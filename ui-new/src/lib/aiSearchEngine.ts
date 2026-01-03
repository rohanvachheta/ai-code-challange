/**
 * AI-Enhanced Search System
 * 
 * Integrates multiple free AI libraries for superior search experience:
 * - Fuse.js: Advanced fuzzy search with scoring
 * - fast-levenshtein: Optimized string distance calculations
 * - compromise: Natural language processing
 * - trie-search: Fast prefix matching
 * - soundex: Phonetic matching for sound-alike words
 */

import Fuse from 'fuse.js';
import levenshtein from 'fast-levenshtein';
import nlp from 'compromise';
import TrieSearch from 'trie-search';
import soundex from 'soundex';
import { SmartSuggestion, UserContext } from '@/types/search';
import { DUMMY_OFFERS, DUMMY_PURCHASES, DUMMY_TRANSPORTS } from './dummyData';

// Enhanced automotive database for AI processing
interface VehicleData {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  location: string;
  condition: string;
  status: string;
  vin?: string;
  phone?: string;
  dealerName?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  coordinates?: { lat: number; lng: number };
  fullText: string;
  searchKeys: string[];
}

// Generate realistic phone numbers and enhanced location data
const generatePhoneNumber = (index: number): string => {
  const areaCodes = ['212', '415', '303', '404', '512', '206', '305', '702', '713', '214'];
  const areaCode = areaCodes[index % areaCodes.length];
  const number = (5550000 + index).toString();
  return `(${areaCode}) ${number.slice(0, 3)}-${number.slice(3)}`;
};

const generateLocationData = (location: string, index: number) => {
  const locationParts = location.split(', ');
  const city = locationParts[0] || 'Unknown City';
  const state = locationParts[1] || 'CA';
  const dealerNames = [
    `${city} Auto Center`, `Premium Motors ${city}`, `${state} Car Gallery`,
    `Elite Auto ${city}`, `${city} Vehicle Hub`, `Metro Cars ${city}`,
    `${city} Auto Plaza`, `Superior Motors`, `${state} Auto Exchange`
  ];
  
  return {
    city,
    state,
    zipCode: (90000 + index).toString(),
    dealerName: dealerNames[index % dealerNames.length],
    coordinates: {
      lat: 40.7128 + (Math.random() - 0.5) * 10, // Rough US coordinates
      lng: -74.0060 + (Math.random() - 0.5) * 50
    }
  };
};

// Convert dummy data to searchable format with enhanced location/phone data
const vehicleDatabase: VehicleData[] = DUMMY_OFFERS.map((offer, index) => {
  const locationData = generateLocationData(offer.location, index);
  const phone = generatePhoneNumber(index);
  
  return {
    ...offer,
    phone,
    ...locationData,
    fullText: `${offer.year} ${offer.make} ${offer.model} ${offer.condition} ${offer.location} ${offer.vin} ${phone} ${locationData.dealerName} ${locationData.city} ${locationData.state}`,
    searchKeys: [
      offer.make.toLowerCase(),
      offer.model.toLowerCase(),
      `${offer.make} ${offer.model}`.toLowerCase(),
      `${offer.year} ${offer.make}`.toLowerCase(),  // Added year+make combination
      `${offer.year} ${offer.make} ${offer.model}`.toLowerCase(),  // Added year+make+model combination
      offer.year.toString(),
      offer.condition.toLowerCase(),
      offer.location.toLowerCase(),
      offer.vin.toLowerCase(),
      phone.replace(/[^0-9]/g, ''), // Just digits for phone search
      locationData.city.toLowerCase(),
      locationData.state.toLowerCase(),
      locationData.dealerName.toLowerCase()
    ]
  };
});

// Initialize AI libraries
class AISearchEngine {
  private fuseEngine: Fuse<VehicleData>;
  private trieSearch: TrieSearch<VehicleData>;
  private vehicleData: VehicleData[];

  constructor() {
    console.log('🔧 AI Search Engine constructor started...');
    this.vehicleData = vehicleDatabase;
    console.log('📊 Vehicle data loaded:', this.vehicleData.length, 'vehicles');
    
    // Configure Fuse.js for advanced fuzzy search with location and phone
    console.log('⚙️ Configuring Fuse.js engine...');
    this.fuseEngine = new Fuse(this.vehicleData, {
      keys: [
        { name: 'make', weight: 0.22 },
        { name: 'model', weight: 0.22 },
        { name: 'year', weight: 0.18 },  // Added year as searchable field
        { name: 'fullText', weight: 0.12 },
        { name: 'city', weight: 0.1 },
        { name: 'state', weight: 0.08 },
        { name: 'dealerName', weight: 0.05 },
        { name: 'phone', weight: 0.02 },
        { name: 'vin', weight: 0.01 }
      ],
      threshold: 0.3, // More strict for better exact matches
      distance: 100,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2,
      shouldSort: true,
      findAllMatches: true
    });

    // Configure Trie for fast prefix matching including location, phone and year
    console.log('⚙️ Configuring Trie search engine...');
    this.trieSearch = new TrieSearch<VehicleData>(['make', 'model', 'year', 'vin', 'city', 'state', 'dealerName']);
    this.trieSearch.addAll(this.vehicleData);
    console.log('✅ AI Search Engine constructor completed successfully');
  }

  /**
   * Advanced fuzzy search using Fuse.js
   */
  fuzzySearch(query: string, limit: number = 8): SmartSuggestion[] {
    const results = this.fuseEngine.search(query, { limit });
    
    return results.map((result, index) => {
      const item = result.item;
      const score = result.score || 0;
      const confidence = Math.max(0, 1 - score); // Convert Fuse score to confidence
      
      // Highlight matches from Fuse.js
      let highlightedText = `${item.year} ${item.make} ${item.model}`;
      if (result.matches && result.matches.length > 0) {
        const match = result.matches[0];
        if (match.indices && match.indices.length > 0) {
          const [start, end] = match.indices[0];
          const matchText = match.value || '';
          const highlighted = matchText.substring(0, start) + 
            `<mark class="bg-yellow-200 dark:bg-yellow-800">${matchText.substring(start, end + 1)}</mark>` +
            matchText.substring(end + 1);
          highlightedText = highlighted;
        }
      }

      return {
        id: `fuse-${item.id}`,
        text: `${item.year} ${item.make} ${item.model}`,
        entityType: 'offer' as const,
        highlightedText: highlightedText || `${item.year} ${item.make} ${item.model}`,
        suggestionType: 'make_model' as const,
        confidence: confidence,
        context: `${item.condition} • ${item.location} • AI match`
      };
    });
  }

  /**
   * Prefix-based search using TrieSearch
   */
  prefixSearch(query: string, limit: number = 5): SmartSuggestion[] {
    const results = this.trieSearch.search(query).slice(0, limit);
    
    return results.map(item => ({
      id: `trie-${item.id}`,
      text: `${item.year} ${item.make} ${item.model}`,
      entityType: 'offer' as const,
      highlightedText: this.highlightMatch(`${item.make} ${item.model}`, query),
      suggestionType: 'make_model' as const,
      confidence: 0.9,
      context: `${item.condition} • ${item.city}, ${item.state} • Quick match`
    }));
  }

  /**
   * Phonetic matching using Soundex algorithm
   */
  phoneticSearch(query: string): SmartSuggestion[] {
    const querySound = soundex(query);
    const matches: SmartSuggestion[] = [];
    
    for (const vehicle of this.vehicleData) {
      const makeSound = soundex(vehicle.make);
      const modelSound = soundex(vehicle.model);
      
      if (makeSound === querySound || modelSound === querySound) {
        matches.push({
          id: `phonetic-${vehicle.id}`,
          text: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          entityType: 'offer' as const,
          highlightedText: this.highlightMatch(`${vehicle.make} ${vehicle.model}`, query),
          suggestionType: 'make_model' as const,
          confidence: 0.75,
          context: `${vehicle.condition} • ${vehicle.city}, ${vehicle.state} • Sounds like "${query}"`
        });
      }
      
      if (matches.length >= 3) break;
    }
    
    return matches;
  }

  /**
   * Natural Language Processing using compromise
   */
  nlpSearch(query: string): SmartSuggestion[] {
    const doc = nlp(query);
    const suggestions: SmartSuggestion[] = [];

    // Extract entities from the query
    const nouns = doc.nouns().out('array');
    const numbers = doc.numbers().out('array');
    const places = doc.places().out('array');
    
    // Look for year patterns
    const years = numbers.filter(num => {
      const n = parseInt(num);
      return n >= 1990 && n <= new Date().getFullYear() + 2;
    });

    // Enhanced search for year + make combinations
    if (years.length > 0) {
      const yearValue = parseInt(years[0]);
      const makes = ['bmw', 'toyota', 'honda', 'ford', 'chevrolet', 'mercedes', 'audi', 'volkswagen', 'nissan', 'hyundai'];
      const queryMake = makes.find(make => query.toLowerCase().includes(make));
      
      if (queryMake) {
        // Direct year+make match
        const yearMakeMatches = this.vehicleData.filter(vehicle => 
          vehicle.year === yearValue && 
          vehicle.make.toLowerCase().includes(queryMake)
        ).slice(0, 4);
        
        yearMakeMatches.forEach(vehicle => {
          suggestions.push({
            id: `nlp-year-make-${vehicle.id}`,
            text: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
            entityType: 'offer' as const,
            highlightedText: this.highlightMatch(`${vehicle.year} ${vehicle.make} ${vehicle.model}`, query),
            suggestionType: 'make_model' as const,
            confidence: 0.92,
            context: `${vehicle.condition} • ${vehicle.city}, ${vehicle.state} • Year + Make match`
          });
        });
      }
    }

    // Search for vehicles matching NLP-extracted terms
    const searchTerms = [...nouns, ...places, ...years].filter(term => term.length >= 2);
    
    for (const term of searchTerms) {
      const matches = this.vehicleData.filter(vehicle => 
        vehicle.fullText.toLowerCase().includes(term.toLowerCase())
      ).slice(0, 2);

      matches.forEach(vehicle => {
        // Avoid duplicates from year+make logic above
        const isDuplicate = suggestions.some(s => s.id.includes(vehicle.id));
        if (!isDuplicate) {
          suggestions.push({
            id: `nlp-${vehicle.id}-${term}`,
            text: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
            entityType: 'offer' as const,
            highlightedText: this.highlightMatch(`${vehicle.make} ${vehicle.model}`, term),
            suggestionType: 'make_model' as const,
            confidence: 0.8,
            context: `${vehicle.condition} • ${vehicle.city}, ${vehicle.state} • Found: "${term}"`
          });
        }
      });
    }

    return suggestions.slice(0, 6);
  }

  /**
   * Levenshtein distance-based correction
   */
  levenshteinCorrection(query: string, threshold: number = 3): SmartSuggestion[] {
    const corrections: Array<{ vehicle: VehicleData, distance: number, match: string }> = [];
    
    for (const vehicle of this.vehicleData) {
      // Check make similarity
      const makeDistance = levenshtein.get(query.toLowerCase(), vehicle.make.toLowerCase());
      if (makeDistance <= threshold && makeDistance < query.length * 0.6) {
        corrections.push({ vehicle, distance: makeDistance, match: vehicle.make });
      }
      
      // Check model similarity
      const modelDistance = levenshtein.get(query.toLowerCase(), vehicle.model.toLowerCase());
      if (modelDistance <= threshold && modelDistance < query.length * 0.6) {
        corrections.push({ vehicle, distance: modelDistance, match: vehicle.model });
      }
    }

    // Sort by distance (lower is better)
    corrections.sort((a, b) => a.distance - b.distance);
    
    return corrections.slice(0, 3).map(({ vehicle, distance, match }) => ({
      id: `levenshtein-${vehicle.id}`,
      text: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      entityType: 'offer' as const,
      highlightedText: this.highlightMatch(`${vehicle.make} ${vehicle.model}`, match),
      suggestionType: 'make_model' as const,
      confidence: Math.max(0.5, 1 - (distance / query.length)),
      context: `${vehicle.condition} • ${vehicle.city}, ${vehicle.state} • Did you mean "${match}"?`
    }));
  }

  private highlightMatch(text: string, query: string): string {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
  }

  /**
   * Location-based search functionality
   */
  locationSearch(query: string, limit: number = 6): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    const lowerQuery = query.toLowerCase();
    
    // Extract make/brand from query if present
    const makes = ['bmw', 'toyota', 'honda', 'ford', 'chevrolet', 'mercedes', 'audi', 'volkswagen', 'nissan', 'hyundai'];
    const queryMake = makes.find(make => lowerQuery.includes(make));
    
    // Extract location terms
    const stateNames = ['california', 'new york', 'texas', 'florida', 'illinois', 'pennsylvania', 'ohio', 'georgia', 'north carolina', 'michigan'];
    const cityNames = ['los angeles', 'new york', 'chicago', 'houston', 'phoenix', 'philadelphia', 'san antonio', 'san diego', 'dallas', 'san jose'];
    const queryState = stateNames.find(state => lowerQuery.includes(state));
    const queryCity = cityNames.find(city => lowerQuery.includes(city));
    
    // Search by location and optionally filter by make
    let locationMatches = this.vehicleData.filter(vehicle => {
      const locationText = `${vehicle.city} ${vehicle.state} ${vehicle.dealerName} ${vehicle.location}`.toLowerCase();
      const makeText = vehicle.make.toLowerCase();
      
      // Location match
      let locationMatch = false;
      if (queryState) {
        locationMatch = vehicle.state?.toLowerCase().includes(queryState) || 
                      locationText.includes(queryState);
      } else if (queryCity) {
        locationMatch = vehicle.city?.toLowerCase().includes(queryCity) ||
                      locationText.includes(queryCity);
      } else if (lowerQuery.includes('near') || lowerQuery.includes('around')) {
        locationMatch = true; // Show all for proximity searches
      } else {
        // General location terms
        locationMatch = lowerQuery.includes('dealer') || lowerQuery.includes('auto');
      }
      
      // Make match (if specified)
      const makeMatch = !queryMake || makeText.includes(queryMake);
      
      return locationMatch && makeMatch;
    });

    // Handle "near me" or proximity-based searches
    if (lowerQuery.includes('near') || lowerQuery.includes('around')) {
      // Filter by make if specified (e.g., "BMW near me")
      if (queryMake) {
        locationMatches = locationMatches.filter(vehicle => 
          vehicle.make.toLowerCase().includes(queryMake)
        );
      }
      
      // Simulate location-based results with distances
      const proximityResults = locationMatches.slice(0, limit).map(vehicle => ({
        ...vehicle,
        estimatedDistance: Math.floor(Math.random() * 50) + 1
      }));

      proximityResults.forEach(vehicle => {
        suggestions.push({
          id: `location-proximity-${vehicle.id}`,
          text: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          entityType: 'offer' as const,
          highlightedText: `${vehicle.make} ${vehicle.model} - ${vehicle.dealerName}`,
          suggestionType: 'location' as const,
          confidence: 0.85,
          context: `${vehicle.estimatedDistance} mi • ${vehicle.city}, ${vehicle.state} • ${vehicle.phone}`
        });
      });
    } else {
      // Regular location-based search (e.g., "Toyota in California")
      locationMatches.slice(0, limit).forEach(vehicle => {
        const highlightText = queryMake ? 
          `${vehicle.make} ${vehicle.model} in ${vehicle.city}, ${vehicle.state}` :
          `${vehicle.make} ${vehicle.model} at ${vehicle.dealerName}`;
          
        suggestions.push({
          id: `location-${vehicle.id}`,
          text: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          entityType: 'offer' as const,
          highlightedText: this.highlightMatch(highlightText, query),
          suggestionType: 'location' as const,
          confidence: 0.9,
          context: `${vehicle.city}, ${vehicle.state} • ${vehicle.phone} • ${vehicle.condition}`
        });
      });
    }

    return suggestions;
  }

  /**
   * Phone number search functionality
   */
  phoneSearch(query: string, limit: number = 5): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    
    // Clean query - remove all non-digits
    const cleanQuery = query.replace(/[^0-9]/g, '');
    
    if (cleanQuery.length < 3) return suggestions; // Need at least 3 digits
    
    // Search by phone number (partial or full matches)
    const phoneMatches = this.vehicleData.filter(vehicle => {
      if (!vehicle.phone) return false;
      const cleanPhone = vehicle.phone.replace(/[^0-9]/g, '');
      return cleanPhone.includes(cleanQuery) || 
             cleanQuery.includes(cleanPhone.slice(-4)) || // Last 4 digits
             cleanPhone.slice(-7).includes(cleanQuery); // Last 7 digits
    });

    phoneMatches.slice(0, limit).forEach(vehicle => {
      suggestions.push({
        id: `phone-${vehicle.id}`,
        text: `${vehicle.dealerName} - ${vehicle.phone}`,
        entityType: 'offer' as const,
        highlightedText: this.highlightMatch(vehicle.phone!, query),
        suggestionType: 'phone' as const,
        confidence: 0.95,
        context: `${vehicle.city}, ${vehicle.state} • ${vehicle.year} ${vehicle.make} ${vehicle.model}`
      });
    });

    // Also search for vehicles by dealers with matching phone patterns
    if (suggestions.length < limit) {
      const dealerMatches = this.vehicleData.filter(vehicle => 
        vehicle.phone && !phoneMatches.includes(vehicle) &&
        vehicle.phone.replace(/[^0-9]/g, '').includes(cleanQuery)
      );

      dealerMatches.slice(0, limit - suggestions.length).forEach(vehicle => {
        suggestions.push({
          id: `phone-dealer-${vehicle.id}`,
          text: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          entityType: 'offer' as const,
          highlightedText: `${vehicle.make} ${vehicle.model} from ${vehicle.dealerName}`,
          suggestionType: 'phone' as const,
          confidence: 0.8,
          context: `Contact: ${vehicle.phone} • ${vehicle.city}, ${vehicle.state}`
        });
      });
    }

    return suggestions;
  }

  /**
   * Combined search that intelligently routes to appropriate search methods
   */
  smartSearch(query: string, context: UserContext): SmartSuggestion[] {
    console.log('🧠 Smart search called with query:', query);
    
    if (!query.trim()) {
      console.log('❌ Empty query, returning empty results');
      return [];
    }
    
    let allSuggestions: SmartSuggestion[] = [];
    const lowerQuery = query.toLowerCase();
    console.log('🔍 Processing query:', lowerQuery);
    
    // Detect search intent and route accordingly
    if (/^\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/.test(query) || 
        /^[0-9]{3,10}$/.test(query.replace(/[^0-9]/g, ''))) {
      // Phone number pattern detected
      console.log('📞 Phone number pattern detected, using phone search');
      allSuggestions = this.phoneSearch(query, 8);
    } else if (lowerQuery.includes('near') || lowerQuery.includes(' in ') || 
               lowerQuery.includes('around') || lowerQuery.includes('california') ||
               lowerQuery.includes('new york') || lowerQuery.includes('texas') ||
               lowerQuery.includes('florida') || lowerQuery.includes('chicago') ||
               lowerQuery.includes('los angeles') || /\b(dealer|dealers)\b/.test(lowerQuery)) {
      // Location-based search detected
      console.log('🗺️ Location-based search detected, using location search');
      allSuggestions = this.locationSearch(query, 8);
      
      // Also add regular vehicle matches if make/model detected
      const makeDetected = /\b(bmw|toyota|honda|ford|chevrolet|mercedes|audi|volkswagen|nissan|hyundai)\b/.test(lowerQuery);
      if (makeDetected) {
        console.log('🚗 Make detected in location search, adding fuzzy results');
        allSuggestions.push(...this.fuzzySearch(query, 4));
      }
    } else {
      // Regular vehicle search with enhanced year+make logic
      console.log('🔄 Regular vehicle search, using all AI methods');
      allSuggestions.push(...this.fuzzySearch(query, 5));
      console.log('🔍 Fuzzy search completed, found:', allSuggestions.length);
      
      allSuggestions.push(...this.prefixSearch(query, 4));
      console.log('🔤 Prefix search completed, total:', allSuggestions.length);
      
      // Enhanced year+make combination search
      const yearMatch = query.match(/\b(19\d{2}|20[0-3]\d)\b/);
      const makeMatch = lowerQuery.match(/\b(bmw|toyota|honda|ford|chevrolet|mercedes|audi|volkswagen|nissan|hyundai)\b/);
      
      if (yearMatch && makeMatch) {
        // Specific year+make search
        console.log('📅🚗 Year+make combination detected:', yearMatch[0], makeMatch[0]);
        const year = yearMatch[0];
        const make = makeMatch[0];
        const yearMakeResults = this.vehicleData.filter(vehicle => 
          vehicle.year.toString() === year && 
          vehicle.make.toLowerCase().includes(make)
        ).slice(0, 6).map(vehicle => ({
          id: `year-make-${vehicle.id}`,
          text: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          entityType: 'offer' as const,
          highlightedText: this.highlightMatch(`${vehicle.year} ${vehicle.make} ${vehicle.model}`, query),
          suggestionType: 'make_model' as const,
          confidence: 0.95,
          context: `${vehicle.condition} • ${vehicle.city}, ${vehicle.state} • Exact match`
        }));
        console.log('📅🚗 Year+make results found:', yearMakeResults.length);
        allSuggestions.push(...yearMakeResults);
      }
      
      // Continue with other AI methods
      if (query.length >= 3) {
        allSuggestions.push(...this.phoneticSearch(query));
        console.log('🔊 Phonetic search completed, total:', allSuggestions.length);
      }
      allSuggestions.push(...this.levenshteinCorrection(query));
      console.log('📝 Levenshtein correction completed, total:', allSuggestions.length);
      
      allSuggestions.push(...this.nlpSearch(query));
      console.log('🧠 NLP search completed, total:', allSuggestions.length);
    }
    
    // Remove duplicates and sort by confidence
    const uniqueSuggestions = Array.from(
      new Map(allSuggestions.map(s => [s.text, s])).values()
    );
    
    const finalResults = uniqueSuggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
      
    console.log('✅ Smart search completed. Final results:', finalResults.length);
    console.log('📋 Final suggestions:', finalResults);
    
    return finalResults;
  }

  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// Initialize the AI search engine
console.log('🚀 Initializing AI Search Engine...');
const aiSearchEngine = new AISearchEngine();
console.log('✅ AI Search Engine initialized successfully with', aiSearchEngine.vehicleData.length, 'vehicles');

/**
 * Enhanced smart suggestions powered by multiple AI libraries
 * Now with location and phone search capabilities
 */
export function generateAIEnhancedSuggestions(
  query: string,
  userContext: UserContext
): SmartSuggestion[] {
  console.log('🤖 AI Search Engine called with query:', query);
  
  if (!query.trim() || query.length < 1) {
    console.log('❌ Query too short or empty, returning empty results');
    return [];
  }

  try {
    console.log('🔄 Running smart search algorithm...');
    // Use the smart search method which intelligently routes to appropriate search types
    const results = aiSearchEngine.smartSearch(query, userContext);
    console.log('✅ AI Search completed. Results:', results.length, 'suggestions found');
    console.log('📋 Search results:', results);
    return results;
  } catch (error) {
    console.error('❌ AI search error:', error);
    console.log('🔄 Attempting fallback search...');
    
    // Fallback to basic fuzzy search if AI methods fail
    try {
      const fallbackResults = aiSearchEngine.fuzzySearch(query, 5);
      console.log('✅ Fallback search completed:', fallbackResults.length, 'results');
      return fallbackResults;
    } catch (fallbackError) {
      console.error('❌ Fallback search error:', fallbackError);
      return [];
    }
  }
}

/**
 * Detect query intent using NLP
 */
export function detectQueryIntent(query: string): {
  intent: string;
  entities: Record<string, any>;
  confidence: number;
} {
  const doc = nlp(query);
  
  const nouns = doc.nouns().out('array');
  const verbs = doc.verbs().out('array');
  const numbers = doc.numbers().out('array');
  const places = doc.places().out('array');
  
  // Detect years
  const years = numbers.filter(num => {
    const n = parseInt(num);
    return n >= 1990 && n <= new Date().getFullYear() + 2;
  });

  // Detect price mentions
  const priceKeywords = ['price', 'cost', 'dollar', '$', 'cheap', 'expensive', 'budget'];
  const hasPriceIntent = priceKeywords.some(keyword => 
    query.toLowerCase().includes(keyword)
  );

  // Detect VIN patterns
  const vinPattern = /\b[A-HJ-NPR-Z0-9]{17}\b/i;
  const hasVin = vinPattern.test(query);

  // Detect phone number patterns
  const phonePattern = /^\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$|^[0-9]{3,10}$/;
  const hasPhone = phonePattern.test(query.replace(/[^0-9\(\)\-\.\s]/g, ''));

  // Detect location-based queries
  const locationKeywords = ['near', 'in', 'around', 'close', 'nearby', 'location', 'area', 'city', 'state'];
  const dealerKeywords = ['dealer', 'dealership', 'auto center', 'motors', 'cars', 'garage'];
  const hasLocationIntent = locationKeywords.some(keyword => 
    query.toLowerCase().includes(keyword)
  ) || dealerKeywords.some(keyword => 
    query.toLowerCase().includes(keyword)
  ) || places.length > 0;

  let intent = 'search_vehicle';
  let confidence = 0.7;

  if (hasPhone) {
    intent = 'search_by_phone';
    confidence = 0.95;
  } else if (hasVin) {
    intent = 'search_by_vin';
    confidence = 0.9;
  } else if (hasLocationIntent) {
    intent = 'search_by_location';
    confidence = 0.85;
  } else if (hasPriceIntent) {
    intent = 'search_by_price';
    confidence = 0.8;
  } else if (years.length > 0) {
    intent = 'search_by_year';
    confidence = 0.75;
  }

  return {
    intent,
    entities: {
      nouns,
      years: years.map(y => parseInt(y)),
      places,
      hasPrice: hasPriceIntent,
      hasVin,
      hasPhone,
      hasLocation: hasLocationIntent
    },
    confidence
  };
}

/**
 * Smart query expansion using NLP
 */
export function expandQuery(query: string): string[] {
  const doc = nlp(query);
  const expanded: string[] = [query];
  
  // Add synonyms and related terms
  const synonymMap: Record<string, string[]> = {
    'car': ['vehicle', 'auto', 'automobile'],
    'truck': ['pickup', 'lorry'],
    'suv': ['sport utility vehicle', 'crossover'],
    'cheap': ['affordable', 'budget', 'inexpensive'],
    'expensive': ['premium', 'luxury', 'high-end'],
    'new': ['brand new', 'latest', 'current'],
    'used': ['pre-owned', 'second-hand', 'previously owned']
  };

  const words = doc.out('array');
  words.forEach(word => {
    const lowerWord = word.toLowerCase();
    if (synonymMap[lowerWord]) {
      synonymMap[lowerWord].forEach(synonym => {
        const expandedQuery = query.replace(new RegExp(word, 'gi'), synonym);
        if (expandedQuery !== query) {
          expanded.push(expandedQuery);
        }
      });
    }
  });

  return expanded.slice(0, 3); // Limit expansions
}