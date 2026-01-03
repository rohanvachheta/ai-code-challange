import { useState, useEffect, useRef, useCallback, KeyboardEvent } from 'react';
import { Search, Loader2, Car, ShoppingCart, Truck, Phone, Calendar, MapPin, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AIStatus } from '@/components/AIStatus';
import { EntityType, UserContext } from '@/types/search';
import { SmartSuggestion, generateSmartSuggestions, detectInputType } from '@/lib/smartSuggestions';
import { generateAIEnhancedSuggestions, detectQueryIntent } from '@/lib/aiSearchEngine';

interface SmartSearchBarProps {
  userContext: UserContext;
  onSearch: (query: string) => void;
  isSearching: boolean;
}

const DEBOUNCE_DELAY = 250; // Reduced for faster response

const SUGGESTION_TYPE_ICONS = {
  vin: <Car className="w-4 h-4" />,
  make_model: <Car className="w-4 h-4" />,
  phone: <Phone className="w-4 h-4" />,
  name: <Phone className="w-4 h-4" />,
  location: <MapPin className="w-4 h-4" />,
  price: <DollarSign className="w-4 h-4" />,
  year: <Calendar className="w-4 h-4" />
};

const SUGGESTION_TYPE_LABELS = {
  vin: 'VIN',
  make_model: 'Vehicle',
  phone: 'Contact',
  name: 'Contact',
  location: 'Location',
  price: 'Price',
  year: 'Year'
};

/**
 * SmartSearchBar Component
 *
 * Enhanced search input with smart autocomplete functionality.
 * Features intelligent detection of VINs, car makes/models, phone numbers, etc.
 * Supports keyboard navigation and highlights matched query parts.
 */
export function SmartSearchBar({
  userContext,
  onSearch,
  isSearching,
}: SmartSearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [detectedInputType, setDetectedInputType] = useState<string>('');

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Detect input type for smart placeholder
  useEffect(() => {
    const type = detectInputType(query);
    setDetectedInputType(type);
  }, [query]);

  // Fetch smart suggestions with AI enhancement
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    console.log('🔍 SmartSearchBar: fetchSuggestions called with:', searchQuery);
    
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      console.log('🤖 Calling AI-enhanced suggestions...');
      // Get query intent for better UX feedback
      const queryIntent = detectQueryIntent(searchQuery);
      console.log('🎯 Query intent detected:', queryIntent);
      
      // Use AI-enhanced suggestions for better accuracy
      const aiSuggestions = generateAIEnhancedSuggestions(searchQuery, userContext);
      console.log('🤖 AI suggestions received:', aiSuggestions);
      
      // Fallback to original smart suggestions if AI returns few results
      let finalSuggestions = aiSuggestions;
      if (aiSuggestions.length < 3) {
        console.log('⚠️ AI returned few results, adding fallback suggestions...');
        const fallbackSuggestions = generateSmartSuggestions(searchQuery, userContext);
        console.log('🔄 Fallback suggestions:', fallbackSuggestions);
        finalSuggestions = [...aiSuggestions, ...fallbackSuggestions]
          .filter((suggestion, index, self) => 
            index === self.findIndex(s => s.text === suggestion.text)
          )
          .slice(0, 8);
      }
      
      console.log('✅ Final suggestions to display:', finalSuggestions);
      setSuggestions(finalSuggestions);
      setShowDropdown(finalSuggestions.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('❌ AI-enhanced search error:', error);
      // Fallback to original suggestions on error
      const fallbackSuggestions = generateSmartSuggestions(searchQuery, userContext);
      console.log('🔄 Error fallback suggestions:', fallbackSuggestions);
      setSuggestions(fallbackSuggestions);
      setShowDropdown(fallbackSuggestions.length > 0);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [userContext]);

  // Debounced input handler
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, fetchSuggestions]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Enhanced keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSearch = () => {
    if (query.trim()) {
      setShowDropdown(false);
      onSearch(query.trim());
    }
  };

  const handleSuggestionSelect = (suggestion: SmartSuggestion) => {
    setQuery(suggestion.text);
    setShowDropdown(false);
    onSearch(suggestion.text);
  };

  const getSmartPlaceholder = () => {
    if (!query) {
      return 'AI Search: VIN, make/model, phone, location, "BMW near me"...';
    }
    
    switch (detectedInputType) {
      case 'vin':
        return 'Continue typing VIN...';
      case 'phone':
        return 'Phone number detected - searching dealers...';
      case 'location_query':
        return 'Location search active - finding nearby dealers...';
      case 'proximity_search':
        return 'Proximity search - finding cars near you...';
      case 'year':
        return 'Year detected - try adding make/model';
      case 'price':
        return 'Price detected - searching similar prices';
      case 'partial_make':
        return 'Continue typing car make...';
      case 'alias':
        return 'Car brand detected - continue typing...';
      case 'typo_correction':
        return 'AI typo correction active...';
      case 'fuzzy_match':
        return 'AI finding similar matches...';
      default:
        return '🤖 AI-powered: VIN, make, model, phone, location, natural language...';
    }
  };

  return (
    <div className="relative w-full">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          
          {/* Input Type Indicator */}
          {detectedInputType && detectedInputType !== 'text' && (
            <div className="absolute right-12 top-1/2 -translate-y-1/2">
              <Badge variant="secondary" className="text-xs">
                {detectedInputType.replace('_', ' ')}
              </Badge>
            </div>
          )}
          
          <Input
            ref={inputRef}
            type="text"
            placeholder={getSmartPlaceholder()}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            className="pl-12 pr-20 h-14 text-lg bg-background border-2 border-border focus:border-primary transition-colors"
            disabled={isSearching}
          />
          {isLoadingSuggestions && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
          )}
        </div>
        
        <Button
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          className="h-14 px-8 text-lg font-semibold"
        >
          {isSearching ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-5 h-5 mr-2" />
              Search
            </>
          )}
        </Button>
      </div>

      {/* Enhanced Smart Autocomplete Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-lg z-50 overflow-hidden max-h-96 overflow-y-auto"
        >
          <div className="p-2">
            <AIStatus query={query} suggestionsCount={suggestions.length} />
            
            <div className="text-xs text-muted-foreground mb-2 px-2">
              Smart suggestions ({suggestions.length})
            </div>
            
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => handleSuggestionSelect(suggestion)}
                className={`
                  w-full flex items-center gap-3 px-3 py-3 text-left transition-colors rounded-lg
                  ${index === selectedIndex
                    ? 'bg-accent/10 text-accent-foreground'
                    : 'hover:bg-muted/50'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-md bg-muted">
                    {SUGGESTION_TYPE_ICONS[suggestion.suggestionType]}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {SUGGESTION_TYPE_LABELS[suggestion.suggestionType]}
                  </Badge>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p 
                    className="text-sm font-medium truncate"
                    dangerouslySetInnerHTML={{ __html: suggestion.highlightedText }}
                  />
                  {suggestion.context && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {suggestion.context}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  <div className="flex">
                    {Array.from({ length: Math.ceil(suggestion.confidence * 5) }, (_, i) => (
                      <div key={i} className="w-1 h-1 rounded-full bg-primary mr-0.5" />
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}