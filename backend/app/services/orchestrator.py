"""Query orchestrator for multi-source queries."""
import json
import time
from datetime import datetime, date
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
from sqlalchemy.orm import Session
from app.models.data_source import DataSource
from app.models.query_history import QueryHistory
from app.models.schema_metadata import SchemaMetadata
from app.connectors import (
    PostgresConnector, ExcelConnector, ParquetConnector,
    TimescaleConnector, TrinoConnector, DuckDBConnector,
    MotherDuckConnector, DatabricksConnector, CubeConnector,
    SnowflakeConnector, RedshiftConnector, BucketParquetConnector
)
from app.services.llm_service import LLMService
from app.services.visualization_service import VisualizationService
from app.utils.security import decrypt_credentials
from app.schemas.query import QueryResponse, QueryMetadata, Visualization


class QueryOrchestrator:
    """Orchestrates query execution across multiple data sources."""
    
    def __init__(self, db: Session, client_id: int):
        self.db = db
        self.client_id = client_id
        self.llm_service = LLMService()
        self.viz_service = VisualizationService()
    
    def execute_query(
        self,
        prompt: str,
        data_source_ids: Optional[List[int]] = None,
        max_rows: int = 1000
    ) -> QueryResponse:
        """
        Execute a natural language query.
        
        Args:
            prompt: Natural language query prompt
            data_source_ids: Optional list of specific data source IDs
            max_rows: Maximum rows to return
            
        Returns:
            QueryResponse with results and metadata
        """
        start_time = time.time()
        
        # Initialize variables for error handling
        executed_query = None
        query_type = "unknown"
        data_source = None
        data_sources = None
        schema_info = {}
        available_tables = []
        
        try:
            # Get data sources
            query = self.db.query(DataSource).filter(
                DataSource.client_id == self.client_id,
                DataSource.is_active == True
            )
            
            if data_source_ids:
                query = query.filter(DataSource.id.in_(data_source_ids))
            
            data_sources = query.all()
            
            if not data_sources:
                return QueryResponse(
                    status="error",
                    error_message="No active data sources found"
                )
            
            # Check if this is a dashboard/visualization question
            is_dashboard_question = any(keyword in prompt.lower() for keyword in [
                'dashboard', 'visualization', 'chart', 'graph', 'plot', 'visualize',
                'what can i create', 'what dashboard', 'show me dashboard', 'create from these data'
            ])
            
            # For dashboard questions or when multiple sources selected, query all sources
            if is_dashboard_question or len(data_sources) > 1:
                # Query all selected data sources
                all_results = []
                all_sources_used = []
                combined_schema_info = {}
                
                for data_source in data_sources:
                    try:
                        # Get schema information
                        schema_info = self._get_schema_info(data_source)
                        combined_schema_info[data_source.source_name] = schema_info
                        
                        # For dashboard questions, get sample data from each source
                        if is_dashboard_question:
                            connector = self._create_connector(data_source)
                            with connector:
                                # Get more rows from each source for better dashboard suggestions (10 per source)
                                if data_source.source_type == "postgres":
                                    tables = list(schema_info.keys())
                                    if tables:
                                        # Get data from all tables in this source (20 rows per table)
                                        for table_name in tables:
                                            try:
                                                sample_query = f"SELECT * FROM {table_name} LIMIT 20"
                                                sample_results = connector.execute_query(sample_query, timeout=60)
                                                # Add source identifier to each row
                                                for row in sample_results:
                                                    row['_source'] = data_source.source_name
                                                    row['_source_type'] = data_source.source_type
                                                    row['_table'] = table_name
                                                all_results.extend(sample_results)
                                                print(f"[Orchestrator] Got {len(sample_results)} rows from {data_source.source_name}.{table_name}", flush=True)
                                            except Exception as table_error:
                                                print(f"[Orchestrator] Error querying table {table_name} from {data_source.source_name}: {str(table_error)}", flush=True)
                                                continue
                                        if tables:
                                            all_sources_used.append(data_source.source_name)
                                else:
                                    # For Excel/Parquet, get sample data (up to 20 rows)
                                    try:
                                        # For file-based sources, we need to get all data and then limit
                                        # The connectors expect filter queries, but for dashboard we want all data
                                        # So we'll use the connector's internal DataFrame directly
                                        connector.connect()
                                        
                                        # Access the internal DataFrame and convert to records
                                        if hasattr(connector, '_df') and connector._df is not None:
                                            df = connector._df
                                            # Get up to 20 rows
                                            sample_df = df.head(20)
                                            sample_results = sample_df.to_dict('records')
                                            
                                            # Add source identifier to each row
                                            for row in sample_results:
                                                row['_source'] = data_source.source_name
                                                row['_source_type'] = data_source.source_type
                                            
                                            all_results.extend(sample_results)
                                            print(f"[Orchestrator] Got {len(sample_results)} rows from {data_source.source_name}", flush=True)
                                            all_sources_used.append(data_source.source_name)
                                        else:
                                            # Fallback: try empty filter (should return all rows if connector handles it)
                                            try:
                                                sample_results = connector.execute_query("{}", timeout=60)
                                                for row in sample_results[:20]:
                                                    row['_source'] = data_source.source_name
                                                    row['_source_type'] = data_source.source_type
                                                all_results.extend(sample_results[:20])
                                                print(f"[Orchestrator] Got {min(20, len(sample_results))} rows from {data_source.source_name}", flush=True)
                                                all_sources_used.append(data_source.source_name)
                                            except:
                                                # If that fails, try to get schema and use first column
                                                schema = connector.get_schema()
                                                if schema:
                                                    table_name = list(schema.keys())[0]
                                                    columns = schema[table_name]
                                                    if columns:
                                                        # Use a simple filter that should match all rows
                                                        first_col = columns[0]['name']
                                                        filter_query = json.dumps({"column": first_col, "operator": "!=", "value": None})
                                                        sample_results = connector.execute_query(filter_query, timeout=60)
                                                        for row in sample_results[:20]:
                                                            row['_source'] = data_source.source_name
                                                            row['_source_type'] = data_source.source_type
                                                        all_results.extend(sample_results[:20])
                                                        print(f"[Orchestrator] Got {min(20, len(sample_results))} rows from {data_source.source_name} (fallback)", flush=True)
                                                        all_sources_used.append(data_source.source_name)
                                    except Exception as file_error:
                                        print(f"[Orchestrator] Error querying file source {data_source.source_name}: {str(file_error)}", flush=True)
                                        import traceback
                                        print(f"[Orchestrator] Traceback: {traceback.format_exc()}", flush=True)
                                        continue
                        else:
                            # Regular query - convert prompt to query for this source
                            query_data = self.llm_service.convert_prompt_to_query(
                                prompt=prompt,
                                schema_info=schema_info,
                                source_type=data_source.source_type
                            )
                            executed_query = query_data.get("query")
                            
                            connector = self._create_connector(data_source)
                            with connector:
                                source_results = connector.execute_query(executed_query, timeout=300)
                                # Add source identifier
                                for row in source_results:
                                    row['_source'] = data_source.source_name
                                all_results.extend(source_results)
                                all_sources_used.append(data_source.source_name)
                    except Exception as e:
                        print(f"[Orchestrator] Error querying {data_source.source_name}: {str(e)}", flush=True)
                        continue
                
                # Limit total results
                if len(all_results) > max_rows:
                    all_results = all_results[:max_rows]
                
                # Generate enhanced visualizations for dashboard questions
                if is_dashboard_question:
                    visualizations = self.viz_service.suggest_dashboards(all_results, combined_schema_info, prompt)
                    print(f"[Orchestrator] Generated {len(visualizations)} dashboard suggestions from {len(all_results)} rows", flush=True)
                else:
                    visualizations = self.viz_service.suggest_visualizations(all_results, prompt)
                
                execution_time_ms = (time.time() - start_time) * 1000
                
                print(f"[Orchestrator] Multi-source query complete: {len(all_results)} total rows from {len(all_sources_used)} sources: {all_sources_used}", flush=True)
                
                return QueryResponse(
                    status="success",
                    data=all_results,
                    visualizations=[Visualization(**v) for v in visualizations] if visualizations else [],
                    metadata=QueryMetadata(
                        sources_used=all_sources_used,
                        execution_time_ms=execution_time_ms,
                        row_count=len(all_results),
                        query_type="multi_source" if len(data_sources) > 1 else "sql"
                    ),
                    executed_query=f"Queried {len(data_sources)} data source(s): {', '.join(all_sources_used)}" if is_dashboard_question else (executed_query if 'executed_query' in locals() else f"Queried {len(data_sources)} source(s)")
                )
            
            # Single source query (original logic)
            data_source = data_sources[0]
            
            # Get schema information
            schema_info = self._get_schema_info(data_source)
            available_tables = list(schema_info.keys())
            
            # Convert prompt to query using LLM
            query_data = self.llm_service.convert_prompt_to_query(
                prompt=prompt,
                schema_info=schema_info,
                source_type=data_source.source_type
            )
            
            executed_query = query_data.get("query")
            query_type = query_data.get("query_type", "unknown")
            
            # Create connector
            connector = self._create_connector(data_source)
            
            # Execute query
            with connector:
                results = connector.execute_query(
                    query=executed_query,
                    timeout=300
                )
            
            # Limit results
            if len(results) > max_rows:
                results = results[:max_rows]
            
            # Generate visualizations
            visualizations = self.viz_service.suggest_visualizations(results, prompt)
            
            # Calculate execution time
            execution_time_ms = (time.time() - start_time) * 1000
            
            # Save to query history
            self._save_query_history(
                prompt=prompt,
                data_source_id=data_source.id,
                query_type=query_type,
                executed_query=executed_query,
                status="success",
                result_count=len(results),
                execution_time_ms=execution_time_ms,
                result_preview=results[:10] if results else None
            )
            
            return QueryResponse(
                status="success",
                data=results,
                visualizations=[Visualization(**v) for v in visualizations],
                metadata=QueryMetadata(
                    sources_used=[data_source.source_name],
                    execution_time_ms=execution_time_ms,
                    row_count=len(results),
                    query_type=query_type
                ),
                executed_query=executed_query
            )
        
        except Exception as e:
            execution_time_ms = (time.time() - start_time) * 1000
            
            # Get schema info if we have a data source but failed later
            if data_source and not available_tables:
                try:
                    schema_info = self._get_schema_info(data_source)
                    available_tables = list(schema_info.keys())
                except:
                    pass
            
            data_source_name = data_source.source_name if data_source else None
            data_source_id = data_source.id if data_source else None
            
            # Save error to query history
            self._save_query_history(
                prompt=prompt,
                data_source_id=data_source_id,
                query_type=query_type,
                executed_query=executed_query,
                status="error",
                result_count=0,
                execution_time_ms=execution_time_ms,
                error_message=str(e)
            )
            
            return QueryResponse(
                status="error",
                error_message=str(e),
                executed_query=executed_query,
                available_tables=available_tables if available_tables else None,
                metadata=QueryMetadata(
                    sources_used=[data_source_name] if data_source_name else [],
                    execution_time_ms=execution_time_ms,
                    row_count=0,
                    query_type=query_type
                ) if data_source_name else None
            )
    
    def _get_schema_info(self, data_source: DataSource) -> Dict[str, Any]:
        """Get schema information, using cache if available."""
        # Check cache
        cached_schema = self.db.query(SchemaMetadata).filter(
            SchemaMetadata.data_source_id == data_source.id
        ).first()
        
        if cached_schema:
            # Return cached schema
            return {
                cached_schema.table_name: cached_schema.column_info
            }
        
        # Fetch fresh schema
        connector = self._create_connector(data_source)
        
        try:
            with connector:
                schema = connector.get_schema()
            
            # Cache schema - serialize numpy types before saving
            for table_name, columns in schema.items():
                # Convert numpy types to native Python types for JSON serialization
                serialized_columns = self._serialize_for_json(columns)
                
                schema_metadata = SchemaMetadata(
                    data_source_id=data_source.id,
                    table_name=table_name,
                    column_info=serialized_columns,
                    sample_data=None
                )
                self.db.add(schema_metadata)
            
            try:
                self.db.commit()
            except Exception as e:
                self.db.rollback()
                print(f"Failed to cache schema metadata: {str(e)}", flush=True)
                # Return schema anyway, even if caching failed
            
            return schema
        
        except Exception as e:
            # Return empty schema if fetch fails
            return {}
    
    def _create_connector(self, data_source: DataSource):
        """Create appropriate connector for data source."""
        # Decrypt connection config
        config_json = decrypt_credentials(data_source.connection_config)
        config = json.loads(config_json)
        
        source_type = data_source.source_type
        
        if source_type == "postgres":
            return PostgresConnector(config)
        elif source_type == "excel":
            return ExcelConnector(config)
        elif source_type == "parquet":
            return ParquetConnector(config)
        elif source_type == "timescale":
            return TimescaleConnector(config)
        elif source_type == "trino":
            return TrinoConnector(config)
        elif source_type == "duckdb":
            return DuckDBConnector(config)
        elif source_type == "motherduck":
            return MotherDuckConnector(config)
        elif source_type == "databricks":
            return DatabricksConnector(config)
        elif source_type == "cube":
            return CubeConnector(config)
        elif source_type == "snowflake":
            return SnowflakeConnector(config)
        elif source_type == "redshift":
            return RedshiftConnector(config)
        elif source_type == "bucket_parquet":
            return BucketParquetConnector(config)
        else:
            raise ValueError(f"Unsupported data source type: {source_type}")
    
    def _save_query_history(
        self,
        prompt: str,
        data_source_id: Optional[int],
        query_type: str,
        executed_query: Optional[str],
        status: str,
        result_count: int,
        execution_time_ms: float,
        result_preview: Optional[List[Dict[str, Any]]] = None,
        error_message: Optional[str] = None
    ):
        """Save query to history."""
        # Convert datetime/date objects to strings for JSON serialization
        serialized_preview = None
        if result_preview:
            serialized_preview = self._serialize_for_json(result_preview)
        
        query_history = QueryHistory(
            client_id=self.client_id,
            data_source_id=data_source_id,
            prompt=prompt,
            query_type=query_type,
            executed_query=executed_query,
            status=status,
            result_count=result_count,
            execution_time_ms=execution_time_ms,
            error_message=error_message,
            result_preview=serialized_preview
        )
        
        try:
            self.db.add(query_history)
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            # Log error but don't fail the query execution
            print(f"Failed to save query history: {str(e)}", flush=True)
    
    def _serialize_for_json(self, data: Any) -> Any:
        """Recursively convert datetime/date/numpy objects to JSON-serializable types."""
        # Handle numpy types
        if isinstance(data, (np.integer, np.floating)):
            return data.item()  # Convert numpy scalar to Python native type
        elif isinstance(data, np.bool_):
            return bool(data)  # Convert numpy bool to Python bool
        elif isinstance(data, np.ndarray):
            return data.tolist()  # Convert numpy array to list
        # Handle datetime/date
        elif isinstance(data, (datetime, date)):
            return data.isoformat()
        # Handle dict and list recursively
        elif isinstance(data, dict):
            return {key: self._serialize_for_json(value) for key, value in data.items()}
        elif isinstance(data, list):
            return [self._serialize_for_json(item) for item in data]
        else:
            return data

