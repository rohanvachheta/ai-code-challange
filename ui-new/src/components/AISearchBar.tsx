import { useState, useEffect, useRef, useCallback, KeyboardEvent } from 'react';
import { Search, Loader2, Car, MapPin, Zap, Settings, ToggleLeft, ToggleRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { UserContext } from '@/types/search';
import { fetchBackendAutocomplete, AISearchSuggestion, testBackendAutocomplete } from '@/lib/backendAutocomplete';
import { SmartSuggestion, generateSmartSuggestions } from '@/lib/smartSuggestions';

interface AISearchBarProps {
  userContext: UserContext;
  onSearch: (query: string) => void;
  isSearching: boolean;
  className?: string;
}

const DEBOUNCE_DELAY = 200;

const SUGGESTION_TYPE_ICONS = {
  vin: <Car className="w-4 h-4" />,
  make: <Car className="w-4 h-4" />,
  model: <Car className="w-4 h-4" />,
  location: <MapPin className="w-4 h-4" />,
  fuzzy: <Zap className="w-4 h-4" />
};

const SUGGESTION_TYPE_LABELS = {
  vin: 'VIN',
  make: 'Make',
  model: 'Model', 
  location: 'Location',
  fuzzy: 'Smart Match'
};

/**
 * Enhanced AI Search Bar with Backend Integration
 * 
 * Features:
 * - Feature flag to switch between local AI and backend API
 * - Enhanced fuzzy search with Elasticsearch
 * - Real-time connectivity testing
 * - Fallback to local suggestions
 */
export function AISearchBar({
  userContext,
  onSearch,
  isSearching,
  className = ""
}: AISearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<(AISearchSuggestion | SmartSuggestion)[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  // Feature flags
  const [useBackendAPI, setUseBackendAPI] = useState(true);
  const [backendConnected, setBackendConnected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Test backend connectivity on component mount
  useEffect(() => {
    const checkBackendConnection = async () => {
      const isConnected = await testBackendAutocomplete();
      setBackendConnected(isConnected);
      if (!isConnected && useBackendAPI) {
        console.warn('Backend autocomplete not available, falling back to local suggestions');
      }
    };
    
    checkBackendConnection();
    
    // Check periodically
    const interval = setInterval(checkBackendConnection, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [useBackendAPI]);

  // Fetch suggestions based on feature flag
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    // Handle global search
    if (searchQuery.trim() === '*') {
      const globalSuggestion: AISearchSuggestion = {
        id: 'global-search',
        text: '*',
        type: 'fuzzy',
        confidence: 1.0,
        highlightedText: '<strong>*</strong> - Show all records',
        context: `Retrieve all ${userContext.userType} accessible records`
      };
      setSuggestions([globalSuggestion]);
      setShowDropdown(true);
      return;
    }

    setIsLoadingSuggestions(true);
    
    try {
      let aiSuggestions: (AISearchSuggestion | SmartSuggestion)[] = [];

      // Try backend API first if enabled and connected
      if (useBackendAPI && backendConnected) {
        try {
          console.log('🤖 Fetching backend AI suggestions...');
          aiSuggestions = await fetchBackendAutocomplete(searchQuery, userContext, 8);
          console.log('✅ Backend suggestions:', aiSuggestions);
        } catch (error) {
          console.error('❌ Backend API failed, falling back to local:', error);
          setBackendConnected(false);
        }
      }

      // Fallback to local suggestions if backend failed or disabled
      if (aiSuggestions.length === 0 || (!useBackendAPI)) {
        console.log('🔄 Using local AI suggestions...');
        const localSuggestions = generateSmartSuggestions(searchQuery, userContext);
        aiSuggestions = localSuggestions.map(s => ({
          ...s,
          type: s.suggestionType as any,
          confidence: s.confidence
        }));
      }

      setSuggestions(aiSuggestions);
      setShowDropdown(aiSuggestions.length > 0);
      setSelectedIndex(-1);
      
    } catch (error) {
      console.error('❌ All suggestion methods failed:', error);
      setSuggestions([]);
      setShowDropdown(false);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [userContext, useBackendAPI, backendConnected]);

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
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
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

  const handleSuggestionSelect = (suggestion: AISearchSuggestion | SmartSuggestion) => {
    setQuery(suggestion.text);
    setShowDropdown(false);
    onSearch(suggestion.text);
  };

  const getSmartPlaceholder = () => {
    if (useBackendAPI && backendConnected) {
      return '🤖 AI-Powered Search: VIN, make/model, location, fuzzy matching...';
    } else if (useBackendAPI && !backendConnected) {
      return '⚠️ Backend offline - Local AI: VIN, make/model, phone...';
    } else {
      return '🔍 Local Search: VIN, make/model, phone, location...';
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          
          {/* AI Status Indicator */}
          <div className="absolute right-16 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {useBackendAPI && (
              <Badge 
                variant={backendConnected ? "default" : "destructive"} 
                className="text-xs"
              >
                {backendConnected ? '🤖 AI' : '⚠️ Local'}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="h-6 w-6 p-0"
            >
              <Settings className="w-3 h-3" />
            </Button>
          </div>
          
          <Input
            ref={inputRef}
            type="text"
            placeholder={getSmartPlaceholder()}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            className="pl-12 pr-24 h-14 text-lg bg-background border-2 border-border focus:border-primary transition-colors"
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

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-full right-0 mt-2 p-4 bg-popover border border-border rounded-lg shadow-lg z-50 min-w-[300px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">AI Search Settings</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(false)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="backend-toggle" className="text-sm">
                  Use Backend AI API
                </Label>
                <div className="flex items-center gap-2">
                  {useBackendAPI ? (
                    <ToggleRight className="w-5 h-5 text-primary" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                  )}
                  <Switch
                    id="backend-toggle"
                    checked={useBackendAPI}
                    onCheckedChange={setUseBackendAPI}
                  />
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                {useBackendAPI ? (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-block w-2 h-2 rounded-full ${backendConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                      Backend Status: {backendConnected ? 'Connected' : 'Disconnected'}
                    </div>
                    {backendConnected ? 
                      'Using Elasticsearch fuzzy search with enhanced AI matching' : 
                      'Will fallback to local suggestions'
                    }
                  </>
                ) : (
                  'Using local AI suggestions with smart pattern matching'
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced AI Autocomplete Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-lg z-50 overflow-hidden max-h-96 overflow-y-auto"
        >
          <div className="p-2">
            <div className="flex items-center justify-between mb-2 px-2">
              <div className="text-xs text-muted-foreground">
                {useBackendAPI && backendConnected ? 'AI Backend' : 'Local AI'} suggestions ({suggestions.length})
              </div>
              {useBackendAPI && backendConnected && (
                <Badge variant="outline" className="text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  Fuzzy Search
                </Badge>
              )}
            </div>
            
            {suggestions.map((suggestion, index) => {
              const isAISuggestion = 'type' in suggestion;
              const suggestionType = isAISuggestion ? suggestion.type : suggestion.suggestionType;
              const displayType = suggestionType === 'make_model' ? 'model' : suggestionType;
              
              return (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-3 text-left transition-colors rounded-lg
                    ${index === selectedIndex
                      ? 'bg-accent/20 text-accent-foreground border border-accent/30'
                      : 'hover:bg-muted/50'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-md bg-muted">
                      {SUGGESTION_TYPE_ICONS[displayType as keyof typeof SUGGESTION_TYPE_ICONS] || <Car className="w-4 h-4" />}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {SUGGESTION_TYPE_LABELS[displayType as keyof typeof SUGGESTION_TYPE_LABELS] || 'Match'}
                    </Badge>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p 
                      className="text-sm font-medium truncate"
                      dangerouslySetInnerHTML={{ 
                        __html: isAISuggestion ? suggestion.highlightedText : suggestion.highlightedText 
                      }}
                    />
                    {(isAISuggestion ? suggestion.context : suggestion.context) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isAISuggestion ? suggestion.context : suggestion.context}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      {Array.from({ 
                        length: Math.ceil((isAISuggestion ? suggestion.confidence : suggestion.confidence) * 5) 
                      }, (_, i) => (
                        <div key={i} className="w-1 h-1 rounded-full bg-primary mr-0.5" />
                      ))}
                    </div>
                    {useBackendAPI && backendConnected && (
                      <Badge variant="secondary" className="text-xs ml-1">
                        AI
                      </Badge>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}