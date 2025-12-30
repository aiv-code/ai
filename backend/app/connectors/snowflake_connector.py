"""Snowflake connector."""
import snowflake.connector
from typing import List, Dict, Any
import logging
from app.connectors.base import BaseConnector

logger = logging.getLogger(__name__)


class SnowflakeConnector(BaseConnector):
    """Snowflake connector."""
    
    def __init__(self, connection_config: Dict[str, Any]):
        super().__init__(connection_config)
        self._connection = None
    
    def connect(self) -> None:
        """Establish Snowflake connection."""
        try:
            self._connection = snowflake.connector.connect(
                user=self.connection_config["username"],
                password=self.connection_config["password"],
                account=self.connection_config["account"],
                warehouse=self.connection_config.get("warehouse"),
                database=self.connection_config.get("database"),
                schema=self.connection_config.get("schema", "PUBLIC"),
                role=self.connection_config.get("role"),
            )
        except Exception as e:
            raise ConnectionError(f"Failed to connect to Snowflake: {str(e)}")
    
    def disconnect(self) -> None:
        """Close Snowflake connection."""
        if self._connection:
            self._connection.close()
            self._connection = None
    
    def execute_query(self, query: str, timeout: int = 300) -> List[Dict[str, Any]]:
        """Execute SQL query."""
        if not self._connection:
            self.connect()
        
        try:
            cursor = self._connection.cursor()
            
            # Set query timeout
            cursor.execute(f"ALTER SESSION SET STATEMENT_TIMEOUT_IN_SECONDS = {timeout}")
            
            cursor.execute(query)
            
            # Fetch column names
            columns = [desc[0] for desc in cursor.description] if cursor.description else []
            
            # Fetch all rows
            rows = cursor.fetchall()
            
            # Convert to list of dicts
            result = [dict(zip(columns, row)) for row in rows]
            
            cursor.close()
            return result
        except Exception as e:
            logger.error(f"[SnowflakeConnector] Query execution failed: {str(e)}")
            raise RuntimeError(f"Query execution failed: {str(e)}")
    
    def get_schema(self) -> Dict[str, List[Dict[str, Any]]]:
        """Get schema information for all tables."""
        if not self._connection:
            self.connect()
        
        database = self.connection_config.get("database")
        schema = self.connection_config.get("schema", "PUBLIC")
        
        # Build query with proper filtering
        query = f"""
            SELECT 
                table_name,
                column_name,
                data_type,
                is_nullable,
                column_default
            FROM information_schema.columns
            WHERE table_schema = '{schema}'
        """
        
        if database:
            query += f" AND table_catalog = '{database}'"
        
        query += " ORDER BY table_name, ordinal_position"
        
        try:
            cursor = self._connection.cursor()
            cursor.execute(query)
            
            columns = [desc[0] for desc in cursor.description]
            rows = cursor.fetchall()
            
            schema_dict = {}
            for row in rows:
                row_dict = dict(zip(columns, row))
                table_name = row_dict["table_name"]
                if table_name not in schema_dict:
                    schema_dict[table_name] = []
                
                schema_dict[table_name].append({
                    "name": row_dict["column_name"],
                    "type": row_dict["data_type"],
                    "nullable": row_dict["is_nullable"] == "YES",
                    "default": row_dict["column_default"]
                })
            
            cursor.close()
            return schema_dict
        except Exception as e:
            raise RuntimeError(f"Failed to get schema: {str(e)}")
    
    def test_connection(self) -> bool:
        """Test Snowflake connection."""
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


