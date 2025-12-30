import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function PieChartWidget({ data, config }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available
      </div>
    );
  }

  const labelField = config?.labelField;
  const valueField = config?.valueField;
  const title = config?.title || 'Pie Chart';

  if (!labelField || !valueField) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Chart configuration missing (need labelField and valueField)
      </div>
    );
  }

  // Prepare chart data - aggregate if needed
  const chartDataMap = new Map();
  
  data.forEach(row => {
    const label = String(row[labelField] || 'N/A');
    const value = Number(row[valueField]) || 0;
    
    if (chartDataMap.has(label)) {
      chartDataMap.set(label, chartDataMap.get(label) + value);
    } else {
      chartDataMap.set(label, value);
    }
  });

  const chartData = Array.from(chartDataMap.entries()).map(([name, value]) => ({
    name,
    value
  }));

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

