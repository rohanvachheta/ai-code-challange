/**
 * Smart Suggestions for Automotive Search
 * 
 * Enhanced autocomplete that intelligently detects and suggests based on:
 * - VIN numbers
 * - Car makes/models
 * - Phone numbers
 * - Years
 * - Locations
 * - Price ranges
 */

import { AutocompleteSuggestion, SmartSuggestion, UserContext } from "@/types/search";
import { DUMMY_OFFERS, DUMMY_PURCHASES, DUMMY_TRANSPORTS } from "./dummyData";

// Pattern detection for smart input recognition
const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{8,17}$/i;
const PHONE_PATTERN = /^\+?[\d\s\-\(\)]{10,}$/;
const YEAR_PATTERN = /^\d{4}$/;
const PRICE_PATTERN = /^\$?[\d,]+$/;

/**
 * Fuzzy String Matching Utilities
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

function fuzzyMatch(input: string, target: string, threshold: number = 0.7): { match: boolean; confidence: number } {
  const distance = levenshteinDistance(input.toLowerCase(), target.toLowerCase());
  const maxLength = Math.max(input.length, target.length);
  const similarity = 1 - (distance / maxLength);
  
  return {
    match: similarity >= threshold,
    confidence: similarity
  };
}

function soundexCode(str: string): string {
  const code = str.toLowerCase()
    .replace(/[hwybfpv]/g, (match) => {
      switch (match) {
        case 'h': case 'w': case 'y': return '';
        case 'b': case 'f': case 'p': case 'v': return '1';
        default: return match;
      }
    })
    .replace(/[cgjkqsxz]/g, '2')
    .replace(/[dt]/g, '3')
    .replace(/[l]/g, '4')
    .replace(/[mn]/g, '5')
    .replace(/[r]/g, '6')
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 4)
    .padEnd(4, '0');
    
  return code;
}

// Enhanced automotive database with common variations and typos
const AUTOMOTIVE_DATABASE = {
  makes: [
    'Toyota', 'Honda', 'Ford', 'BMW', 'Mercedes-Benz', 'Chevrolet', 'Nissan', 
    'Audi', 'Hyundai', 'Kia', 'Tesla', 'Lexus', 'Volkswagen', 'Subaru', 
    'Mazda', 'Jeep', 'Ram', 'GMC', 'Cadillac', 'Infiniti', 'Porsche',
    'Ferrari', 'Lamborghini', 'Maserati', 'Bentley', 'Rolls-Royce'
  ],
  // Common typos and phonetic variations
  typoCorrections: new Map([
    ['cmw', 'BMW'], ['bmv', 'BMW'], ['bwm', 'BMW'],
    ['toyata', 'Toyota'], ['toyota', 'Toyota'], ['toyoto', 'Toyota'],
    ['honsa', 'Honda'], ['handa', 'Honda'], ['honds', 'Honda'],
    ['frod', 'Ford'], ['ford', 'Ford'], ['fodr', 'Ford'],
    ['mersedes', 'Mercedes-Benz'], ['mercades', 'Mercedes-Benz'], ['benz', 'Mercedes-Benz'],
    ['chevy', 'Chevrolet'], ['chevrolet', 'Chevrolet'], ['chevralet', 'Chevrolet'],
    ['nisan', 'Nissan'], ['nissan', 'Nissan'], ['nisson', 'Nissan'],
    ['aodi', 'Audi'], ['audy', 'Audi'], ['oudi', 'Audi'],
    ['hyundai', 'Hyundai'], ['hyunday', 'Hyundai'], ['hundai', 'Hyundai'],
    ['tesle', 'Tesla'], ['tesla', 'Tesla'], ['tesls', 'Tesla'],
    ['lexas', 'Lexus'], ['lexis', 'Lexus'], ['lexuss', 'Lexus'],
    ['volkswagen', 'Volkswagen'], ['vw', 'Volkswagen'], ['volkwagen', 'Volkswagen'],
    ['subaru', 'Subaru'], ['suburu', 'Subaru'], ['subaroo', 'Subaru'],
    ['mazda', 'Mazda'], ['masda', 'Mazda'], ['mzda', 'Mazda'],
    ['jeap', 'Jeep'], ['jep', 'Jeep'], ['jeep', 'Jeep'],
    ['porche', 'Porsche'], ['porsh', 'Porsche'], ['porshe', 'Porsche']
  ]),
  models: [
    'Camry', 'Accord', 'F-150', '3 Series', 'C-Class', 'Silverado', 'Altima', 
    'A4', 'Elantra', 'Sorento', 'Model 3', 'Model S', 'Model Y', 'Civic', 
    'Corolla', 'Wrangler', 'Cherokee', 'Explorer', 'Escape', 'Tahoe'
  ],
  aliases: new Map([
    ['benz', 'Mercedes-Benz'],
    ['mercedes', 'Mercedes-Benz'],
    ['bmw', 'BMW'],
    ['chevy', 'Chevrolet'],
    ['ford truck', 'Ford F-150'],
    ['f150', 'Ford F-150'],
    ['vw', 'Volkswagen'],
    ['beemer', 'BMW'],
    ['bimmer', 'BMW']
  ]),
  bodyTypes: ['sedan', 'suv', 'truck', 'coupe', 'hatchback', 'convertible', 'wagon'],
  conditions: ['new', 'used', 'certified', 'pre-owned']
};

export function generateSmartSuggestions(
  query: string,
  userContext: UserContext
): SmartSuggestion[] {
  if (!query.trim()) return [];

  const suggestions: SmartSuggestion[] = [];
  const normalizedQuery = query.toLowerCase().trim();

  // 1. VIN Detection and Matching
  if (VIN_PATTERN.test(query)) {
    const vinMatches = findVinMatches(normalizedQuery);
    suggestions.push(...vinMatches);
  }

  // 2. Smart Make/Model Recognition
  const makeModelSuggestions = generateMakeModelSuggestions(normalizedQuery);
  suggestions.push(...makeModelSuggestions);

  // 3. Phone Number Detection
  if (PHONE_PATTERN.test(query)) {
    const phoneMatches = findPhoneMatches(normalizedQuery);
    suggestions.push(...phoneMatches);
  }

  // 4. Year-based suggestions
  if (YEAR_PATTERN.test(query)) {
    const yearMatches = generateYearSuggestions(parseInt(query));
    suggestions.push(...yearMatches);
  }

  // 5. Location-based suggestions
  const locationMatches = generateLocationSuggestions(normalizedQuery);
  suggestions.push(...locationMatches);

  // 6. Price-based suggestions
  if (PRICE_PATTERN.test(query)) {
    const priceMatches = generatePriceSuggestions(normalizedQuery);
    suggestions.push(...priceMatches);
  }

  // 7. Fallback text matching for any remaining content
  if (suggestions.length < 3) {
    const textMatches = generateTextMatches(normalizedQuery);
    suggestions.push(...textMatches);
  }

  // Sort by confidence and relevance, remove duplicates
  return suggestions
    .filter((suggestion, index, self) => 
      index === self.findIndex(s => s.id === suggestion.id)
    )
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 8);
}

function findVinMatches(query: string): SmartSuggestion[] {
  return DUMMY_OFFERS
    .filter(offer => offer.vin.toLowerCase().includes(query))
    .slice(0, 3)
    .map(offer => ({
      id: `vin-${offer.id}`,
      text: `${offer.vin} - ${offer.year} ${offer.make} ${offer.model}`,
      entityType: "offer" as const,
      highlightedText: highlightMatch(`${offer.vin} - ${offer.year} ${offer.make} ${offer.model}`, query),
      suggestionType: 'vin' as const,
      confidence: 0.95,
      context: `${offer.condition} • ${offer.location}`
    }));
}

function generateMakeModelSuggestions(query: string): SmartSuggestion[] {
  const suggestions: SmartSuggestion[] = [];
  const seenOffers = new Set<string>();
  
  // 1. Check typo corrections first (highest confidence)
  const typoCorrection = AUTOMOTIVE_DATABASE.typoCorrections.get(query.toLowerCase());
  if (typoCorrection) {
    const makeMatches = DUMMY_OFFERS
      .filter(offer => offer.make.toLowerCase() === typoCorrection.toLowerCase())
      .slice(0, 3);
    
    makeMatches.forEach(offer => {
      if (!seenOffers.has(offer.id)) {
        seenOffers.add(offer.id);
        suggestions.push({
          id: `typo-${offer.id}`,
          text: `${offer.year} ${offer.make} ${offer.model}`,
          entityType: "offer",
          highlightedText: highlightMatch(`${offer.make} ${offer.model}`, typoCorrection),
          suggestionType: 'make_model',
          confidence: 0.95,
          context: `${offer.condition} • ${offer.location} • Did you mean "${typoCorrection}"?`
        });
      }
    });
  }

  // 2. Check aliases
  const aliasMatch = AUTOMOTIVE_DATABASE.aliases.get(query.toLowerCase());
  if (aliasMatch) {
    const makeMatches = DUMMY_OFFERS
      .filter(offer => offer.make.toLowerCase() === aliasMatch.toLowerCase())
      .slice(0, 2);
    
    makeMatches.forEach(offer => {
      if (!seenOffers.has(offer.id)) {
        seenOffers.add(offer.id);
        suggestions.push({
          id: `alias-${offer.id}`,
          text: `${offer.year} ${offer.make} ${offer.model}`,
          entityType: "offer",
          highlightedText: highlightMatch(`${offer.make} ${offer.model}`, query),
          suggestionType: 'make_model',
          confidence: 0.9,
          context: `${offer.condition} • ${offer.location}`
        });
      }
    });
  }

  // 3. Exact and partial matches
  AUTOMOTIVE_DATABASE.makes.forEach(make => {
    if (make.toLowerCase().includes(query.toLowerCase()) || query.toLowerCase().includes(make.toLowerCase())) {
      const matchingOffers = DUMMY_OFFERS
        .filter(offer => offer.make.toLowerCase() === make.toLowerCase())
        .slice(0, 2);

      matchingOffers.forEach(offer => {
        if (!seenOffers.has(offer.id)) {
          seenOffers.add(offer.id);
          suggestions.push({
            id: `make-${offer.id}`,
            text: `${offer.year} ${offer.make} ${offer.model}`,
            entityType: "offer",
            highlightedText: highlightMatch(`${offer.make} ${offer.model}`, query),
            suggestionType: 'make_model',
            confidence: 0.85,
            context: `${offer.condition} • ${offer.location}`
          });
        }
      });
    }
  });

  // 4. Fuzzy matching for makes (only if we don't have enough suggestions)
  if (suggestions.length < 3 && query.length >= 2) {
    AUTOMOTIVE_DATABASE.makes.forEach(make => {
      const fuzzyResult = fuzzyMatch(query, make, 0.6);
      if (fuzzyResult.match) {
        const matchingOffers = DUMMY_OFFERS
          .filter(offer => offer.make.toLowerCase() === make.toLowerCase())
          .slice(0, 1);

        matchingOffers.forEach(offer => {
          if (!seenOffers.has(offer.id)) {
            seenOffers.add(offer.id);
            suggestions.push({
              id: `fuzzy-${offer.id}`,
              text: `${offer.year} ${offer.make} ${offer.model}`,
              entityType: "offer",
              highlightedText: highlightMatch(`${offer.make} ${offer.model}`, make),
              suggestionType: 'make_model',
              confidence: fuzzyResult.confidence * 0.8,
              context: `${offer.condition} • ${offer.location} • Did you mean "${make}"?`
            });
          }
        });
      }
    });
  }

  // 5. Model matches
  AUTOMOTIVE_DATABASE.models.forEach(model => {
    if (model.toLowerCase().includes(query.toLowerCase())) {
      const matchingOffers = DUMMY_OFFERS
        .filter(offer => offer.model.toLowerCase() === model.toLowerCase())
        .slice(0, 1);

      matchingOffers.forEach(offer => {
        if (!seenOffers.has(offer.id)) {
          seenOffers.add(offer.id);
          suggestions.push({
            id: `model-${offer.id}`,
            text: `${offer.year} ${offer.make} ${offer.model}`,
            entityType: "offer",
            highlightedText: highlightMatch(`${offer.make} ${offer.model}`, query),
            suggestionType: 'make_model',
            confidence: 0.8,
            context: `${offer.condition} • ${offer.location}`
          });
        }
      });
    }
  });

  return suggestions;
}

function findPhoneMatches(query: string): SmartSuggestion[] {
  // Simulate phone number matching in purchases/transports
  const cleanQuery = query.replace(/\D/g, '');
  
  return DUMMY_PURCHASES
    .filter(purchase => purchase.buyerEmail.includes(cleanQuery.slice(-4)))
    .slice(0, 2)
    .map(purchase => ({
      id: `phone-${purchase.id}`,
      text: `${purchase.buyerName} - ${purchase.offerMake} ${purchase.offerModel}`,
      entityType: "purchase" as const,
      highlightedText: highlightMatch(purchase.buyerName, query),
      suggestionType: 'phone' as const,
      confidence: 0.75,
      context: `Purchase ${purchase.purchaseDate}`
    }));
}

function generateYearSuggestions(year: number): SmartSuggestion[] {
  if (year < 1990 || year > new Date().getFullYear() + 2) return [];

  return DUMMY_OFFERS
    .filter(offer => offer.year === year)
    .slice(0, 4)
    .map(offer => ({
      id: `year-${offer.id}`,
      text: `${offer.year} ${offer.make} ${offer.model}`,
      entityType: "offer" as const,
      highlightedText: highlightMatch(`${offer.year} ${offer.make} ${offer.model}`, year.toString()),
      suggestionType: 'year' as const,
      confidence: 0.8,
      context: `${offer.condition} • ${offer.condition}`
    }));
}

function generateLocationSuggestions(query: string): SmartSuggestion[] {
  return DUMMY_OFFERS
    .filter(offer => offer.location.toLowerCase().includes(query))
    .slice(0, 3)
    .map(offer => ({
      id: `location-${offer.id}`,
      text: `${offer.year} ${offer.make} ${offer.model} in ${offer.location}`,
      entityType: "offer" as const,
      highlightedText: highlightMatch(`${offer.make} ${offer.model} in ${offer.location}`, query),
      suggestionType: 'location' as const,
      confidence: 0.7,
      context: `${offer.condition}`
    }));
}

function generatePriceSuggestions(query: string): SmartSuggestion[] {
  const priceValue = parseInt(query.replace(/\D/g, ''));
  if (isNaN(priceValue)) return [];

  const priceRange = priceValue * 0.1; // 10% tolerance
  
  return DUMMY_OFFERS
    .filter(offer => 
      Math.abs(offer.price - priceValue) <= priceRange
    )
    .slice(0, 3)
    .map(offer => ({
      id: `price-${offer.id}`,
      text: `${offer.year} ${offer.make} ${offer.model}`,
      entityType: "offer" as const,
      highlightedText: highlightMatch(`${offer.make} ${offer.model}`, query),
      suggestionType: 'price' as const,
      confidence: 0.75,
      context: `${offer.condition} • ${offer.location}`
    }));
}

function generateTextMatches(query: string): SmartSuggestion[] {
  const suggestions: SmartSuggestion[] = [];
  
  // Search in all text fields
  DUMMY_OFFERS.forEach(offer => {
    const searchableText = `${offer.make} ${offer.model} ${offer.condition} ${offer.location}`.toLowerCase();
    if (searchableText.includes(query)) {
      suggestions.push({
        id: `text-${offer.id}`,
        text: `${offer.year} ${offer.make} ${offer.model}`,
        entityType: "offer",
        highlightedText: highlightMatch(`${offer.make} ${offer.model}`, query),
        suggestionType: 'make_model',
        confidence: 0.6,
        context: `${offer.condition} • ${offer.condition}`
      });
    }
  });

  return suggestions.slice(0, 3);
}

function highlightMatch(text: string, query: string): string {
  if (!query.trim()) return text;
  
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function detectInputType(query: string): string {
  if (!query.trim()) return '';
  
  const normalizedQuery = query.toLowerCase().trim();
  
  if (VIN_PATTERN.test(query)) return 'vin';
  if (PHONE_PATTERN.test(query)) return 'phone';
  if (YEAR_PATTERN.test(query)) return 'year';
  if (PRICE_PATTERN.test(query)) return 'price';
  
  // Check for typo corrections
  if (AUTOMOTIVE_DATABASE.typoCorrections.has(normalizedQuery)) {
    return 'typo_correction';
  }
  
  // Check for partial make matches
  for (const make of AUTOMOTIVE_DATABASE.makes) {
    if (make.toLowerCase().startsWith(normalizedQuery) && query.length >= 2) {
      return 'partial_make';
    }
  }
  
  // Check for aliases
  if (AUTOMOTIVE_DATABASE.aliases.has(normalizedQuery)) {
    return 'alias';
  }
  
  // Check for fuzzy matches
  if (query.length >= 3) {
    for (const make of AUTOMOTIVE_DATABASE.makes) {
      const fuzzyResult = fuzzyMatch(query, make, 0.7);
      if (fuzzyResult.match) {
        return 'fuzzy_match';
      }
    }
  }
  
  return 'text';
}

/**
 * AI-Enhanced Search Integration
 * 
 * For production, you can integrate with external APIs like:
 * - Google Places API (for location autocomplete)
 * - Bing Spell Check API (for typo correction)
 * - OpenAI GPT API (for natural language understanding)
 * - CarQuery API (for automotive data)
 * 
 * Example integration patterns:
 */
export interface ExternalAPIConfig {
  googlePlacesApiKey?: string;
  bingSpellCheckApiKey?: string;
  openaiApiKey?: string;
  carqueryApiUrl?: string;
}

// Example function for future API integration
export async function enhanceWithExternalAPI(
  query: string,
  config: ExternalAPIConfig
): Promise<SmartSuggestion[]> {
  const suggestions: SmartSuggestion[] = [];
  
  // Example: Bing Spell Check API integration
  if (config.bingSpellCheckApiKey && query.length >= 3) {
    try {
      // This would be the actual API call in production:
      // const spellCheckResponse = await fetch(`https://api.bing.microsoft.com/v7.0/spellcheck`, {
      //   method: 'POST',
      //   headers: {
      //     'Ocp-Apim-Subscription-Key': config.bingSpellCheckApiKey,
      //     'Content-Type': 'application/x-www-form-urlencoded'
      //   },
      //   body: `text=${encodeURIComponent(query)}&mode=spell`
      // });
      
      // For now, we'll use our local fuzzy matching
      console.log('Would integrate with Bing Spell Check API for:', query);
    } catch (error) {
      console.warn('External API integration failed:', error);
    }
  }
  
  // Example: CarQuery API integration for automotive data
  if (config.carqueryApiUrl) {
    try {
      // This would fetch real automotive data:
      // const carData = await fetch(`${config.carqueryApiUrl}/makes`);
      console.log('Would integrate with CarQuery API for automotive data');
    } catch (error) {
      console.warn('CarQuery API integration failed:', error);
    }
  }
  
  return suggestions;
}

/**
 * Open APIs you can integrate with:
 * 
 * 1. **CarQuery API** (Free)
 *    - URL: https://carqueryapi.com/
 *    - Features: Vehicle makes, models, years, engine specs
 *    - Usage: Real automotive data instead of dummy data
 * 
 * 2. **NHTSA Vehicle API** (Free, US Government)
 *    - URL: https://vpic.nhtsa.dot.gov/api/
 *    - Features: Vehicle identification, recalls, safety ratings
 * 
 * 3. **Bing Spell Check API** (Microsoft)
 *    - URL: https://docs.microsoft.com/en-us/azure/cognitive-services/bing-spell-check/
 *    - Features: Advanced typo correction and suggestions
 * 
 * 4. **Google Places API**
 *    - URL: https://developers.google.com/maps/documentation/places/web-service/overview
 *    - Features: Location autocomplete for addresses
 * 
 * 5. **OpenAI GPT API**
 *    - URL: https://openai.com/api/
 *    - Features: Natural language understanding for complex queries
 */