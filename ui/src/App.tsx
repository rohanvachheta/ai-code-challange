import React, { useState, useEffect } from 'react';
import SearchForm from './components/SearchForm.tsx';
import SearchResults from './components/SearchResults.tsx';
import Statistics from './components/Statistics.tsx';
import { searchService, SearchRequest, SearchResponse, UserType } from './services/searchService.ts';
import { fallbackSearchService, FallbackSearchResponse } from './services/fallbackSearchService.ts';

interface AppState {
  results: SearchResponse | FallbackSearchResponse | null;
  loading: boolean;
  error: string | null;
  statistics: any | null;
  usingFallback: boolean;
}

function App() {
  const [state, setState] = useState<AppState>({
    results: null,
    loading: false,
    error: null,
    statistics: null,
    usingFallback: false,
  });

  // Load statistics on component mount
  useEffect(() => {
    const loadStatistics = async () => {
      try {
        // Try search service first
        const stats = await searchService.getStatistics();
        setState(prev => ({ ...prev, statistics: stats, usingFallback: false }));
      } catch (error) {
        console.warn('Search service unavailable, using fallback:', error);
        try {
          // Fallback to individual services
          const stats = await fallbackSearchService.getStatistics();
          setState(prev => ({ ...prev, statistics: stats, usingFallback: true }));
        } catch (fallbackError) {
          console.error('Failed to load statistics:', fallbackError);
          setState(prev => ({ ...prev, usingFallback: true }));
        }
      }
    };

    loadStatistics();
  }, []);

  const handleSearch = async (searchRequest: SearchRequest) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Try search service first
      const results = await searchService.search(searchRequest);
      setState(prev => ({
        ...prev,
        results,
        loading: false,
        usingFallback: false,
      }));
    } catch (error) {
      console.warn('Search service unavailable, using fallback:', error);
      try {
        // Fallback to individual services
        const results = await fallbackSearchService.searchAll(searchRequest.searchText);
        setState(prev => ({
          ...prev,
          results,
          loading: false,
          usingFallback: true,
        }));
      } catch (fallbackError) {
        setState(prev => ({
          ...prev,
          error: fallbackError instanceof Error ? fallbackError.message : 'Search failed',
          loading: false,
          usingFallback: true,
        }));
      }
    }
  };

  const handlePageChange = async (page: number) => {
    if (!state.results) return;
    
    // Get the last search request from results or create a default one
    const lastSearch: SearchRequest = {
      userType: UserType.AGENT,
      accountId: '00000000-0000-0000-0000-000000000000', // Default agent ID
      searchText: '',
      page,
      limit: state.results.limit,
    };

    await handleSearch(lastSearch);
  };

  return (
    <div className="App">
      <div className="search-header">
        <div className="container">
          <h1 style={{ margin: 0, fontSize: '2.5rem', textAlign: 'center' }}>
            🚗 Automotive Search Platform
          </h1>
          <p style={{ margin: '0.5rem 0 0 0', textAlign: 'center', opacity: 0.9 }}>
            Centralized search across offers, purchases, and transports
          </p>
        </div>
      </div>

      <div className="container">
        {state.usingFallback && (
          <div style={{
            background: '#fff3cd',
            color: '#856404',
            padding: '1rem',
            borderRadius: '5px',
            marginBottom: '1rem',
            border: '1px solid #ffeeba'
          }}>
            ⚠️ Search service unavailable - using direct API access (limited search functionality)
          </div>
        )}

        {state.statistics && <Statistics data={state.statistics} />}
        
        <SearchForm onSearch={handleSearch} loading={state.loading} />
        
        {state.error && (
          <div className="error">
            <strong>Error:</strong> {state.error}
          </div>
        )}

        {state.loading && (
          <div className="loading">
            <div>🔍 Searching...</div>
          </div>
        )}

        {state.results && !state.loading && (
          <SearchResults 
            results={state.results} 
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
}

export default App;