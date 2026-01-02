/**
 * External API Integration Examples
 * 
 * This file demonstrates how to integrate with various automotive and AI APIs
 * to enhance the search experience with real-time data.
 */

// Types for external API responses
export interface CarQueryMake {
  make_id: string;
  make_display: string;
  make_is_common: string;
  make_country: string;
}

export interface CarQueryModel {
  model_make_id: string;
  model_name: string;
  model_trim: string;
  model_year: string;
  model_body: string;
  model_engine_position: string;
  model_engine_cc: string;
  model_engine_cyl: string;
  model_engine_type: string;
  model_engine_valves_per_cyl: string;
  model_engine_power_ps: string;
  model_engine_power_rpm: string;
  model_engine_torque_nm: string;
  model_engine_torque_rpm: string;
  model_engine_bore_mm: string;
  model_engine_stroke_mm: string;
  model_engine_compression: string;
  model_engine_fuel: string;
  model_top_speed_kmh: string;
  model_0_to_100_kmh: string;
  model_drive: string;
  model_transmission_type: string;
  model_seats: string;
  model_doors: string;
  model_weight_kg: string;
  model_length_mm: string;
  model_width_mm: string;
  model_height_mm: string;
  model_wheelbase_mm: string;
  model_lkm_hwy: string;
  model_lkm_mixed: string;
  model_lkm_city: string;
  model_fuel_cap_l: string;
  model_sold_in_us: string;
  model_co2: string;
  model_make_display: string;
}

export interface BingSpellCheckResponse {
  _type: string;
  flaggedTokens: Array<{
    offset: number;
    token: string;
    type: string;
    suggestions: Array<{
      suggestion: string;
      score: number;
    }>;
  }>;
}

/**
 * CarQuery API Integration
 * Free automotive database with comprehensive vehicle information
 */
export class CarQueryAPI {
  private baseUrl = 'https://carqueryapi.com/api/0.3/';

  async getMakes(year?: number): Promise<CarQueryMake[]> {
    try {
      const url = year 
        ? `${this.baseUrl}?callback=?&cmd=getMakes&year=${year}`
        : `${this.baseUrl}?callback=?&cmd=getMakes`;
      
      const response = await fetch(url);
      const data = await response.json();
      return data.Makes || [];
    } catch (error) {
      console.error('CarQuery getMakes error:', error);
      return [];
    }
  }

  async getModels(makeId: string, year?: number): Promise<CarQueryModel[]> {
    try {
      const url = year
        ? `${this.baseUrl}?callback=?&cmd=getModels&make=${makeId}&year=${year}`
        : `${this.baseUrl}?callback=?&cmd=getModels&make=${makeId}`;
      
      const response = await fetch(url);
      const data = await response.json();
      return data.Models || [];
    } catch (error) {
      console.error('CarQuery getModels error:', error);
      return [];
    }
  }

  async searchVehicles(query: {
    make?: string;
    model?: string;
    year?: number;
    body?: string;
  }): Promise<CarQueryModel[]> {
    try {
      const params = new URLSearchParams({
        callback: '?',
        cmd: 'getModels',
        ...query
      });
      
      const response = await fetch(`${this.baseUrl}?${params}`);
      const data = await response.json();
      return data.Models || [];
    } catch (error) {
      console.error('CarQuery search error:', error);
      return [];
    }
  }
}

/**
 * NHTSA Vehicle API Integration
 * US Government vehicle database with safety and recall information
 */
export class NHTSAVehicleAPI {
  private baseUrl = 'https://vpic.nhtsa.dot.gov/api/vehicles';

  async getMakes(): Promise<Array<{ Make_ID: number; Make_Name: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/getallmakes?format=json`);
      const data = await response.json();
      return data.Results || [];
    } catch (error) {
      console.error('NHTSA getMakes error:', error);
      return [];
    }
  }

  async getModelsForMake(makeId: number): Promise<Array<{ Model_ID: number; Model_Name: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/getmodelsformake/${makeId}?format=json`);
      const data = await response.json();
      return data.Results || [];
    } catch (error) {
      console.error('NHTSA getModels error:', error);
      return [];
    }
  }

  async decodeVin(vin: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/DecodeVin/${vin}?format=json`);
      const data = await response.json();
      return data.Results || [];
    } catch (error) {
      console.error('NHTSA VIN decode error:', error);
      return [];
    }
  }
}

/**
 * Microsoft Bing Spell Check API Integration
 * Advanced typo correction and suggestions
 */
export class BingSpellCheckAPI {
  constructor(private apiKey: string) {}

  async checkSpelling(text: string): Promise<BingSpellCheckResponse | null> {
    try {
      const response = await fetch('https://api.bing.microsoft.com/v7.0/spellcheck', {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `text=${encodeURIComponent(text)}&mode=spell`,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Bing Spell Check error:', error);
      return null;
    }
  }

  async getSuggestions(text: string): Promise<string[]> {
    const result = await this.checkSpelling(text);
    
    if (!result || !result.flaggedTokens) {
      return [];
    }

    return result.flaggedTokens
      .map(token => token.suggestions[0]?.suggestion)
      .filter(Boolean);
  }
}

/**
 * OpenAI GPT Integration for Natural Language Processing
 */
export class OpenAISearchAPI {
  constructor(private apiKey: string) {}

  async interpretSearchQuery(query: string): Promise<{
    intent: string;
    entities: Record<string, any>;
    suggestions: string[];
  }> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are an automotive search assistant. Analyze the user's query and extract:
              1. Intent (search_vehicle, compare_vehicles, find_dealer, etc.)
              2. Entities (make, model, year, price_range, location, etc.)
              3. Suggestions for similar or corrected terms
              
              Return a JSON object with this structure:
              {
                "intent": "search_vehicle",
                "entities": {
                  "make": "BMW",
                  "model": "3 Series", 
                  "year": 2023,
                  "price_range": "30000-50000"
                },
                "suggestions": ["BMW 3 Series", "BMW 5 Series", "Audi A4"]
              }`
            },
            {
              role: 'user',
              content: query
            }
          ],
          max_tokens: 200,
          temperature: 0.3
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      try {
        return JSON.parse(content);
      } catch {
        return {
          intent: 'search_vehicle',
          entities: {},
          suggestions: []
        };
      }
    } catch (error) {
      console.error('OpenAI API error:', error);
      return {
        intent: 'search_vehicle',
        entities: {},
        suggestions: []
      };
    }
  }
}

/**
 * Enhanced Smart Suggestions with External API Integration
 */
export class EnhancedSmartSuggestions {
  private carQueryAPI = new CarQueryAPI();
  private nhtsaAPI = new NHTSAVehicleAPI();
  private bingSpellCheck?: BingSpellCheckAPI;
  private openAI?: OpenAISearchAPI;

  constructor(config?: {
    bingApiKey?: string;
    openaiApiKey?: string;
  }) {
    if (config?.bingApiKey) {
      this.bingSpellCheck = new BingSpellCheckAPI(config.bingApiKey);
    }
    if (config?.openaiApiKey) {
      this.openAI = new OpenAISearchAPI(config.openaiApiKey);
    }
  }

  async generateEnhancedSuggestions(query: string): Promise<any[]> {
    const suggestions = [];

    // 1. Use Bing Spell Check for typo correction
    if (this.bingSpellCheck) {
      const spellSuggestions = await this.bingSpellCheck.getSuggestions(query);
      suggestions.push(...spellSuggestions.map(suggestion => ({
        text: suggestion,
        type: 'spell_correction',
        confidence: 0.9,
        source: 'bing'
      })));
    }

    // 2. Use CarQuery for real automotive data
    const makes = await this.carQueryAPI.getMakes();
    const matchingMakes = makes.filter(make => 
      make.make_display.toLowerCase().includes(query.toLowerCase())
    );
    
    suggestions.push(...matchingMakes.map(make => ({
      text: make.make_display,
      type: 'automotive_make',
      confidence: 0.85,
      source: 'carquery'
    })));

    // 3. Use OpenAI for natural language understanding
    if (this.openAI) {
      const aiResult = await this.openAI.interpretSearchQuery(query);
      suggestions.push(...aiResult.suggestions.map(suggestion => ({
        text: suggestion,
        type: 'ai_suggestion',
        confidence: 0.8,
        source: 'openai',
        entities: aiResult.entities
      })));
    }

    return suggestions.slice(0, 8);
  }
}

// Example usage:
/*
const enhancedSearch = new EnhancedSmartSuggestions({
  bingApiKey: 'your-bing-api-key',
  openaiApiKey: 'your-openai-api-key'
});

// When user types "cmw"
const suggestions = await enhancedSearch.generateEnhancedSuggestions('cmw');
// Returns: [
//   { text: 'BMW', type: 'spell_correction', confidence: 0.9, source: 'bing' },
//   { text: 'BMW 3 Series', type: 'ai_suggestion', confidence: 0.8, source: 'openai' }
// ]
*/