"""Parquet connector."""
import pandas as pd
import pyarrow.parquet as pq
import os
from typing import List, Dict, Any
from app.connectors.base import BaseConnector


class ParquetConnector(BaseConnector):
    """Parquet file connector."""
    
    def __init__(self, connection_config: Dict[str, Any]):
        super().__init__(connection_config)
        self._df = None
        self._file_path = connection_config["file_path"]
    
    def connect(self) -> None:
        """Load Parquet file."""
        if not os.path.exists(self._file_path):
            raise FileNotFoundError(f"File not found: {self._file_path}")
        
        try:
            # Use pyarrow for better performance
            self._df = pd.read_parquet(self._file_path)
        except Exception as e:
            raise ConnectionError(f"Failed to load Parquet file: {str(e)}")
    
    def disconnect(self) -> None:
        """Clear loaded data."""
        self._df = None
    
    def execute_query(self, query: str, timeout: int = 300) -> List[Dict[str, Any]]:
        """
        Execute filter-based query on Parquet DataFrame.
        
        Query format: JSON filter expression (similar to Excel connector)
        """
        if self._df is None:
            self.connect()
        
        try:
            import json
            import operator as op
            
            # Parse filter query
            filter_expr = json.loads(query) if isinstance(query, str) else query
            
            # If empty dict or empty list, return all rows (no filters)
            if (isinstance(filter_expr, dict) and not filter_expr) or (isinstance(filter_expr, list) and not filter_expr):
                result = self._df.to_dict('records')
                return result
            
            # Apply filters
            df_filtered = self._df.copy()
            
            if isinstance(filter_expr, dict):
                # Single filter
                df_filtered = self._apply_filter(df_filtered, filter_expr)
            elif isinstance(filter_expr, list):
                # Multiple filters (AND logic)
                for f in filter_expr:
                    df_filtered = self._apply_filter(df_filtered, f)
            
            # Convert to list of dicts
            result = df_filtered.to_dict('records')
            
            return result
        except Exception as e:
            raise RuntimeError(f"Query execution failed: {str(e)}")
    
    def _apply_filter(self, df: pd.DataFrame, filter_expr: Dict[str, Any]) -> pd.DataFrame:
        """Apply a single filter expression."""
        column = filter_expr.get("column")
        operator = filter_expr.get("operator", "==")
        value = filter_expr.get("value")
        
        if column not in df.columns:
            raise ValueError(f"Column '{column}' not found")
        
        # Map operators
        op_map = {
            "==": op.eq,
            "!=": op.ne,
            ">": op.gt,
            ">=": op.ge,
            "<": op.lt,
            "<=": op.le,
            "in": lambda x, y: x.isin(y),
            "contains": lambda x, y: x.str.contains(y, na=False),
        }
        
        if operator not in op_map:
            raise ValueError(f"Unsupported operator: {operator}")
        
        return df[op_map[operator](df[column], value)]
    
    def get_schema(self) -> Dict[str, List[Dict[str, Any]]]:
        """Get schema information."""
        if self._df is None:
            self.connect()
        
        # Use filename as table name
        table_name = os.path.basename(self._file_path).split('.')[0]
        
        schema = {
            table_name: []
        }
        
        # Get schema from Parquet metadata for better type information
        try:
            parquet_file = pq.ParquetFile(self._file_path)
            parquet_schema = parquet_file.schema_arrow
            
            for i, field in enumerate(parquet_schema):
                schema[table_name].append({
                    "name": field.name,
                    "type": str(field.type),
                    "nullable": field.nullable,
                    "default": None
                })
        except Exception:
            # Fallback to pandas dtypes
            for col in self._df.columns:
                dtype = str(self._df[col].dtype)
                schema[table_name].append({
                    "name": col,
                    "type": dtype,
                    "nullable": self._df[col].isna().any(),
                    "default": None
                })
        
        return schema
    
    def test_connection(self) -> bool:
        """Test file access."""
        try:
            if not os.path.exists(self._file_path):
                return False
            
            self.connect()
            return True
        except Exception:
            return False

