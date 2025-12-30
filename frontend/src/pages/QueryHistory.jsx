import { useState, useEffect } from 'react';
import { History as HistoryIcon } from 'lucide-react';

export function QueryHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Placeholder - implement actual history loading
    setLoading(false);
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Query History</h1>
        <p className="text-gray-600 mt-2">View your past queries and results</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      ) : history.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <HistoryIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No query history found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-gray-900">{item.prompt}</p>
              <p className="text-sm text-gray-500 mt-2">
                {new Date(item.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


