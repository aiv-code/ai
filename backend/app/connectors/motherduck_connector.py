"""MotherDuck connector."""
import duckdb
from typing import List, Dict, Any
import logging
from app.connectors.base import BaseConnector

logger = logging.getLogger(__name__)


class MotherDuckConnector(BaseConnector):
    """MotherDuck connector (uses DuckDB with MotherDuck extension)."""
    
    def __init__(self, connection_config: Dict[str, Any]):
        super().__init__(connection_config)
        self._connection = None
    
    def connect(self) -> None:
        """Establish MotherDuck connection."""
        try:
            # MotherDuck uses a token-based connection
            token = self.connection_config.get("token")
            if not token:
                raise ValueError("MotherDuck token is required")
            
            # Create connection string for MotherDuck
            # Format: motherduck:?token=<token>
            connection_string = f"motherduck:?token={token}"
            
            # Optionally specify database
            database = self.connection_config.get("database")
            if database:
                connection_string = f"motherduck:{database}?token={token}"
            
            self._connection = duckdb.connect(connection_string)
            
        except Exception as e:
            raise ConnectionError(f"Failed to connect to MotherDuck: {str(e)}")
    
    def disconnect(self) -> None:
        """Close MotherDuck connection."""
        if self._connection:
            self._connection.close()
            self._connection = None
    
    def execute_query(self, query: str, timeout: int = 300) -> List[Dict[str, Any]]:
        """Execute SQL query."""
        if not self._connection:
            self.connect()
        
        try:
            # MotherDuck uses DuckDB cursor API
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
            logger.error(f"[MotherDuckConnector] Query execution failed: {str(e)}")
            raise RuntimeError(f"Query execution failed: {str(e)}")
    
    def get_schema(self) -> Dict[str, List[Dict[str, Any]]]:
        """Get schema information for all tables."""
        if not self._connection:
            self.connect()
        
        database = self.connection_config.get("database", "main")
        
        try:
            cursor = self._connection.cursor()
            
            # Get all tables from the specified database
            cursor.execute(f"""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = '{database}'
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
                    WHERE table_schema = '{database}' AND table_name = '{table_name}'
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
        """Test MotherDuck connection."""
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

