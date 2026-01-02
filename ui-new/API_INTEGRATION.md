# Search API Integration

## Overview
The application now supports real API integration with your search endpoint at `http://localhost:3004/search`.

## API Details

### Endpoint
- **URL:** `http://localhost:3004/search`
- **Method:** `POST`
- **Content-Type:** `application/json`

### Request Payload
```json
{
  "userType": "AGENT",
  "accountId": "00000000-0000-0000-0000-000000000000",
  "searchText": " ",
  "page": 1,
  "limit": 20
}
```

### Response Format
```json
{
  "results": [
    {
      "entityType": "offer" | "purchase" | "transport",
      "entityId": "string",
      "vin": "string",
      "sellerId": "string",
      "status": "string",
      "searchableText": "string",
      "createdAt": "string",
      "updatedAt": "string",
      "permissions": {
        "sellerIds": ["string"],
        "buyerIds": ["string"],
        "carrierIds": ["string"]
      },
      // Entity-specific fields...
    }
  ],
  "total": 6,
  "page": 1,
  "limit": 20,
  "pages": 1
}
```

## Implementation

### Updated User Types
- User types now match API format: `"SELLER"`, `"BUYER"`, `"CARRIER"`, `"AGENT"`
- Default user context uses `"AGENT"` type with accountId `"00000000-0000-0000-0000-000000000000"`

### API Functions
- `fetchSearchResultsFromAPI()` - Makes real API calls
- `fetchSearchResults()` - Wrapper function that tries real API first, falls back to dummy data
- Automatic response transformation to match internal data structure

### Features
- **Automatic Fallback:** If API fails, automatically falls back to dummy data
- **Error Handling:** Comprehensive error handling with user-friendly messages
- **Type Safety:** Full TypeScript support with proper types
- **Response Transformation:** Converts API response format to internal format

## Usage

### Basic Search
The main search interface automatically uses the real API when available:

```typescript
const response = await fetchSearchResults(
  query,
  userContext,
  { page: 1, pageSize: 20 }
);
```

### Direct API Call
For direct API integration:

```typescript
const response = await fetchSearchResultsFromAPI(
  query,
  userContext,
  { page: 1, pageSize: 20 }
);
```

### Testing
A test component (`APITest`) is included in the development build to verify API connectivity.

## Configuration

### API URL
The API URL is configured in `/src/lib/api.ts`:

```typescript
const SEARCH_API_URL = "http://localhost:3004/search";
```

To change the endpoint, update this constant.

### Enable/Disable Real API
You can control API usage in the `fetchSearchResults` function:

```typescript
// Use real API (default)
await fetchSearchResults(query, userContext, pagination, "all", true);

// Use dummy data only
await fetchSearchResults(query, userContext, pagination, "all", false);
```

## Error Handling

The integration includes robust error handling:
- Network errors are caught and logged
- Falls back to dummy data on API failure
- User-friendly error messages in UI
- Console logging for debugging

## Development

### Starting the Application
```bash
npm run dev
```

### Testing API Integration
1. Start your API server at `http://localhost:3004`
2. Open the application
3. Use the "API Test" section to verify connectivity
4. Perform searches through the main interface

### Debugging
- Check browser console for detailed error logs
- Verify API server is running
- Check network tab for request/response details

## Production Deployment

Before deploying to production:

1. **Remove Test Component:** Remove the `APITest` component from `Index.tsx`
2. **Update API URL:** Change `SEARCH_API_URL` to production endpoint
3. **Environment Variables:** Consider using environment variables for API configuration
4. **Error Handling:** Ensure proper production error handling is in place

## Next Steps

Consider implementing:
- Environment-based API configuration
- Request caching for improved performance
- Real-time search suggestions
- Advanced filtering with API support
- Pagination with API integration
- User authentication integration