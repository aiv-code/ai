"""TimescaleDB connector."""
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2.extensions import quote_ident
from typing import List, Dict, Any
import logging
from app.connectors.base import BaseConnector
from app.utils.validators import validate_sql_query, sanitize_sql_query

logger = logging.getLogger(__name__)


class TimescaleConnector(BaseConnector):
    """TimescaleDB connector (PostgreSQL-compatible)."""
    
    def __init__(self, connection_config: Dict[str, Any]):
        super().__init__(connection_config)
        self._connection = None
    
    def connect(self) -> None:
        """Establish TimescaleDB connection."""
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
                    quoted_schema = quote_ident(schema_name, self._connection)
                    cursor.execute(f'SET search_path TO {quoted_schema}, public')
                    cursor.execute('SHOW search_path')
                    actual_path = cursor.fetchone()[0]
                    logger.info(f"[TimescaleConnector] Connected and set search_path to: {actual_path}")
        except Exception as e:
            raise ConnectionError(f"Failed to connect to TimescaleDB: {str(e)}")
    
    def disconnect(self) -> None:
        """Close TimescaleDB connection."""
        if self._connection:
            self._connection.close()
            self._connection = None
    
    def execute_query(self, query: str, timeout: int = 300) -> List[Dict[str, Any]]:
        """Execute SQL query."""
        if not self._connection:
            self.connect()
        
        # Validate query
        is_valid, error_msg = validate_sql_query(query)
        if not is_valid:
            raise ValueError(f"Invalid SQL query: {error_msg}")
        
        # Sanitize query
        query = sanitize_sql_query(query)
        
        schema_name = self.connection_config.get("schema", "public")
        
        # Add schema prefix for non-public schemas
        if schema_name and schema_name != "public":
            import re
            
            table_pattern = r'\b(FROM|JOIN)\s+([a-zA-Z_][a-zA-Z0-9_]*)'
            
            def add_schema(match):
                keyword = match.group(1)
                table_name = match.group(2)
                if '.' in table_name:
                    return match.group(0)
                quoted_schema = quote_ident(schema_name, self._connection)
                quoted_table = quote_ident(table_name, self._connection)
                return f'{keyword} {quoted_schema}.{quoted_table}'
            
            query = re.sub(table_pattern, add_schema, query, flags=re.IGNORECASE)
        
        try:
            # Set search_path as backup
            if schema_name and schema_name != "public":
                with self._connection.cursor() as setup_cursor:
                    quoted_schema = quote_ident(schema_name, self._connection)
                    setup_cursor.execute(f'SET search_path TO {quoted_schema}, public')
            
            # Execute query
            with self._connection.cursor(cursor_factory=RealDictCursor) as cursor:
                # Set statement timeout
                cursor.execute(f"SET statement_timeout = {timeout * 1000}")  # milliseconds
                
                cursor.execute(query)
                rows = cursor.fetchall()
                result = [dict(row) for row in rows]
                return result
        except psycopg2.errors.QueryCanceled:
            raise TimeoutError("Query exceeded timeout limit")
        except Exception as e:
            logger.error(f"[TimescaleConnector] Query execution failed: {str(e)}")
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
        """Test TimescaleDB connection."""
        try:
            if not self._connection:
                self.connect()
            
            with self._connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
            
            return True
        except Exception:
            return False


