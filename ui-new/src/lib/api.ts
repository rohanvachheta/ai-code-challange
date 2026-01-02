/**
 * API Client for Centralized Search Platform - Fixed Version
 */
import type {
  UserContext,
  AutocompleteSuggestion,
  SearchResponse,
  StatusFilter,
  SearchFilters,
  SearchRequest,
  ApiSearchResponse,
  ApiSearchResult,
} from "@/types/search";
import {
  DUMMY_OFFERS,
  DUMMY_PURCHASES,
  DUMMY_TRANSPORTS,
  filterOffersByQuery,
  filterPurchasesByQuery,
  filterTransportsByQuery,
  filterOffersByStatus,
  filterPurchasesByStatus,
  filterTransportsByStatus,
  filterByUserContext,
  generateAutocompleteSuggestions,
  filterOffersAdvanced,
  filterPurchasesAdvanced,
  filterTransportsAdvanced,
} from "./dummyData";

// Search API endpoint
const SEARCH_API_URL = "http://localhost:3004/search";

/**
 * Fetch autocomplete suggestions
 */
export async function fetchAutocomplete(
  query: string,
  userContext: UserContext
): Promise<AutocompleteSuggestion[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  if (!query.trim()) return [];

  // Generate suggestions from dummy data based on query and user context
  return generateAutocompleteSuggestions(query, userContext);
}

/**
 * Transform API search result to internal format
 */
function transformApiResult(apiResult: ApiSearchResult): any {
  const base = {
    id: apiResult.entityId,
    entityType: apiResult.entityType,
  };

  switch (apiResult.entityType) {
    case "offer":
      return {
        ...base,
        vin: apiResult.vin || '',
        make: apiResult.make || '',
        model: apiResult.model || '',
        year: apiResult.year || 0,
        price: parseFloat(apiResult.price || '0'),
        location: apiResult.location || '',
        condition: apiResult.condition?.toLowerCase() as "new" | "used" | "certified" || "new",
        status: mapStatus(apiResult.status),
      };
    case "purchase":
      return {
        ...base,
        purchaseId: apiResult.purchaseId || apiResult.entityId,
        offerVin: apiResult.vin || '',
        offerMake: apiResult.make || '',
        offerModel: apiResult.model || '',
        buyerName: 'Buyer',
        buyerEmail: 'buyer@example.com',
        purchaseDate: apiResult.createdAt,
        status: mapPurchaseStatus(apiResult.status),
      };
    case "transport":
      return {
        ...base,
        transportId: apiResult.entityId,
        carrierName: 'Carrier',
        carrierPhone: '555-0123',
        pickupLocation: apiResult.pickupLocation || '',
        deliveryLocation: apiResult.deliveryLocation || '',
        scheduleDate: apiResult.scheduledPickupDate || apiResult.createdAt,
        status: mapTransportStatus(apiResult.status),
      };
    default:
      return base;
  }
}

function mapStatus(status: string): "available" | "pending" | "sold" {
  switch (status?.toLowerCase()) {
    case "active":
      return "available";
    case "pending":
      return "pending";
    case "sold":
    case "completed":
      return "sold";
    default:
      return "available";
  }
}

function mapPurchaseStatus(status: string): "pending" | "completed" | "cancelled" {
  switch (status?.toLowerCase()) {
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    default:
      return "pending";
  }
}

function mapTransportStatus(status: string): "scheduled" | "in_transit" | "delivered" | "cancelled" {
  switch (status?.toLowerCase()) {
    case "scheduled":
      return "scheduled";
    case "in_transit":
      return "in_transit";
    case "delivered":
      return "delivered";
    case "cancelled":
      return "cancelled";
    default:
      return "scheduled";
  }
}

/**
 * Fetch search results from real API with filters
 */
export async function fetchSearchResultsFromAPIWithFilters(
  query: string,
  filters: SearchFilters,
  userContext: UserContext,
  pagination: { page: number; pageSize: number } = { page: 1, pageSize: 20 }
): Promise<SearchResponse> {
  // Convert SearchFilters to API format
  const apiFilters = {
    status: filters.status !== 'all' ? filters.status : undefined,
    make: filters.make || undefined,
    model: filters.model || undefined,
    minYear: filters.minYear ? parseInt(filters.minYear) : undefined,
    maxYear: filters.maxYear ? parseInt(filters.maxYear) : undefined,
    minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
    location: filters.location || undefined,
  };

  // Remove undefined values
  const cleanFilters = Object.fromEntries(
    Object.entries(apiFilters).filter(([_, value]) => value !== undefined)
  );

  const requestPayload: SearchRequest = {
    userType: userContext.userType,
    accountId: userContext.accountId,
    searchText: query,
    page: pagination.page,
    limit: pagination.pageSize,
    ...(Object.keys(cleanFilters).length > 0 && { filters: cleanFilters }),
  };

  const response = await fetch(SEARCH_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestPayload),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const apiResponse: ApiSearchResponse = await response.json();

  // Transform API results into internal format
  const transformedResults = apiResponse.results.map(transformApiResult);

  // Group results by entity type
  const offers = transformedResults.filter(r => r.entityType === 'offer');
  const purchases = transformedResults.filter(r => r.entityType === 'purchase');
  const transports = transformedResults.filter(r => r.entityType === 'transport');

  return {
    query,
    totalResults: apiResponse.total,
    results: {
      offers,
      purchases,
      transports,
    },
    pagination: {
      page: apiResponse.page,
      pageSize: apiResponse.limit,
      totalPages: apiResponse.pages,
    },
  };
}

/**
 * Fetch search results from real API
 */
export async function fetchSearchResultsFromAPI(
  query: string,
  userContext: UserContext,
  pagination: { page: number; pageSize: number } = { page: 1, pageSize: 20 }
): Promise<SearchResponse> {
  const requestPayload: SearchRequest = {
    userType: userContext.userType,
    accountId: userContext.accountId,
    searchText: query,
    page: pagination.page,
    limit: pagination.pageSize,
  };

  const response = await fetch(SEARCH_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestPayload),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const apiResponse: ApiSearchResponse = await response.json();

  // Transform API results into internal format
  const transformedResults = apiResponse.results.map(transformApiResult);

  // Group results by entity type
  const offers = transformedResults.filter(r => r.entityType === 'offer');
  const purchases = transformedResults.filter(r => r.entityType === 'purchase');
  const transports = transformedResults.filter(r => r.entityType === 'transport');

  return {
    query,
    totalResults: apiResponse.total,
    results: {
      offers,
      purchases,
      transports,
    },
    pagination: {
      page: apiResponse.page,
      pageSize: apiResponse.limit,
      totalPages: apiResponse.pages,
    },
  };
}

/**
 * Dummy data implementation
 */
async function fetchSearchResultsLegacy(
  query: string,
  userContext: UserContext,
  pagination: { page: number; pageSize: number } = { page: 1, pageSize: 20 },
  statusFilter: StatusFilter = "all"
): Promise<SearchResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // If no query, return empty results
  if (!query.trim()) {
    return {
      query,
      totalResults: 0,
      results: { offers: [], purchases: [], transports: [] },
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalPages: 0,
      },
    };
  }

  // Step 1: Filter dummy data by query (query-aware filtering)
  let filteredOffers = filterOffersByQuery(DUMMY_OFFERS, query);
  let filteredPurchases = filterPurchasesByQuery(DUMMY_PURCHASES, query);
  let filteredTransports = filterTransportsByQuery(DUMMY_TRANSPORTS, query);

  // Step 2: Apply status filtering
  filteredOffers = filterOffersByStatus(filteredOffers, statusFilter);
  filteredPurchases = filterPurchasesByStatus(filteredPurchases, statusFilter);
  filteredTransports = filterTransportsByStatus(
    filteredTransports,
    statusFilter
  );

  // Step 3: Apply user context filtering (role-based filtering)
  const { offers, purchases, transports } = filterByUserContext(
    filteredOffers,
    filteredPurchases,
    filteredTransports,
    userContext
  );

  // Step 4: Apply pagination
  const startIndex = (pagination.page - 1) * pagination.pageSize;
  const endIndex = startIndex + pagination.pageSize;

  const paginatedOffers = offers.slice(startIndex, endIndex);
  const paginatedPurchases = purchases.slice(startIndex, endIndex);
  const paginatedTransports = transports.slice(startIndex, endIndex);

  const totalResults = offers.length + purchases.length + transports.length;
  const totalPages = Math.ceil(totalResults / pagination.pageSize);

  return {
    query,
    totalResults,
    results: {
      offers: paginatedOffers,
      purchases: paginatedPurchases,
      transports: paginatedTransports,
    },
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages,
    },
  };
}

/**
 * Main search function - tries API first, falls back to dummy data
 * This is the main function that should be called from components
 */
export async function fetchSearchResults(
  query: string,
  userContext: UserContext,
  pagination: { page: number; pageSize: number } = { page: 1, pageSize: 20 },
  statusFilter: StatusFilter = "all",
  useRealAPI: boolean = true
): Promise<SearchResponse> {
  // Use real API if requested and available
  if (useRealAPI) {
    try {
      return await fetchSearchResultsFromAPI(query, userContext, pagination);
    } catch (error) {
      console.warn('Real API failed, falling back to dummy data:', error);
      // Fall through to dummy data
    }
  }

  // Use dummy data implementation
  return fetchSearchResultsLegacy(query, userContext, pagination, statusFilter);
}

/**
 * Fetch search results with advanced filters - now uses real API
 */
export async function fetchSearchResultsWithFilters(
  query: string,
  filters: SearchFilters,
  userContext: UserContext,
  pagination: { page: number; pageSize: number } = { page: 1, pageSize: 5 },
  useRealAPI: boolean = true
): Promise<SearchResponse> {
  // Use real API if requested and available
  if (useRealAPI) {
    try {
      return await fetchSearchResultsFromAPIWithFilters(query, filters, userContext, pagination);
    } catch (error) {
      console.warn('Real API with filters failed, falling back to dummy data:', error);
      // Fall through to dummy data
    }
  }

  // Fallback to dummy data implementation
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // If no query, return empty results
  if (!query.trim()) {
    return {
      query,
      totalResults: 0,
      results: { offers: [], purchases: [], transports: [] },
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalPages: 0,
      },
    };
  }

  // Apply advanced filters to dummy data
  let filteredOffers = filterOffersAdvanced(DUMMY_OFFERS, filters);
  let filteredPurchases = filterPurchasesAdvanced(DUMMY_PURCHASES, filters);
  let filteredTransports = filterTransportsAdvanced(DUMMY_TRANSPORTS, filters);

  // Apply user context filtering
  const { offers, purchases, transports } = filterByUserContext(
    filteredOffers,
    filteredPurchases,
    filteredTransports,
    userContext
  );

  // Apply pagination
  const startIndex = (pagination.page - 1) * pagination.pageSize;
  const endIndex = startIndex + pagination.pageSize;

  const paginatedOffers = offers.slice(startIndex, endIndex);
  const paginatedPurchases = purchases.slice(startIndex, endIndex);
  const paginatedTransports = transports.slice(startIndex, endIndex);

  const totalResults = offers.length + purchases.length + transports.length;
  const totalPages = Math.ceil(totalResults / pagination.pageSize);

  return {
    query,
    totalResults,
    results: {
      offers: paginatedOffers,
      purchases: paginatedPurchases,
      transports: paginatedTransports,
    },
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages,
    },
  };
}