# 🚗 Search Hub - Frontend Interface

A unified, enterprise-grade search interface for an automotive marketplace. This React application provides a centralized search experience for multiple user roles (Sellers, Buyers, Carriers, and Agents), replacing fragmented search bars with a single, intelligent portal.



## 🎯 Frontend Problem Statement

Automotive marketplaces often suffer from "Fragmented Search Syndrome," where every page (Orders, Inventory, Logistics) has a different search bar with different behavior. 

**The Solution:** A centralized React UI that dynamically adapts its schema, filters, and permissions based on the user's role, providing a "Google-like" universal search experience for vehicle data.

## 👥 Role-Based UI Logic

The frontend implementation handles data visibility through **Context-Aware Rendering**:

* **Sellers**: UI restricted to "My Offers." High visibility on vehicle VIN and price.
* **Buyers**: Dual-view interface for "Available Marketplace" and "My Purchases."
* **Carriers**: Logistics-focused view displaying Transport IDs and delivery status.
* **Agents**: "Universal View" with the ability to search across all entities simultaneously to assist customers.

## 🚀 Frontend Features

### 🔍 Search Intelligence
* **Real-time Autocomplete**: Debounced search suggestions as you type.
* **Typo Tolerance**: Visual indicators for corrected search terms.
* **Highlighting**: Highlighting search matches within VINs, IDs, and descriptions.
* **Entity Detection**: UI identifies if a user is typing a VIN or a Phone Number and adjusts search priority.

### 🛠️ UI Components (shadcn/ui)
* **Advanced Filter Sidebar**: Sliding panel for multi-criteria filtering (Make, Model, Year, Price).
* **Conditional UI**: Fields like "Vehicle Images" only appear when specific status filters are active.
* **Result Grouping**: Clean layouts that separate Offers, Purchases, and Transports into scannable sections.
* **Responsive Grid**: Optimized layouts for mobile (Carriers) and desktop (Call Centers).

## 🛠️ Tech Stack

* **React 18.3.1** - UI framework (Hooks & Functional Components).
* **TypeScript 5.8.3** - Strict typing for Automotive entities.
* **Vite 5.4.19** - Fast build tool and dev server.
* **Tailwind CSS 3.4.17** - Utility-first styling.
* **shadcn/ui** - Accessible component primitives.
* **Lucide React** - Icon library for vehicle types and status indicators.

## 📁 Project Structure

```text
src/
├── components/           # UI Components
│   ├── SearchBar/        # Autocomplete & Input logic
│   ├── Filters/          # Sidebar & Filter tags
│   ├── Results/          # Entity-specific cards (OfferCard, TransportCard)
│   └── ui/               # Base shadcn components
├── hooks/                # Custom React Hooks
│   ├── useSearch.ts      # Debouncing & API fetching logic
│   └── useUserContext.ts # Role & Permission management
├── lib/                  # Utilities
│   ├── api.ts            # Axios configuration & Interceptors
│   └── formatters.ts     # Currency and Date formatting
├── types/                # TypeScript Interfaces
│   └── search.ts         # Offer, Purchase, and Transport types
└── pages/
    └── Index.tsx         # Main Search Dashboard
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher) OR **Bun** runtime
- **Docker** (for containerized development)
- **Git**

### 🐳 Docker Setup (Recommended)

The easiest way to get started is using Docker:

#### 1. Clone the repository
```bash
git clone https://github.com/patelbinal/ai-demo-search-client.git
cd ai-demo-search-client
```

#### 2. Run with Docker Compose
```bash
# Build and start the application
docker-compose up --build

# Run in detached mode
docker-compose up -d --build
```

#### 3. Access the application
- **Frontend**: http://localhost:8080
- **Mock API** (if included): Available internally within the container

#### 4. Stop the application
```bash
docker-compose down
```

### 💻 Local Development Setup

#### Option 1: Using Bun (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/patelbinal/ai-demo-search-client.git
cd ai-demo-search-client

# 2. Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# 3. Install dependencies
bun install

# 4. Start development server
bun run dev

# 5. (Optional) Run with mock API
bun run dev:full
```

#### Option 2: Using npm/yarn

```bash
# 1. Clone the repository
git clone https://github.com/patelbinal/ai-demo-search-client.git
cd ai-demo-search-client

# 2. Install dependencies
npm install
# or
yarn install

# 3. Start development server
npm run dev
# or
yarn dev

# 4. (Optional) Run with mock API
npm run dev:full
# or
yarn dev:full
```

### 📱 Available Scripts

```bash
# Development
bun run dev          # Start Vite dev server
bun run dev:full     # Start both mock API and dev server

# Building
bun run build        # Production build
bun run build:dev    # Development build
bun run preview      # Preview production build

# Development Tools
bun run lint         # Run ESLint
bun run mock-api     # Start mock API server only
```

### 🌐 Application URLs

- **Development Server**: http://localhost:5173
- **Docker Container**: http://localhost:8080
- **Mock API Server**: http://localhost:3001 (when running `dev:full`)

### 🔧 Environment Configuration

Create a `.env` file in the root directory for environment-specific settings:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3001
VITE_ENVIRONMENT=development

# Optional: Enable/Disable features
VITE_ENABLE_MOCK_DATA=true
```

### 🧪 Development Notes

- The application uses **Vite** for fast hot-reload during development
- **Mock API** is available for testing without a backend
- All UI components are built with **shadcn/ui** for consistency
- **TypeScript** is configured for strict type checking

---
    └── Index.tsx         # Main Search Dashboard