/**
 * Backend Autocomplete API Service
 * 
 * Integrates with the enhanced backend autocomplete API for AI-based search suggestions
 */
import { UserContext } from '@/types/search';

// Backend autocomplete API response
export interface BackendAutocompleteResponse {
  suggestions: string[];
}

// Enhanced suggestion with AI metadata
export interface AISearchSuggestion {
  id: string;
  text: string;
  type: 'make' | 'model' | 'vin' | 'location' | 'fuzzy';
  confidence: number;
  highlightedText: string;
  count?: number;
  context?: string;
}

const SEARCH_API_URL = import.meta.env.VITE_SEARCH_API_URL || "http://localhost:3004";

/**
 * Fetch AI-powered autocomplete suggestions from backend
 */
export async function fetchBackendAutocomplete(
  query: string,
  userContext: UserContext,
  limit: number = 10
): Promise<AISearchSuggestion[]> {
  try {
    if (!query.trim()) return [];

    const url = `${SEARCH_API_URL}/search/autocomplete?searchText=${encodeURIComponent(query)}&limit=${limit}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend autocomplete failed: ${response.status}`);
    }

    const data: BackendAutocompleteResponse = await response.json();
    
    // Transform backend suggestions into AI suggestions with metadata
    return data.suggestions.map((suggestion, index) => {
      const suggestionLower = suggestion.toLowerCase();
      const queryLower = query.toLowerCase();
      
      // Detect suggestion type based on content
      let type: AISearchSuggestion['type'] = 'fuzzy';
      let confidence = 0.5;
      
      // VIN detection (alphanumeric, 17 characters, or contains typical VIN patterns)
      if (/^[A-HJ-NPR-Z0-9]{17}$/.test(suggestion) || /^[A-HJ-NPR-Z0-9]{8,17}$/.test(suggestion)) {
        type = 'vin';
        confidence = 0.95;
      }
      // Location detection (contains common location words)
      else if (/\b(city|state|street|ave|avenue|road|rd|blvd|boulevard|drive|dr|lane|ln|way|place|pl|court|ct|circle|cir)\b/i.test(suggestion) || suggestion.includes(',')) {
        type = 'location';
        confidence = 0.8;
      }
      // Make detection (common car manufacturers)
      else if (/\b(toyota|honda|ford|chevrolet|nissan|bmw|mercedes|audi|volkswagen|hyundai|kia|mazda|subaru|lexus|acura|infiniti|cadillac|buick|gmc|jeep|ram|dodge|chrysler|lincoln|volvo|jaguar|land rover|porsche|ferrari|lamborghini|maserati|bentley|rolls royce|tesla|lucid|rivian|maruti)\b/i.test(suggestion)) {
        type = 'make';
        confidence = 0.9;
      }
      // Model detection (if not a make, and not a location/vin)
      else if (type === 'fuzzy') {
        type = 'model';
        confidence = 0.7;
      }

      // Calculate match confidence based on query similarity
      if (suggestionLower === queryLower) {
        confidence = Math.min(confidence + 0.3, 1.0);
      } else if (suggestionLower.startsWith(queryLower)) {
        confidence = Math.min(confidence + 0.2, 1.0);
      } else if (suggestionLower.includes(queryLower)) {
        confidence = Math.min(confidence + 0.1, 1.0);
      }

      // Generate highlighted text
      const highlightedText = highlightMatch(suggestion, query);
      
      // Generate context based on type
      let context = '';
      switch (type) {
        case 'vin':
          context = 'Vehicle identification number';
          break;
        case 'make':
          context = `Search ${suggestion} vehicles`;
          break;
        case 'model':
          context = `Find ${suggestion} models`;
          break;
        case 'location':
          context = `Search in ${suggestion}`;
          break;
        case 'fuzzy':
          context = 'Similar match found';
          break;
      }

      return {
        id: `backend_${type}_${index}`,
        text: suggestion,
        type,
        confidence,
        highlightedText,
        context
      };
    })
    .sort((a, b) => b.confidence - a.confidence); // Sort by confidence

  } catch (error) {
    console.error('Backend autocomplete error:', error);
    return [];
  }
}

/**
 * Highlight matching parts of the suggestion
 */
function highlightMatch(text: string, query: string): string {
  if (!query.trim()) return text;
  
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  
  // Find the position of the match
  const matchIndex = textLower.indexOf(queryLower);
  
  if (matchIndex === -1) {
    // No direct match, try fuzzy highlighting
    return text; // Could implement more sophisticated highlighting here
  }
  
  // Highlight the exact match
  const before = text.slice(0, matchIndex);
  const match = text.slice(matchIndex, matchIndex + query.length);
  const after = text.slice(matchIndex + query.length);
  
  return `${before}<strong class="text-primary">${match}</strong>${after}`;
}

/**
 * Test backend autocomplete connectivity
 */
export async function testBackendAutocomplete(): Promise<boolean> {
  try {
    const response = await fetch(`${SEARCH_API_URL}/search/autocomplete?searchText=test&limit=1`);
    return response.ok;
  } catch {
    return false;
  }
}