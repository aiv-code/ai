export function KPIWidget({ data, config }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500">
        No data available
      </div>
    );
  }

  const valueField = config?.valueField || config?.field;
  const title = config?.title || 'KPI';

  if (!valueField) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500">
        KPI field not specified
      </div>
    );
  }

  // Calculate total or average based on data
  const values = data.map(row => Number(row[valueField]) || 0).filter(v => !isNaN(v));
  if (values.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500">
        No numeric values found
      </div>
    );
  }
  
  const total = values.reduce((sum, val) => sum + val, 0);
  const average = values.length > 0 ? total / values.length : 0;
  const displayValue = values.length === 1 ? total : average;

  return (
    <div className="w-full h-full p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <div className="text-4xl font-bold text-blue-900">
        {typeof displayValue === 'number' 
          ? displayValue.toLocaleString(undefined, { maximumFractionDigits: 2 })
          : displayValue}
      </div>
      {values.length > 1 && (
        <p className="text-xs text-gray-500 mt-2">Average of {values.length} values</p>
      )}
    </div>
  );
}

