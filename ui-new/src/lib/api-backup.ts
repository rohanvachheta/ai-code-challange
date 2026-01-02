/**
 * API Client for Centralized Search Platform
 *
 * TODO: Replace BASE_URL with your actual Search API endpoint
 * Example: const BASE_URL = 'https://api.yourplatform.com/v1/search';
 *
 * Currently using dummy data from src/lib/dummyData.ts
 * Replace the dummy data implementation with actual API calls when ready.
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
 *
 * @param query - The search query string
 * @param userContext - User context for role-based filtering
 * @returns Promise<AutocompleteSuggestion[]>
 *
 * TODO: Replace with actual API call:
 * const response = await fetch(`${BASE_URL}/autocomplete`, {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ query, ...userContext }),
 * });
 * const data = await response.json();
 * return mapAutocompleteSuggestions(data);
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
        buyerName: 'Buyer', // This might need to come from another API
        buyerEmail: 'buyer@example.com', // This might need to come from another API
        purchaseDate: apiResult.createdAt,
        status: mapPurchaseStatus(apiResult.status),
      };
    case "transport":
      return {
        ...base,
        transportId: apiResult.entityId,
        carrierName: 'Carrier', // This might need to come from another API
        carrierPhone: '555-0123', // This might need to come from another API
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
 * Fetch search results from real API
 */
export async function fetchSearchResultsFromAPI(
  query: string,
  userContext: UserContext,
  pagination: { page: number; pageSize: number } = { page: 1, pageSize: 20 }
): Promise<SearchResponse> {
  try {
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
  } catch (error) {
    console.error('Search API error:', error);
    // Fallback to dummy data on error - call the dummy implementation directly
    return fetchSearchResultsLegacy(query, userContext, pagination, "all");
  }
}

/**
 * Legacy dummy data implementation
 */
async function fetchSearchResultsLegacy(
  query: string,
  userContext: UserContext,
  pagination: { page: number; pageSize: number } = { page: 1, pageSize: 20 },
  statusFilter: StatusFilter = "all"
): Promise<SearchResponse> {
  // Original dummy data implementation
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
  // In production, this filtering happens on the backend based on accountId/userId
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
 * Fetch search results with advanced filters
 *
 * @param query - The search query string (can be empty)
 * @param filters - Advanced search filters
 * @param userContext - User context for role-based filtering
 * @param pagination - Pagination parameters
 * @returns Promise<SearchResponse>
 *
 * TODO: Replace with actual API call:
 * const response = await fetch(`${BASE_URL}/search`, {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ query, filters, ...userContext, ...pagination }),
 * });
 * const data = await response.json();
 * return mapSearchResponse(data);
 */
export async function fetchSearchResultsWithFilters(
  query: string,
  filters: SearchFilters,
  userContext: UserContext,
  pagination: { page: number; pageSize: number } = { page: 1, pageSize: 5 }
): Promise<SearchResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Step 1: Start with all dummy data
  let filteredOffers = [...DUMMY_OFFERS];
  let filteredPurchases = [...DUMMY_PURCHASES];
  let filteredTransports = [...DUMMY_TRANSPORTS];

  // Step 2: Apply query filtering if query exists
  if (query.trim()) {
    filteredOffers = filterOffersByQuery(filteredOffers, query);
    filteredPurchases = filterPurchasesByQuery(filteredPurchases, query);
    filteredTransports = filterTransportsByQuery(filteredTransports, query);
  }

  // Step 3: Apply advanced filtering
  filteredOffers = filterOffersAdvanced(filteredOffers, filters);
  filteredPurchases = filterPurchasesAdvanced(filteredPurchases, filters);
  filteredTransports = filterTransportsAdvanced(filteredTransports, filters);

  // Step 4: Apply user context filtering (role-based filtering)
  const { offers, purchases, transports } = filterByUserContext(
    filteredOffers,
    filteredPurchases,
    filteredTransports,
    userContext
  );

  // Step 5: Apply pagination (default 5 per page for view more functionality)
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
