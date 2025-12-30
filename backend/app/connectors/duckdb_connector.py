"""DuckDB connector."""
import duckdb
from typing import List, Dict, Any
import logging
from app.connectors.base import BaseConnector

logger = logging.getLogger(__name__)


class DuckDBConnector(BaseConnector):
    """DuckDB connector."""
    
    def __init__(self, connection_config: Dict[str, Any]):
        super().__init__(connection_config)
        self._connection = None
    
    def connect(self) -> None:
        """Establish DuckDB connection."""
        try:
            # DuckDB can connect to a file or in-memory
            database_path = self.connection_config.get("database", ":memory:")
            
            self._connection = duckdb.connect(database_path, read_only=self.connection_config.get("read_only", False))
            
            # Set configuration options if provided
            config = self.connection_config.get("config", {})
            for key, value in config.items():
                self._connection.execute(f"SET {key} = '{value}'")
                
        except Exception as e:
            raise ConnectionError(f"Failed to connect to DuckDB: {str(e)}")
    
    def disconnect(self) -> None:
        """Close DuckDB connection."""
        if self._connection:
            self._connection.close()
            self._connection = None
    
    def execute_query(self, query: str, timeout: int = 300) -> List[Dict[str, Any]]:
        """Execute SQL query."""
        if not self._connection:
            self.connect()
        
        try:
            # DuckDB uses cursor for queries
            cursor = self._connection.cursor()
            cursor.execute(query)
            
            # Get column names
            columns = [desc[0] for desc in cursor.description] if cursor.description else []
            
            # Fetch all rows
            rows = cursor.fetchall()
            
            # Convert to list of dicts
            result_dict = [dict(zip(columns, row)) for row in rows]
            
            cursor.close()
            return result_dict
        except Exception as e:
            logger.error(f"[DuckDBConnector] Query execution failed: {str(e)}")
            raise RuntimeError(f"Query execution failed: {str(e)}")
    
    def get_schema(self) -> Dict[str, List[Dict[str, Any]]]:
        """Get schema information for all tables."""
        if not self._connection:
            self.connect()
        
        try:
            cursor = self._connection.cursor()
            
            # Get all tables
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'main'
            """)
            tables_result = cursor.fetchall()
            
            schema = {}
            
            for (table_name,) in tables_result:
                # Get columns for each table
                cursor.execute(f"""
                    SELECT 
                        column_name,
                        data_type,
                        is_nullable,
                        column_default
                    FROM information_schema.columns
                    WHERE table_schema = 'main' AND table_name = '{table_name}'
                    ORDER BY ordinal_position
                """)
                columns_result = cursor.fetchall()
                
                schema[table_name] = []
                for col_name, data_type, is_nullable, col_default in columns_result:
                    schema[table_name].append({
                        "name": col_name,
                        "type": data_type,
                        "nullable": is_nullable == "YES",
                        "default": col_default
                    })
            
            cursor.close()
            return schema
        except Exception as e:
            raise RuntimeError(f"Failed to get schema: {str(e)}")
    
    def test_connection(self) -> bool:
        """Test DuckDB connection."""
        try:
            if not self._connection:
                self.connect()
            
            cursor = self._connection.cursor()
            cursor.execute("SELECT 1")
            cursor.fetchone()
            cursor.close()
            return True
        except Exception:
            return False

