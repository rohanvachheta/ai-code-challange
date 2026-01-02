// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   StatusFilter,
//   STATUS_FILTER_LABELS,
//   SearchFilters,
// } from "@/types/search";
// interface SearchFilterProps {
//   filters: SearchFilters;
//   onFiltersChange: (filters: SearchFilters) => void;
//   onApplyFilters: () => void;
//   isLoading?: boolean;
// }
// /**
//  * SearchFilter Component
//  *
//  * Provides advanced filtering options for search results including:
//  * - Status filter with conditional image field
//  * - Make and model filters
//  * - Year range filter
//  * - Price range filter
//  */
// export function SearchFilter({
//   filters,
//   onFiltersChange,
//   onApplyFilters,
//   isLoading = false,
// }: SearchFilterProps) {
//   const [showImageField, setShowImageField] = useState(false);
//   const handleFilterChange = (key: keyof SearchFilters, value: string) => {
//     onFiltersChange({
//       ...filters,
//       [key]: value,
//     });
//   };
//   const handleStatusChange = (value: StatusFilter) => {
//     handleFilterChange("status", value);
//     // Show image field only when "all" status is selected
//     setShowImageField(value === "all");
//   };
//   const handleApplyFilters = () => {
//     onApplyFilters();
//   };
//   const handleResetFilters = () => {
//     const resetFilters: SearchFilters = {
//       status: "all",
//       make: "",
//       model: "",
//       minYear: "",
//       maxYear: "",
//       minPrice: "",
//       maxPrice: "",
//     };
//     onFiltersChange(resetFilters);
//     setShowImageField(true);
//   };
//   return (
//     <div className="bg-card border border-border rounded-xl p-6 space-y-6">
//       <div className="flex items-center justify-between">
//         <h3 className="text-lg font-semibold text-foreground">Filters</h3>
//         <Button
//           variant="outline"
//           size="sm"
//           onClick={handleResetFilters}
//           disabled={isLoading}
//         >
//           Reset
//         </Button>
//       </div>
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//         {/* Status Filter */}
//         <div className="space-y-2">
//           <Label htmlFor="status-filter">Status</Label>
//           <Select
//             value={filters.status}
//             onValueChange={(value) => handleStatusChange(value as StatusFilter)}
//             disabled={isLoading}
//           >
//             <SelectTrigger id="status-filter">
//               <SelectValue placeholder="Select status" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all">{STATUS_FILTER_LABELS.all}</SelectItem>
//               <SelectItem value="complete">
//                 {STATUS_FILTER_LABELS.complete}
//               </SelectItem>
//               <SelectItem value="pending">
//                 {STATUS_FILTER_LABELS.pending}
//               </SelectItem>
//               <SelectItem value="in_transit">
//                 {STATUS_FILTER_LABELS.in_transit}
//               </SelectItem>
//             </SelectContent>
//           </Select>
//         </div>
//         {/* Image Field - Only shown when status is "all" */}
//         {showImageField && (
//           <div className="space-y-2">
//             <Label htmlFor="image-filter">Image</Label>
//             <Input
//               id="image-filter"
//               type="text"
//               placeholder="Search by image..."
//               value={filters.make} // Using make field temporarily for image
//               onChange={(e) => handleFilterChange("make", e.target.value)}
//               disabled={isLoading}
//             />
//           </div>
//         )}
//         {/* Make Filter */}
//         <div className="space-y-2">
//           <Label htmlFor="make-filter">Make</Label>
//           <Input
//             id="make-filter"
//             type="text"
//             placeholder="e.g., Toyota, Honda"
//             value={filters.make}
//             onChange={(e) => handleFilterChange("make", e.target.value)}
//             disabled={isLoading}
//           />
//         </div>
//         {/* Model Filter */}
//         <div className="space-y-2">
//           <Label htmlFor="model-filter">Model</Label>
//           <Input
//             id="model-filter"
//             type="text"
//             placeholder="e.g., Camry, Accord"
//             value={filters.model}
//             onChange={(e) => handleFilterChange("model", e.target.value)}
//             disabled={isLoading}
//           />
//         </div>
//         {/* Min Year Filter */}
//         <div className="space-y-2">
//           <Label htmlFor="min-year-filter">Min Year</Label>
//           <Input
//             id="min-year-filter"
//             type="number"
//             placeholder="e.g., 2020"
//             value={filters.minYear}
//             onChange={(e) => handleFilterChange("minYear", e.target.value)}
//             disabled={isLoading}
//             min="1900"
//             max={new Date().getFullYear() + 1}
//           />
//         </div>
//         {/* Max Year Filter */}
//         <div className="space-y-2">
//           <Label htmlFor="max-year-filter">Max Year</Label>
//           <Input
//             id="max-year-filter"
//             type="number"
//             placeholder="e.g., 2024"
//             value={filters.maxYear}
//             onChange={(e) => handleFilterChange("maxYear", e.target.value)}
//             disabled={isLoading}
//             min="1900"
//             max={new Date().getFullYear() + 1}
//           />
//         </div>
//         {/* Min Price Filter */}
//         <div className="space-y-2">
//           <Label htmlFor="min-price-filter">Min Price ($)</Label>
//           <Input
//             id="min-price-filter"
//             type="number"
//             placeholder="e.g., 10000"
//             value={filters.minPrice}
//             onChange={(e) => handleFilterChange("minPrice", e.target.value)}
//             disabled={isLoading}
//             min="0"
//             step="1000"
//           />
//         </div>
//         {/* Max Price Filter */}
//         <div className="space-y-2">
//           <Label htmlFor="max-price-filter">Max Price ($)</Label>
//           <Input
//             id="max-price-filter"
//             type="number"
//             placeholder="e.g., 50000"
//             value={filters.maxPrice}
//             onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
//             disabled={isLoading}
//             min="0"
//             step="1000"
//           />
//         </div>
//       </div>
//       {/* Apply Filters Button */}
//       <div className="flex justify-end">
//         <Button
//           onClick={handleApplyFilters}
//           disabled={isLoading}
//           className="min-w-[120px]"
//         >
//           {isLoading ? "Applying..." : "Apply Filters"}
//         </Button>
//       </div>
//     </div>
//   );
// }

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  StatusFilter,
  STATUS_FILTER_LABELS,
  SearchFilters,
} from "@/types/search";
interface SearchFilterProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onApplyFilters: () => void;
  isLoading?: boolean;
}
/**
 * SearchFilter Component
 *
 * Provides advanced filtering options for search results including:
 * - Status filter with conditional image field
 * - Make and model filters
 * - Year range filter
 * - Price range filter
 */
export function SearchFilter({
  filters,
  onFiltersChange,
  onApplyFilters,
  isLoading = false,
}: SearchFilterProps) {
  const [showImageField, setShowImageField] = useState(false);
  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };
  const handleStatusChange = (value: StatusFilter) => {
    handleFilterChange("status", value);
    // Show image field only when "all" status is selected
    setShowImageField(value === "all");
  };
  const handleApplyFilters = () => {
    onApplyFilters();
  };
  const handleResetFilters = () => {
    const resetFilters: SearchFilters = {
      status: "all",
      make: "",
      model: "",
      minYear: "",
      maxYear: "",
      minPrice: "",
      maxPrice: "",
      location: "",
    };
    onFiltersChange(resetFilters);
    setShowImageField(true);
  };
  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Filters</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetFilters}
          disabled={isLoading}
        >
          Reset
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status-filter">Status</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => handleStatusChange(value as StatusFilter)}
            disabled={isLoading}
          >
            <SelectTrigger id="status-filter">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{STATUS_FILTER_LABELS.all}</SelectItem>
              <SelectItem value="complete">
                {STATUS_FILTER_LABELS.complete}
              </SelectItem>
              <SelectItem value="pending">
                {STATUS_FILTER_LABELS.pending}
              </SelectItem>
              <SelectItem value="in_transit">
                {STATUS_FILTER_LABELS.in_transit}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Image Field - Only shown when status is "all" */}
        {showImageField && (
          <div className="space-y-2">
            <Label htmlFor="image-filter">Image</Label>
            <Input
              id="image-filter"
              type="text"
              placeholder="Search by image..."
              value={filters.make} // Using make field temporarily for image
              onChange={(e) => handleFilterChange("make", e.target.value)}
              disabled={isLoading}
            />
          </div>
        )}
        {/* Make Filter */}
        <div className="space-y-2">
          <Label htmlFor="make-filter">Make</Label>
          <Input
            id="make-filter"
            type="text"
            placeholder="e.g., Toyota, Honda"
            value={filters.make}
            onChange={(e) => handleFilterChange("make", e.target.value)}
            disabled={isLoading}
          />
        </div>
        {/* Model Filter */}
        <div className="space-y-2">
          <Label htmlFor="model-filter">Model</Label>
          <Input
            id="model-filter"
            type="text"
            placeholder="e.g., Camry, Accord"
            value={filters.model}
            onChange={(e) => handleFilterChange("model", e.target.value)}
            disabled={isLoading}
          />
        </div>
        {/* Min Year Filter */}
        <div className="space-y-2">
          <Label htmlFor="min-year-filter">Min Year</Label>
          <Input
            id="min-year-filter"
            type="number"
            placeholder="e.g., 2020"
            value={filters.minYear}
            onChange={(e) => handleFilterChange("minYear", e.target.value)}
            disabled={isLoading}
            min="1900"
            max={new Date().getFullYear() + 1}
          />
        </div>
        {/* Max Year Filter */}
        <div className="space-y-2">
          <Label htmlFor="max-year-filter">Max Year</Label>
          <Input
            id="max-year-filter"
            type="number"
            placeholder="e.g., 2024"
            value={filters.maxYear}
            onChange={(e) => handleFilterChange("maxYear", e.target.value)}
            disabled={isLoading}
            min="1900"
            max={new Date().getFullYear() + 1}
          />
        </div>
        {/* Min Price Filter */}
        <div className="space-y-2">
          <Label htmlFor="min-price-filter">Min Price ($)</Label>
          <Input
            id="min-price-filter"
            type="number"
            placeholder="e.g., 10000"
            value={filters.minPrice}
            onChange={(e) => handleFilterChange("minPrice", e.target.value)}
            disabled={isLoading}
            min="0"
            step="1000"
          />
        </div>
        {/* Max Price Filter */}
        <div className="space-y-2">
          <Label htmlFor="max-price-filter">Max Price ($)</Label>
          <Input
            id="max-price-filter"
            type="number"
            placeholder="e.g., 50000"
            value={filters.maxPrice}
            onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
            disabled={isLoading}
            min="0"
            step="1000"
          />
        </div>
        {/* Location Filter */}
        <div className="space-y-2">
          <Label htmlFor="location-filter">Location</Label>
          <Input
            id="location-filter"
            type="text"
            placeholder="e.g., Los Angeles, CA"
            value={filters.location}
            onChange={(e) => handleFilterChange("location", e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>
      {/* Apply Filters Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleApplyFilters}
          disabled={isLoading}
          className="min-w-[120px]"
        >
          {isLoading ? "Applying..." : "Apply Filters"}
        </Button>
      </div>
    </div>
  );
}
