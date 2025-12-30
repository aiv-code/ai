"""Base connector interface."""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import time


class BaseConnector(ABC):
    """Base class for all data connectors."""
    
    def __init__(self, connection_config: Dict[str, Any]):
        """
        Initialize connector with connection configuration.
        
        Args:
            connection_config: Connection configuration dictionary
        """
        self.connection_config = connection_config
        self._connection = None
    
    @abstractmethod
    def connect(self) -> None:
        """Establish connection to data source."""
        pass
    
    @abstractmethod
    def disconnect(self) -> None:
        """Close connection to data source."""
        pass
    
    @abstractmethod
    def execute_query(self, query: str, timeout: int = 300) -> List[Dict[str, Any]]:
        """
        Execute a query and return results.
        
        Args:
            query: Query string (SQL, filter expression, etc.)
            timeout: Query timeout in seconds
            
        Returns:
            List of dictionaries representing rows
        """
        pass
    
    @abstractmethod
    def get_schema(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        Get schema information for all tables/datasets.
        
        Returns:
            Dictionary mapping table names to column metadata
        """
        pass
    
    @abstractmethod
    def test_connection(self) -> bool:
        """
        Test if connection is valid.
        
        Returns:
            True if connection is valid, False otherwise
        """
        pass
    
    def __enter__(self):
        """Context manager entry."""
        self.connect()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.disconnect()


