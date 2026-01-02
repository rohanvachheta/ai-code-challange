// import { useState, useEffect, useRef, useCallback, KeyboardEvent } from 'react';
// import { Search, Loader2, Car, ShoppingCart, Truck } from 'lucide-react';
// import { Input } from '@/components/ui/input';
// import { Button } from '@/components/ui/button';
// import { AutocompleteSuggestion, EntityType, UserContext } from '@/types/search';
// import { fetchAutocomplete } from '@/lib/api';

// interface SearchBarWithAutocompleteProps {
//   userContext: UserContext;
//   onSearch: (query: string) => void;
//   isSearching: boolean;
// }

// const DEBOUNCE_DELAY = 350; // ms

// const ENTITY_ICONS: Record<EntityType, React.ReactNode> = {
//   offer: <Car className="w-4 h-4 text-accent" />,
//   purchase: <ShoppingCart className="w-4 h-4 text-success" />,
//   transport: <Truck className="w-4 h-4 text-warning" />,
// };

// const ENTITY_LABELS: Record<EntityType, string> = {
//   offer: 'Offer',
//   purchase: 'Purchase',
//   transport: 'Transport',
// };

// /**
//  * SearchBarWithAutocomplete Component
//  *
//  * Central search input with debounced autocomplete functionality.
//  * Supports keyboard navigation and highlights matched query parts.
//  */
// export function SearchBarWithAutocomplete({
//   userContext,
//   onSearch,
//   isSearching,
// }: SearchBarWithAutocompleteProps) {
//   const [query, setQuery] = useState('');
//   const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
//   const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
//   const [showDropdown, setShowDropdown] = useState(false);
//   const [selectedIndex, setSelectedIndex] = useState(-1);

//   const inputRef = useRef<HTMLInputElement>(null);
//   const dropdownRef = useRef<HTMLDivElement>(null);
//   const debounceRef = useRef<NodeJS.Timeout | null>(null);

//   // Fetch autocomplete suggestions with debounce
//   const fetchSuggestions = useCallback(async (searchQuery: string) => {
//     if (!searchQuery.trim()) {
//       setSuggestions([]);
//       setShowDropdown(false);
//       return;
//     }

//     setIsLoadingSuggestions(true);
//     try {
//       const results = await fetchAutocomplete(searchQuery, userContext);
//       setSuggestions(results);
//       setShowDropdown(results.length > 0);
//       setSelectedIndex(-1);
//     } catch (error) {
//       console.error('Autocomplete error:', error);
//       setSuggestions([]);
//     } finally {
//       setIsLoadingSuggestions(false);
//     }
//   }, [userContext]);

//   // Debounced input handler
//   useEffect(() => {
//     if (debounceRef.current) {
//       clearTimeout(debounceRef.current);
//     }

//     debounceRef.current = setTimeout(() => {
//       fetchSuggestions(query);
//     }, DEBOUNCE_DELAY);

//     return () => {
//       if (debounceRef.current) {
//         clearTimeout(debounceRef.current);
//       }
//     };
//   }, [query, fetchSuggestions]);

//   // Close dropdown on outside click
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         dropdownRef.current &&
//         !dropdownRef.current.contains(event.target as Node) &&
//         inputRef.current &&
//         !inputRef.current.contains(event.target as Node)
//       ) {
//         setShowDropdown(false);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   // Handle keyboard navigation
//   const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
//     if (!showDropdown) {
//       if (e.key === 'Enter') {
//         handleSearch();
//       }
//       return;
//     }

//     switch (e.key) {
//       case 'ArrowDown':
//         e.preventDefault();
//         setSelectedIndex((prev) =>
//           prev < suggestions.length - 1 ? prev + 1 : prev
//         );
//         break;
//       case 'ArrowUp':
//         e.preventDefault();
//         setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
//         break;
//       case 'Enter':
//         e.preventDefault();
//         if (selectedIndex >= 0 && suggestions[selectedIndex]) {
//           handleSuggestionSelect(suggestions[selectedIndex]);
//         } else {
//           handleSearch();
//         }
//         break;
//       case 'Escape':
//         setShowDropdown(false);
//         setSelectedIndex(-1);
//         break;
//     }
//   };

//   const handleSearch = () => {
//     if (query.trim()) {
//       setShowDropdown(false);
//       onSearch(query.trim());
//     }
//   };

//   const handleSuggestionSelect = (suggestion: AutocompleteSuggestion) => {
//     setQuery(suggestion.text);
//     setShowDropdown(false);
//     onSearch(suggestion.text);
//   };

//   return (
//     <div className="relative w-full">
//       <div className="flex gap-3">
//         <div className="relative flex-1">
//           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
//           <Input
//             ref={inputRef}
//             type="text"
//             placeholder="Search by VIN, ID, phone, name, or any text..."
//             value={query}
//             onChange={(e) => setQuery(e.target.value)}
//             onKeyDown={handleKeyDown}
//             onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
//             className="pl-12 pr-4 h-14 text-lg bg-background border-2 border-border focus:border-primary transition-colors"
//             disabled={isSearching}
//           />
//           {isLoadingSuggestions && (
//             <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
//           )}
//         </div>
//         <Button
//           onClick={handleSearch}
//           disabled={isSearching || !query.trim()}
//           className="h-14 px-8 text-lg font-semibold"
//         >
//           {isSearching ? (
//             <>
//               <Loader2 className="w-5 h-5 mr-2 animate-spin" />
//               Searching...
//             </>
//           ) : (
//             <>
//               <Search className="w-5 h-5 mr-2" />
//               Search
//             </>
//           )}
//         </Button>
//       </div>

//       {/* Autocomplete Dropdown */}
//       {showDropdown && suggestions.length > 0 && (
//         <div
//           ref={dropdownRef}
//           className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-lg z-50 overflow-hidden"
//         >
//           <ul className="py-2">
//             {suggestions.map((suggestion, index) => (
//               <li key={suggestion.id}>
//                 <button
//                   type="button"
//                   onClick={() => handleSuggestionSelect(suggestion)}
//                   className={`
//                     w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
//                     ${index === selectedIndex
//                       ? 'bg-accent/10 text-accent-foreground'
//                       : 'hover:bg-muted/50'
//                     }
//                   `}
//                 >
//                   <span className="p-2 rounded-lg bg-muted">
//                     {ENTITY_ICONS[suggestion.entityType]}
//                   </span>
//                   <div className="flex-1 min-w-0">
//                     <p
//                       className="text-sm font-medium truncate"
//                       dangerouslySetInnerHTML={{ __html: suggestion.highlightedText }}
//                     />
//                     <p className="text-xs text-muted-foreground">
//                       {ENTITY_LABELS[suggestion.entityType]}
//                     </p>
//                   </div>
//                 </button>
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}
//     </div>
//   );
// }

import { useState, useEffect, useRef, useCallback, KeyboardEvent } from "react";
import { Search, Loader2, Car, ShoppingCart, Truck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AutocompleteSuggestion,
  EntityType,
  UserContext,
} from "@/types/search";
import { fetchAutocomplete } from "@/lib/api";
interface SearchBarWithAutocompleteProps {
  userContext: UserContext;
  onSearch: (query: string) => void;
  isSearching: boolean;
}
const DEBOUNCE_DELAY = 350; // ms
const ENTITY_ICONS: Record<EntityType, React.ReactNode> = {
  offer: <Car className="w-4 h-4 text-accent" />,
  purchase: <ShoppingCart className="w-4 h-4 text-success" />,
  transport: <Truck className="w-4 h-4 text-warning" />,
};
const ENTITY_LABELS: Record<EntityType, string> = {
  offer: "Offer",
  purchase: "Purchase",
  transport: "Transport",
};
/**
 * SearchBarWithAutocomplete Component
 *
 * Central search input with debounced autocomplete functionality.
 * Supports keyboard navigation and highlights matched query parts.
 */
export function SearchBarWithAutocomplete({
  userContext,
  onSearch,
  isSearching,
}: SearchBarWithAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  // Fetch autocomplete suggestions with debounce
  const fetchSuggestions = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }
      setIsLoadingSuggestions(true);
      try {
        const results = await fetchAutocomplete(searchQuery, userContext);
        setSuggestions(results);
        setShowDropdown(results.length > 0);
        setSelectedIndex(-1);
      } catch (error) {
        console.error("Autocomplete error:", error);
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    },
    [userContext]
  );
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) {
      if (e.key === "Enter") {
        handleSearch();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case "Escape":
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
  const handleSuggestionSelect = (suggestion: AutocompleteSuggestion) => {
    setQuery(suggestion.text);
    setShowDropdown(false);
    onSearch(suggestion.text);
  };
  return (
    <div className="relative w-full">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search by VIN, ID, phone, name, or any text..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            className="pl-12 pr-4 h-14 text-lg bg-background border-2 border-border focus:border-primary transition-colors"
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
      {/* Autocomplete Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-lg z-50 overflow-hidden"
        >
          <ul className="py-2">
            {suggestions.map((suggestion, index) => (
              <li key={suggestion.id}>
                <button
                  type="button"
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                    ${
                      index === selectedIndex
                        ? "bg-accent/10 text-accent-foreground"
                        : "hover:bg-muted/50"
                    }
                  `}
                >
                  <span className="p-2 rounded-lg bg-muted">
                    {ENTITY_ICONS[suggestion.entityType]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      dangerouslySetInnerHTML={{
                        __html: suggestion.highlightedText,
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      {ENTITY_LABELS[suggestion.entityType]}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
