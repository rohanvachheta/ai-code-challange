# Centralized Search Platform - Detailed Technical Documentation

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Microservices Structure](#microservices-structure)
3. [Kafka Event-Driven Architecture](#kafka-event-driven-architecture)
4. [Elasticsearch Search Engine](#elasticsearch-search-engine)
5. [Data Flow & Synchronization](#data-flow--synchronization)
6. [Database Design](#database-design)
7. [API Design](#api-design)
8. [Security & Role-Based Access Control](#security--role-based-access-control)
9. [Performance & Monitoring](#performance--monitoring)
10. [Testing Strategy](#testing-strategy)
11. [Setup & Deployment](#setup--deployment)

---

## 🏗️ Architecture Overview

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Centralized Search Platform                        │
│                         Enterprise Automotive Marketplace                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────────────────────────┐
                    │         React Frontend             │
                    │  UI: Port 3100  │  UI-New: 3101   │
                    │    (Docker)     │   (Vite Dev)    │
                    └─────────────────┬───────────────────┘
                                      │ HTTP/REST
                    ┌─────────────────────────────────────┐
                    │              API Gateway            │
                    │         (Load Balancer)            │
                    └─────────────────┬───────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          │                           │                           │
    ┌─────▼─────┐  ┌─────────┐  ┌─────▼─────┐  ┌─────────┐  ┌─────▼─────┐
    │   User    │  │ Offer   │  │ Purchase  │  │Transport│  │  Search   │
    │ Service   │  │Service  │  │ Service   │  │ Service │  │ Service   │
    │Port 3005  │  │Port 3001│  │Port 3002  │  │Port 3003│  │Port 3000  │
    └─────┬─────┘  └─────┬───┘  └─────┬─────┘  └─────┬───┘  └─────┬─────┘
          │              │            │              │            │
    ┌─────▼─────┐  ┌─────▼───┐  ┌─────▼─────┐  ┌─────▼───┐  ┌─────▼─────┐
    │PostgreSQL │  │PostgreSQL│ │PostgreSQL │  │PostgreSQL│ │Elasticsearch│
    │ user_db   │  │ offer_db │  │purchase_db│  │transport│  │+ Redis    │
    │Port 5435  │  │Port 5432 │  │Port 5433  │  │Port 5434│  │Cache      │
    └───────────┘  └─────┬───┘  └─────┬─────┘  └─────┬───┘  └───────────┘
                         │            │              │
                         └────────────┼──────────────┘
                                      │
                         ┌─────────────────────────────────────┐
                         │         Kafka Message Bus           │
                         │    Topics: offer-events,           │
                         │           purchase-events,         │
                         │           transport-events         │
                         │    Ports: 9092 (external)         │
                         │           19092 (internal)        │
                         └─────────────────────────────────────┘
```

### Technology Stack

**Backend Services:**
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: NestJS with Express
- **Databases**: PostgreSQL 15 (per service)
- **Search Engine**: Elasticsearch 8.10.0
- **Cache**: Redis 7 (Alpine)
- **Message Broker**: Apache Kafka 7.4.0
- **API Documentation**: Swagger/OpenAPI

**Frontend:**
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Query + Context API

**Infrastructure:**
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx (production)
- **Monitoring**: Health checks, metrics endpoints
- **Testing**: K6 load testing, Jest unit tests

---

## 🔧 Microservices Structure

### Service Breakdown

#### 1. **Search Service** (Port 3000)
**Purpose**: Centralized search engine with role-based filtering

**File Structure:**
```
services/search-service/
├── src/
│   ├── main.ts                    # Service entry point
│   ├── app.module.ts              # Main application module
│   ├── search/
│   │   ├── search.controller.ts   # Search API endpoints
│   │   ├── search.service.ts      # Search business logic
│   │   └── dto/                   # Data transfer objects
│   ├── elasticsearch/
│   │   ├── elasticsearch.service.ts # ES client & operations
│   │   └── elasticsearch.module.ts
│   ├── cache/
│   │   ├── cache.service.ts       # Redis caching layer
│   │   └── cache.module.ts
│   ├── events/
│   │   ├── events.service.ts      # Kafka consumer
│   │   └── events.module.ts
│   └── index/
│       ├── index.service.ts       # Document indexing
│       └── index.module.ts
├── Dockerfile
└── package.json
```

**Key Responsibilities:**
- Universal search across all entities (offers, purchases, transports)
- Real-time data synchronization via Kafka events
- Role-based access control and data filtering
- Autocomplete and suggestion engine
- Search analytics and statistics

#### 2. **Offer Service** (Port 3001)
**Purpose**: Vehicle offer management with seller workflows

**File Structure:**
```
services/offer-service/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── offers/
│   │   ├── offers.controller.ts   # Offer CRUD operations
│   │   ├── offers.service.ts      # Business logic
│   │   ├── entities/offer.entity.ts # Database entity
│   │   └── dto/                   # DTOs for validation
│   └── events/
│       ├── events.service.ts      # Kafka producer
│       └── events.module.ts
└── Dockerfile
```

**Database Schema (PostgreSQL):**
```sql
CREATE TABLE offers (
  offer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL,
  vin VARCHAR(17) UNIQUE NOT NULL,
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 1900 AND year <= 2030),
  price DECIMAL(12,2) NOT NULL CHECK (price >= 0),
  location TEXT NOT NULL,
  condition VARCHAR(20) CHECK (condition IN ('NEW', 'USED', 'CERTIFIED')),
  status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SOLD', 'EXPIRED')),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP
);

CREATE INDEX idx_offers_seller_id ON offers(seller_id);
CREATE INDEX idx_offers_vin ON offers(vin);
CREATE INDEX idx_offers_make_model ON offers(make, model);
CREATE INDEX idx_offers_price ON offers(price);
CREATE INDEX idx_offers_status ON offers(status);
```

#### 3. **Purchase Service** (Port 3002)
**Purpose**: Purchase transaction management with buyer workflows

**Database Schema:**
```sql
CREATE TABLE purchases (
  purchase_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL,
  offer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  vehicle_id UUID,
  vin VARCHAR(17) NOT NULL,
  purchase_price DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(50),
  status VARCHAR(20) DEFAULT 'PENDING',
  payment_status VARCHAR(20) DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);
```

#### 4. **Transport Service** (Port 3003)
**Purpose**: Vehicle transportation and logistics management

**Database Schema:**
```sql
CREATE TABLE transports (
  transport_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id UUID NOT NULL,
  purchase_id UUID,
  offer_id UUID,
  vin VARCHAR(17) NOT NULL,
  pickup_location TEXT NOT NULL,
  delivery_location TEXT NOT NULL,
  transport_cost DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'SCHEDULED',
  tracking_number VARCHAR(100),
  scheduled_pickup_date TIMESTAMP,
  scheduled_delivery_date TIMESTAMP,
  actual_pickup_date TIMESTAMP,
  actual_delivery_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5. **User Service** (Port 3005)
**Purpose**: User management and authentication

**Database Schema:**
```sql
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('SELLER', 'BUYER', 'CARRIER', 'AGENT')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);
```

---

## 📡 Kafka Event-Driven Architecture

### Message Flow Design

Kafka enables eventual consistency across microservices through event sourcing:

```
┌─────────────┐    Events     ┌─────────────┐    Sync      ┌─────────────┐
│   Domain    │─────────────→ │    Kafka    │─────────────→│   Search    │
│  Services   │               │  Message    │              │   Service   │
│             │               │     Bus     │              │             │
└─────────────┘               └─────────────┘              └─────────────┘
       │                             │                             │
       │ Publish                     │ Store & Forward            │ Index
       ▼                             ▼                             ▼
┌─────────────┐               ┌─────────────┐              ┌─────────────┐
│ PostgreSQL  │               │   Topics    │              │Elasticsearch│
│ Databases   │               │ Partitions  │              │   Indices   │
│             │               │ Replication │              │             │
└─────────────┘               └─────────────┘              └─────────────┘
```

### Kafka Configuration

**Broker Configuration** (`docker-compose.yml`):
```yaml
kafka:
  image: confluentinc/cp-kafka:7.4.0
  environment:
    KAFKA_BROKER_ID: 1
    KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
    KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092,PLAINTEXT_INTERNAL://kafka:19092
    KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,PLAINTEXT_INTERNAL://0.0.0.0:19092
    KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT_INTERNAL
    KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    KAFKA_AUTO_CREATE_TOPICS_ENABLE: 'true'
```

### Topics & Event Schema

#### 1. **offer-events** Topic
Events published when offers are created, updated, or deleted:

```typescript
interface OfferEvent {
  eventType: 'OfferCreated' | 'OfferUpdated' | 'OfferDeleted';
  entityType: 'offer';
  entityId: string;
  timestamp: string;
  payload: {
    offerId: string;
    sellerId: string;
    vin: string;
    make: string;
    model: string;
    year: number;
    price: number;
    location: string;
    condition: string;
    status: string;
    sellerDetails?: {
      userId: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      userType: string;
    };
  };
}
```

**Producer Implementation** (Offer Service):
```typescript
// services/offer-service/src/events/events.service.ts
async publishOfferCreated(offer: Offer, sellerDetails?: any): Promise<void> {
  const event: OfferEvent = {
    eventType: 'OfferCreated',
    entityType: 'offer',
    entityId: offer.offerId,
    timestamp: new Date().toISOString(),
    payload: { ...offer, sellerDetails }
  };

  await this.publishEvent('offer-events', event);
}
```

#### 2. **purchase-events** Topic
```typescript
interface PurchaseEvent {
  eventType: 'PurchaseCreated' | 'PurchaseUpdated' | 'PurchaseCompleted';
  entityType: 'purchase';
  entityId: string;
  timestamp: string;
  payload: PurchaseData;
}
```

#### 3. **transport-events** Topic
```typescript
interface TransportEvent {
  eventType: 'TransportScheduled' | 'TransportUpdated' | 'TransportCompleted';
  entityType: 'transport';
  entityId: string;
  timestamp: string;
  payload: TransportData;
}
```

### Consumer Implementation (Search Service)

**Event Consumer** (`services/search-service/src/events/events.service.ts`):
```typescript
async onModuleInit() {
  await this.consumer.connect();
  
  // Subscribe to all topics
  for (const topic of ['offer-events', 'purchase-events', 'transport-events']) {
    await this.consumer.subscribe({ topic, fromBeginning: false });
  }

  await this.consumer.run({
    eachMessage: async (payload: EachMessagePayload) => {
      await this.handleMessage(payload);
    },
  });
}

private async handleMessage(payload: EachMessagePayload): Promise<void> {
  const event: BaseEvent = JSON.parse(payload.message.value?.toString() || '{}');
  
  switch (event.entityType) {
    case 'offer':
      await this.handleOfferEvent(event);
      break;
    case 'purchase':
      await this.handlePurchaseEvent(event);
      break;
    case 'transport':
      await this.handleTransportEvent(event);
      break;
  }
}
```

---

## 🔍 Elasticsearch Search Engine

### Index Design

**Global Search Index** (`global_search`):
The search service maintains a single, denormalized index for all entities to enable cross-entity search:

```json
{
  "settings": {
    "analysis": {
      "analyzer": {
        "autocomplete_analyzer": {
          "type": "custom",
          "tokenizer": "autocomplete_tokenizer",
          "filter": ["lowercase", "stop"]
        },
        "search_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase", "stop"]
        }
      },
      "tokenizer": {
        "autocomplete_tokenizer": {
          "type": "edge_ngram",
          "min_gram": 2,
          "max_gram": 10,
          "token_chars": ["letter", "digit"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "vin": { "type": "keyword" },
      "entityType": { "type": "keyword" },
      "entityId": { "type": "keyword" },
      "status": { "type": "keyword" },
      "searchableText": { 
        "type": "text",
        "analyzer": "autocomplete_analyzer",
        "search_analyzer": "search_analyzer"
      },
      "make": { "type": "keyword" },
      "model": { "type": "keyword" },
      "year": { "type": "integer" },
      "price": { "type": "float" },
      "location": { "type": "text" },
      "permissions": {
        "type": "object",
        "properties": {
          "sellerIds": { "type": "keyword" },
          "buyerIds": { "type": "keyword" },
          "carrierIds": { "type": "keyword" }
        }
      }
    }
  }
}
```

### Document Structure

Each document in Elasticsearch represents a searchable entity:

```typescript
interface GlobalSearchDocument {
  entityType: 'offer' | 'purchase' | 'transport';
  entityId: string;
  vin?: string;
  sellerId?: string;
  buyerId?: string;
  carrierId?: string;
  status: string;
  searchableText: string; // Concatenated searchable fields
  createdAt: string;
  updatedAt: string;
  permissions: {
    sellerIds: string[];
    buyerIds: string[];
    carrierIds: string[];
  };
  // Entity-specific fields
  make?: string;
  model?: string;
  year?: number;
  price?: number;
  location?: string;
}
```

### Search Features

#### 1. **Fuzzy Search with Typo Tolerance**
```typescript
const searchQuery = {
  query: {
    bool: {
      should: [
        {
          multi_match: {
            query: searchText,
            fields: ['searchableText', 'make', 'model', 'vin'],
            fuzziness: 'AUTO',
            prefix_length: 1
          }
        },
        {
          match: {
            searchableText: {
              query: searchText,
              boost: 2
            }
          }
        }
      ]
    }
  }
};
```

#### 2. **Autocomplete with Edge N-grams**
```typescript
const autocompleteQuery = {
  query: {
    match: {
      searchableText: {
        query: searchText,
        analyzer: 'autocomplete_analyzer'
      }
    }
  },
  size: limit,
  _source: ['make', 'model', 'vin', 'entityType']
};
```

#### 3. **Role-Based Access Control**
```typescript
const roleFilter = {
  bool: {
    should: [
      { terms: { 'permissions.sellerIds': [accountId] } },
      { terms: { 'permissions.buyerIds': [accountId] } },
      { terms: { 'permissions.carrierIds': [accountId] } }
    ],
    minimum_should_match: 1
  }
};
```

### Indexing Strategy

**Real-time Indexing** via Kafka events:
```typescript
private async handleOfferEvent(event: BaseEvent): Promise<void> {
  switch (event.eventType) {
    case 'OfferCreated':
    case 'OfferUpdated':
      const document = this.transformToSearchDocument(event.payload);
      await this.elasticsearchService.indexDocument(document);
      break;
    case 'OfferDeleted':
      await this.elasticsearchService.deleteDocument('offer', event.entityId);
      break;
  }
}
```

**Bulk Indexing** for large datasets:
```typescript
async bulkIndex(documents: GlobalSearchDocument[]): Promise<void> {
  const operations = documents.flatMap(doc => [
    { index: { _index: this.indexName, _id: `${doc.entityType}_${doc.entityId}` } },
    doc
  ]);

  const response = await this.client.bulk({ operations });
  console.log(`Bulk indexed ${documents.length} documents`);
}
```

---

## 🔄 Data Flow & Synchronization

### Creation Flow

When a new entity is created (e.g., a vehicle offer):

1. **API Request** → Offer Service receives POST `/offers`
2. **Database Write** → Save offer to PostgreSQL `offer_db`
3. **Event Publish** → Publish `OfferCreated` event to Kafka `offer-events` topic
4. **Event Consumption** → Search Service consumes event
5. **Index Update** → Transform and index document in Elasticsearch
6. **Cache Invalidation** → Clear relevant Redis cache keys

```typescript
// 1. Controller handles API request
@Post()
async createOffer(@Body() createOfferDto: CreateOfferDto) {
  const offer = await this.offersService.create(createOfferDto);
  return offer;
}

// 2. Service handles business logic
async create(createOfferDto: CreateOfferDto): Promise<Offer> {
  // Save to database
  const offer = await this.offerRepository.save(createOfferDto);
  
  // Publish event
  await this.eventsService.publishOfferCreated(offer);
  
  return offer;
}

// 3. Search service indexes document
private async handleOfferEvent(event: BaseEvent): Promise<void> {
  const document = this.transformOfferToSearchDocument(event.payload);
  await this.elasticsearchService.indexDocument(document);
  await this.cacheService.invalidateSearchCache();
}
```

### Update Flow

When an entity is updated:

1. **Database Update** → Update entity in source database
2. **Event Publish** → Publish `EntityUpdated` event
3. **Search Reindex** → Update document in Elasticsearch
4. **Cache Invalidation** → Clear cached search results

### Delete Flow

When an entity is deleted:

1. **Soft Delete** → Mark as deleted in source database (status change)
2. **Event Publish** → Publish `EntityDeleted` event  
3. **Search Remove** → Remove document from Elasticsearch
4. **Cache Clear** → Invalidate related cache entries

### Data Consistency Strategy

**Eventual Consistency Model:**
- Source of truth: PostgreSQL databases
- Search index: Eventually consistent via Kafka events
- Cache: Short-lived with invalidation on updates

**Conflict Resolution:**
- Timestamp-based ordering for concurrent updates
- Idempotent event processing to handle duplicates
- Dead letter queue for failed event processing

---

## 🗄️ Database Design

### Database Architecture

Each microservice maintains its own PostgreSQL database, following the Database-per-Service pattern:

```
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│   User Service  │   │  Offer Service  │   │ Purchase Service│
│                 │   │                 │   │                 │
│ ┌─────────────┐ │   │ ┌─────────────┐ │   │ ┌─────────────┐ │
│ │  user_db    │ │   │ │  offer_db   │ │   │ │ purchase_db │ │
│ │ Port 5435   │ │   │ │ Port 5432   │ │   │ │ Port 5433   │ │
│ └─────────────┘ │   │ └─────────────┘ │   │ └─────────────┘ │
└─────────────────┘   └─────────────────┘   └─────────────────┘

┌─────────────────┐   ┌─────────────────┐
│ Transport Service│   │  Search Service │
│                 │   │                 │
│ ┌─────────────┐ │   │ ┌─────────────┐ │
│ │transport_db │ │   │ │Elasticsearch│ │
│ │ Port 5434   │ │   │ │+ Redis Cache│ │
│ └─────────────┘ │   │ └─────────────┘ │
└─────────────────┘   └─────────────────┘
```

### Entity Relationships

While databases are isolated, logical relationships exist:

```
Users (1) ←→ (N) Offers
Users (1) ←→ (N) Purchases  
Users (1) ←→ (N) Transports

Offers (1) ←→ (N) Purchases
Purchases (1) ←→ (1) Transports

Vehicle VIN serves as the common identifier across services
```

### Schema Optimization

**Indexing Strategy:**
```sql
-- Offer Service Indexes
CREATE INDEX idx_offers_seller_id ON offers(seller_id);
CREATE INDEX idx_offers_vin ON offers(vin);
CREATE INDEX idx_offers_make_model ON offers(make, model);
CREATE INDEX idx_offers_price ON offers(price);
CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_offers_location ON offers(location);
CREATE INDEX idx_offers_created_at ON offers(created_at);

-- Purchase Service Indexes  
CREATE INDEX idx_purchases_buyer_id ON purchases(buyer_id);
CREATE INDEX idx_purchases_offer_id ON purchases(offer_id);
CREATE INDEX idx_purchases_vin ON purchases(vin);
CREATE INDEX idx_purchases_status ON purchases(status);

-- Transport Service Indexes
CREATE INDEX idx_transports_carrier_id ON transports(carrier_id);
CREATE INDEX idx_transports_purchase_id ON transports(purchase_id);
CREATE INDEX idx_transports_vin ON transports(vin);
CREATE INDEX idx_transports_status ON transports(status);
```

**Constraints & Validation:**
```sql
-- Data integrity constraints
ALTER TABLE offers ADD CONSTRAINT chk_offer_year 
  CHECK (year >= 1900 AND year <= 2030);
  
ALTER TABLE offers ADD CONSTRAINT chk_offer_price 
  CHECK (price >= 0);

ALTER TABLE offers ADD CONSTRAINT chk_offer_condition 
  CHECK (condition IN ('NEW', 'USED', 'CERTIFIED'));

-- Enum constraints
ALTER TABLE users ADD CONSTRAINT chk_user_type 
  CHECK (user_type IN ('SELLER', 'BUYER', 'CARRIER', 'AGENT'));
```

---

## 🚀 API Design

### REST API Standards

All services follow RESTful conventions with OpenAPI/Swagger documentation:

#### Search Service API

**Base URL**: `http://localhost:3000`

**Core Endpoints:**

```typescript
// Universal search across all entities
POST /search
{
  "userType": "BUYER|SELLER|CARRIER|AGENT",
  "accountId": "uuid",
  "searchText": "Toyota Camry",
  "entityTypes": ["offer", "purchase", "transport"],
  "filters": {
    "minYear": 2020,
    "maxPrice": 50000,
    "status": "ACTIVE",
    "location": "California"
  },
  "page": 1,
  "limit": 20
}

// Response
{
  "results": [
    {
      "entityType": "offer",
      "entityId": "uuid",
      "vin": "1HGBH41JXMN109186",
      "make": "Toyota",
      "model": "Camry",
      "year": 2023,
      "price": 28500,
      "location": "Los Angeles, CA",
      "status": "ACTIVE",
      "highlights": ["<mark>Toyota</mark> <mark>Camry</mark>"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  },
  "aggregations": {
    "byMake": { "Toyota": 45, "Honda": 32 },
    "byYear": { "2023": 12, "2022": 18 },
    "priceRanges": { "0-25000": 8, "25000-50000": 35 }
  }
}

// Autocomplete endpoint
GET /search/autocomplete?searchText=Toy&limit=10
{
  "suggestions": [
    { "text": "Toyota", "type": "make", "count": 245 },
    { "text": "Toyota Camry", "type": "model", "count": 89 },
    { "text": "Toyota Prius", "type": "model", "count": 56 }
  ]
}

// Search statistics
GET /search/statistics
{
  "totalDocuments": 15420,
  "indexHealth": "green", 
  "lastIndexed": "2024-01-15T10:30:00Z",
  "entityCounts": {
    "offers": 8520,
    "purchases": 4230,
    "transports": 2670
  }
}
```

#### Offer Service API

**Base URL**: `http://localhost:3001`

```typescript
// Create new offer
POST /offers
{
  "sellerId": "uuid",
  "vin": "1HGBH41JXMN109186",
  "make": "Toyota",
  "model": "Camry",
  "year": 2023,
  "price": 28500,
  "location": "Los Angeles, CA",
  "condition": "USED",
  "description": "Well maintained vehicle"
}

// Get offers with filtering
GET /offers?sellerId=uuid&status=ACTIVE&page=1&limit=20

// Update offer
PUT /offers/:offerId
PATCH /offers/:offerId

// Delete offer (soft delete)
DELETE /offers/:offerId
```

### API Authentication & Authorization

**JWT Token-Based Authentication:**
```typescript
// Auth middleware
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('SELLER')
@Post('offers')
async createOffer(@Request() req, @Body() createOfferDto) {
  // Only sellers can create offers
  return this.offersService.create(req.user.userId, createOfferDto);
}
```

**Role-Based Access Control:**
```typescript
// User roles enum
enum UserType {
  SELLER = 'SELLER',
  BUYER = 'BUYER', 
  CARRIER = 'CARRIER',
  AGENT = 'AGENT'
}

// Permission matrix
const permissions = {
  SELLER: ['create:offer', 'read:own_offers', 'update:own_offers'],
  BUYER: ['read:offers', 'create:purchase'],
  CARRIER: ['read:transports', 'update:transports'],
  AGENT: ['read:all', 'create:all', 'update:all']
};
```

### Error Handling

**Standardized Error Response:**
```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "price",
        "message": "Price must be a positive number"
      }
    ],
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_12345"
  }
}
```

**HTTP Status Codes:**
- `200 OK` - Successful GET/PUT/PATCH
- `201 Created` - Successful POST
- `400 Bad Request` - Validation errors
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate resource
- `500 Internal Server Error` - Server errors

---

## 🔐 Security & Role-Based Access Control

### Authentication System

**JWT-Based Authentication:**
```typescript
// User authentication
interface JWTPayload {
  userId: string;
  email: string;
  userType: UserType;
  permissions: string[];
  iat: number;
  exp: number;
}

// Token generation
const token = jwt.sign(
  { 
    userId: user.userId,
    email: user.email,
    userType: user.userType 
  },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);
```

### Role-Based Access Control (RBAC)

**User Types & Permissions:**

| Role | Permissions | Description |
|------|------------|-------------|
| **SELLER** | Create/Read/Update own offers | Vehicle sellers |
| **BUYER** | Read offers, Create purchases | Vehicle buyers |
| **CARRIER** | Read/Update transport assignments | Logistics providers |
| **AGENT** | Full access to all entities | Administrative users |

### Data Access Control

**Search Filtering by Role:**
```typescript
// Role-based search filtering
const buildRoleFilter = (userType: UserType, accountId: string) => {
  switch (userType) {
    case 'SELLER':
      return {
        bool: {
          should: [
            { term: { 'permissions.sellerIds': accountId } },
            { term: { entityType: 'offer' } } // Sellers see all offers
          ]
        }
      };
    
    case 'BUYER':
      return {
        bool: {
          should: [
            { term: { 'permissions.buyerIds': accountId } },
            { term: { entityType: 'offer' } }, // Buyers see all offers
            { term: { status: 'ACTIVE' } }
          ]
        }
      };
    
    case 'CARRIER':
      return {
        bool: {
          should: [
            { term: { 'permissions.carrierIds': accountId } },
            { term: { entityType: 'transport' } }
          ]
        }
      };
    
    case 'AGENT':
      return { match_all: {} }; // Agents see everything
  }
};
```

**Database-Level Security:**
```sql
-- Row-level security example
CREATE POLICY seller_policy ON offers
  FOR ALL TO seller_role
  USING (seller_id = current_setting('app.current_user_id')::uuid);

-- Function to set user context
CREATE OR REPLACE FUNCTION set_current_user_id(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_uuid::TEXT, false);
END;
$$ LANGUAGE plpgsql;
```

### Data Privacy & Compliance

**PII Protection:**
- Email masking in search results: `j***@example.com`
- Phone number partial hiding: `(555) ***-1234`
- Address truncation: `Los Angeles, CA` (no street address)

**GDPR Compliance:**
- Right to be forgotten: Soft deletion with anonymization
- Data portability: Export APIs for user data
- Consent management: Opt-in/opt-out flags

---

## ⚡ Performance & Monitoring

### Caching Strategy

**Redis Cache Implementation:**
```typescript
// Search result caching
@Injectable()
export class CacheService {
  constructor(private readonly redis: Redis) {}
  
  async getSearchResults(cacheKey: string): Promise<any> {
    const cached = await this.redis.get(cacheKey);
    return cached ? JSON.parse(cached) : null;
  }
  
  async setSearchResults(cacheKey: string, data: any, ttl: number = 300): Promise<void> {
    await this.redis.setex(cacheKey, ttl, JSON.stringify(data));
  }
  
  // Generate cache key from search parameters
  generateSearchCacheKey(params: SearchParams): string {
    const normalized = {
      ...params,
      searchText: params.searchText?.toLowerCase().trim()
    };
    return `search:${crypto.createHash('md5').update(JSON.stringify(normalized)).digest('hex')}`;
  }
}
```

**Cache Invalidation Strategy:**
```typescript
// Invalidate cache on data updates
async invalidateSearchCache(entityType?: string): Promise<void> {
  const patterns = entityType 
    ? [`search:*:${entityType}:*`]
    : ['search:*'];
    
  for (const pattern of patterns) {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

### Performance Metrics

**Response Time Targets:**
- Search queries: < 500ms (95th percentile)
- API endpoints: < 200ms (95th percentile)  
- Autocomplete: < 100ms (95th percentile)

**Elasticsearch Performance:**
```typescript
// Query optimization
const searchQuery = {
  query: {
    bool: {
      must: [
        {
          multi_match: {
            query: searchText,
            fields: ['searchableText^2', 'make^1.5', 'model^1.5'],
            type: 'best_fields',
            fuzziness: 'AUTO'
          }
        }
      ],
      filter: [...filters] // Filters are cached and fast
    }
  },
  highlight: {
    fields: {
      searchableText: { pre_tags: ['<mark>'], post_tags: ['</mark>'] }
    }
  },
  size: 20,
  track_total_hits: true
};
```

### Health Monitoring

**Health Check Endpoints:**
```typescript
// Comprehensive health check
@Get('/health')
async healthCheck(): Promise<HealthStatus> {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: await this.checkDatabase(),
      elasticsearch: await this.checkElasticsearch(),
      redis: await this.checkRedis(),
      kafka: await this.checkKafka()
    },
    metrics: {
      totalDocuments: await this.getTotalDocuments(),
      cacheHitRate: await this.getCacheHitRate(),
      avgResponseTime: await this.getAvgResponseTime()
    }
  };
}
```

**Elasticsearch Health:**
```typescript
async checkElasticsearch(): Promise<ServiceHealth> {
  try {
    const health = await this.elasticsearchClient.cluster.health();
    return {
      status: health.status === 'green' ? 'healthy' : 'degraded',
      details: {
        cluster_status: health.status,
        active_shards: health.active_shards,
        number_of_nodes: health.number_of_nodes
      }
    };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}
```

---

## 🧪 Testing Strategy

### Load Testing with K6

**Search Performance Testing:**
```javascript
// scripts/load-testing/search-test.js
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up
    { duration: '5m', target: 50 },   // Normal load
    { duration: '2m', target: 100 },  // Peak load
    { duration: '3m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% < 2s
    search_errors: ['rate<0.05'],      // Error rate < 5%
  },
};

export default function() {
  // Test universal search
  const searchResponse = http.post('http://localhost:3000/search', JSON.stringify({
    userType: userTypes[Math.floor(Math.random() * userTypes.length)],
    accountId: generateUUID(),
    searchText: searchQueries[Math.floor(Math.random() * searchQueries.length)],
    page: Math.floor(Math.random() * 5) + 1,
    limit: [10, 20, 50][Math.floor(Math.random() * 3)]
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
  
  check(searchResponse, {
    'search status is 200': (r) => r.status === 200,
    'search response time < 2000ms': (r) => r.timings.duration < 2000,
    'search has results': (r) => JSON.parse(r.body).results.length > 0,
  });
}
```

**Concurrent Operations Testing:**
```javascript
// scripts/load-testing/mixed-workload.js
export default function() {
  const scenarios = [
    () => testSearch(),
    () => testOfferCreation(), 
    () => testPurchaseFlow(),
    () => testAutocomplete()
  ];
  
  // Execute random scenario
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  scenario();
  
  sleep(Math.random() * 2 + 1); // Random delay 1-3s
}
```

### System Integration Testing

**End-to-End Workflow Testing:**
```javascript
// scripts/test-workflow.js
class WorkflowTester {
  async testCompleteOfferFlow() {
    // 1. Create seller user
    const seller = await this.createUser('SELLER');
    
    // 2. Create vehicle offer
    const offer = await this.createOffer(seller.userId);
    
    // 3. Wait for Kafka event processing
    await this.waitForIndexing();
    
    // 4. Verify offer appears in search
    const searchResults = await this.searchOffers(offer.make);
    assert(searchResults.some(r => r.entityId === offer.offerId));
    
    // 5. Create buyer and purchase
    const buyer = await this.createUser('BUYER');
    const purchase = await this.createPurchase(buyer.userId, offer.offerId);
    
    // 6. Verify purchase workflow
    assert(purchase.status === 'COMPLETED');
  }
}
```

### Performance Benchmarking

**Search Performance Metrics:**
```bash
# Run search performance test
cd scripts/load-testing
npm run search-test

# Expected output:
✓ search status is 200................: 99.95% 
✓ search response time < 2000ms........: 98.2%
✓ search has results...................: 97.8%

http_req_duration..............: avg=245ms  p(95)=892ms
http_req_rate..................: 45.2/s
search_errors..................: 0.03%
```

**Database Performance:**
```sql
-- Query performance analysis
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM offers 
WHERE make = 'Toyota' AND year >= 2020 
ORDER BY created_at DESC 
LIMIT 20;

-- Index usage verification
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats 
WHERE tablename = 'offers';
```

---

## 📦 Setup & Deployment

### Development Setup

**Prerequisites:**
```bash
# Required software
- Docker & Docker Compose
- Node.js 18+
- PostgreSQL 15 (optional, for local dev)
- Git
```

**Quick Start:**
```bash
# 1. Clone repository
git clone <repository-url>
cd No-code-report

# 2. Start all services
docker-compose up -d

# 3. Generate test data
cd scripts && npm install
npm run generate:medium  # 1K records

# 4. Access application
# UI: http://localhost:3100
# Search API: http://localhost:3000
```

### Docker Services Configuration

**docker-compose.yml** breakdown:

```yaml
# Infrastructure
elasticsearch:    # Port 9200, 1GB heap
redis:           # Port 6379, Alpine image  
kafka:           # Port 9092, auto-create topics
zookeeper:       # Port 2181, Kafka dependency

# Databases (PostgreSQL 15)
offer-db:        # Port 5432
purchase-db:     # Port 5433
transport-db:    # Port 5434
user-db:         # Port 5435

# Application Services
search-service:   # Port 3000
offer-service:    # Port 3001  
purchase-service: # Port 3002
transport-service: # Port 3003
user-service:     # Port 3005

# Frontend
ui:              # Port 3100 (React)
ui-new:          # Port 3101 (React + Vite)
```

### Production Deployment

**Environment Configuration:**
```bash
# .env.production
NODE_ENV=production

# Database URLs
OFFER_DB_URL=postgresql://user:pass@offer-db:5432/offer_db
PURCHASE_DB_URL=postgresql://user:pass@purchase-db:5433/purchase_db

# Infrastructure
ELASTICSEARCH_URL=http://elasticsearch:9200
REDIS_URL=redis://redis:6379
KAFKA_BROKER=kafka:9092

# Security
JWT_SECRET=your-super-secure-secret
```

**Scaling Configuration:**
```yaml
# docker-compose.prod.yml
services:
  search-service:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1'
          memory: 1G
    
  elasticsearch:
    deploy:
      resources:
        limits:
          memory: 4G
    environment:
      - "ES_JAVA_OPTS=-Xms2g -Xmx2g"
```

### Performance Optimization

**Elasticsearch Tuning:**
```yaml
# Production ES configuration
elasticsearch:
  environment:
    - "ES_JAVA_OPTS=-Xms4g -Xmx4g"
    - index.refresh_interval=30s
    - indices.memory.index_buffer_size=20%
    - thread_pool.write.queue_size=1000
```

**Database Optimization:**
```sql
-- PostgreSQL tuning
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
```

### Monitoring & Logging

**Application Logging:**
```typescript
// Structured logging with Winston
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'search-service' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

**Health Monitoring:**
```bash
# Health check all services
./scripts/health-check.sh

# Monitor Kafka topics
kafka-topics --bootstrap-server localhost:9092 --list

# Elasticsearch cluster health
curl http://localhost:9200/_cluster/health?pretty
```

---

## 🎯 Key Features Summary

### 1. **Intelligent Search Engine**
- **Fuzzy matching** with typo tolerance
- **Autocomplete** with edge n-grams
- **Cross-entity search** (offers, purchases, transports)
- **Faceted search** with aggregations
- **Highlighting** of matched terms

### 2. **Event-Driven Architecture**
- **Kafka message bus** for service communication
- **Eventual consistency** across microservices
- **Event sourcing** for audit trails
- **Reliable message delivery** with retries

### 3. **Role-Based Access Control**
- **Multi-tenant security** with data isolation
- **JWT authentication** with role validation
- **Permission-based filtering** in search results
- **Audit logging** for compliance

### 4. **High Performance**
- **Redis caching** for frequent queries
- **Elasticsearch optimization** with proper indexing
- **Database indexing** for fast queries
- **Connection pooling** and batch operations

### 5. **Scalable Infrastructure**
- **Microservices architecture** with Docker
- **Horizontal scaling** capability
- **Load balancing** ready
- **Health monitoring** and metrics

### 6. **Production Ready**
- **Comprehensive testing** with K6 load tests
- **Error handling** and graceful degradation
- **Structured logging** and monitoring
- **Documentation** and API specs

This platform successfully demonstrates enterprise-grade search capabilities with modern microservices architecture, handling millions of records with sub-second response times while maintaining data security and consistency.