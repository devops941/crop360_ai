# Crop360 AI &mdash; Agricultural Intelligence Platform

> **Precision Soil Intelligence & End-to-End Crop Lifecycle Management**

Crop360 AI is a scalable, enterprise-grade Next.js application designed to help agricultural communities, agronomists, and farmers upload soil test reports, perform automated AI soil analysis, match optimal crop varieties, and orchestrate full cultivation lifecycles from seedbed preparation to harvest monetization.

---

## Architecture Foundation

The application implements a strict **layered clean architecture**:

```
Route Handler (src/app/api)
       ↓
Validation Layer (src/validators using Zod)
       ↓
Service Layer (src/services - Business Logic)
       ↓
Repository Layer (src/repositories - Data Access)
       ↓
MongoDB Models (src/models using Mongoose)
       ↓
MongoDB Database
```

### Architectural Principles
1. **Thin Route Handlers**: Route handlers only handle request parsing, invoke services, and format standardized responses.
2. **Encapsulated Business Logic**: Domain logic resides strictly in services.
3. **Dedicated Data Access**: Repositories encapsulate database queries using the centralized connection utility.
4. **Server-Side Security**: Database access is strictly confined to server-side code (`src/lib/mongodb.ts`). Database connection credentials and internal stack traces are never exposed to browser bundles.
5. **Standardized Responses**: All API endpoints return a uniform JSON format:
   ```json
   {
     "success": true,
     "message": "Operation description",
     "data": {},
     "timestamp": "2026-10-14T05:00:00.000Z"
   }
   ```

---

## Technology Stack

- **Framework**: Next.js 15 (App Router, Server Components & Route Handlers)
- **Frontend**: React 19, TypeScript (Strict Mode)
- **Styling**: Tailwind CSS with custom forest green (`#166534`) tokens and charcoal typography
- **Database**: MongoDB with Mongoose ODM (connection caching across hot-reloads)
- **Validation**: Zod schema validation
- **Icons & UI**: Lucide React
- **DevOps**: Docker, Docker Compose, GitHub Actions CI
- **Quality Tools**: ESLint, Prettier, TypeScript strict check

---

## Directory Structure

```
crop360-ai/
├── public/
│   ├── icons/            # App icons & SVGs
│   └── images/           # Static image assets
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # Route Handlers
│   │   │   ├── route.ts          # GET /api (API info)
│   │   │   ├── health/           # GET /api/health (System health)
│   │   │   └── health/db/        # GET /api/health/db (MongoDB connectivity)
│   │   ├── globals.css   # Tailwind design tokens
│   │   ├── layout.tsx    # Root layout & providers
│   │   ├── page.tsx      # Landing page & status monitor
│   │   ├── loading.tsx   # Loading state
│   │   ├── error.tsx     # Error boundary
│   │   └── not-found.tsx # 404 page
│   ├── components/
│   │   ├── common/       # Status indicators & shared widgets
│   │   ├── layout/       # Navbar, Footer
│   │   └── ui/           # Button, Card, Badge primitives
│   ├── config/
│   │   └── env.ts        # Zod-validated environment config
│   ├── lib/
│   │   ├── api-response.ts # Centralized JSON response helper
│   │   ├── logger.ts       # Structured JSON logging
│   │   └── mongodb.ts      # Hot-reload cached MongoDB connection
│   ├── models/           # Mongoose schemas & models
│   ├── repositories/     # Base & domain repositories
│   ├── services/         # Domain business services
│   ├── types/            # TypeScript interfaces & types
│   ├── utils/            # Shared utilities & cn()
│   └── validators/       # Zod schemas & request validators
├── .github/
│   └── workflows/
│       └── ci.yml        # GitHub Actions CI workflow
├── .editorconfig         # Editor formatting rules
├── .env.example          # Environment variable template
├── .gitignore            # Git ignore specification
├── .prettierrc           # Prettier configuration
├── .prettierignore       # Prettier ignore patterns
├── docker-compose.yml    # Multi-container orchestration
├── Dockerfile            # Multi-stage production container
├── next.config.ts        # Next.js configuration
├── package.json          # Dependencies & scripts
├── tsconfig.json         # Strict TypeScript compiler options
└── README.md
```

---

## Getting Started

### Prerequisites
- **Node.js**: v20 or v22+
- **npm**: v10+
- **MongoDB**: Local MongoDB instance (port 27017) OR Docker

### 1. Environment Configuration

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Default contents:
```env
MONGODB_URI=mongodb://localhost:27017/crop360_ai
MONGODB_DB_NAME=crop360_ai
NEXT_PUBLIC_APP_NAME=Crop360 AI
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Running Locally

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Docker Workflows

### Option A: Run MongoDB in Docker and Next.js locally
Start only the MongoDB container:
```bash
docker compose up -d mongodb
```
Then run Next.js on your host:
```bash
npm run dev
```

### Option B: Run both MongoDB and Next.js with Docker Compose
```bash
docker compose up --build
```
To stop the services:
```bash
docker compose down
```
To wipe persistent database volumes:
```bash
docker compose down -v
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Compile production build |
| `npm run start` | Launch production server |
| `npm run lint` | Run ESLint across code files |
| `npm run typecheck` | Run TypeScript compiler type-checking (`tsc --noEmit`) |
| `npm run format` | Auto-format files using Prettier |
| `npm run format:check` | Verify code formatting compliance |

---

## API Endpoints

### 1. GET `/api`
Returns general API information and discoverable endpoints.

**Example Response:**
```json
{
  "success": true,
  "message": "Crop360 AI API is online",
  "data": {
    "name": "Crop360 AI API",
    "version": "0.1.0",
    "description": "AI-driven comprehensive agriculture management API",
    "endpoints": {
      "health": "/api/health",
      "dbHealth": "/api/health/db"
    }
  },
  "timestamp": "2026-10-14T05:00:00.000Z"
}
```

### 2. GET `/api/health`
Returns application uptime, environment, and runtime metrics.

**Example Response:**
```json
{
  "success": true,
  "message": "Application is running normally",
  "data": {
    "status": "ok",
    "service": "Crop360 AI",
    "uptime": 124,
    "environment": "development",
    "version": "0.1.0"
  },
  "timestamp": "2026-10-14T05:00:00.000Z"
}
```

### 3. GET `/api/health/db`
Performs a live admin ping against the MongoDB database instance to verify real connectivity and latency.

**Example Response (Success - 200 OK):**
```json
{
  "success": true,
  "message": "MongoDB database connection is healthy and responsive",
  "data": {
    "status": "connected",
    "database": "crop360_ai",
    "latencyMs": 4
  },
  "timestamp": "2026-10-14T05:00:00.000Z"
}
```

**Example Response (Failure - 503 Service Unavailable):**
```json
{
  "success": false,
  "message": "Database connection unavailable",
  "error": {
    "code": "DATABASE_UNAVAILABLE"
  },
  "timestamp": "2026-10-14T05:00:00.000Z"
}
```

---

## CI / CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) executes on every push and pull request to `main`, `master`, and `develop`:
1. Checks out repository and configures Node.js 22.
2. Boots an ephemeral MongoDB 7.0 container with health checks.
3. Installs dependencies with `npm ci`.
4. Executes `npm run format:check`.
5. Executes `npm run lint`.
6. Executes `npm run typecheck`.
7. Executes `npm run build`.

---

## Future Modules Roadmap (Phase 2+)

1. **Farmer and Farm Management**: Geolocation, soil history, and farmer profiles.
2. **Field and Soil Test Reports**: PDF/Image upload, OCR, and NPK extraction.
3. **AI Soil Analysis**: Machine learning diagnosis of nutrient imbalances.
4. **Crop Suitability & Recommendation**: Recommendation engine matching weather & soil chemistry.
5. **Crop Lifecycle Planning**: Automated stage-by-stage agronomic advisories.
6. **Irrigation and Nutrient Management**: Water budgeting and fertilizer dosage calendars.
7. **Pest and Disease Analysis**: Visual diagnosis and integrated pest management (IPM).
8. **Harvest & Storage Planning**: Post-harvest moisture management and warehouse preservation.
9. **Market Analysis & Profit Estimation**: Commodity price forecasts and ROI modeling.
