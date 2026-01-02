import React from 'react';

interface StatisticsProps {
  data: {
    total: number;
    entityTypes: Array<{ key: string; doc_count: number }>;
    statuses: Array<{ key: string; doc_count: number }>;
    averagePrice: number;
    priceStatistics: {
      min: number;
      max: number;
      avg: number;
      sum: number;
    };
  };
}

const Statistics: React.FC<StatisticsProps> = ({ data }) => {
  const formatCurrency = (amount: number) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="aggregations" style={{ marginBottom: '2rem' }}>
      <div className="agg-header">
        📈 Platform Statistics
      </div>
      <div className="agg-content">
        <div className="agg-grid">
          <div className="agg-section">
            <h4>🎯 Overview</h4>
            <div className="agg-item">
              <span>Total Documents</span>
              <span><strong>{formatNumber(data.total)}</strong></span>
            </div>
            <div className="agg-item">
              <span>Average Price</span>
              <span><strong>{formatCurrency(data.averagePrice)}</strong></span>
            </div>
          </div>

          <div className="agg-section">
            <h4>📊 Entity Types</h4>
            {data.entityTypes?.map((item) => (
              <div key={item.key} className="agg-item">
                <span>
                  {item.key === 'offer' && '🚗'} 
                  {item.key === 'purchase' && '💰'} 
                  {item.key === 'transport' && '🚛'} 
                  {item.key.charAt(0).toUpperCase() + item.key.slice(1)}s
                </span>
                <span><strong>{formatNumber(item.doc_count)}</strong></span>
              </div>
            ))}
          </div>

          <div className="agg-section">
            <h4>📋 Status Overview</h4>
            {data.statuses?.slice(0, 5).map((item) => (
              <div key={item.key} className="agg-item">
                <span>
                  {item.key === 'ACTIVE' && '🟢'} 
                  {item.key === 'COMPLETED' && '✅'} 
                  {item.key === 'PENDING' && '🟡'} 
                  {item.key === 'CANCELLED' && '❌'} 
                  {item.key === 'IN_TRANSIT' && '🚚'} 
                  {item.key}
                </span>
                <span><strong>{formatNumber(item.doc_count)}</strong></span>
              </div>
            ))}
          </div>

          {data.priceStatistics && (
            <div className="agg-section">
              <h4>💸 Price Analytics</h4>
              <div className="agg-item">
                <span>Minimum</span>
                <span>{formatCurrency(data.priceStatistics.min)}</span>
              </div>
              <div className="agg-item">
                <span>Maximum</span>
                <span>{formatCurrency(data.priceStatistics.max)}</span>
              </div>
              <div className="agg-item">
                <span>Average</span>
                <span>{formatCurrency(data.priceStatistics.avg)}</span>
              </div>
              <div className="agg-item">
                <span>Total Volume</span>
                <span>{formatCurrency(data.priceStatistics.sum)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Statistics;