import { useState, useEffect } from 'react';
import { Search, Filter, Zap, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserContextForm } from '@/components/UserContextForm';
import { SmartSearchBar } from '@/components/SmartSearchBar';
import { AISearchBar } from '@/components/AISearchBar';
import { SearchResults } from '@/components/SearchResults';
import { SearchFilter } from '@/components/SearchFilter';
import { UserContext, SearchResponse, StatusFilter, SearchFilters } from '@/types/search';
import { fetchSearchResults, fetchSearchResultsWithFilters } from '@/lib/api';
import { testBackendAutocomplete } from '@/lib/backendAutocomplete';

/**
 * Index Page - Centralized Search Platform with AI Enhancement
 * 
 * Main search interface for the automotive marketplace.
 * Provides role-based search with grouped results by entity type.
 * Features AI-powered search with backend integration and local fallback.
 */
const Index = () => {
  // User context state
  const [userContext, setUserContext] = useState<UserContext>({
    userType: "BUYER",
    accountId: "a1263bca-021b-4878-a1ce-a9988b845c45", // Priya Sharma - our test buyer
    userId: "a1263bca-021b-4878-a1ce-a9988b845c45",
  });

  // Search state
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [currentQuery, setCurrentQuery] = useState<string>('');

  // Advanced filters state
  const [useAdvancedFilters, setUseAdvancedFilters] = useState(false);
  const [showFilterSection, setShowFilterSection] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    status: 'all',
    make: '',
    model: '',
    minYear: '',
    maxYear: '',
    minPrice: '',
    maxPrice: '',
    location: '',
  });
  const [currentPage, setCurrentPage] = useState(1);

  // AI Feature flags
  const [useAISearch, setUseAISearch] = useState(true);
  const [aiBackendStatus, setAiBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [showAISettings, setShowAISettings] = useState(false);

  // Check AI backend status
  useEffect(() => {
    const checkAIBackend = async () => {
      setAiBackendStatus('checking');
      const isConnected = await testBackendAutocomplete();
      setAiBackendStatus(isConnected ? 'connected' : 'disconnected');
    };
    
    checkAIBackend();
    
    // Check periodically
    const interval = setInterval(checkAIBackend, 30000);
    return () => clearInterval(interval);
  }, []);

  // Helper function to validate user context before search
  const isUserContextValid = (): boolean => {
    // For AGENT users, account ID is optional
    if (userContext.userType === "AGENT") {
      return true;
    }
    // For other user types, account ID is required but we'll be more lenient
    // Allow search even if account ID is not a perfect UUID, as long as something is provided
    return userContext.accountId && userContext.accountId.trim().length > 0;
  };

  // Handle search execution
  const handleSearch = async (query: string) => {
    console.log('🔍 handleSearch called with query:', query);
    console.log('🔍 Current userContext:', userContext);
    
    // Validate user context before proceeding
    if (!isUserContextValid()) {
      console.log('❌ User context validation failed');
      setSearchError(
        `Please select a user account before searching. Use the user search dropdown above to select your account.`
      );
      return;
    }

    console.log('✅ User context validation passed');
    setCurrentQuery(query);
    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);
    setCurrentPage(1);

    try {
      console.log('🚀 Starting search API call...');
      let response;
      if (useAdvancedFilters) {
        console.log('📊 Using advanced filters');
        // Use advanced filters with 5 results per page
        response = await fetchSearchResultsWithFilters(
          query,
          searchFilters,
          userContext,
          { page: 1, pageSize: 5 }
        );
      } else {
        console.log('📄 Using legacy search');
        // Use legacy search
        response = await fetchSearchResults(
          query, 
          userContext, 
          { page: 1, pageSize: 20 },
          statusFilter
        );
      }
      console.log('✅ Search API response received:', response);
      setSearchResponse(response);
    } catch (error) {
      console.error('❌ Search error:', error);
      setSearchError(
        error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred. Please try again.'
      );
      setSearchResponse(null);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle advanced filter application
  const handleApplyFilters = async () => {
    // Validate user context before proceeding
    if (!isUserContextValid()) {
      setSearchError(
        `Account ID is required for ${userContext.userType.toLowerCase()} users. Please provide your account ID before applying filters.`
      );
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);
    setCurrentPage(1);
    setUseAdvancedFilters(true);

    try {
      const response = await fetchSearchResultsWithFilters(
        currentQuery,
        searchFilters,
        userContext,
        { page: 1, pageSize: 5 }
      );
      setSearchResponse(response);
    } catch (error) {
      console.error('Filter error:', error);
      setSearchError(
        error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred. Please try again.'
      );
      setSearchResponse(null);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle load more functionality
  const handleLoadMore = async () => {
    if (!searchResponse || isSearching) return;
    
    // Validate user context before proceeding
    if (!isUserContextValid()) {
      setSearchError(
        `Account ID is required for ${userContext.userType.toLowerCase()} users. Please provide your account ID.`
      );
      return;
    }

    setIsSearching(true);
    const nextPage = currentPage + 1;

    try {
      const response = await fetchSearchResultsWithFilters(
        currentQuery,
        searchFilters,
        userContext,
        { page: nextPage, pageSize: 5 }
      );

      // Append new results to existing results
      setSearchResponse(prev => prev ? {
        ...response,
        results: {
          offers: [...prev.results.offers, ...response.results.offers],
          purchases: [...prev.results.purchases, ...response.results.purchases],
          transports: [...prev.results.transports, ...response.results.transports],
        },
      } : response);
      
      setCurrentPage(nextPage);
    } catch (error) {
      console.error('Load more error:', error);
      setSearchError(
        error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred. Please try again.'
      );
    } finally {
      setIsSearching(false);
    }
  };

  // Re-search when status filter changes (if there's an active query)
  useEffect(() => {
    if (currentQuery.trim() && hasSearched) {
      handleSearch(currentQuery);
    }
  }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent text-accent-foreground">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Centralized Search
              </h1>
              <p className="text-sm text-muted-foreground">
                Automotive Marketplace Platform
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* User Context Section */}
        <section className="animate-fade-in">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            User Context
          </h2>
          <UserContextForm
            userContext={userContext}
            onUserContextChange={setUserContext}
          />
        </section>

        {/* Search Section */}
        <section className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              AI-Powered Search
            </h2>
            <div className="flex items-center gap-4">
              {/* AI Status Badge */}
              <Badge 
                variant={aiBackendStatus === 'connected' ? 'default' : aiBackendStatus === 'disconnected' ? 'destructive' : 'secondary'}
                className="flex items-center gap-1"
              >
                {aiBackendStatus === 'checking' && '⏳ Checking AI...'}
                {aiBackendStatus === 'connected' && '🤖 AI Connected'}
                {aiBackendStatus === 'disconnected' && '⚠️ AI Offline'}
              </Badge>
              
              {/* AI Settings Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAISettings(!showAISettings)}
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                AI Settings
              </Button>
            </div>
          </div>

          {/* AI Settings Panel */}
          {showAISettings && (
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  AI Search Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="ai-search-toggle">Enhanced AI Search</Label>
                    <p className="text-sm text-muted-foreground">
                      Use AI-powered search with fuzzy matching and backend integration
                    </p>
                  </div>
                  <Switch
                    id="ai-search-toggle"
                    checked={useAISearch}
                    onCheckedChange={setUseAISearch}
                  />
                </div>
                
                <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <strong>AI Search Features:</strong>
                      <ul className="mt-1 space-y-1">
                        <li>• Backend Elasticsearch fuzzy search</li>
                        <li>• Enhanced typo tolerance</li>
                        <li>• Smart VIN/Make/Model detection</li>
                        <li>• Real-time relevance scoring</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Fallback Features:</strong>
                      <ul className="mt-1 space-y-1">
                        <li>• Local pattern matching</li>
                        <li>• Phone number detection</li>
                        <li>• Location-based suggestions</li>
                        <li>• Offline capability</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2">
            {/* Conditional Search Bar Based on Feature Flag */}
            {useAISearch ? (
              <AISearchBar
                userContext={userContext}
                onSearch={handleSearch}
                isSearching={isSearching}
                className="flex-1"
              />
            ) : (
              <SmartSearchBar
                userContext={userContext}
                onSearch={handleSearch}
                isSearching={isSearching}
              />
            )}
            
            <Button
              onClick={() => setShowFilterSection(!showFilterSection)}
              variant={showFilterSection ? "default" : "outline"}
              className="h-14 px-6 flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              {showFilterSection ? 'Hide Filters' : 'More Filters'}
            </Button>
          </div>
        </section>

        {/* Advanced Filters Section - Conditionally Rendered */}
        {showFilterSection && (
          <section className="animate-fade-in" style={{ animationDelay: '150ms' }}>
            <SearchFilter
              filters={searchFilters}
              onFiltersChange={setSearchFilters}
              onApplyFilters={handleApplyFilters}
              isLoading={isSearching}
            />
          </section>
        )}

        {/* Results Section */}
        <section className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Results
          </h2>
          <SearchResults
            response={searchResponse}
            isLoading={isSearching}
            error={searchError}
            hasSearched={hasSearched}
            onLoadMore={handleLoadMore}
            useAdvancedFilters={useAdvancedFilters}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-auto">
        <div className="container mx-auto px-4 py-4">
          <p className="text-sm text-muted-foreground text-center">
            Centralized Search Platform • Role-based filtering enforced on backend
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;