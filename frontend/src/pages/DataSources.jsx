import { useState } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Plus } from 'lucide-react';
import { DataSourceList } from '../components/data-sources/DataSourceList';
import { DataSourceForm } from '../components/data-sources/DataSourceForm';

export function DataSources() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Data Sources</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          <Plus className="w-4 h-4" />
          <span>Add Data Source</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <DataSourceForm
            onSuccess={() => {
              setShowForm(false);
              window.location.reload(); // Refresh to show new source
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <ErrorBoundary>
        <DataSourceList />
      </ErrorBoundary>
    </div>
  );
}

