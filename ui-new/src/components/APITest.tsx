import React, { useState } from 'react';
import { fetchSearchResultsFromAPI, fetchSearchResultsFromAPIWithFilters } from '@/lib/api';
import { UserContext, SearchFilters } from '@/types/search';

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

  const testFilters: SearchFilters = {
    status: "all",
    make: "BMW",
    model: "",
    minYear: "",
    maxYear: "",
    minPrice: "",
    maxPrice: "",
    location: "",
  };

  const testBasicAPI = async () => {
    setLoading(true);
    setStatus('Testing basic API...');

    try {
      const response = await fetchSearchResultsFromAPI(
        " ", // Empty search (matching your payload)
        testUserContext,
        { page: 1, pageSize: 20 }
      );
      
      setStatus(`✅ Basic API Success! Found ${response.totalResults} results`);
      console.log('Basic API Response:', response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setStatus(`❌ Basic API Error: ${errorMessage}`);
      console.error('Basic API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const testFilterAPI = async () => {
    setLoading(true);
    setStatus('Testing filter API...');

    try {
      const response = await fetchSearchResultsFromAPIWithFilters(
        " ", // Empty search
        testFilters,
        testUserContext,
        { page: 1, pageSize: 20 }
      );
      
      setStatus(`✅ Filter API Success! Found ${response.totalResults} results (filtered for BMW)`);
      console.log('Filter API Response:', response);
      console.log('Filters sent:', testFilters);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setStatus(`❌ Filter API Error: ${errorMessage}`);
      console.error('Filter API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg space-y-3 bg-gray-50">
      <h3 className="font-medium">API Connection Tests</h3>
      
      <div className="flex gap-2">
        <button 
          onClick={testBasicAPI}
          disabled={loading}
          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Basic API'}
        </button>

        <button 
          onClick={testFilterAPI}
          disabled={loading}
          className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Filter API'}
        </button>
      </div>

      <p className="text-sm text-gray-600">{status}</p>
      
      <div className="text-xs text-gray-500">
        <p><strong>Basic API:</strong> Search without filters</p>
        <p><strong>Filter API:</strong> Search with BMW make filter</p>
      </div>
    </div>
  );
}