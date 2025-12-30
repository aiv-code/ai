"""LLM service for natural language to query conversion."""
import httpx
import json
from typing import Dict, Any, List
from app.config import settings


class LLMService:
    """Service for interacting with LLM providers."""
    
    def __init__(self):
        self.provider = settings.LLM_PROVIDER.lower()
        self.model = settings.OLLAMA_MODEL
    
    def convert_prompt_to_query(
        self,
        prompt: str,
        schema_info: Dict[str, Any],
        source_type: str
    ) -> Dict[str, Any]:
        """
        Convert natural language prompt to executable query.
        
        Args:
            prompt: Natural language query
            schema_info: Schema information for the data source
            source_type: Type of data source (postgres, excel, parquet)
            
        Returns:
            Dictionary with 'query' and 'query_type' keys
        """
        if self.provider == "ollama":
            return self._convert_with_ollama(prompt, schema_info, source_type)
        elif self.provider == "groq":
            return self._convert_with_groq(prompt, schema_info, source_type)
        elif self.provider == "together":
            return self._convert_with_together(prompt, schema_info, source_type)
        else:
            raise ValueError(f"Unsupported LLM provider: {self.provider}")
    
    def _convert_with_ollama(self, prompt: str, schema_info: Dict[str, Any], source_type: str) -> Dict[str, Any]:
        """Convert using Ollama."""
        system_prompt = self._build_system_prompt(schema_info, source_type)
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]
        
        try:
            # Increase timeout for Ollama - it can be slow, especially on first request
            timeout_seconds = 180.0  # 3 minutes for LLM conversion (model might need to load)
            with httpx.Client(timeout=timeout_seconds) as client:
                response = client.post(
                    f"{settings.OLLAMA_URL}/api/chat",
                    json={
                        "model": self.model,
                        "messages": messages,
                        "stream": False,
                        "format": "json",
                        "options": {
                            "temperature": 0.1,
                            "num_predict": 500  # Limit response length
                        }
                    },
                    timeout=timeout_seconds
                )
                
                # Check status code before parsing
                if response.status_code != 200:
                    error_detail = "Unknown error"
                    try:
                        error_data = response.json()
                        error_detail = error_data.get("error", {}).get("message", str(error_data))
                    except:
                        error_detail = response.text[:200]
                    
                    raise RuntimeError(
                        f"Ollama API returned error {response.status_code}: {error_detail}. "
                        f"Check if the model '{self.model}' is loaded and Ollama is running properly."
                    )
                
                result = response.json()
                
                # Extract JSON from response
                content = result.get("message", {}).get("content", "")
                if not content:
                    raise ValueError("Empty response from LLM - the model might not have generated a response")
                    
                query_data = json.loads(content)
                
                if not query_data.get("query"):
                    raise ValueError("LLM response missing 'query' field")
                
                return {
                    "query": query_data.get("query", ""),
                    "query_type": query_data.get("query_type", "sql" if source_type == "postgres" else "filter")
                }
        except httpx.TimeoutException:
            raise RuntimeError(
                f"LLM conversion timed out after {timeout_seconds} seconds. "
                f"The Ollama service might be slow or the model '{self.model}' needs to be loaded. "
                f"Try: docker exec ollama_service ollama run {self.model}"
            )
        except httpx.ConnectError:
            raise RuntimeError(
                f"Cannot connect to Ollama at {settings.OLLAMA_URL}. "
                f"Check if Ollama service is running: docker ps | grep ollama"
            )
        except json.JSONDecodeError as e:
            raise RuntimeError(f"LLM returned invalid JSON: {str(e)}. The model response might be malformed.")
        except Exception as e:
            error_msg = str(e)
            if "timeout" in error_msg.lower() or "timed out" in error_msg.lower():
                raise RuntimeError(
                    f"LLM conversion timed out. The model '{self.model}' might be slow or not loaded. "
                    f"Check Ollama logs: docker logs ollama_service"
                )
            raise RuntimeError(f"LLM conversion failed: {error_msg}")
    
    def _convert_with_groq(self, prompt: str, schema_info: Dict[str, Any], source_type: str) -> Dict[str, Any]:
        """Convert using Groq API."""
        if not settings.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY not configured")
        
        system_prompt = self._build_system_prompt(schema_info, source_type)
        
        try:
            with httpx.Client(timeout=60.0) as client:
                response = client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": settings.GROQ_MODEL,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": prompt}
                        ],
                        "response_format": {"type": "json_object"},
                        "temperature": 0.1
                    }
                )
                response.raise_for_status()
                result = response.json()
                
                content = result["choices"][0]["message"]["content"]
                query_data = json.loads(content)
                
                return {
                    "query": query_data.get("query", ""),
                    "query_type": query_data.get("query_type", "sql" if source_type == "postgres" else "filter")
                }
        except Exception as e:
            raise RuntimeError(f"Groq API call failed: {str(e)}")
    
    def _convert_with_together(self, prompt: str, schema_info: Dict[str, Any], source_type: str) -> Dict[str, Any]:
        """Convert using Together.ai API."""
        if not settings.TOGETHER_API_KEY:
            raise ValueError("TOGETHER_API_KEY not configured")
        
        system_prompt = self._build_system_prompt(schema_info, source_type)
        
        try:
            with httpx.Client(timeout=60.0) as client:
                response = client.post(
                    "https://api.together.xyz/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.TOGETHER_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": settings.TOGETHER_MODEL,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.1
                    }
                )
                response.raise_for_status()
                result = response.json()
                
                content = result["choices"][0]["message"]["content"]
                query_data = json.loads(content)
                
                return {
                    "query": query_data.get("query", ""),
                    "query_type": query_data.get("query_type", "sql" if source_type == "postgres" else "filter")
                }
        except Exception as e:
            raise RuntimeError(f"Together.ai API call failed: {str(e)}")
    
    def _build_system_prompt(self, schema_info: Dict[str, Any], source_type: str) -> str:
        """Build system prompt with schema information."""
        schema_str = json.dumps(schema_info, indent=2)
        
        # Extract table names for better prompting
        table_names = list(schema_info.keys())
        tables_list = ", ".join(table_names) if table_names else "none"
        example_table = table_names[0] if table_names else "table_name"
        
        if source_type == "postgres":
            return f"""You are a SQL query generator. Convert natural language queries to SQL SELECT statements.

CRITICAL: You can ONLY use tables that exist in the schema below. Do NOT invent or guess table names.

Available tables: {tables_list}

Full schema with columns:
{schema_str}

Rules:
- Only generate SELECT queries (no INSERT, UPDATE, DELETE, DROP, etc.)
- Use proper SQL syntax
- You MUST use ONLY the table names from this list: {tables_list}
- If the user asks for a table that doesn't exist, use the FIRST available table from: {tables_list}
- For "show me first N rows" or "show me all data", use the first table: {example_table}
- Return JSON with 'query' and 'query_type' fields
- query_type should be 'sql'
- Use table names exactly as shown (case-sensitive)

Example responses:
{{"query": "SELECT * FROM {example_table} LIMIT 10", "query_type": "sql"}}
{{"query": "SELECT * FROM {example_table}", "query_type": "sql"}}"""
        else:
            return f"""You are a filter query generator for {source_type} files. Convert natural language queries to filter expressions.

Available schema:
{schema_str}

Rules:
- Generate JSON filter expressions
- Use operators: ==, !=, >, >=, <, <=, in, contains
- Return JSON with 'query' and 'query_type' fields
- query_type should be 'filter'

Example response:
{{"query": "{{\\"column\\": \\"age\\", \\"operator\\": \\">\\", \\"value\\": 18}}", "query_type": "filter"}}"""
    
    def suggest_visualizations(self, data: List[Dict[str, Any]], prompt: str) -> List[Dict[str, Any]]:
        """
        Suggest visualizations based on data and prompt.
        
        Args:
            data: Query result data
            prompt: Original user prompt
            
        Returns:
            List of visualization suggestions
        """
        # Simple heuristic-based visualization suggestions
        # In production, this could use LLM for better suggestions
        
        if not data:
            return []
        
        # Get column names and types
        columns = list(data[0].keys())
        numeric_cols = []
        text_cols = []
        
        for col in columns:
            sample_val = data[0].get(col)
            if isinstance(sample_val, (int, float)):
                numeric_cols.append(col)
            else:
                text_cols.append(col)
        
        suggestions = []
        
        # KPI card if single numeric column
        if len(numeric_cols) == 1 and len(columns) == 1:
            suggestions.append({
                "type": "kpi",
                "config": {
                    "title": prompt[:50],
                    "value_field": numeric_cols[0]
                }
            })
        
        # Bar chart for categorical vs numeric
        if len(text_cols) >= 1 and len(numeric_cols) >= 1:
            suggestions.append({
                "type": "bar",
                "config": {
                    "xAxis": text_cols[0],
                    "yAxis": numeric_cols[0],
                    "title": prompt[:50]
                }
            })
        
        # Table view as fallback
        suggestions.append({
            "type": "table",
            "config": {
                "columns": columns,
                "title": "Query Results"
            }
        })
        
        return suggestions[:3]  # Return top 3 suggestions

