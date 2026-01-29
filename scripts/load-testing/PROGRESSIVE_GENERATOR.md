# Enhanced Progressive Massive Data Generator

An improved version of the massive data generator with UUID support, specific user types, progressive record generation, and robust error handling.

## 🎯 New Features

### 1. **UUID-based IDs**
- All entities now use UUID v4 for unique identification
- Consistent ID format across offers, purchases, transports, and users
- No more collision issues or predictable IDs

### 2. **Specific User Types**
- **Sellers (30%)**: Car dealers and individual sellers
- **Buyers (40%)**: Car purchasers with preferences and budget info
- **Carriers (30%)**: Transport providers with license and vehicle details
- Each type has relevant additional information

### 3. **Progressive Record Generation**
- Starts with small numbers (default: 5 records)
- Incrementally increases (default: +5 each time)  
- Goes up to configurable maximum (default: 10,000)
- Sequence: 5 → 10 → 15 → 20 → ... → 10,000

### 4. **Enhanced Error Handling**
- API error detection and retry logic
- Configurable stop-on-error behavior
- Progressive backoff for failed requests
- Critical vs. non-critical error classification

### 5. **Improved Data Relationships**
- Sellers are properly linked to offers
- Buyers are specifically chosen for purchases
- Carriers are assigned to transport requests
- UUID-based foreign key relationships

## 🚀 Usage

### Basic Progressive Generation
```bash
# Start with defaults (5 → 10,000, increment by 5)
node massive-data-generator.js

# Custom progression
node massive-data-generator.js --start 10 --max 1000 --increment 20

# Stop on first error
node massive-data-generator.js --start 5 --max 100 --stop-on-error true
```

### Command Line Options
- `--start N`: Starting number of records (default: 5)
- `--max N`: Maximum number of records (default: 10,000)
- `--increment N`: Increment between runs (default: 5)
- `--workers N`: Number of concurrent workers (default: 2)
- `--batch N`: Batch size for API calls (default: 10)
- `--stop-on-error true/false`: Stop on API errors (default: true)

### Examples

#### Quick Test (Small Scale)
```bash
# Generate 2, 4, 6, 8 records with error stopping
node massive-data-generator.js --start 2 --max 8 --increment 2 --stop-on-error true
```

#### Production Scale  
```bash
# Generate 50 → 10,000 records, increment by 50
node massive-data-generator.js --start 50 --max 10000 --increment 50 --workers 4
```

#### Stress Test
```bash
# Generate 100 → 50,000 records, increment by 100
node massive-data-generator.js --start 100 --max 50000 --increment 100 --workers 8
```

## 🧪 Testing

### Test the Enhanced Features
```bash
# Run comprehensive tests (checks user generation, UUID usage, etc.)
node test-progressive-generator.js
```

### Test User Generation Only
```bash
# Test user type distribution and UUID generation
node -e "
const gen = require('./massive-data-generator');
const g = new gen();
g.generateUsers(15, 'test').then(users => {
  console.log('Generated users:', users.length);
  const types = {};
  users.forEach(u => types[u.userType] = (types[u.userType] || 0) + 1);
  console.log('Distribution:', types);
  console.log('Sample user:', users[0]);
});
"
```

## 📊 Output

### Progressive Console Output
```
🚀 MASSIVE DATA GENERATOR WITH PROGRESSION
==========================================
🎯 Starting Records: 5
🏁 Maximum Records: 1,000
📈 Increment: 10
👥 Workers: 2
📦 Batch Size: 10
==========================================

🔄 Generating 5 records...
👥 Generated 6 users: 2 sellers, 2 buyers, 2 carriers
📈 Progress [████████████████████████████████████████] 100% (5/5) ETA: 0.0s
✅ Successfully generated 5 records

⏳ Waiting 2 seconds before next batch...

🔄 Generating 15 records...
👥 Generated 8 users: 3 sellers, 3 buyers, 2 carriers  
📈 Progress [████████████████████████████████████████] 100% (15/15) ETA: 0.0s
✅ Successfully generated 15 records
```

### Final Summary
```
🎉 PROGRESSIVE DATA GENERATION COMPLETE!
==========================================
📊 Total Records Created: 2,485
🏪 Offers: 892
💰 Purchases: 745  
🚛 Transports: 623
👥 Users: 225
✅ Successful Runs: 24
❌ Failed Runs: 1
❌ Total Errors: 12
⏱️  Total Duration: 15.42 minutes
🚀 Average Rate: 2.68 records/sec
==========================================
```

## 🔧 Configuration

### Error Handling Modes

#### Stop on Error (Recommended for Development)
```bash
node massive-data-generator.js --stop-on-error true
```
- Stops immediately when API errors occur
- Useful for debugging and development
- Ensures data quality

#### Continue on Error (Production Mode)
```bash
node massive-data-generator.js --stop-on-error false
```
- Continues despite individual API failures
- Allows for partial data generation
- Better for stress testing

### API Rate Limiting
The script includes built-in rate limiting:
- 100ms delay between individual API calls
- 2-second pause between progressive runs
- Progressive backoff on retry attempts
- Maximum 20% failure rate tolerance

## 📋 Data Structure Examples

### User with UUID
```javascript
{
  userId: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  userType: "SELLER",
  firstName: "Rajesh",
  lastName: "Kumar", 
  email: "rajesh.kumar.a1b2c3d4@example.com",
  phone: "+917894561230",
  businessType: "DEALER",
  // ... other fields
}
```

### Offer with Linked Seller
```javascript
{
  offerId: "f1e2d3c4-b5a6-7890-1234-567890fedcba",
  sellerId: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  vin: "ABC123XYZ789DEFGH",
  make: "Toyota",
  model: "Camry",
  year: 2022,
  price: 1500000,
  sellerInfo: {
    name: "Rajesh Kumar",
    businessType: "DEALER",
    phone: "+917894561230"
  }
  // ... other fields
}
```

## 🚨 Prerequisites

### Required Services
Make sure all services are running:
```bash
docker-compose up -d
```

Services needed:
- `user-service` (port 3005)
- `offer-service` (port 3001) 
- `purchase-service` (port 3002)
- `transport-service` (port 3003)

### Required Dependencies
```bash
npm install uuid
```

## 📈 Performance Tips

1. **Start Small**: Begin with low numbers to verify everything works
2. **Monitor Resources**: Watch CPU and memory usage during generation
3. **API Health**: Ensure all services are responsive before large runs
4. **Incremental Approach**: Use reasonable increments (5-50 for testing, 100+ for production)
5. **Error Analysis**: Review error patterns to identify API bottlenecks

## 🐛 Troubleshooting

### Common Issues

#### "No sellers found in user pool"
- Increase the user count or ensure user creation succeeds
- Check user service availability

#### "Too many API failures"
- Reduce batch size or worker count
- Check service health and logs
- Increase timeout values if needed

#### "Failed to create any users"
- Verify user service is running on correct port
- Check API endpoint and request format
- Review service logs for detailed errors

#### Memory Issues with Large Numbers
- Reduce concurrent workers
- Decrease batch sizes  
- Add delays between batches

## 🔄 Migration from Old Script

The enhanced script is backward compatible. Old CLI options still work:

**Old**: `node massive-data-generator.js --records 1000 --workers 4`
**New**: `node massive-data-generator.js --start 50 --max 1000 --increment 50 --workers 4`

The new script provides much better user type management and UUID consistency.