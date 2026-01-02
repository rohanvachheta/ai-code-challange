const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock Data - Replicating the data structure from dummyData.ts
const DUMMY_OFFERS = [
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
    make: "BMW",
    model: "X5",
    year: 2024,
    price: 65000,
    location: "Dallas, TX",
    condition: "new",
    status: "available",
  },
  {
    id: "o5",
    entityType: "offer",
    vin: "5HGBH41JXMN109190",
    make: "Mercedes",
    model: "E-Class",
    year: 2023,
    price: 58000,
    location: "Miami, FL",
    condition: "certified",
    status: "available",
  },
];

const DUMMY_PURCHASES = [
  {
    id: "p1",
    entityType: "purchase",
    purchaseId: "PUR-2024-001",
    offerVin: "1HGBH41JXMN109186",
    offerMake: "Toyota",
    offerModel: "Camry",
    buyerName: "John Smith",
    buyerEmail: "john@example.com",
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
    buyerEmail: "jane@example.com",
    purchaseDate: "2024-01-18",
    status: "pending",
  },
  {
    id: "p3",
    entityType: "purchase",
    purchaseId: "PUR-2024-003",
    offerVin: "4HGBH41JXMN109189",
    offerMake: "BMW",
    offerModel: "X5",
    buyerName: "Mike Wilson",
    buyerEmail: "mike@example.com",
    purchaseDate: "2024-01-20",
    status: "completed",
  },
];

const DUMMY_TRANSPORTS = [
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
    relatedOfferModel: "Toyota Camry",
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
    relatedOfferModel: "Honda Accord",
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
];

// Helper functions for filtering and searching
function filterOffersByQuery(offers, query) {
  if (!query || !query.trim()) return offers;

  const searchTerm = query.toLowerCase();
  return offers.filter(
    (offer) =>
      offer.make.toLowerCase().includes(searchTerm) ||
      offer.model.toLowerCase().includes(searchTerm) ||
      offer.vin.toLowerCase().includes(searchTerm) ||
      offer.location.toLowerCase().includes(searchTerm) ||
      offer.year.toString().includes(searchTerm) ||
      offer.condition.toLowerCase().includes(searchTerm) ||
      offer.status.toLowerCase().includes(searchTerm)
  );
}

function filterPurchasesByQuery(purchases, query) {
  if (!query || !query.trim()) return purchases;

  const searchTerm = query.toLowerCase();
  return purchases.filter(
    (purchase) =>
      purchase.purchaseId.toLowerCase().includes(searchTerm) ||
      purchase.offerMake.toLowerCase().includes(searchTerm) ||
      purchase.offerModel.toLowerCase().includes(searchTerm) ||
      purchase.offerVin.toLowerCase().includes(searchTerm) ||
      purchase.buyerName.toLowerCase().includes(searchTerm) ||
      purchase.buyerEmail.toLowerCase().includes(searchTerm) ||
      purchase.status.toLowerCase().includes(searchTerm)
  );
}

function filterTransportsByQuery(transports, query) {
  if (!query || !query.trim()) return transports;

  const searchTerm = query.toLowerCase();
  return transports.filter(
    (transport) =>
      transport.transportId.toLowerCase().includes(searchTerm) ||
      transport.carrierName.toLowerCase().includes(searchTerm) ||
      transport.pickupLocation.toLowerCase().includes(searchTerm) ||
      transport.deliveryLocation.toLowerCase().includes(searchTerm) ||
      transport.relatedOfferVin?.toLowerCase().includes(searchTerm) ||
      transport.relatedOfferModel?.toLowerCase().includes(searchTerm) ||
      transport.status.toLowerCase().includes(searchTerm)
  );
}

function filterByUserContext(offers, purchases, transports, userContext) {
  // Apply user-context filtering based on userType
  let filteredOffers = [...offers];
  let filteredPurchases = [...purchases];
  let filteredTransports = [...transports];

  switch (userContext.userType) {
    case "seller":
      // Sellers can only see their own offers (in real app, filter by accountId)
      filteredPurchases = [];
      filteredTransports = [];
      break;
    case "buyer":
      // Buyers can see offers and their purchases (in real app, filter by accountId)
      filteredTransports = [];
      break;
    case "carrier":
      // Carriers can only see transports (in real app, filter by accountId)
      filteredOffers = [];
      filteredPurchases = [];
      break;
    case "agent":
      // Agents can see everything
      break;
    default:
      break;
  }

  return {
    offers: filteredOffers,
    purchases: filteredPurchases,
    transports: filteredTransports,
  };
}

function generateAutocompleteSuggestions(query, userContext) {
  if (!query || !query.trim()) return [];

  const suggestions = [];

  // Generate suggestions from offers
  const filteredOffers = filterOffersByQuery(DUMMY_OFFERS, query);
  filteredOffers.slice(0, 3).forEach((offer, index) => {
    suggestions.push({
      id: `offer-${index}`,
      text: `${offer.make} ${offer.model} ${offer.year}`,
      entityType: "offer",
      highlightedText: `<mark>${query}</mark> - ${offer.make} ${offer.model} ${offer.year}`,
    });
  });

  // Generate suggestions from purchases
  if (userContext.userType !== "seller" && userContext.userType !== "carrier") {
    const filteredPurchases = filterPurchasesByQuery(DUMMY_PURCHASES, query);
    filteredPurchases.slice(0, 2).forEach((purchase, index) => {
      suggestions.push({
        id: `purchase-${index}`,
        text: `${purchase.offerMake} ${purchase.offerModel} Purchase`,
        entityType: "purchase",
        highlightedText: `<mark>${query}</mark> - ${purchase.offerMake} ${purchase.offerModel} Purchase`,
      });
    });
  }

  // Generate suggestions from transports
  if (userContext.userType !== "seller" && userContext.userType !== "buyer") {
    const filteredTransports = filterTransportsByQuery(DUMMY_TRANSPORTS, query);
    filteredTransports.slice(0, 2).forEach((transport, index) => {
      suggestions.push({
        id: `transport-${index}`,
        text: `Transport ${transport.pickupLocation} to ${transport.deliveryLocation}`,
        entityType: "transport",
        highlightedText: `<mark>${query}</mark> - Transport ${transport.pickupLocation} to ${transport.deliveryLocation}`,
      });
    });
  }

  return suggestions.slice(0, 5); // Limit to 5 suggestions
}

// Routes

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Mock Search API is running" });
});

// Autocomplete endpoint
app.post("/api/search/autocomplete", (req, res) => {
  try {
    const { query, userType, accountId, userId } = req.body;

    // Validate required fields
    if (!query || !userType || !accountId || !userId) {
      return res.status(400).json({
        error: "Missing required fields: query, userType, accountId, userId",
      });
    }

    const userContext = { userType, accountId, userId };

    // Simulate network delay
    setTimeout(() => {
      const suggestions = generateAutocompleteSuggestions(query, userContext);
      res.json(suggestions);
    }, 200);
  } catch (error) {
    console.error("Error in autocomplete:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Search endpoint
app.post("/api/search", (req, res) => {
  try {
    const {
      query,
      userType,
      accountId,
      userId,
      page = 1,
      pageSize = 20,
    } = req.body;

    // Validate required fields
    if (!query || !userType || !accountId || !userId) {
      return res.status(400).json({
        error: "Missing required fields: query, userType, accountId, userId",
      });
    }

    const userContext = { userType, accountId, userId };

    // Simulate network delay
    setTimeout(() => {
      // If no query, return empty results
      if (!query.trim()) {
        return res.json({
          query,
          totalResults: 0,
          results: { offers: [], purchases: [], transports: [] },
          pagination: { page, pageSize, totalPages: 0 },
        });
      }

      // Filter data by query
      let filteredOffers = filterOffersByQuery(DUMMY_OFFERS, query);
      let filteredPurchases = filterPurchasesByQuery(DUMMY_PURCHASES, query);
      let filteredTransports = filterTransportsByQuery(DUMMY_TRANSPORTS, query);

      // Apply user context filtering
      const { offers, purchases, transports } = filterByUserContext(
        filteredOffers,
        filteredPurchases,
        filteredTransports,
        userContext
      );

      // Apply pagination
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;

      const paginatedOffers = offers.slice(startIndex, endIndex);
      const paginatedPurchases = purchases.slice(startIndex, endIndex);
      const paginatedTransports = transports.slice(startIndex, endIndex);

      const totalResults = offers.length + purchases.length + transports.length;
      const totalPages = Math.ceil(totalResults / pageSize);

      res.json({
        query,
        totalResults,
        results: {
          offers: paginatedOffers,
          purchases: paginatedPurchases,
          transports: paginatedTransports,
        },
        pagination: { page, pageSize, totalPages },
      });
    }, 500);
  } catch (error) {
    console.error("Error in search:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Error handler
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`🚀 Mock Search API server running on http://localhost:${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  /api/health - Health check`);
  console.log(
    `   POST /api/search/autocomplete - Get autocomplete suggestions`
  );
  console.log(`   POST /api/search - Search for results`);
});
