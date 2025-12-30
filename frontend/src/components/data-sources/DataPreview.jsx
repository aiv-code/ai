import { useState, useEffect } from 'react';
import { Loader2, Database, Table } from 'lucide-react';
import { dataSourcesApi } from '../../api/dataSourcesApi';

export function DataPreview({ sourceId, limit = 10 }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState(null);

  useEffect(() => {
    if (sourceId) {
      loadPreview();
    }
  }, [sourceId, limit]);

  const loadPreview = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Loading preview for source ID:', sourceId);
      const data = await dataSourcesApi.getPreview(sourceId, limit);
      console.log('Preview data received:', data);
      setPreviewData(data);
    } catch (err) {
      console.error('Error loading preview:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data
      });
      
      // Safely extract error message
      let errorMessage = 'Failed to load preview';
      
      if (err) {
        if (typeof err === 'string') {
          errorMessage = err;
        } else if (err.message) {
          errorMessage = String(err.message);
        } else if (err.response?.data?.detail) {
          const detail = err.response.data.detail;
          if (Array.isArray(detail)) {
            errorMessage = detail.map(e => e.msg || 'Validation error').join('; ');
          } else if (typeof detail === 'string') {
            errorMessage = detail;
          }
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        <span className="ml-2 text-gray-600">Loading preview...</span>
      </div>
    );
  }

  if (error) {
    // Ensure error is a string
    const errorText = typeof error === 'string' ? error : String(error);
    
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-800 font-medium mb-2">Preview Error</p>
        <p className="text-sm text-red-700 mb-3">{errorText}</p>
        <div className="text-xs text-red-600 space-y-1">
          <p>Common issues:</p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>PostgreSQL: Database connection failed or table not found</li>
            <li>Excel/Parquet: File path not accessible or file missing</li>
            <li>Check browser console (F12) for detailed error messages</li>
          </ul>
        </div>
        <button
          onClick={loadPreview}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
        >
          Retry Preview
        </button>
      </div>
    );
  }

  if (!previewData) {
    return null;
  }

  const schema = previewData.schema || {};
  const sampleData = previewData.sample_data || [];
  const tableNames = Object.keys(schema);

  return (
    <div className="space-y-6">
      {/* Schema Information */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Database className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-gray-900">Schema</h3>
        </div>
        
        {tableNames.length === 0 ? (
          <p className="text-sm text-gray-500">No schema information available</p>
        ) : (
          <div className="space-y-4">
            {tableNames.map((tableName) => {
              const columns = schema[tableName] || [];
              return (
                <div key={tableName} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Table className="w-4 h-4 text-gray-600" />
                    <h4 className="font-medium text-gray-900">{tableName}</h4>
                    <span className="text-xs text-gray-500">
                      ({columns.length} columns)
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {columns.map((col, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded border border-gray-200 p-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">
                            {col.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {col.type}
                          </span>
                        </div>
                        {col.nullable !== undefined && (
                          <div className="mt-1">
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded ${
                                col.nullable
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {col.nullable ? 'Nullable' : 'Required'}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sample Data */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Table className="w-5 h-5 text-primary-500" />
            <h3 className="text-lg font-semibold text-gray-900">Sample Data</h3>
          </div>
          <span className="text-sm text-gray-500">
            Showing {sampleData.length} of {previewData.row_count || sampleData.length} rows
          </span>
        </div>

        {sampleData.length === 0 ? (
          <p className="text-sm text-gray-500">No sample data available</p>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(sampleData[0] || {}).map((key) => (
                    <th
                      key={key}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sampleData.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-gray-50">
                    {Object.values(row).map((value, colIdx) => (
                      <td
                        key={colIdx}
                        className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                      >
                        {value === null || value === undefined
                          ? <span className="text-gray-400">null</span>
                          : String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

