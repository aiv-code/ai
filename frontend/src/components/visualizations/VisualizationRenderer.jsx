import { BarChartWidget } from './BarChartWidget';
import { LineChartWidget } from './LineChartWidget';
import { PieChartWidget } from './PieChartWidget';
import { KPIWidget } from './KPIWidget';
import { ScatterChartWidget } from './ScatterChartWidget';
import { TableWidget } from './TableWidget';

export function VisualizationRenderer({ visualization, data }) {
  if (!visualization || !data) {
    return null;
  }

  const { type, config } = visualization;

  switch (type) {
    case 'bar':
      return <BarChartWidget data={data} config={config} />;
    case 'line':
      return <LineChartWidget data={data} config={config} />;
    case 'pie':
      return <PieChartWidget data={data} config={config} />;
    case 'kpi':
      return <KPIWidget data={data} config={config} />;
    case 'scatter':
      return <ScatterChartWidget data={data} config={config} />;
    case 'table':
      return <TableWidget data={data} config={config} />;
    default:
      return (
        <div className="p-4 text-gray-500">
          Visualization type "{type}" not supported
        </div>
      );
  }
}


