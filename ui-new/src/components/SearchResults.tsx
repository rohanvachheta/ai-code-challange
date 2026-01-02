// import { SearchResponse } from '@/types/search';
// import { ResultGroup, OfferCard, PurchaseCard, TransportCard } from './ResultGroup';
// import { Search, AlertCircle } from 'lucide-react';

// interface SearchResultsProps {
//   response: SearchResponse | null;
//   isLoading: boolean;
//   error: string | null;
//   hasSearched: boolean;
// }

// /**
//  * SearchResults Component
//  *
//  * Displays grouped search results by entity type.
//  * Handles loading, error, and empty states.
//  */
// export function SearchResults({ response, isLoading, error, hasSearched }: SearchResultsProps) {
//   // Loading state
//   if (isLoading) {
//     return (
//       <div className="flex flex-col items-center justify-center py-16 space-y-4">
//         <div className="relative">
//           <div className="w-16 h-16 border-4 border-muted rounded-full" />
//           <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
//         </div>
//         <p className="text-muted-foreground">Searching...</p>
//       </div>
//     );
//   }

//   // Error state
//   if (error) {
//     return (
//       <div className="flex flex-col items-center justify-center py-16 space-y-4">
//         <div className="p-4 rounded-full bg-destructive/10">
//           <AlertCircle className="w-8 h-8 text-destructive" />
//         </div>
//         <div className="text-center">
//           <p className="font-medium text-foreground">Search failed</p>
//           <p className="text-sm text-muted-foreground mt-1">{error}</p>
//         </div>
//       </div>
//     );
//   }

//   // Initial state (no search yet)
//   if (!hasSearched) {
//     return (
//       <div className="flex flex-col items-center justify-center py-16 space-y-4">
//         <div className="p-4 rounded-full bg-muted">
//           <Search className="w-8 h-8 text-muted-foreground" />
//         </div>
//         <div className="text-center">
//           <p className="font-medium text-foreground">Start searching</p>
//           <p className="text-sm text-muted-foreground mt-1">
//             Enter a VIN, ID, phone number, name, or any text to search
//           </p>
//         </div>
//       </div>
//     );
//   }

//   // No results state
//   if (!response || response.totalResults === 0) {
//     return (
//       <div className="flex flex-col items-center justify-center py-16 space-y-4">
//         <div className="p-4 rounded-full bg-muted">
//           <Search className="w-8 h-8 text-muted-foreground" />
//         </div>
//         <div className="text-center">
//           <p className="font-medium text-foreground">No results found</p>
//           <p className="text-sm text-muted-foreground mt-1">
//             Try adjusting your search query or filters
//           </p>
//         </div>
//       </div>
//     );
//   }

//   const { offers, purchases, transports } = response.results;

//   return (
//     <div className="space-y-4">
//       {/* Results summary */}
//       <div className="flex items-center justify-between">
//         <p className="text-sm text-muted-foreground">
//           Found <span className="font-semibold text-foreground">{response.totalResults}</span> results
//           for "<span className="font-medium">{response.query}</span>"
//         </p>
//         {response.pagination.totalPages > 1 && (
//           <p className="text-sm text-muted-foreground">
//             Page {response.pagination.page} of {response.pagination.totalPages}
//           </p>
//         )}
//       </div>

//       {/* Result groups */}
//       <div className="space-y-4">
//         <ResultGroup
//           title="Offers"
//           entityType="offer"
//           results={offers}
//           renderItem={(offer) => <OfferCard offer={offer} />}
//         />

//         <ResultGroup
//           title="Purchases"
//           entityType="purchase"
//           results={purchases}
//           renderItem={(purchase) => <PurchaseCard purchase={purchase} />}
//         />

//         <ResultGroup
//           title="Transports"
//           entityType="transport"
//           results={transports}
//           renderItem={(transport) => <TransportCard transport={transport} />}
//         />
//       </div>
//     </div>
//   );
// }

import { useState } from "react";
import { SearchResponse } from "@/types/search";
import {
  ResultGroup,
  OfferCard,
  PurchaseCard,
  TransportCard,
} from "./ResultGroup";
import { Search, AlertCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
interface SearchResultsProps {
  response: SearchResponse | null;
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
  onLoadMore?: () => void;
  useAdvancedFilters?: boolean;
}
/**
 * SearchResults Component
 *
 * Displays grouped search results by entity type.
 * Handles loading, error, and empty states.
 * Supports pagination with "View More" functionality.
 */
export function SearchResults({
  response,
  isLoading,
  error,
  hasSearched,
  onLoadMore,
  useAdvancedFilters = false,
}: SearchResultsProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-muted rounded-full" />
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-muted-foreground">Searching...</p>
      </div>
    );
  }
  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="p-4 rounded-full bg-destructive/10">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <div className="text-center">
          <p className="font-medium text-foreground">Search failed</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>
      </div>
    );
  }
  // Initial state (no search yet)
  if (!hasSearched) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="p-4 rounded-full bg-muted">
          <Search className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="font-medium text-foreground">Start searching</p>
          <p className="text-sm text-muted-foreground mt-1">
            Enter a VIN, ID, phone number, name, or any text to search
          </p>
        </div>
      </div>
    );
  }
  // No results state
  if (!response || response.totalResults === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="p-4 rounded-full bg-muted">
          <Search className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="font-medium text-foreground">No results found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your search query or filters
          </p>
        </div>
      </div>
    );
  }
  const { offers, purchases, transports } = response.results;
  const hasMoreResults =
    response.pagination.page < response.pagination.totalPages;
  const isAdvancedMode =
    useAdvancedFilters && response.pagination.pageSize === 5;
  return (
    <div className="space-y-4">
      {/* Results summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Found{" "}
          <span className="font-semibold text-foreground">
            {response.totalResults}
          </span>{" "}
          results
          {response.query.trim() && (
            <>
              {" "}
              for "<span className="font-medium">{response.query}</span>"
            </>
          )}
          {isAdvancedMode && (
            <>
              {" "}
              (Page {response.pagination.page} of{" "}
              {response.pagination.totalPages})
            </>
          )}
        </p>
        {!isAdvancedMode && response.pagination.totalPages > 1 && (
          <p className="text-sm text-muted-foreground">
            Page {response.pagination.page} of {response.pagination.totalPages}
          </p>
        )}
      </div>
      {/* Result groups */}
      <div className="space-y-4">
        <ResultGroup
          title="Offers"
          entityType="offer"
          results={offers}
          renderItem={(offer) => <OfferCard offer={offer} />}
        />

        <ResultGroup
          title="Purchases"
          entityType="purchase"
          results={purchases}
          renderItem={(purchase) => <PurchaseCard purchase={purchase} />}
        />

        <ResultGroup
          title="Transports"
          entityType="transport"
          results={transports}
          renderItem={(transport) => <TransportCard transport={transport} />}
        />
      </div>
      {/* View More Button - Only shown in advanced filter mode */}
      {isAdvancedMode && hasMoreResults && onLoadMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoading}
            className="min-w-[120px]"
          >
            {isLoading ? (
              <>Loading...</>
            ) : (
              <>
                View More
                <ChevronDown className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
