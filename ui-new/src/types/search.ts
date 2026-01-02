// // User types for the automotive marketplace
// export type UserType = "seller" | "buyer" | "carrier" | "agent";

// export interface UserContext {
//   userType: UserType;
//   accountId: string;
//   userId: string;
// }

// // Entity types for search results
// export type EntityType = "offer" | "purchase" | "transport";

// // Base interface for all search results
// interface BaseSearchResult {
//   id: string;
//   entityType: EntityType;
//   score?: number;
// }

// // Offer entity
// export interface OfferResult extends BaseSearchResult {
//   entityType: "offer";
//   vin: string;
//   make: string;
//   model: string;
//   year: number;
//   price: number;
//   location: string;
//   condition: "new" | "used" | "certified";
//   status: "available" | "pending" | "sold";
// }

// // Purchase entity
// export interface PurchaseResult extends BaseSearchResult {
//   entityType: "purchase";
//   purchaseId: string;
//   offerVin: string;
//   offerMake: string;
//   offerModel: string;
//   buyerName: string;
//   buyerEmail: string;
//   purchaseDate: string;
//   status: "pending" | "completed" | "cancelled";
// }

// // Transport entity
// export interface TransportResult extends BaseSearchResult {
//   entityType: "transport";
//   transportId: string;
//   carrierName: string;
//   carrierPhone: string;
//   pickupLocation: string;
//   deliveryLocation: string;
//   scheduleDate: string;
//   status: "scheduled" | "in_transit" | "delivered" | "cancelled";
//   relatedOfferVin?: string;
//   relatedOfferMake?: string;
//   relatedOfferModel?: string;
// }

// // Discriminated union for all result types
// export type SearchResult = OfferResult | PurchaseResult | TransportResult;

// // Autocomplete suggestion
// export interface AutocompleteSuggestion {
//   id: string;
//   text: string;
//   entityType: EntityType;
//   highlightedText: string;
// }

// // Grouped search response
// export interface SearchResponse {
//   query: string;
//   totalResults: number;
//   results: {
//     offers: OfferResult[];
//     purchases: PurchaseResult[];
//     transports: TransportResult[];
//   };
//   pagination: {
//     page: number;
//     pageSize: number;
//     totalPages: number;
//   };
// }

// // Role-based hints for UX
// export const USER_TYPE_HINTS: Record<UserType, string> = {
//   seller: "You can only see your own offers.",
//   buyer: "You can search available offers and your purchase history.",
//   carrier: "You can search your transport assignments and related vehicles.",
//   agent: "You can search across offers, purchases, and transports.",
// };

// export const USER_TYPE_LABELS: Record<UserType, string> = {
//   seller: "Seller",
//   buyer: "Buyer",
//   carrier: "Carrier",
//   agent: "Agent",
// };

// User types for the automotive marketplace
export type UserType = "SELLER" | "BUYER" | "CARRIER" | "AGENT";
export interface UserContext {
  userType: UserType;
  accountId: string;
  userId?: string;
}

// API Request/Response types for the actual search endpoint
export interface SearchRequest {
  userType: UserType;
  accountId: string;
  searchText: string;
  page: number;
  limit: number;
  // Optional filters
  filters?: {
    status?: string;
    make?: string;
    model?: string;
    minYear?: number;
    maxYear?: number;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
  };
}

export interface ApiSearchResult {
  entityType: "offer" | "purchase" | "transport";
  entityId: string;
  vin?: string;
  sellerId?: string;
  offerId?: string;
  carrierId?: string;
  buyerId?: string;
  purchaseId?: string;
  status: string;
  searchableText: string;
  createdAt: string;
  updatedAt: string;
  permissions: {
    sellerIds: string[];
    buyerIds: string[];
    carrierIds: string[];
  };
  // Offer specific fields
  make?: string;
  model?: string;
  year?: number;
  price?: string;
  location?: string;
  condition?: string;
  // Purchase specific fields
  purchasePrice?: string;
  paymentMethod?: string;
  // Transport specific fields
  transportCost?: string;
  pickupLocation?: string;
  deliveryLocation?: string;
  scheduledPickupDate?: string;
  scheduledDeliveryDate?: string;
}

export interface ApiSearchResponse {
  results: ApiSearchResult[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Entity types for search results
export type EntityType = "offer" | "purchase" | "transport";
// Base interface for all search results
interface BaseSearchResult {
  id: string;
  entityType: EntityType;
  score?: number;
}
// Offer entity
export interface OfferResult extends BaseSearchResult {
  entityType: "offer";
  vin: string;
  make: string;
  model: string;
  year: number;
  price: number;
  location: string;
  condition: "new" | "used" | "certified";
  status: "available" | "pending" | "sold";
}
// Purchase entity
export interface PurchaseResult extends BaseSearchResult {
  entityType: "purchase";
  purchaseId: string;
  offerVin: string;
  offerMake: string;
  offerModel: string;
  buyerName: string;
  buyerEmail: string;
  purchaseDate: string;
  status: "pending" | "completed" | "cancelled";
}
// Transport entity
export interface TransportResult extends BaseSearchResult {
  entityType: "transport";
  transportId: string;
  carrierName: string;
  carrierPhone: string;
  pickupLocation: string;
  deliveryLocation: string;
  scheduleDate: string;
  status: "scheduled" | "in_transit" | "delivered" | "cancelled";
  relatedOfferVin?: string;
  relatedOfferMake?: string;
  relatedOfferModel?: string;
}
// Discriminated union for all result types
export type SearchResult = OfferResult | PurchaseResult | TransportResult;
// Autocomplete suggestion
export interface AutocompleteSuggestion {
  id: string;
  text: string;
  entityType: EntityType;
  highlightedText: string;
}
// Grouped search response
export interface SearchResponse {
  query: string;
  totalResults: number;
  results: {
    offers: OfferResult[];
    purchases: PurchaseResult[];
    transports: TransportResult[];
  };
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
  };
}
// Role-based hints for UX
export const USER_TYPE_HINTS: Record<UserType, string> = {
  SELLER: "You can only see your own offers.",
  BUYER: "You can search available offers and your purchase history.",
  CARRIER: "You can search your transport assignments and related vehicles.",
  AGENT: "You can search across offers, purchases, and transports.",
};
export const USER_TYPE_LABELS: Record<UserType, string> = {
  SELLER: "Seller",
  BUYER: "Buyer",
  CARRIER: "Carrier",
  AGENT: "Agent",
};
// Status filter options for search
export type StatusFilter = "all" | "complete" | "pending" | "in_transit";
export const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
  all: "All Status",
  complete: "Complete",
  pending: "Pending",
  in_transit: "In Transit",
};
// Advanced search filters interface
export interface SearchFilters {
  status: StatusFilter;
  make: string;
  model: string;
  minYear: string;
  maxYear: string;
  minPrice: string;
  maxPrice: string;
  location: string;
}
