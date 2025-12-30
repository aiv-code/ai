import { useState, useEffect } from 'react';
import { Eye, Trash2, Database, RefreshCw } from 'lucide-react';
import { dataSourcesApi } from '../../api/dataSourcesApi';
import { DataPreview } from './DataPreview';
import { testApiConnection } from '../../utils/apiTest';

export function DataSourceList() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewingSource, setPreviewingSource] = useState(null);
  const [testingConnection, setTestingConnection] = useState(false);

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    setLoading(true);
    setError(null);
    try {
      // Check if API key is set
      const apiKey = localStorage.getItem('apiKey');
      if (!apiKey) {
        setError('API key not set. Please go to Settings and configure your API key.');
        setLoading(false);
        return;
      }

      console.log('Loading data sources with API key:', apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET');
      console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000');
      
      const data = await dataSourcesApi.list();
      console.log('Data sources loaded:', data);
      console.log('Number of data sources:', data?.length || 0);
      setSources(data || []);
      
      if (!data || data.length === 0) {
        console.warn('No data sources returned. This might mean:');
        console.warn('1. The API key belongs to a client with no data sources');
        console.warn('2. The data sources belong to a different client');
        console.warn('3. All data sources are inactive');
      }
    } catch (err) {
      console.error('Error loading data sources:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data,
        code: err.code,
        request: err.request
      });
      
      // Safely extract error message
      let errorMessage = 'Failed to load data sources.';
      
      // Check for network errors (no response received)
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error') || err.message?.includes('Failed to fetch') || (!err.response && err.request)) {
        errorMessage = 'Network Error: Cannot connect to backend API. Please ensure the backend is running on http://localhost:8000';
      } else if (err) {
        if (err.response?.status === 401) {
          errorMessage = 'Invalid API key. Please check your API key in Settings.';
        } else if (err.response?.status === 403) {
          errorMessage = 'Client account is inactive. Please contact administrator.';
        } else if (typeof err === 'string') {
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

  const handleDelete = async (sourceId) => {
    if (!window.confirm('Are you sure you want to delete this data source?')) {
      return;
    }

    try {
      await dataSourcesApi.delete(sourceId);
      setSources(sources.filter((s) => s.id !== sourceId));
      if (previewingSource === sourceId) {
        setPreviewingSource(null);
      }
    } catch (err) {
      console.error('Error deleting data source:', err);
      // Safely extract error message
      let errorMessage = 'Failed to delete data source';
      
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
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    // Ensure error is a string
    const errorText = typeof error === 'string' ? error : String(error);
    const apiKey = localStorage.getItem('apiKey');
    
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-800 font-medium mb-2">Error loading data sources</p>
        <p className="text-sm text-red-700">{errorText}</p>
        
        {(!apiKey || errorText.includes('Network Error') || errorText.includes('Cannot connect')) && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-xs text-yellow-800 font-medium mb-1">
              {!apiKey ? 'No API key configured' : 'Connection Issue'}
            </p>
            {!apiKey ? (
              <>
                <p className="text-xs text-yellow-700">
                  Data sources are filtered by client. You need to set the API key for the client that owns the data sources.
                </p>
                <p className="text-xs text-yellow-700 mt-1 mb-2">
                  Quick setup: Use the default Demo Client API key (if using Docker setup).
                </p>
                <button
                  onClick={() => {
                    const defaultApiKey = 'M_cBEte-4FfupNUsHhe_NjgV6fraEmMw-GubfjQiFxQ';
                    localStorage.setItem('apiKey', defaultApiKey);
                    alert('API key set! Refreshing page...');
                    window.location.reload();
                  }}
                  className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                >
                  Use Default API Key (Demo Client)
                </button>
              </>
            ) : (
              <>
                <p className="text-xs text-yellow-700 mb-2">
                  The frontend cannot connect to the backend API at http://localhost:8000
                </p>
                <p className="text-xs text-yellow-700 mb-2">
                  Please verify:
                </p>
                <ul className="text-xs text-yellow-700 list-disc list-inside mb-2 space-y-1">
                  <li>The backend container is running: <code className="bg-yellow-100 px-1 rounded">docker ps</code></li>
                  <li>Backend is accessible: <code className="bg-yellow-100 px-1 rounded">http://localhost:8000/health</code></li>
                  <li>No firewall is blocking port 8000</li>
                </ul>
              </>
            )}
            <p className="text-xs text-yellow-700 mt-2">
              Or go to Settings to configure a different API key, or use the Admin page to find/create clients.
            </p>
          </div>
        )}
        
        {apiKey && errorText.includes('Invalid') && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-xs text-yellow-800 font-medium mb-1">API Key Issue</p>
            <p className="text-xs text-yellow-700">
              The API key you're using might belong to a different client than the one that has the data sources.
            </p>
            <p className="text-xs text-yellow-700 mt-1 mb-2">
              Try using the default Demo Client API key:
            </p>
            <button
              onClick={() => {
                const defaultApiKey = 'M_cBEte-4FfupNUsHhe_NjgV6fraEmMw-GubfjQiFxQ';
                localStorage.setItem('apiKey', defaultApiKey);
                alert('API key updated! Refreshing page...');
                window.location.reload();
              }}
              className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
            >
              Use Default API Key (Demo Client)
            </button>
            <p className="text-xs text-yellow-700 mt-2">
              Or check the Admin page to see all clients and their API keys.
            </p>
          </div>
        )}
        
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={loadSources}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
          >
            Retry
          </button>
          <button
            onClick={async () => {
              setTestingConnection(true);
              const result = await testApiConnection();
              console.log('API Test Result:', result);
              alert(`API Test:\n${result.message}\n\nCheck browser console (F12) for details.`);
              setTestingConnection(false);
            }}
            disabled={testingConnection}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm disabled:opacity-50"
          >
            {testingConnection ? 'Testing...' : 'Test API Connection'}
          </button>
          <a
            href="/settings"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Go to Settings
          </a>
          <a
            href="/admin"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
          >
            View Clients
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sources.length === 0 ? (
        <div className="text-center py-12">
          <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No data sources found for this client.</p>
          <p className="text-sm text-gray-500 mb-4">
            Data sources are filtered by client. Make sure you're using the API key for the correct client.
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => window.location.href = '/admin'}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
            >
              Check Clients
            </button>
            <button
              onClick={() => window.location.href = '/settings'}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm"
            >
              Check API Key
            </button>
          </div>
        </div>
      ) : (
        sources.map((source) => (
          <div key={source.id}>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{source.source_name}</h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        source.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {source.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                      {source.source_type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Created: {new Date(source.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      setPreviewingSource(
                        previewingSource === source.id ? null : source.id
                      )
                    }
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => window.location.href = `/?test=${source.id}`}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    title="Test Query"
                  >
                    Test
                  </button>
                  <button
                    onClick={() => handleDelete(source.id)}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            {previewingSource === source.id && (
              <div className="mt-4 bg-white rounded-lg border border-gray-200 p-6">
                <DataPreview sourceId={source.id} />
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

