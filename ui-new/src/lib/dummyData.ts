// /**
//  * Dummy Data for Centralized Search Platform
//  *
//  * This file contains comprehensive mock data that simulates backend responses.
//  * Replace this with actual API calls when connecting to the real backend.
//  *
//  * The data is structured to support:
//  * - Query-aware filtering (matches search terms)
//  * - User-context-aware filtering (role-based results)
//  * - Realistic automotive marketplace entities
//  */
// import type {
//   OfferResult,
//   PurchaseResult,
//   TransportResult,
//   AutocompleteSuggestion,
//   UserContext,
// } from "@/types/search";
// // Comprehensive dummy offers data
// export const DUMMY_OFFERS: OfferResult[] = [
//   {
//     id: "o1",
//     entityType: "offer",
//     vin: "1HGBH41JXMN109186",
//     make: "Toyota",
//     model: "Camry",
//     year: 2023,
//     price: 28500,
//     location: "Los Angeles, CA",
//     condition: "new",
//     status: "available",
//   },
//   {
//     id: "o2",
//     entityType: "offer",
//     vin: "2HGBH41JXMN109187",
//     make: "Honda",
//     model: "Accord",
//     year: 2022,
//     price: 24900,
//     location: "San Francisco, CA",
//     condition: "certified",
//     status: "available",
//   },
//   {
//     id: "o3",
//     entityType: "offer",
//     vin: "3HGBH41JXMN109188",
//     make: "Ford",
//     model: "Mustang",
//     year: 2023,
//     price: 42000,
//     location: "Phoenix, AZ",
//     condition: "new",
//     status: "pending",
//   },
//   {
//     id: "o4",
//     entityType: "offer",
//     vin: "4HGBH41JXMN109189",
//     make: "Tesla",
//     model: "Model 3",
//     year: 2024,
//     price: 38900,
//     location: "Seattle, WA",
//     condition: "new",
//     status: "available",
//   },
//   {
//     id: "o5",
//     entityType: "offer",
//     vin: "5HGBH41JXMN109190",
//     make: "BMW",
//     model: "3 Series",
//     year: 2023,
//     price: 45200,
//     location: "Denver, CO",
//     condition: "certified",
//     status: "available",
//   },
//   {
//     id: "o6",
//     entityType: "offer",
//     vin: "6HGBH41JXMN109191",
//     make: "Mercedes-Benz",
//     model: "C-Class",
//     year: 2022,
//     price: 38500,
//     location: "Dallas, TX",
//     condition: "used",
//     status: "available",
//   },
//   {
//     id: "o7",
//     entityType: "offer",
//     vin: "7HGBH41JXMN109192",
//     make: "Chevrolet",
//     model: "Silverado",
//     year: 2023,
//     price: 52000,
//     location: "Houston, TX",
//     condition: "new",
//     status: "available",
//   },
//   {
//     id: "o8",
//     entityType: "offer",
//     vin: "8HGBH41JXMN109193",
//     make: "Audi",
//     model: "A4",
//     year: 2023,
//     price: 41800,
//     location: "Miami, FL",
//     condition: "certified",
//     status: "pending",
//   },
//   {
//     id: "o9",
//     entityType: "offer",
//     vin: "9HGBH41JXMN109194",
//     make: "Nissan",
//     model: "Altima",
//     year: 2022,
//     price: 22800,
//     location: "Atlanta, GA",
//     condition: "used",
//     status: "available",
//   },
//   {
//     id: "o10",
//     entityType: "offer",
//     vin: "0HGBH41JXMN109195",
//     make: "Hyundai",
//     model: "Elantra",
//     year: 2023,
//     price: 21500,
//     location: "Chicago, IL",
//     condition: "new",
//     status: "available",
//   },
// ];
// // Comprehensive dummy purchases data
// export const DUMMY_PURCHASES: PurchaseResult[] = [
//   {
//     id: "p1",
//     entityType: "purchase",
//     purchaseId: "PUR-2024-001",
//     offerVin: "1HGBH41JXMN109186",
//     offerMake: "Toyota",
//     offerModel: "Camry",
//     buyerName: "John Smith",
//     buyerEmail: "john.smith@example.com",
//     purchaseDate: "2024-01-15",
//     status: "completed",
//   },
//   {
//     id: "p2",
//     entityType: "purchase",
//     purchaseId: "PUR-2024-002",
//     offerVin: "2HGBH41JXMN109187",
//     offerMake: "Honda",
//     offerModel: "Accord",
//     buyerName: "Jane Doe",
//     buyerEmail: "jane.doe@example.com",
//     purchaseDate: "2024-01-18",
//     status: "pending",
//   },
//   {
//     id: "p3",
//     entityType: "purchase",
//     purchaseId: "PUR-2024-003",
//     offerVin: "4HGBH41JXMN109189",
//     offerMake: "Tesla",
//     offerModel: "Model 3",
//     buyerName: "Robert Johnson",
//     buyerEmail: "robert.j@example.com",
//     purchaseDate: "2024-01-20",
//     status: "completed",
//   },
//   {
//     id: "p4",
//     entityType: "purchase",
//     purchaseId: "PUR-2024-004",
//     offerVin: "5HGBH41JXMN109190",
//     offerMake: "BMW",
//     offerModel: "3 Series",
//     buyerName: "Sarah Williams",
//     buyerEmail: "sarah.w@example.com",
//     purchaseDate: "2024-01-22",
//     status: "pending",
//   },
//   {
//     id: "p5",
//     entityType: "purchase",
//     purchaseId: "PUR-2024-005",
//     offerVin: "6HGBH41JXMN109191",
//     offerMake: "Mercedes-Benz",
//     offerModel: "C-Class",
//     buyerName: "Michael Brown",
//     buyerEmail: "michael.brown@example.com",
//     purchaseDate: "2024-01-25",
//     status: "completed",
//   },
//   {
//     id: "p6",
//     entityType: "purchase",
//     purchaseId: "PUR-2024-006",
//     offerVin: "9HGBH41JXMN109194",
//     offerMake: "Nissan",
//     offerModel: "Altima",
//     buyerName: "Emily Davis",
//     buyerEmail: "emily.davis@example.com",
//     purchaseDate: "2024-01-28",
//     status: "pending",
//   },
// ];
// // Comprehensive dummy transports data
// export const DUMMY_TRANSPORTS: TransportResult[] = [
//   {
//     id: "t1",
//     entityType: "transport",
//     transportId: "TRN-2024-001",
//     carrierName: "FastShip Logistics",
//     carrierPhone: "+1 555-0123",
//     pickupLocation: "Los Angeles, CA",
//     deliveryLocation: "Phoenix, AZ",
//     scheduleDate: "2024-01-20",
//     status: "scheduled",
//     relatedOfferVin: "1HGBH41JXMN109186",
//     relatedOfferModel: "Toyota Camry",
//   },
//   {
//     id: "t2",
//     entityType: "transport",
//     transportId: "TRN-2024-002",
//     carrierName: "AutoMove Express",
//     carrierPhone: "+1 555-0456",
//     pickupLocation: "San Francisco, CA",
//     deliveryLocation: "Seattle, WA",
//     scheduleDate: "2024-01-22",
//     status: "in_transit",
//     relatedOfferVin: "2HGBH41JXMN109187",
//     relatedOfferModel: "Honda Accord",
//   },
//   {
//     id: "t3",
//     entityType: "transport",
//     transportId: "TRN-2024-003",
//     carrierName: "QuickHaul Inc",
//     carrierPhone: "+1 555-0789",
//     pickupLocation: "Denver, CO",
//     deliveryLocation: "Dallas, TX",
//     scheduleDate: "2024-01-25",
//     status: "delivered",
//   },
//   {
//     id: "t4",
//     entityType: "transport",
//     transportId: "TRN-2024-004",
//     carrierName: "Reliable Transport Co",
//     carrierPhone: "+1 555-0321",
//     pickupLocation: "Seattle, WA",
//     deliveryLocation: "Portland, OR",
//     scheduleDate: "2024-01-26",
//     status: "scheduled",
//     relatedOfferVin: "4HGBH41JXMN109189",
//     relatedOfferModel: "Tesla Model 3",
//   },
//   {
//     id: "t5",
//     entityType: "transport",
//     transportId: "TRN-2024-005",
//     carrierName: "Nationwide Auto Transport",
//     carrierPhone: "+1 555-0654",
//     pickupLocation: "Miami, FL",
//     deliveryLocation: "Atlanta, GA",
//     scheduleDate: "2024-01-27",
//     status: "in_transit",
//     relatedOfferVin: "8HGBH41JXMN109193",
//     relatedOfferModel: "Audi A4",
//   },
//   {
//     id: "t6",
//     entityType: "transport",
//     transportId: "TRN-2024-006",
//     carrierName: "Coast to Coast Logistics",
//     carrierPhone: "+1 555-0987",
//     pickupLocation: "Chicago, IL",
//     deliveryLocation: "New York, NY",
//     scheduleDate: "2024-01-29",
//     status: "scheduled",
//     relatedOfferVin: "0HGBH41JXMN109195",
//     relatedOfferModel: "Hyundai Elantra",
//   },
// ];
// /**
//  * Helper function to check if a string matches a query (case-insensitive)
//  */
// function matchesQuery(text: string, query: string): boolean {
//   if (!query.trim()) return true;
//   const lowerText = text.toLowerCase();
//   const lowerQuery = query.toLowerCase();
//   return lowerText.includes(lowerQuery);
// }
// /**
//  * Filter offers based on query
//  */
// export function filterOffersByQuery(
//   offers: OfferResult[],
//   query: string
// ): OfferResult[] {
//   if (!query.trim()) return offers;

//   return offers.filter((offer) => {
//     const searchableText = [
//       offer.vin,
//       offer.make,
//       offer.model,
//       offer.year.toString(),
//       offer.location,
//       offer.condition,
//       offer.status,
//       offer.price.toString(),
//     ]
//       .join(" ")
//       .toLowerCase();

//     return searchableText.includes(query.toLowerCase());
//   });
// }
// /**
//  * Filter purchases based on query
//  */
// export function filterPurchasesByQuery(
//   purchases: PurchaseResult[],
//   query: string
// ): PurchaseResult[] {
//   if (!query.trim()) return purchases;

//   return purchases.filter((purchase) => {
//     const searchableText = [
//       purchase.purchaseId,
//       purchase.offerVin,
//       purchase.offerMake,
//       purchase.offerModel,
//       purchase.buyerName,
//       purchase.buyerEmail,
//       purchase.purchaseDate,
//       purchase.status,
//     ]
//       .join(" ")
//       .toLowerCase();

//     return searchableText.includes(query.toLowerCase());
//   });
// }
// /**
//  * Filter transports based on query
//  */
// export function filterTransportsByQuery(
//   transports: TransportResult[],
//   query: string
// ): TransportResult[] {
//   if (!query.trim()) return transports;

//   return transports.filter((transport) => {
//     const searchableText = [
//       transport.transportId,
//       transport.carrierName,
//       transport.carrierPhone,
//       transport.pickupLocation,
//       transport.deliveryLocation,
//       transport.scheduleDate,
//       transport.status,
//       transport.relatedOfferVin || "",
//       transport.relatedOfferModel || "",
//     ]
//       .join(" ")
//       .toLowerCase();

//     return searchableText.includes(query.toLowerCase());
//   });
// }
// /**
//  * Generate autocomplete suggestions based on query
//  */
// export function generateAutocompleteSuggestions(
//   query: string,
//   userContext: UserContext
// ): AutocompleteSuggestion[] {
//   if (!query.trim()) return [];

//   const suggestions: AutocompleteSuggestion[] = [];
//   const lowerQuery = query.toLowerCase();

//   // Generate suggestions from offers
//   if (
//     userContext.userType === "seller" ||
//     userContext.userType === "buyer" ||
//     userContext.userType === "agent"
//   ) {
//     const matchingOffers = filterOffersByQuery(DUMMY_OFFERS, query).slice(0, 3);
//     matchingOffers.forEach((offer) => {
//       const text = `${offer.make} ${offer.model} ${offer.year} - ${offer.vin}`;
//       const highlightedText = text.replace(
//         new RegExp(`(${query})`, "gi"),
//         "<mark>$1</mark>"
//       );
//       suggestions.push({
//         id: `offer-${offer.id}`,
//         text,
//         entityType: "offer",
//         highlightedText,
//       });
//     });
//   }

//   // Generate suggestions from purchases
//   if (userContext.userType === "buyer" || userContext.userType === "agent") {
//     const matchingPurchases = filterPurchasesByQuery(
//       DUMMY_PURCHASES,
//       query
//     ).slice(0, 2);
//     matchingPurchases.forEach((purchase) => {
//       const text = `Purchase ${purchase.purchaseId} - ${purchase.offerMake} ${purchase.offerModel}`;
//       const highlightedText = text.replace(
//         new RegExp(`(${query})`, "gi"),
//         "<mark>$1</mark>"
//       );
//       suggestions.push({
//         id: `purchase-${purchase.id}`,
//         text,
//         entityType: "purchase",
//         highlightedText,
//       });
//     });
//   }

//   // Generate suggestions from transports
//   if (userContext.userType === "carrier" || userContext.userType === "agent") {
//     const matchingTransports = filterTransportsByQuery(
//       DUMMY_TRANSPORTS,
//       query
//     ).slice(0, 2);
//     matchingTransports.forEach((transport) => {
//       const text = `Transport ${transport.transportId} - ${transport.carrierName}`;
//       const highlightedText = text.replace(
//         new RegExp(`(${query})`, "gi"),
//         "<mark>$1</mark>"
//       );
//       suggestions.push({
//         id: `transport-${transport.id}`,
//         text,
//         entityType: "transport",
//         highlightedText,
//       });
//     });
//   }

//   // Limit to 5 suggestions total
//   return suggestions.slice(0, 5);
// }
// /**
//  * Filter results based on user context (role-based filtering)
//  *
//  * Note: In production, this filtering happens on the backend.
//  * This is just for demo purposes to simulate backend behavior.
//  */
// export function filterByUserContext(
//   offers: OfferResult[],
//   purchases: PurchaseResult[],
//   transports: TransportResult[],
//   userContext: UserContext
// ): {
//   offers: OfferResult[];
//   purchases: PurchaseResult[];
//   transports: TransportResult[];
// } {
//   // In a real backend, filtering would be based on accountId and userId
//   // For demo purposes, we simulate role-based filtering

//   switch (userContext.userType) {
//     case "seller":
//       // Sellers only see their own offers
//       // In production, this would filter by accountId/userId
//       return {
//         offers: offers.filter((_, index) => index < 5), // Simulate seller's own offers
//         purchases: [],
//         transports: [],
//       };

//     case "buyer":
//       // Buyers see available offers and their purchase history
//       return {
//         offers: offers.filter((o) => o.status === "available"),
//         purchases: purchases.filter((_, index) => index < 3), // Simulate buyer's purchases
//         transports: [],
//       };

//     case "carrier":
//       // Carriers see their transport assignments
//       return {
//         offers: [],
//         purchases: [],
//         transports: transports.filter((_, index) => index < 4), // Simulate carrier's transports
//       };

//     case "agent":
//       // Agents see everything
//       return {
//         offers,
//         purchases,
//         transports,
//       };

//     default:
//       return { offers: [], purchases: [], transports: [] };
//   }
// }

/**
 * Dummy Data for Centralized Search Platform
 *
 * This file contains comprehensive mock data that simulates backend responses.
 * Replace this with actual API calls when connecting to the real backend.
 *
 * The data is structured to support:
 * - Query-aware filtering (matches search terms)
 * - User-context-aware filtering (role-based results)
 * - Realistic automotive marketplace entities
 */
import type {
  OfferResult,
  PurchaseResult,
  TransportResult,
  AutocompleteSuggestion,
  UserContext,
  StatusFilter,
  SearchFilters,
} from "@/types/search";
// Comprehensive dummy offers data
export const DUMMY_OFFERS: OfferResult[] = [
  {
    id: "o1",
    entityType: "offer",
    vin: "1HGBH41JXMN109186",
    make: "Toyota",
    model: "Camry",
    year: 2023,
    price: 28500,
    location: "Los Angeles, CA",
    condition: "new",
    status: "available",
  },
  {
    id: "o2",
    entityType: "offer",
    vin: "2HGBH41JXMN109187",
    make: "Honda",
    model: "Accord",
    year: 2022,
    price: 24900,
    location: "San Francisco, CA",
    condition: "certified",
    status: "available",
  },
  {
    id: "o3",
    entityType: "offer",
    vin: "3HGBH41JXMN109188",
    make: "Ford",
    model: "Mustang",
    year: 2023,
    price: 42000,
    location: "Phoenix, AZ",
    condition: "new",
    status: "pending",
  },
  {
    id: "o4",
    entityType: "offer",
    vin: "4HGBH41JXMN109189",
    make: "Tesla",
    model: "Model 3",
    year: 2024,
    price: 38900,
    location: "Seattle, WA",
    condition: "new",
    status: "available",
  },
  {
    id: "o5",
    entityType: "offer",
    vin: "5HGBH41JXMN109190",
    make: "BMW",
    model: "3 Series",
    year: 2023,
    price: 45200,
    location: "Denver, CO",
    condition: "certified",
    status: "available",
  },
  {
    id: "o6",
    entityType: "offer",
    vin: "6HGBH41JXMN109191",
    make: "Mercedes-Benz",
    model: "C-Class",
    year: 2022,
    price: 38500,
    location: "Dallas, TX",
    condition: "used",
    status: "available",
  },
  {
    id: "o7",
    entityType: "offer",
    vin: "7HGBH41JXMN109192",
    make: "Chevrolet",
    model: "Silverado",
    year: 2023,
    price: 52000,
    location: "Houston, TX",
    condition: "new",
    status: "available",
  },
  {
    id: "o8",
    entityType: "offer",
    vin: "8HGBH41JXMN109193",
    make: "Audi",
    model: "A4",
    year: 2023,
    price: 41800,
    location: "Miami, FL",
    condition: "certified",
    status: "pending",
  },
  {
    id: "o9",
    entityType: "offer",
    vin: "9HGBH41JXMN109194",
    make: "Nissan",
    model: "Altima",
    year: 2022,
    price: 22800,
    location: "Atlanta, GA",
    condition: "used",
    status: "available",
  },
  {
    id: "o10",
    entityType: "offer",
    vin: "0HGBH41JXMN109195",
    make: "Hyundai",
    model: "Elantra",
    year: 2023,
    price: 21500,
    location: "Chicago, IL",
    condition: "new",
    status: "available",
  },
  {
    id: "o11",
    entityType: "offer",
    vin: "1HGBH41JXMN109196",
    make: "Toyota",
    model: "Corolla",
    year: 2022,
    price: 19800,
    location: "Boston, MA",
    condition: "used",
    status: "sold",
  },
  {
    id: "o12",
    entityType: "offer",
    vin: "2HGBH41JXMN109197",
    make: "Honda",
    model: "Civic",
    year: 2023,
    price: 22000,
    location: "Philadelphia, PA",
    condition: "certified",
    status: "sold",
  },
];
// Comprehensive dummy purchases data
export const DUMMY_PURCHASES: PurchaseResult[] = [
  {
    id: "p1",
    entityType: "purchase",
    purchaseId: "PUR-2024-001",
    offerVin: "1HGBH41JXMN109186",
    offerMake: "Toyota",
    offerModel: "Camry",
    buyerName: "John Smith",
    buyerEmail: "john.smith@example.com",
    purchaseDate: "2024-01-15",
    status: "completed",
  },
  {
    id: "p2",
    entityType: "purchase",
    purchaseId: "PUR-2024-002",
    offerVin: "2HGBH41JXMN109187",
    offerMake: "Honda",
    offerModel: "Accord",
    buyerName: "Jane Doe",
    buyerEmail: "jane.doe@example.com",
    purchaseDate: "2024-01-18",
    status: "pending",
  },
  {
    id: "p3",
    entityType: "purchase",
    purchaseId: "PUR-2024-003",
    offerVin: "4HGBH41JXMN109189",
    offerMake: "Tesla",
    offerModel: "Model 3",
    buyerName: "Robert Johnson",
    buyerEmail: "robert.j@example.com",
    purchaseDate: "2024-01-20",
    status: "completed",
  },
  {
    id: "p4",
    entityType: "purchase",
    purchaseId: "PUR-2024-004",
    offerVin: "5HGBH41JXMN109190",
    offerMake: "BMW",
    offerModel: "3 Series",
    buyerName: "Sarah Williams",
    buyerEmail: "sarah.w@example.com",
    purchaseDate: "2024-01-22",
    status: "pending",
  },
  {
    id: "p5",
    entityType: "purchase",
    purchaseId: "PUR-2024-005",
    offerVin: "6HGBH41JXMN109191",
    offerMake: "Mercedes-Benz",
    offerModel: "C-Class",
    buyerName: "Michael Brown",
    buyerEmail: "michael.brown@example.com",
    purchaseDate: "2024-01-25",
    status: "completed",
  },
  {
    id: "p6",
    entityType: "purchase",
    purchaseId: "PUR-2024-006",
    offerVin: "9HGBH41JXMN109194",
    offerMake: "Nissan",
    offerModel: "Altima",
    buyerName: "Emily Davis",
    buyerEmail: "emily.davis@example.com",
    purchaseDate: "2024-01-28",
    status: "pending",
  },
];
// Comprehensive dummy transports data
export const DUMMY_TRANSPORTS: TransportResult[] = [
  {
    id: "t1",
    entityType: "transport",
    transportId: "TRN-2024-001",
    carrierName: "FastShip Logistics",
    carrierPhone: "+1 555-0123",
    pickupLocation: "Los Angeles, CA",
    deliveryLocation: "Phoenix, AZ",
    scheduleDate: "2024-01-20",
    status: "scheduled",
    relatedOfferVin: "1HGBH41JXMN109186",
    relatedOfferMake: "Toyota",
    relatedOfferModel: "Camry",
  },
  {
    id: "t2",
    entityType: "transport",
    transportId: "TRN-2024-002",
    carrierName: "AutoMove Express",
    carrierPhone: "+1 555-0456",
    pickupLocation: "San Francisco, CA",
    deliveryLocation: "Seattle, WA",
    scheduleDate: "2024-01-22",
    status: "in_transit",
    relatedOfferVin: "2HGBH41JXMN109187",
    relatedOfferMake: "Honda",
    relatedOfferModel: "Accord",
  },
  {
    id: "t3",
    entityType: "transport",
    transportId: "TRN-2024-003",
    carrierName: "QuickHaul Inc",
    carrierPhone: "+1 555-0789",
    pickupLocation: "Denver, CO",
    deliveryLocation: "Dallas, TX",
    scheduleDate: "2024-01-25",
    status: "delivered",
  },
  {
    id: "t4",
    entityType: "transport",
    transportId: "TRN-2024-004",
    carrierName: "Reliable Transport Co",
    carrierPhone: "+1 555-0321",
    pickupLocation: "Seattle, WA",
    deliveryLocation: "Portland, OR",
    scheduleDate: "2024-01-26",
    status: "scheduled",
    relatedOfferVin: "4HGBH41JXMN109189",
    relatedOfferMake: "Tesla",
    relatedOfferModel: "Model 3",
  },
  {
    id: "t5",
    entityType: "transport",
    transportId: "TRN-2024-005",
    carrierName: "Nationwide Auto Transport",
    carrierPhone: "+1 555-0654",
    pickupLocation: "Miami, FL",
    deliveryLocation: "Atlanta, GA",
    scheduleDate: "2024-01-27",
    status: "in_transit",
    relatedOfferVin: "8HGBH41JXMN109193",
    relatedOfferMake: "Audi",
    relatedOfferModel: "A4",
  },
  {
    id: "t6",
    entityType: "transport",
    transportId: "TRN-2024-006",
    carrierName: "Coast to Coast Logistics",
    carrierPhone: "+1 555-0987",
    pickupLocation: "Chicago, IL",
    deliveryLocation: "New York, NY",
    scheduleDate: "2024-01-29",
    status: "scheduled",
    relatedOfferVin: "0HGBH41JXMN109195",
    relatedOfferMake: "Hyundai",
    relatedOfferModel: "Elantra",
  },
];
/**
 * Helper function to check if a string matches a query (case-insensitive)
 */
function matchesQuery(text: string, query: string): boolean {
  if (!query.trim()) return true;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  return lowerText.includes(lowerQuery);
}
/**
 * Filter offers based on query
 */
export function filterOffersByQuery(
  offers: OfferResult[],
  query: string
): OfferResult[] {
  if (!query.trim()) return offers;

  return offers.filter((offer) => {
    const searchableText = [
      offer.vin,
      offer.make,
      offer.model,
      offer.year.toString(),
      offer.location,
      offer.condition,
      offer.status,
      offer.price.toString(),
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(query.toLowerCase());
  });
}
/**
 * Filter purchases based on query
 */
export function filterPurchasesByQuery(
  purchases: PurchaseResult[],
  query: string
): PurchaseResult[] {
  if (!query.trim()) return purchases;

  return purchases.filter((purchase) => {
    const searchableText = [
      purchase.purchaseId,
      purchase.offerVin,
      purchase.offerMake,
      purchase.offerModel,
      purchase.buyerName,
      purchase.buyerEmail,
      purchase.purchaseDate,
      purchase.status,
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(query.toLowerCase());
  });
}
/**
 * Filter transports based on query
 */
export function filterTransportsByQuery(
  transports: TransportResult[],
  query: string
): TransportResult[] {
  if (!query.trim()) return transports;

  return transports.filter((transport) => {
    const searchableText = [
      transport.transportId,
      transport.carrierName,
      transport.carrierPhone,
      transport.pickupLocation,
      transport.deliveryLocation,
      transport.scheduleDate,
      transport.status,
      transport.relatedOfferVin || "",
      transport.relatedOfferModel || "",
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(query.toLowerCase());
  });
}
/**
 * Generate autocomplete suggestions based on query
 */
export function generateAutocompleteSuggestions(
  query: string,
  userContext: UserContext
): AutocompleteSuggestion[] {
  if (!query.trim()) return [];

  const suggestions: AutocompleteSuggestion[] = [];
  const lowerQuery = query.toLowerCase();

  // Generate suggestions from offers
  if (
    userContext.userType === "seller" ||
    userContext.userType === "buyer" ||
    userContext.userType === "agent"
  ) {
    const matchingOffers = filterOffersByQuery(DUMMY_OFFERS, query).slice(0, 3);
    matchingOffers.forEach((offer) => {
      const text = `${offer.make} ${offer.model} ${offer.year} - ${offer.vin}`;
      const highlightedText = text.replace(
        new RegExp(`(${query})`, "gi"),
        "<mark>$1</mark>"
      );
      suggestions.push({
        id: `offer-${offer.id}`,
        text,
        entityType: "offer",
        highlightedText,
      });
    });
  }

  // Generate suggestions from purchases
  if (userContext.userType === "buyer" || userContext.userType === "agent") {
    const matchingPurchases = filterPurchasesByQuery(
      DUMMY_PURCHASES,
      query
    ).slice(0, 2);
    matchingPurchases.forEach((purchase) => {
      const text = `Purchase ${purchase.purchaseId} - ${purchase.offerMake} ${purchase.offerModel}`;
      const highlightedText = text.replace(
        new RegExp(`(${query})`, "gi"),
        "<mark>$1</mark>"
      );
      suggestions.push({
        id: `purchase-${purchase.id}`,
        text,
        entityType: "purchase",
        highlightedText,
      });
    });
  }

  // Generate suggestions from transports
  if (userContext.userType === "carrier" || userContext.userType === "agent") {
    const matchingTransports = filterTransportsByQuery(
      DUMMY_TRANSPORTS,
      query
    ).slice(0, 2);
    matchingTransports.forEach((transport) => {
      const text = `Transport ${transport.transportId} - ${transport.carrierName}`;
      const highlightedText = text.replace(
        new RegExp(`(${query})`, "gi"),
        "<mark>$1</mark>"
      );
      suggestions.push({
        id: `transport-${transport.id}`,
        text,
        entityType: "transport",
        highlightedText,
      });
    });
  }

  // Limit to 5 suggestions total
  return suggestions.slice(0, 5);
}
/**
 * Filter offers by status filter
 */
export function filterOffersByStatus(
  offers: OfferResult[],
  statusFilter: StatusFilter
): OfferResult[] {
  if (statusFilter === "all") return offers;

  return offers.filter((offer) => {
    switch (statusFilter) {
      case "complete":
        return offer.status === "sold";
      case "pending":
        return offer.status === "pending";
      case "in_transit":
        return false; // Offers don't have in_transit status
      default:
        return true;
    }
  });
}
/**
 * Filter purchases by status filter
 */
export function filterPurchasesByStatus(
  purchases: PurchaseResult[],
  statusFilter: StatusFilter
): PurchaseResult[] {
  if (statusFilter === "all") return purchases;

  return purchases.filter((purchase) => {
    switch (statusFilter) {
      case "complete":
        return purchase.status === "completed";
      case "pending":
        return purchase.status === "pending";
      case "in_transit":
        return false; // Purchases don't have in_transit status
      default:
        return true;
    }
  });
}
/**
 * Filter transports by status filter
 */
export function filterTransportsByStatus(
  transports: TransportResult[],
  statusFilter: StatusFilter
): TransportResult[] {
  if (statusFilter === "all") return transports;

  return transports.filter((transport) => {
    switch (statusFilter) {
      case "complete":
        return transport.status === "delivered";
      case "pending":
        return transport.status === "scheduled";
      case "in_transit":
        return transport.status === "in_transit";
      default:
        return true;
    }
  });
}
/**
 * Filter results based on user context (role-based filtering)
 *
 * Note: In production, this filtering happens on the backend.
 * This is just for demo purposes to simulate backend behavior.
 */
export function filterByUserContext(
  offers: OfferResult[],
  purchases: PurchaseResult[],
  transports: TransportResult[],
  userContext: UserContext
): {
  offers: OfferResult[];
  purchases: PurchaseResult[];
  transports: TransportResult[];
} {
  // In a real backend, filtering would be based on accountId and userId
  // For demo purposes, we simulate role-based filtering

  switch (userContext.userType) {
    case "seller":
      // Sellers only see their own offers
      // In production, this would filter by accountId/userId
      return {
        offers: offers.filter((_, index) => index < 5), // Simulate seller's own offers
        purchases: [],
        transports: [],
      };

    case "buyer":
      // Buyers see available offers and their purchase history
      return {
        offers: offers.filter((o) => o.status === "available"),
        purchases: purchases.filter((_, index) => index < 3), // Simulate buyer's purchases
        transports: [],
      };

    case "carrier":
      // Carriers see their transport assignments
      return {
        offers: [],
        purchases: [],
        transports: transports.filter((_, index) => index < 4), // Simulate carrier's transports
      };

    case "agent":
      // Agents see everything
      return {
        offers,
        purchases,
        transports,
      };

    default:
      return { offers: [], purchases: [], transports: [] };
  }
}
/**
 * Advanced filtering function for offers based on multiple criteria
 */
export function filterOffersAdvanced(
  offers: OfferResult[],
  filters: SearchFilters
): OfferResult[] {
  return offers.filter((offer) => {
    // Status filtering
    if (filters.status !== "all") {
      switch (filters.status) {
        case "complete":
          if (offer.status !== "sold") return false;
          break;
        case "pending":
          if (offer.status !== "pending") return false;
          break;
        case "in_transit":
          return false; // Offers don't have in_transit status
      }
    }
    // Make filtering
    if (
      filters.make &&
      !offer.make.toLowerCase().includes(filters.make.toLowerCase())
    ) {
      return false;
    }
    // Model filtering
    if (
      filters.model &&
      !offer.model.toLowerCase().includes(filters.model.toLowerCase())
    ) {
      return false;
    }
    // Location filtering
    if (
      filters.location &&
      !offer.location.toLowerCase().includes(filters.location.toLowerCase())
    ) {
      return false;
    }
    // Year range filtering
    if (filters.minYear && offer.year < parseInt(filters.minYear)) {
      return false;
    }
    if (filters.maxYear && offer.year > parseInt(filters.maxYear)) {
      return false;
    }
    // Price range filtering
    if (filters.minPrice && offer.price < parseInt(filters.minPrice)) {
      return false;
    }
    if (filters.maxPrice && offer.price > parseInt(filters.maxPrice)) {
      return false;
    }
    return true;
  });
}
/**
 * Advanced filtering function for purchases based on multiple criteria
 */
export function filterPurchasesAdvanced(
  purchases: PurchaseResult[],
  filters: SearchFilters
): PurchaseResult[] {
  return purchases.filter((purchase) => {
    // Status filtering
    if (filters.status !== "all") {
      switch (filters.status) {
        case "complete":
          if (purchase.status !== "completed") return false;
          break;
        case "pending":
          if (purchase.status !== "pending") return false;
          break;
        case "in_transit":
          return false; // Purchases don't have in_transit status
      }
    }
    // Make filtering (from offer)
    if (
      filters.make &&
      !purchase.offerMake.toLowerCase().includes(filters.make.toLowerCase())
    ) {
      return false;
    }
    // Model filtering (from offer)
    if (
      filters.model &&
      !purchase.offerModel.toLowerCase().includes(filters.model.toLowerCase())
    ) {
      return false;
    }
    // Note: Year and price filtering not applicable to purchases in current data structure
    // In a real implementation, you might have this data in the purchase record
    return true;
  });
}
/**
 * Advanced filtering function for transports based on multiple criteria
 */
export function filterTransportsAdvanced(
  transports: TransportResult[],
  filters: SearchFilters
): TransportResult[] {
  return transports.filter((transport) => {
    // Status filtering
    if (filters.status !== "all") {
      switch (filters.status) {
        case "complete":
          if (transport.status !== "delivered") return false;
          break;
        case "pending":
          if (transport.status !== "scheduled") return false;
          break;
        case "in_transit":
          if (transport.status !== "in_transit") return false;
          break;
      }
    }
    // Make filtering (from related offer)
    if (
      filters.make &&
      transport.relatedOfferMake &&
      !transport.relatedOfferMake
        .toLowerCase()
        .includes(filters.make.toLowerCase())
    ) {
      return false;
    }
    // Model filtering (from related offer)
    if (
      filters.model &&
      transport.relatedOfferModel &&
      !transport.relatedOfferModel
        .toLowerCase()
        .includes(filters.model.toLowerCase())
    ) {
      return false;
    }
    // Location filtering (pickup or delivery location)
    if (filters.location) {
      const locationLower = filters.location.toLowerCase();
      const pickupMatch = transport.pickupLocation
        .toLowerCase()
        .includes(locationLower);
      const deliveryMatch = transport.deliveryLocation
        .toLowerCase()
        .includes(locationLower);
      if (!pickupMatch && !deliveryMatch) {
        return false;
      }
    }
    // Note: Year and price filtering not applicable to transports in current data structure
    // In a real implementation, you might have this data in the transport record
    return true;
  });
}
