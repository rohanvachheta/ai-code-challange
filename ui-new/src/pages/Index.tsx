import { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserContextForm } from '@/components/UserContextForm';
import { SearchBarWithAutocomplete } from '@/components/SearchBarWithAutocomplete';
// import { SearchFilter } from '@/components/SearchFilter';
import { SearchResults } from '@/components/SearchResults';
import { UserContext, SearchResponse, StatusFilter, SearchFilters } from '@/types/search';
import { fetchSearchResults, fetchSearchResultsWithFilters } from '@/lib/api';
import { SearchFilter } from '@/components/SearchFilter';

/**
 * Index Page - Centralized Search Platform
 * 
 * Main search interface for the automotive marketplace.
 * Provides role-based search with grouped results by entity type.
 */
const Index = () => {
  // User context state
  const [userContext, setUserContext] = useState<UserContext>({
    userType: "AGENT",
    accountId: "00000000-0000-0000-0000-000000000000",
    userId: "",
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

  // Helper function to validate user context before search
  const isUserContextValid = (): boolean => {
    // Account ID is required for seller, buyer, and carrier
    if (userContext.userType !== "AGENT" && !userContext.accountId.trim()) {
      return false;
    }
    return true;
  };

  // Handle search execution
  const handleSearch = async (query: string) => {
    // Validate user context before proceeding
    if (!isUserContextValid()) {
      setSearchError(
        `Account ID is required for ${userContext.userType.toLowerCase()} users. Please provide your account ID before searching.`
      );
      return;
    }

    setCurrentQuery(query);
    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);
    setCurrentPage(1);

    try {
      let response;
      if (useAdvancedFilters) {
        // Use advanced filters with 5 results per page
        response = await fetchSearchResultsWithFilters(
          query,
          searchFilters,
          userContext,
          { page: 1, pageSize: 5 }
        );
      } else {
        // Use legacy search
        response = await fetchSearchResults(
          query, 
          userContext, 
          { page: 1, pageSize: 20 },
          statusFilter
        );
      }
      setSearchResponse(response);
    } catch (error) {
      console.error('Search error:', error);
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
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Search
          </h2>
          <div className="flex gap-2">
            <SearchBarWithAutocomplete
              userContext={userContext}
              onSearch={handleSearch}
              isSearching={isSearching}
            />
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