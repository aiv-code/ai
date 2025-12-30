/**
 * Utility to test API connection and help debug issues
 */
export async function testApiConnection() {
  const apiKey = localStorage.getItem('apiKey');
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  
  console.log('=== API Connection Test ===');
  console.log('Base URL:', baseURL);
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET');
  
  try {
    // Test health endpoint (no auth required)
    const healthResponse = await fetch(`${baseURL}/health`);
    const healthData = await healthResponse.json();
    console.log('✓ Health check:', healthData);
    
    if (!apiKey) {
      console.warn('⚠ API key not set. Cannot test authenticated endpoints.');
      return {
        success: false,
        message: 'API key not set',
        health: healthData
      };
    }
    
    // Test data sources endpoint
    const dsResponse = await fetch(`${baseURL}/api/v1/data-sources`, {
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


