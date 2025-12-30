import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function ScatterChartWidget({ data, config }) {
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
  const title = config.title || 'Scatter Chart';

  // Prepare chart data - filter out invalid points
  const chartData = data
    .map(row => ({
      x: Number(row[xAxisField]),
      y: Number(row[yAxisField])
    }))
    .filter(point => !isNaN(point.x) && !isNaN(point.y));

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            type="number"
            dataKey="x"
            name={xAxisField}
            label={{ value: xAxisField, position: 'insideBottom', offset: -5 }}
          />
          <YAxis 
            type="number"
            dataKey="y"
            name={yAxisField}
            label={{ value: yAxisField, angle: -90, position: 'insideLeft' }}
          />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Legend />
          <Scatter name="Data Points" data={chartData} fill="#3b82f6" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

