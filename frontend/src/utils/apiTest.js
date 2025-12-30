/**
 * Utility to test API connection and help debug issues
 */
export async function testApiConnection() {
  const apiKey = localStorage.getItem('apiKey');
  // Use relative URLs to leverage Vite proxy, or use env var if set
  const baseURL = import.meta.env.VITE_API_BASE_URL || '';
  // Use 127.0.0.1 instead of localhost to avoid IPv6 issues on Windows
  const directURL = 'http://127.0.0.1:8000';
  
  console.log('=== API Connection Test ===');
  console.log('Base URL (proxy):', baseURL || '(using Vite proxy)');
  console.log('Direct URL:', directURL);
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET');
  
  try {
    // Test health endpoint (no auth required) - try direct connection first
    let healthResponse;
    let healthData;
    try {
      healthResponse = await fetch(`${directURL}/health`);
      healthData = await healthResponse.json();
      console.log('✓ Health check (direct):', healthData);
    } catch (e) {
      console.warn('⚠ Direct health check failed, trying proxy...', e.message);
      // If direct fails, the proxy won't help since /health isn't under /api
      throw new Error('Cannot reach backend at http://localhost:8000/health');
    }
    
    if (!apiKey) {
      console.warn('⚠ API key not set. Cannot test authenticated endpoints.');
      return {
        success: false,
        message: 'API key not set',
        health: healthData
      };
    }
    
    // Test data sources endpoint - use proxy if baseURL is empty, otherwise use direct
    const apiPath = baseURL ? `${baseURL}/api/v1/data-sources` : '/api/v1/data-sources';
    const dsResponse = await fetch(apiPath, {
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    if (!dsResponse.ok) {
      const errorData = await dsResponse.json();
      console.error('✗ Data sources request failed:', {
        status: dsResponse.status,
        statusText: dsResponse.statusText,
        error: errorData
      });
      
      return {
        success: false,
        message: `API request failed: ${dsResponse.status} ${dsResponse.statusText}`,
        error: errorData,
        health: healthData
      };
    }
    
    const dsData = await dsResponse.json();
    console.log('✓ Data sources loaded:', dsData);
    console.log(`✓ Found ${dsData.length || 0} data sources`);
    
    return {
      success: true,
      message: `Successfully loaded ${dsData.length || 0} data sources`,
      data: dsData,
      health: healthData
    };
    
  } catch (error) {
    console.error('✗ Connection error:', error);
    return {
      success: false,
      message: `Connection error: ${error.message}`,
      error: error.message
    };
  }
}


