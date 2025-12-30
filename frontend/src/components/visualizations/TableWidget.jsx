import { useState, useMemo } from 'react';
import { Download, Copy, FileSpreadsheet, Search } from 'lucide-react';
import { exportToCSV, exportToExcel, copyToClipboard } from '../../utils/export';

export function TableWidget({ data = [], title = 'Data Table' }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    if (!searchTerm || !data.length) return data;

    const term = searchTerm.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(term)
      )
    );
  }, [data, searchTerm]);

  const handleCopy = async () => {
    try {
      await copyToClipboard(filteredData);
      // You might want to show a toast notification here
      alert('Data copied to clipboard!');
    } catch (error) {
      alert('Failed to copy to clipboard');
    }
  };

  const handleExportCSV = () => {
    try {
      exportToCSV(filteredData, 'data.csv');
    } catch (error) {
      alert('Failed to export CSV');
    }
  };

  const handleExportExcel = () => {
    try {
      exportToExcel(filteredData, 'data.xlsx');
    } catch (error) {
      alert('Failed to export Excel');
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-500">No data to display</p>
      </div>
    );
  }

  const columns = Object.keys(data[0] || {});

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Copy to clipboard"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={handleExportCSV}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Export to CSV"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleExportExcel}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Export to Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Showing {filteredData.length} of {data.length} rows
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td
                    key={column}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {row[column] === null || row[column] === undefined
                      ? <span className="text-gray-400">null</span>
                      : String(row[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


