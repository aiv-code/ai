import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function BarChartWidget({ data, config }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available
      </div>
    );
  }

  if (!config || !config.xAxis || !config.yAxis) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Chart configuration missing
      </div>
    );
  }

  const xAxisField = config.xAxis;
  const yAxisField = config.yAxis;
  const title = config.title || 'Bar Chart';

  // Prepare chart data - aggregate if needed
  const chartDataMap = new Map();
  
  data.forEach(row => {
    const xValue = String(row[xAxisField] || 'N/A');
    const yValue = Number(row[yAxisField]) || 0;
    
    if (chartDataMap.has(xValue)) {
      chartDataMap.set(xValue, chartDataMap.get(xValue) + yValue);
    } else {
      chartDataMap.set(xValue, yValue);
    }
  });

  const chartData = Array.from(chartDataMap.entries()).map(([x, y]) => ({
    [xAxisField]: x,
    [yAxisField]: y
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 text-sm">
        <p>No valid data points</p>
        <p className="text-xs mt-2">X: {xAxisField}, Y: {yAxisField}</p>
        {data && data.length > 0 && (
          <p className="text-xs mt-1">Sample fields: {Object.keys(data[0]).filter(k => !k.startsWith('_')).slice(0, 5).join(', ')}</p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey={xAxisField} 
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
            tick={{ fontSize: 12 }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey={yAxisField} fill="#3b82f6" name={yAxisField} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

