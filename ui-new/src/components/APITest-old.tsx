import React, { useState } from 'react';
import { fetchSearchResultsFromAPI } from '@/lib/api';
import { UserContext } from '@/types/search';

/**
 * Simple API Test Component
 */
export function APITest() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('Ready to test');

  const testUserContext: UserContext = {
    userType: "AGENT",
    accountId: "00000000-0000-0000-0000-000000000000",
  };

  const testAPI = async () => {
    setLoading(true);
    setStatus('Testing API...');

    try {
      const response = await fetchSearchResultsFromAPI(
        " ", // Empty search (matching your payload)
        testUserContext,
        { page: 1, pageSize: 20 }
      );
      
      setStatus(`✅ Success! Found ${response.totalResults} results`);
      console.log('API Response:', response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setStatus(`❌ Error: ${errorMessage}`);
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg space-y-3 bg-gray-50">
      <h3 className="font-medium">API Connection Test</h3>
      
      <button 
        onClick={testAPI}
        disabled={loading}
        className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test API'}
      </button>

      <p className="text-sm text-gray-600">{status}</p>
    </div>
  );
}
      </button>

      {error && (
        <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="p-3 bg-green-100 border border-green-300 rounded">
          <strong>Success!</strong> Found {result.totalResults} results
          <details className="mt-2">
            <summary className="cursor-pointer font-medium">View Response</summary>
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}