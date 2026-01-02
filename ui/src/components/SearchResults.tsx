import React from 'react';
import { SearchResponse, SearchDocument } from '../services/searchService.ts';
import { FallbackSearchResponse, FallbackSearchResult } from '../services/fallbackSearchService.ts';

interface SearchResultsProps {
  results: SearchResponse | FallbackSearchResponse;
  onPageChange: (page: number) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, onPageChange }) => {
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getBadgeClass = (entityType: string) => {
    switch (entityType) {
      case 'offer': return 'badge-offer';
      case 'purchase': return 'badge-purchase';
      case 'transport': return 'badge-transport';
      default: return 'badge-offer';
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'offer': return '🚗';
      case 'purchase': return '💰';
      case 'transport': return '🚛';
      default: return '📄';
    }
  };

  const renderResultItem = (item: SearchDocument | FallbackSearchResult) => {
    // Handle fallback search result
    if ('entityType' in item && 'title' in item) {
      const fallbackItem = item as FallbackSearchResult;
      return (
        <div key={`${fallbackItem.entityType}_${fallbackItem.id}`} className="result-item">
          <div className="result-header">
            <h3 className="result-title">
              {getEntityIcon(fallbackItem.entityType)} {fallbackItem.title}
            </h3>
            <span className={`result-badge ${getBadgeClass(fallbackItem.entityType)}`}>
              {fallbackItem.entityType.toUpperCase()}
            </span>
          </div>
          
          <div className="result-details">
            <div className="detail-item">
              <span className="detail-label">Description:</span>
              <span>{fallbackItem.description}</span>
            </div>
            {fallbackItem.price && (
              <div className="detail-item">
                <span className="detail-label">Price:</span>
                <span>{formatCurrency(fallbackItem.price)}</span>
              </div>
            )}
            <div className="detail-item">
              <span className="detail-label">Status:</span>
              <span>{fallbackItem.status}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Created:</span>
              <span>{formatDate(fallbackItem.createdAt)}</span>
            </div>
          </div>
        </div>
      );
    }

    // Handle original search result
    const searchItem = item as SearchDocument;
    return (
      <div key={`${searchItem.entityType}_${searchItem.entityId}`} className="result-item">
        <div className="result-header">
          <h3 className="result-title">
            {getEntityIcon(searchItem.entityType)} {searchItem.entityType.toUpperCase()} - {searchItem.entityId.slice(-8)}
            <span className={`result-badge ${getBadgeClass(item.entityType)}`}>
              {item.status}
            </span>
          </h3>
        </div>
        
        <div className="result-details">
          {item.entityType === 'offer' && (
            <>
              <div className="detail-item">
                <span className="detail-label">Vehicle</span>
                <span>{item.year} {item.make} {item.model}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">VIN</span>
                <span>{item.vin}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Price</span>
                <span>{formatCurrency(item.price)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Condition</span>
                <span>{item.condition}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Location</span>
                <span>{item.location}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Seller ID</span>
                <span>{item.sellerId?.slice(-8)}</span>
              </div>
            </>
          )}
          
          {item.entityType === 'purchase' && (
            <>
              <div className="detail-item">
                <span className="detail-label">Purchase Price</span>
                <span>{formatCurrency(item.purchasePrice)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Payment Method</span>
                <span>{item.paymentMethod}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Offer ID</span>
                <span>{item.offerId?.slice(-8)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Buyer ID</span>
                <span>{item.buyerId?.slice(-8)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Seller ID</span>
                <span>{item.sellerId?.slice(-8)}</span>
              </div>
            </>
          )}
          
          {item.entityType === 'transport' && (
            <>
              <div className="detail-item">
                <span className="detail-label">Transport Cost</span>
                <span>{formatCurrency(item.transportCost)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">From</span>
                <span>{item.pickupLocation}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">To</span>
                <span>{item.deliveryLocation}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Pickup Date</span>
                <span>{formatDate(item.scheduledPickupDate)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Delivery Date</span>
                <span>{formatDate(item.scheduledDeliveryDate)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Carrier ID</span>
                <span>{item.carrierId?.slice(-8)}</span>
              </div>
            </>
          )}
          
          <div className="detail-item">
            <span className="detail-label">Created</span>
            <span>{formatDate(item.createdAt)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Updated</span>
            <span>{formatDate(item.updatedAt)}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderPagination = () => {
    const currentPage = results.page;
    const totalPages = results.pages;
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="pagination">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        >
          ⏮️ First
        </button>
        
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          ⬅️ Previous
        </button>
        
        {pages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={page === currentPage ? 'current-page' : ''}
          >
            {page}
          </button>
        ))}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next ➡️
        </button>
        
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          Last ⏭️
        </button>
      </div>
    );
  };

  const renderAggregations = () => {
    if (!results.aggregations) return null;

    return (
      <div className="aggregations">
        <div className="agg-header">
          📊 Search Insights
        </div>
        <div className="agg-content">
          <div className="agg-grid">
            {results.aggregations.entityTypes && (
              <div className="agg-section">
                <h4>Entity Types</h4>
                {results.aggregations.entityTypes.buckets.map((bucket: any) => (
                  <div key={bucket.key} className="agg-item">
                    <span>{bucket.key}</span>
                    <span>{bucket.doc_count}</span>
                  </div>
                ))}
              </div>
            )}
            
            {results.aggregations.statuses && (
              <div className="agg-section">
                <h4>Status Distribution</h4>
                {results.aggregations.statuses.buckets.map((bucket: any) => (
                  <div key={bucket.key} className="agg-item">
                    <span>{bucket.key}</span>
                    <span>{bucket.doc_count}</span>
                  </div>
                ))}
              </div>
            )}
            
            {results.aggregations.makes && (
              <div className="agg-section">
                <h4>Top Makes</h4>
                {results.aggregations.makes.buckets.slice(0, 5).map((bucket: any) => (
                  <div key={bucket.key} className="agg-item">
                    <span>{bucket.key}</span>
                    <span>{bucket.doc_count}</span>
                  </div>
                ))}
              </div>
            )}
            
            {results.aggregations.priceRanges && (
              <div className="agg-section">
                <h4>Price Ranges</h4>
                {results.aggregations.priceRanges.buckets.map((bucket: any) => (
                  <div key={bucket.key} className="agg-item">
                    <span>{bucket.key.replace('_', ' ')}</span>
                    <span>{bucket.doc_count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderAggregations()}
      
      <div className="results-container">
        <div className="stats">
          <span>
            Showing {results.results.length} of {results.total.toLocaleString()} results
          </span>
          <span>
            Page {results.page} of {results.pages}
          </span>
        </div>
        
        {results.results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
            <h3>No results found</h3>
            <p>Try adjusting your search criteria or filters.</p>
          </div>
        ) : (
          <>
            {results.results.map(renderResultItem)}
            {results.pages > 1 && renderPagination()}
          </>
        )}
      </div>
    </>
  );
};

export default SearchResults;