import { VisualizationRenderer } from './VisualizationRenderer';

/**
 * Helper function to detect columns from data
 */
function detectColumns(data) {
  if (!data || data.length === 0) return { numeric: [], text: [], date: [], all: [] };
  
  const firstRow = data[0];
  const columns = Object.keys(firstRow).filter(k => !k.startsWith('_'));
  
  const numeric = [];
  const text = [];
  const date = [];
  const category = []; // Category-like fields (product, category, type, etc.)
  
  columns.forEach(col => {
    const colLower = col.toLowerCase();
    const sample = firstRow[col];
    
    if (typeof sample === 'number') {
      numeric.push(col);
    } else if (typeof sample === 'string') {
      // Try to detect dates
      if (colLower.includes('date') || 
          colLower.includes('time') ||
          colLower.includes('created') ||
          colLower.includes('updated')) {
        date.push(col);
      } 
      // Detect category-like fields
      else if (colLower.includes('category') || 
               colLower.includes('product') ||
               colLower.includes('type') ||
               colLower.includes('status') ||
               colLower.includes('name') ||
               colLower.includes('city') ||
               colLower.includes('state') ||
               colLower.includes('country')) {
        category.push(col);
        text.push(col);
      } else {
        text.push(col);
      }
    }
  });
  
  return { numeric, text, date, category, all: columns };
}

/**
 * Auto-generate config for a widget based on data
 */
function generateWidgetConfig(widget, data) {
  // If widget has a source, filter data by source first
  let widgetData = data;
  if (widget.source) {
    widgetData = data.filter(row => row._source === widget.source);
  }
  
  // If no data after filtering, try to use all data
  if (!widgetData || widgetData.length === 0) {
    widgetData = data;
  }
  
  const { numeric, text, date, category, all } = detectColumns(widgetData);
  const titleLower = (widget.title || '').toLowerCase();
  
  const config = {
    title: widget.title || widget.type,
    ...widget
  };
  
  // Auto-detect fields based on widget type and title hints
  switch (widget.type) {
    case 'bar':
      // For "Sales by Category" type titles, prefer category fields
      if (titleLower.includes('category') || titleLower.includes('by')) {
        if (category.length > 0 && numeric.length > 0) {
          config.xAxis = category[0];
          // Prefer fields with "total", "sum", "count", "sales", "amount" in name
          const salesFields = numeric.filter(n => 
            n.toLowerCase().includes('total') || 
            n.toLowerCase().includes('sum') ||
            n.toLowerCase().includes('count') ||
            n.toLowerCase().includes('sales') ||
            n.toLowerCase().includes('amount') ||
            n.toLowerCase().includes('orders') ||
            n.toLowerCase().includes('quantity')
          );
          config.yAxis = salesFields.length > 0 ? salesFields[0] : numeric[0];
        } else if (text.length > 0 && numeric.length > 0) {
          config.xAxis = text[0];
          config.yAxis = numeric[0];
        }
      } else if (!config.xAxis && category.length > 0 && numeric.length > 0) {
        config.xAxis = category[0];
        config.yAxis = numeric[0];
      } else if (!config.xAxis && text.length > 0 && numeric.length > 0) {
        config.xAxis = text[0];
        config.yAxis = numeric[0];
      }
      break;
      
    case 'line':
      // For "Sales Trend" type titles, prefer date fields
      if (titleLower.includes('trend') || titleLower.includes('time')) {
        if (date.length > 0 && numeric.length > 0) {
          config.xAxis = date[0];
          config.yAxis = numeric[0];
        } else if (text.length > 0 && numeric.length > 0) {
          config.xAxis = text[0];
          config.yAxis = numeric[0];
        }
      } else if (date.length > 0 && numeric.length > 0) {
        config.xAxis = date[0];
        config.yAxis = numeric[0];
      } else if (!config.xAxis && text.length > 0 && numeric.length > 0) {
        config.xAxis = text[0];
        config.yAxis = numeric[0];
      }
      break;
      
    case 'pie':
      // Prefer category fields for labels
      if (category.length > 0 && numeric.length > 0) {
        config.labelField = category[0];
        config.valueField = numeric[0];
      } else if (text.length > 0 && numeric.length > 0) {
        config.labelField = text[0];
        config.valueField = numeric[0];
      }
      break;
      
    case 'kpi':
      if (widget.field) {
        config.valueField = widget.field;
      } else if (!config.valueField && numeric.length > 0) {
        // Prefer fields with meaningful names
        const preferredFields = numeric.filter(n => 
          n.toLowerCase().includes('total') || 
          n.toLowerCase().includes('sum') ||
          n.toLowerCase().includes('count')
        );
        config.valueField = preferredFields.length > 0 ? preferredFields[0] : numeric[0];
      }
      break;
      
    case 'scatter':
      if (!config.xAxis && numeric.length >= 2) {
        config.xAxis = numeric[0];
        config.yAxis = numeric[1];
      }
      break;
  }
  
  return { config, data: widgetData };
}

export function DashboardWidget({ dashboard, allData }) {
  if (!dashboard || !dashboard.config || !dashboard.config.widgets) {
    return null;
  }
  
  const { widgets, title, description } = dashboard.config;
  
  return (
    <div className="w-full">
      {description && (
        <p className="text-sm text-gray-600 mb-4">{description}</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {widgets.map((widget, idx) => {
          const { config, data } = generateWidgetConfig(widget, allData);
          
          // Debug logging
          if (process.env.NODE_ENV === 'development') {
            console.log(`Widget ${idx} (${widget.type}):`, {
              title: config.title,
              source: widget.source,
              dataCount: data?.length,
              config: {
                xAxis: config.xAxis,
                yAxis: config.yAxis,
                valueField: config.valueField,
                labelField: config.labelField
              }
            });
          }
          
          // Skip if no valid config could be generated
          if (!config.xAxis && !config.yAxis && !config.valueField && !config.labelField) {
            return (
              <div key={idx} className="border border-gray-200 rounded p-4 bg-gray-50">
                <h4 className="text-sm font-semibold mb-2">{config.title}</h4>
                <p className="text-xs text-gray-500">
                  Configuration needed. Available fields: {data && data.length > 0 ? Object.keys(data[0]).filter(k => !k.startsWith('_')).join(', ') : 'none'}
                </p>
              </div>
            );
          }
          
          // Skip if no data
          if (!data || data.length === 0) {
            return (
              <div key={idx} className="border border-gray-200 rounded p-4 bg-gray-50">
                <h4 className="text-sm font-semibold mb-2">{config.title}</h4>
                <p className="text-xs text-gray-500">No data available for this widget</p>
              </div>
            );
          }
          
          return (
            <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-white">
              <h4 className="text-sm font-semibold mb-3">{config.title}</h4>
              <div style={{ height: '280px', minHeight: '280px' }}>
                <VisualizationRenderer 
                  visualization={{ type: widget.type, config }} 
                  data={data} 
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

