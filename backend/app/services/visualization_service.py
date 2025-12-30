"""Visualization suggestion service."""
from typing import List, Dict, Any


class VisualizationService:
    """Service for suggesting visualizations based on data."""
    
    def suggest_visualizations(self, data: List[Dict[str, Any]], prompt: str) -> List[Dict[str, Any]]:
        """
        Suggest visualizations based on data and prompt.
        
        Args:
            data: Query result data
            prompt: Original user prompt
            
        Returns:
            List of visualization suggestions
        """
        if not data:
            return []
        
        # Get column names and types
        columns = list(data[0].keys())
        numeric_cols = []
        text_cols = []
        date_cols = []
        
        for col in columns:
            sample_val = data[0].get(col)
            if isinstance(sample_val, (int, float)):
                numeric_cols.append(col)
            elif isinstance(sample_val, str):
                # Try to detect dates
                if any(keyword in col.lower() for keyword in ['date', 'time', 'created', 'updated']):
                    date_cols.append(col)
                else:
                    text_cols.append(col)
        
        suggestions = []
        
        # KPI card if single numeric column
        if len(numeric_cols) == 1 and len(columns) == 1:
            suggestions.append({
                "type": "kpi",
                "config": {
                    "title": self._extract_title(prompt),
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
                    "title": self._extract_title(prompt)
                }
            })
        
        # Line chart for time series
        if len(date_cols) >= 1 and len(numeric_cols) >= 1:
            suggestions.append({
                "type": "line",
                "config": {
                    "xAxis": date_cols[0],
                    "yAxis": numeric_cols[0],
                    "title": self._extract_title(prompt)
                }
            })
        
        # Pie chart for single categorical with numeric
        if len(text_cols) == 1 and len(numeric_cols) == 1 and len(data) <= 20:
            suggestions.append({
                "type": "pie",
                "config": {
                    "labelField": text_cols[0],
                    "valueField": numeric_cols[0],
                    "title": self._extract_title(prompt)
                }
            })
        
        # Scatter plot for two numeric columns
        if len(numeric_cols) >= 2:
            suggestions.append({
                "type": "scatter",
                "config": {
                    "xAxis": numeric_cols[0],
                    "yAxis": numeric_cols[1],
                    "title": self._extract_title(prompt)
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
    
    def suggest_dashboards(self, data: List[Dict[str, Any]], schema_info: Dict[str, Dict[str, Any]], prompt: str) -> List[Dict[str, Any]]:
        """
        Suggest dashboard layouts based on multiple data sources.
        
        Args:
            data: Combined data from multiple sources
            schema_info: Dictionary mapping source names to their schemas
            prompt: Original user prompt
            
        Returns:
            List of dashboard suggestions
        """
        suggestions = []
        
        # Group data by source
        sources_data = {}
        for row in data:
            source = row.get('_source', 'unknown')
            if source not in sources_data:
                sources_data[source] = []
            sources_data[source].append(row)
        
        # Create dashboard suggestions based on available sources
        dashboard_configs = []
        
        # 1. Overview Dashboard - KPIs from all sources
        kpi_widgets = []
        for source_name, source_rows in sources_data.items():
            if source_rows:
                cols = list(source_rows[0].keys())
                numeric_cols = [c for c in cols if c not in ['_source', '_source_type'] and 
                               any(isinstance(r.get(c), (int, float)) for r in source_rows[:5])]
                if numeric_cols:
                    kpi_widgets.append({
                        "type": "kpi",
                        "source": source_name,
                        "field": numeric_cols[0],
                        "title": f"{source_name} - {numeric_cols[0]}"
                    })
        
        if kpi_widgets:
            dashboard_configs.append({
                "type": "dashboard",
                "config": {
                    "title": "Overview Dashboard",
                    "description": "Key metrics from all data sources",
                    "layout": "grid",
                    "widgets": kpi_widgets[:6]  # Max 6 KPIs
                }
            })
        
        # 2. Sales Analytics Dashboard (if sales/customer data exists)
        sales_sources = [s for s in sources_data.keys() if 'sales' in s.lower() or 'customer' in s.lower()]
        if sales_sources:
            dashboard_configs.append({
                "type": "dashboard",
                "config": {
                    "title": "Sales Analytics Dashboard",
                    "description": "Sales performance and customer insights",
                    "layout": "grid",
                    "widgets": [
                        {"type": "bar", "title": "Sales by Category", "source": sales_sources[0]},
                        {"type": "line", "title": "Sales Trend", "source": sales_sources[0]},
                        {"type": "pie", "title": "Customer Distribution", "source": sales_sources[0] if sales_sources else None}
                    ]
                }
            })
        
        # 3. Multi-Source Comparison Dashboard
        if len(sources_data) > 1:
            comparison_widgets = []
            for source_name in list(sources_data.keys())[:4]:  # Max 4 sources
                comparison_widgets.append({
                    "type": "table",
                    "source": source_name,
                    "title": f"{source_name} Data"
                })
            
            dashboard_configs.append({
                "type": "dashboard",
                "config": {
                    "title": "Multi-Source Comparison",
                    "description": "Compare data across all sources",
                    "layout": "grid",
                    "widgets": comparison_widgets
                }
            })
        
        # If no specific dashboards, create generic suggestions
        if not dashboard_configs:
            dashboard_configs.append({
                "type": "dashboard",
                "config": {
                    "title": "Custom Dashboard",
                    "description": "Create a dashboard with widgets from your data sources",
                    "layout": "grid",
                    "widgets": [
                        {"type": "table", "title": "Data Overview"},
                        {"type": "bar", "title": "Data Visualization"}
                    ]
                }
            })
        
        return dashboard_configs[:3]  # Return top 3 dashboard suggestions
    
    def _extract_title(self, prompt: str) -> str:
        """Extract a title from the prompt."""
        # Simple title extraction
        title = prompt.strip()
        if len(title) > 50:
            title = title[:47] + "..."
        return title or "Query Results"

