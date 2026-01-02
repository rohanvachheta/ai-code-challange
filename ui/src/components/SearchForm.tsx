import React, { useState } from 'react';
import { SearchRequest, UserType } from '../services/searchService.ts';

interface SearchFormProps {
  onSearch: (request: SearchRequest) => void;
  loading: boolean;
}

const SearchForm: React.FC<SearchFormProps> = ({ onSearch, loading }) => {
  const [formData, setFormData] = useState({
    userType: UserType.AGENT,
    accountId: '00000000-0000-0000-0000-000000000000',
    searchText: '',
    entityTypes: [] as string[],
    status: '',
    minYear: '',
    maxYear: '',
    minPrice: '',
    maxPrice: '',
    make: '',
    model: '',
    location: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const request: SearchRequest = {
      userType: formData.userType,
      accountId: formData.accountId,
      searchText: formData.searchText,
      page: 1,
      limit: 20,
    };

    // Add optional filters
    if (formData.entityTypes.length > 0) request.entityTypes = formData.entityTypes;
    if (formData.status) request.status = formData.status;
    if (formData.minYear) request.minYear = parseInt(formData.minYear);
    if (formData.maxYear) request.maxYear = parseInt(formData.maxYear);
    if (formData.minPrice) request.minPrice = parseFloat(formData.minPrice);
    if (formData.maxPrice) request.maxPrice = parseFloat(formData.maxPrice);
    if (formData.make) request.make = formData.make;
    if (formData.model) request.model = formData.model;
    if (formData.location) request.location = formData.location;

    onSearch(request);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEntityTypeChange = (entityType: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      entityTypes: checked
        ? [...prev.entityTypes, entityType]
        : prev.entityTypes.filter(t => t !== entityType)
    }));
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="search-form">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <div className="form-row">
            <div className="form-col">
              <label>User Type</label>
              <select
                name="userType"
                value={formData.userType}
                onChange={handleInputChange}
                required
              >
                <option value={UserType.AGENT}>Agent (All Access)</option>
                <option value={UserType.SELLER}>Seller</option>
                <option value={UserType.BUYER}>Buyer</option>
                <option value={UserType.CARRIER}>Carrier</option>
              </select>
            </div>
            <div className="form-col">
              <label>Account ID</label>
              <input
                type="text"
                name="accountId"
                value={formData.accountId}
                onChange={handleInputChange}
                placeholder="Enter your account ID"
                required
              />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Search Query</label>
          <input
            type="text"
            name="searchText"
            value={formData.searchText}
            onChange={handleInputChange}
            placeholder="Search for vehicles, VINs, locations, etc..."
            required
          />
        </div>

        <div className="form-group">
          <label>Entity Types</label>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {['offer', 'purchase', 'transport'].map(type => (
              <label key={type} style={{ display: 'flex', alignItems: 'center', marginBottom: 0 }}>
                <input
                  type="checkbox"
                  checked={formData.entityTypes.includes(type)}
                  onChange={(e) => handleEntityTypeChange(type, e.target.checked)}
                  style={{ width: 'auto', marginRight: '0.5rem' }}
                />
                {type.charAt(0).toUpperCase() + type.slice(1)}s
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <div className="form-row">
            <div className="form-col">
              <label>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="">Any Status</option>
                <option value="ACTIVE">Active</option>
                <option value="SOLD">Sold</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="DELIVERED">Delivered</option>
              </select>
            </div>
            <div className="form-col">
              <label>Make</label>
              <input
                type="text"
                name="make"
                value={formData.make}
                onChange={handleInputChange}
                placeholder="e.g., Toyota, Ford, Honda"
              />
            </div>
            <div className="form-col">
              <label>Model</label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                placeholder="e.g., Camry, F-150, Civic"
              />
            </div>
          </div>
        </div>

        <div className="form-group">
          <div className="form-row">
            <div className="form-col">
              <label>Min Year</label>
              <input
                type="number"
                name="minYear"
                value={formData.minYear}
                onChange={handleInputChange}
                min="1900"
                max={currentYear + 1}
                placeholder="2000"
              />
            </div>
            <div className="form-col">
              <label>Max Year</label>
              <input
                type="number"
                name="maxYear"
                value={formData.maxYear}
                onChange={handleInputChange}
                min="1900"
                max={currentYear + 1}
                placeholder={currentYear.toString()}
              />
            </div>
            <div className="form-col">
              <label>Min Price</label>
              <input
                type="number"
                name="minPrice"
                value={formData.minPrice}
                onChange={handleInputChange}
                min="0"
                step="100"
                placeholder="10000"
              />
            </div>
            <div className="form-col">
              <label>Max Price</label>
              <input
                type="number"
                name="maxPrice"
                value={formData.maxPrice}
                onChange={handleInputChange}
                min="0"
                step="100"
                placeholder="50000"
              />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="City, State or ZIP code"
          />
        </div>

        <div className="form-group">
          <button type="submit" className="search-btn" disabled={loading}>
            {loading ? '🔍 Searching...' : '🔍 Search'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchForm;