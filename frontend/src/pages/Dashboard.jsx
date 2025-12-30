import { useState, useEffect, useRef } from 'react';
import { TableWidget } from '../components/visualizations/TableWidget';
import { VisualizationRenderer } from '../components/visualizations/VisualizationRenderer';
import { DashboardWidget } from '../components/visualizations/DashboardWidget';
import { queriesApi } from '../api/queriesApi';
import { dataSourcesApi } from '../api/dataSourcesApi';

export function Dashboard() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [visualizations, setVisualizations] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [dataSources, setDataSources] = useState([]);
  const [selectedSources, setSelectedSources] = useState([]);
  const [queryStatus, setQueryStatus] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [lastQuery, setLastQuery] = useState(null);
  const textareaRef = useRef(null);
  const statusIntervalRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    loadDataSources();
    
    // Cleanup interval on unmount
    return () => {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
    };
  }, []);

  const loadDataSources = async () => {
    try {
      const sources = await dataSourcesApi.list();
      setDataSources(sources || []);
      // Auto-select first active source
      const activeSources = sources.filter(s => s.is_active);
      if (activeSources.length > 0) {
        setSelectedSources([activeSources[0].id]);
      }
    } catch (err) {
      console.error('Failed to load data sources:', err);
    }
  };

  const handleQuery = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResults(null);
    setVisualizations([]);
    setMetadata(null);
    setQueryStatus('Connecting to data source...');
    setElapsedTime(0);
    startTimeRef.current = Date.now();

    // Update elapsed time every second
    statusIntervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedTime(elapsed);
      }
    }, 1000);

    try {
      console.log('Executing query:', query);
      console.log('Selected data sources:', selectedSources);
      
      setQueryStatus('Loading schema information...');
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX
      
      setQueryStatus('Converting query with AI (this may take 30-60 seconds)...');
      setLastQuery(query); // Save the query for retry
      
      const response = await queriesApi.execute(
        query,
        selectedSources.length > 0 ? selectedSources : null,
        100
      );

      console.log('Query response:', response);

      setQueryStatus('Executing query...');
      await new Promise(resolve => setTimeout(resolve, 300));

      if (response.status === 'error') {
        setError(response.error_message || 'Query failed');
        setErrorDetails({
          executed_query: response.executed_query,
          available_tables: response.available_tables,
          metadata: response.metadata
        });
        setQueryStatus(null);
      } else if (response.data) {
        setResults(response.data); // Store the data array directly for TableWidget
        setVisualizations(response.visualizations || []); // Store visualizations
        setMetadata(response.metadata || null); // Store metadata
        console.log('Query response:', {
          dataCount: response.data?.length,
          visualizations: response.visualizations?.length,
          metadata: response.metadata
        });
        setError(null);
        setErrorDetails(null);
        setQueryStatus('Query completed successfully!');
        setTimeout(() => setQueryStatus(null), 2000);
      } else {
        setError('No data returned');
        setErrorDetails(null);
        setQueryStatus(null);
      }
    } catch (err) {
      console.error('Query error:', err);
      const errorMessage = err.message || err.response?.data?.detail || 'Failed to execute query';
      setError(errorMessage);
      setErrorDetails({
        executed_query: err.response?.data?.executed_query,
        available_tables: err.response?.data?.available_tables,
        metadata: err.response?.data?.metadata
      });
      setQueryStatus(null);
    } finally {
      setLoading(false);
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
        statusIntervalRef.current = null;
      }
      startTimeRef.current = null;
    }
  };

  const handleCancel = () => {
    setLoading(false);
    setQueryStatus(null);
    setElapsedTime(0);
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
      statusIntervalRef.current = null;
    }
    startTimeRef.current = null;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Data Sources (optional - will use all if none selected)
            </label>
            <div className="flex flex-wrap gap-2 mb-4">
              {dataSources.map((source) => (
                <label
                  key={source.id}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg border cursor-pointer ${
                    selectedSources.includes(source.id)
                      ? 'bg-primary-50 border-primary-500'
                      : 'bg-gray-50 border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedSources.includes(source.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSources([...selectedSources, source.id]);
                      } else {
                        setSelectedSources(selectedSources.filter(id => id !== source.id));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{source.source_name}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ask a question about your data
            </label>
            <textarea
              ref={textareaRef}
              id="query-textarea"
              name="query"
              value={query}
              onChange={(e) => {
                const newValue = e.target.value;
                console.log('Textarea onChange triggered, new value:', newValue);
                setQuery(newValue);
              }}
              onInput={(e) => {
                console.log('Textarea onInput triggered');
                setQuery(e.target.value);
              }}
              onFocus={(e) => {
                console.log('Textarea focused');
              }}
              onClick={(e) => {
                console.log('Textarea clicked');
                e.target.focus();
              }}
              onKeyDown={(e) => {
                console.log('Key pressed:', e.key, 'Value:', e.target.value);
                if (e.key === 'Enter' && e.ctrlKey) {
                  e.preventDefault();
                  handleQuery();
                }
              }}
              placeholder="e.g., Show me all customers from New York (Press Ctrl+Enter to run)"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-y bg-white text-gray-900"
              rows={4}
            />
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleQuery}
              disabled={loading || !query.trim()}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 flex items-center space-x-2"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span>{loading ? 'Running Query...' : 'Run Query'}</span>
            </button>
            {loading && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
              >
                Cancel
              </button>
            )}
            <button
              onClick={() => {
                if (textareaRef.current) {
                  textareaRef.current.focus();
                  textareaRef.current.value = 'Show me all customers';
                  setQuery('Show me all customers');
                  console.log('Set test query');
                }
              }}
              type="button"
              disabled={loading}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm disabled:opacity-50"
            >
              Test: Fill Sample Query
            </button>
          </div>

          {/* Progress Indicator */}
          {loading && queryStatus && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-sm font-medium text-blue-900">{queryStatus}</p>
                </div>
                <p className="text-xs text-blue-700">
                  {elapsedTime > 0 && `${elapsedTime}s elapsed`}
                </p>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min((elapsedTime / 120) * 100, 95)}%` 
                  }}
                ></div>
              </div>
              {elapsedTime > 60 && (
                <p className="text-xs text-blue-700 mt-2">
                  ⚠️ This is taking longer than usual. The AI model might be processing a complex query.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-red-800 font-medium mb-2">Query Error</p>
              <p className="text-sm text-red-700 mb-4 whitespace-pre-wrap">{error}</p>
              
              {/* Show executed query if available */}
              {errorDetails?.executed_query && (
                <div className="mb-4 p-3 bg-red-100 rounded border border-red-200">
                  <p className="text-xs font-medium text-red-800 mb-1">Generated Query:</p>
                  <code className="text-xs text-red-900 block bg-white p-2 rounded border border-red-300 overflow-x-auto">
                    {errorDetails.executed_query}
                  </code>
                </div>
              )}
              
              {/* Show available tables if table not found error */}
              {errorDetails?.available_tables && errorDetails.available_tables.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                  <p className="text-xs font-medium text-yellow-800 mb-2">
                    {error.includes('does not exist') || error.includes('relation') 
                      ? 'The table you requested doesn\'t exist. Available tables:' 
                      : 'Available Tables:'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {errorDetails.available_tables.map((table, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setQuery(`Show me all data from ${table} table`);
                          setError(null);
                          setErrorDetails(null);
                          if (textareaRef.current) {
                            textareaRef.current.focus();
                          }
                        }}
                        className="px-3 py-1.5 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 border border-yellow-300 font-medium"
                      >
                        {table}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-yellow-700 mt-2">
                    💡 Click a table name above to automatically update your query
                  </p>
                </div>
              )}
              
              {/* Query suggestions based on error type */}
              {error.includes('does not exist') || error.includes('relation') ? (
                <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="text-xs font-medium text-blue-800 mb-2">💡 Try these queries instead:</p>
                  <div className="space-y-2">
                    {errorDetails?.available_tables && errorDetails.available_tables.length > 0 ? (
                      errorDetails.available_tables.slice(0, 3).map((table, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setQuery(`Show me all data from ${table}`);
                            setError(null);
                            setErrorDetails(null);
                            if (textareaRef.current) {
                              textareaRef.current.focus();
                            }
                          }}
                          className="w-full text-left px-3 py-2 text-xs bg-white text-blue-700 rounded hover:bg-blue-100 border border-blue-300"
                        >
                          "Show me all data from {table}"
                        </button>
                      ))
                    ) : (
                      <button
                        onClick={() => {
                          setQuery('Show me the first 10 rows');
                          setError(null);
                          setErrorDetails(null);
                        }}
                        className="w-full text-left px-3 py-2 text-xs bg-white text-blue-700 rounded hover:bg-blue-100 border border-blue-300"
                      >
                        "Show me the first 10 rows"
                      </button>
                    )}
                  </div>
                </div>
              ) : null}
              
              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  onClick={() => {
                    setError(null);
                    setErrorDetails(null);
                    handleQuery();
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  Retry Query
                </button>
                <button
                  onClick={() => {
                    setError(null);
                    setErrorDetails(null);
                    if (textareaRef.current) {
                      textareaRef.current.focus();
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Edit Query
                </button>
                {selectedSources.length > 0 && (
                  <button
                    onClick={() => {
                      const sourceId = selectedSources[0];
                      window.open(`/data-sources?preview=${sourceId}`, '_blank');
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                  >
                    View Schema
                  </button>
                )}
                {error.includes('timeout') || error.includes('timed out') ? (
                  <button
                    onClick={() => {
                      setQuery('Show me the first 10 rows');
                      setError(null);
                      setErrorDetails(null);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    Try Simpler Query
                  </button>
                ) : null}
              </div>
              
              {/* Troubleshooting for timeout */}
              {error.includes('timeout') || error.includes('timed out') ? (
                <div className="text-xs text-red-600 bg-red-100 p-3 rounded mt-4">
                  <p className="font-medium mb-1">Troubleshooting:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Check if Ollama service is running: <code className="bg-red-200 px-1 rounded">docker ps | grep ollama</code></li>
                    <li>Verify the model is loaded: <code className="bg-red-200 px-1 rounded">docker exec ollama_service ollama list</code></li>
                    <li>Try a simpler query first</li>
                    <li>Check Docker logs: <code className="bg-red-200 px-1 rounded">docker logs ollama_service</code></li>
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Display Visualizations/Dashboards */}
      {visualizations && visualizations.length > 0 && results && results.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Dashboard Suggestions</h2>
          <div className="space-y-6">
            {visualizations.map((viz, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow bg-white">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 capitalize">
                      {viz.type === 'dashboard' ? viz.config?.title || 'Dashboard' : viz.type}
                    </h3>
                    {viz.config?.description && (
                      <p className="text-sm text-gray-600 mt-1">{viz.config.description}</p>
                    )}
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium capitalize">
                    {viz.type}
                  </span>
                </div>
                {viz.type === 'dashboard' && viz.config?.widgets ? (
                  <DashboardWidget dashboard={viz} allData={results} />
                ) : (
                  <div className="mt-2">
                    <VisualizationRenderer visualization={viz} data={results} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Display Results Table */}
      {results && results.length > 0 && (
        <>
          {/* Show data source breakdown if multiple sources */}
          {results.some(r => r._source) && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-2">📊 Data Sources Used:</p>
              <div className="flex flex-wrap gap-2">
                {[...new Set(results.map(r => r._source).filter(Boolean))].map(source => {
                  const count = results.filter(r => r._source === source).length;
                  return (
                    <span key={source} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-medium">
                      {source}: {count} rows
                    </span>
                  );
                })}
              </div>
              {metadata?.sources_used && (
                <p className="text-xs text-blue-700 mt-2">
                  Sources: {metadata.sources_used.join(', ')}
                </p>
              )}
            </div>
          )}
          <TableWidget data={results} title="Query Results" />
        </>
      )}

      {results && results.length === 0 && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">Query executed successfully but returned no results.</p>
          <button
            onClick={() => {
              setQuery('');
              setResults(null);
              if (textareaRef.current) {
                textareaRef.current.focus();
              }
            }}
            className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
          >
            Try Another Query
          </button>
        </div>
      )}

      {/* Success message with next actions */}
      {results && results.length > 0 && !loading && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-green-800 font-medium">
                Found {results.length} result{results.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => {
                setQuery('');
                setResults(null);
                if (textareaRef.current) {
                  textareaRef.current.focus();
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              Ask Another Question
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

