"""PostgreSQL connector."""
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2.extensions import quote_ident
from typing import List, Dict, Any
import logging
from app.connectors.base import BaseConnector
from app.utils.validators import validate_sql_query, sanitize_sql_query

logger = logging.getLogger(__name__)


class PostgresConnector(BaseConnector):
    """PostgreSQL database connector."""
    
    def __init__(self, connection_config: Dict[str, Any]):
        super().__init__(connection_config)
        self._connection = None
    
    def connect(self) -> None:
        """Establish PostgreSQL connection."""
        try:
            self._connection = psycopg2.connect(
                host=self.connection_config["host"],
                port=self.connection_config.get("port", 5432),
                database=self.connection_config["database"],
                user=self.connection_config["username"],
                password=self.connection_config["password"],
                connect_timeout=10
            )
            # Enable autocommit so SET commands take effect immediately
            self._connection.autocommit = True
            # Set search_path to the specified schema if provided
            schema_name = self.connection_config.get("schema", "public")
            if schema_name and schema_name != "public":
                with self._connection.cursor() as cursor:
                    # Use quote_ident to safely quote schema name
                    quoted_schema = quote_ident(schema_name, self._connection)
                    cursor.execute(f'SET search_path TO {quoted_schema}, public')
                    # Verify it was set
                    cursor.execute('SHOW search_path')
                    actual_path = cursor.fetchone()[0]
                    # Use print for immediate visibility
                    print(f"[PostgresConnector] Connected and set search_path to: {actual_path}", flush=True)
                    logger.info(f"[PostgresConnector] Connected and set search_path to: {actual_path}")
        except Exception as e:
            raise ConnectionError(f"Failed to connect to PostgreSQL: {str(e)}")
    
    def disconnect(self) -> None:
        """Close PostgreSQL connection."""
        if self._connection:
            self._connection.close()
            self._connection = None
    
    def execute_query(self, query: str, timeout: int = 300) -> List[Dict[str, Any]]:
        """Execute SQL query."""
        print(f"[PostgresConnector] execute_query called with query: {query[:200]}", flush=True)
        
        if not self._connection:
            print("[PostgresConnector] No connection, calling connect()", flush=True)
            self.connect()
        else:
            print(f"[PostgresConnector] Using existing connection, autocommit={self._connection.autocommit}", flush=True)
        
        # Validate query
        is_valid, error_msg = validate_sql_query(query)
        if not is_valid:
            raise ValueError(f"Invalid SQL query: {error_msg}")
        
        # Sanitize query
        query = sanitize_sql_query(query)
        
        schema_name = self.connection_config.get("schema", "public")
        
        # Debug: Always log schema name
        import sys
        sys.stderr.write(f"\n=== DEBUG START ===\n")
        sys.stderr.write(f"Schema name from config: {schema_name}\n")
        sys.stderr.write(f"Query before modification: {query}\n")
        sys.stderr.flush()
        
        # CRITICAL FIX: Always modify query to include schema prefix for non-public schemas
        # This is more reliable than relying on search_path
        if schema_name and schema_name != "public":
            sys.stderr.write(f"Schema is NOT public, modifying query...\n")
            sys.stderr.flush()
            import re
            import sys
            
            # Pattern to match table names after FROM/JOIN that don't have schema prefix
            # Updated pattern to be more robust
            table_pattern = r'\b(FROM|JOIN)\s+([a-zA-Z_][a-zA-Z0-9_]*)'
            
            def add_schema(match):
                keyword = match.group(1)
                table_name = match.group(2)
                # Don't modify if it already has a schema prefix
                if '.' in table_name:
                    return match.group(0)
                # Quote both schema and table names
                quoted_schema = quote_ident(schema_name, self._connection)
                quoted_table = quote_ident(table_name, self._connection)
                return f'{keyword} {quoted_schema}.{quoted_table}'
            
            # Apply schema prefix to all table references
            original_query = query
            modified_query = re.sub(table_pattern, add_schema, query, flags=re.IGNORECASE)
            
            # Always write to stderr for debugging AND raise exception if not modified
            sys.stderr.write(f"[PostgresConnector] Schema: {schema_name}\n")
            sys.stderr.write(f"[PostgresConnector] Original: {original_query}\n")
            sys.stderr.write(f"[PostgresConnector] Modified: {modified_query}\n")
            sys.stderr.write(f"Query changed: {modified_query != original_query}\n")
            sys.stderr.write(f"=== DEBUG END ===\n\n")
            sys.stderr.flush()
            
            # CRITICAL: Ensure query is modified
            if modified_query == original_query:
                raise RuntimeError(f"Query modification failed! Original: {original_query}, Pattern: {table_pattern}")
            
            query = modified_query
        else:
            sys.stderr.write(f"Schema IS public or None, NOT modifying query\n")
            sys.stderr.write(f"=== DEBUG END ===\n\n")
            sys.stderr.flush()
        
        try:
            # Set search_path as backup (in case query modification didn't catch everything)
            if schema_name and schema_name != "public":
                with self._connection.cursor() as setup_cursor:
                    quoted_schema = quote_ident(schema_name, self._connection)
                    setup_cursor.execute(f'SET search_path TO {quoted_schema}, public')
            
            # Execute query
            with self._connection.cursor(cursor_factory=RealDictCursor) as cursor:
                # Set statement timeout
                cursor.execute(f"SET statement_timeout = {timeout * 1000}")  # milliseconds
                
                # Execute query
                print(f"[PostgresConnector] Executing query: {query[:200]}", flush=True)
                cursor.execute(query)
                
                # Fetch results
                rows = cursor.fetchall()
                
                # Convert to list of dicts
                result = [dict(row) for row in rows]
                
                return result
        except psycopg2.errors.QueryCanceled:
            raise TimeoutError("Query exceeded timeout limit")
        except psycopg2.errors.UndefinedTable as e:
            # Get current search_path for debugging
            try:
                with self._connection.cursor() as debug_cursor:
                    debug_cursor.execute('SHOW search_path')
                    current_path = debug_cursor.fetchone()[0]
                    error_msg = f"[PostgresConnector] Table not found. Current search_path: {current_path}, Query: {query}"
                    print(error_msg, flush=True)
                    logger.error(error_msg)
            except:
                pass
            raise RuntimeError(f"Query execution failed: {str(e)}")
        except Exception as e:
            logger.error(f"[PostgresConnector] Query execution failed: {str(e)}, Query: {query[:200]}")
            raise RuntimeError(f"Query execution failed: {str(e)}")
    
    def get_schema(self) -> Dict[str, List[Dict[str, Any]]]:
        """Get schema information for all tables."""
        if not self._connection:
            self.connect()
        
        schema_name = self.connection_config.get("schema", "public")
        
        query = """
            SELECT 
                table_name,
                column_name,
                data_type,
                is_nullable,
                column_default
            FROM information_schema.columns
            WHERE table_schema = %s
            ORDER BY table_name, ordinal_position
        """
        
        try:
            with self._connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, (schema_name,))
                rows = cursor.fetchall()
                
                # Group by table name
                schema = {}
                for row in rows:
                    table_name = row["table_name"]
                    if table_name not in schema:
                        schema[table_name] = []
                    
                    schema[table_name].append({
                        "name": row["column_name"],
                        "type": row["data_type"],
                        "nullable": row["is_nullable"] == "YES",
                        "default": row["column_default"]
                    })
                
                return schema
        except Exception as e:
            raise RuntimeError(f"Failed to get schema: {str(e)}")
    
    def test_connection(self) -> bool:
        """Test PostgreSQL connection."""
        try:
            if not self._connection:
                self.connect()
            
            with self._connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
            
            return True
        except Exception:
            return False

