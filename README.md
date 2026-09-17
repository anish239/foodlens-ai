# FoodLens AI

<div align="center">

**Scan. Understand. Eat Smarter.**

An enterprise-grade food intelligence platform that decodes packaged food labels, scans retail barcodes, evaluates nutritional density with deterministic scoring algorithms, verifies personal dietary compatibility, and provides explainable AI nutrition insights.

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%7C%20Mongoose-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-Multimodal_AI-8E75C2?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=flat-square)](LICENSE)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
  - [Three-Layer Separation of Concerns](#three-layer-separation-of-concerns)
  - [Product Resolution Pipeline](#product-resolution-pipeline)
  - [Deterministic Health Score Engine](#deterministic-health-score-engine)
  - [Dietary Compatibility Engine](#dietary-compatibility-engine)
  - [Grounded Gemini AI Layer](#grounded-gemini-ai-layer)
- [Technology Stack](#technology-stack)
- [Project Directory Structure](#project-directory-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Setup](#installation--setup)
  - [Running the Development Server](#running-the-development-server)
- [Environment Configuration](#environment-configuration)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Production Build & Deployment](#production-build--deployment)
- [REST API Reference](#rest-api-reference)
  - [Health & System](#health--system)
  - [Authentication](#authentication)
  - [User Profile & Preferences](#user-profile--preferences)
  - [Products & Intelligence](#products--intelligence)
  - [Scan History & Favorites](#scan-history--favorites)
  - [Analytics](#analytics)
- [Security Architecture](#security-architecture)
- [Disclaimers](#disclaimers)
- [License](#license)

---

## Overview

Modern grocery shelves are packed with ultra-processed foods, confusing nutrition claims, and complex ingredient lists. **FoodLens AI** bridges the gap between opaque ingredient panels and consumer wellness by transforming raw food data into actionable, trustworthy intelligence.

Unlike generic AI applications that hallucinate nutrition facts or delegate critical calculations to large language models, FoodLens AI is architected on a **deterministic-first foundation**:

1. **Facts are verified from authoritative food registries** (Open Food Facts, secondary barcode providers, and the USDA FoodData Central database).
2. **Health scores and dietary compatibility are computed using strict mathematical algorithms** that never hallucinate, drift, or change between identical runs.
3. **Google Gemini AI is deployed exclusively as a contextual explanation and synthesis engine**, grounded in the verified numbers and constrained by structured JSON schemas.

---

## Key Features

### 📷 High-Precision Barcode Scanner
- **Direct Canvas Frame Analysis**: Uses `@zxing/library` with direct canvas pixel extraction (`RGBLuminanceSource` and `HybridBinarizer`) to achieve sub-second barcode acquisition without cloud roundtrips.
- **Dual-Orientation Decoding**: Decodes standard horizontal frames and automatically evaluates 90-degree rotated buffers to scan vertical barcodes effortlessly.
- **Multi-Format Retail Support**: Decodes `EAN-13`, `UPC-A`, `EAN-8`, `UPC-E`, `CODE-128`, `CODE-39`, and `ITF`.
- **GS1 Modulo-10 Checksum Validation**: Validates barcode integrity before dispatching network requests, catching transmission errors and optical artifacts before they hit downstream services.
- **Hardware Integration**: Features continuous autofocus (`focusMode: continuous`), LED torch control where supported, camera switching, and manual barcode entry fallback.

### 🌐 Multi-Source Product Resolution
- **Tiered Provider Cascade**: Queries Open Food Facts as the primary registry, falls back to a secondary barcode provider when products are missing, and queries the USDA FoodData Central database by GTIN or FDC ID for missing macro/micronutrient fields.
- **Truthful Normalization**: Standardizes nutrients to per-100g values, categorizes NOVA ultra-processing groups (1–4), parses Nutri-Score grades (A–E), and explicitly preserves missing values as `null` rather than manufacturing fake estimates.
- **Deduplication & In-Memory Caching**: Implements bounded in-memory caching and in-flight request deduplication to prevent redundant external API calls during rapid repeated scans.

### 🧮 Explainable FoodLens Health Score (0–100)
- **Deterministic Algorithm**: Starts at a baseline of 100 points and applies mathematically documented deductions and bonuses.
- **Nutritional Penalties**: Deducts points for high sugar, elevated saturated fat, high sodium/salt concentration, ultra-processing markers (NOVA 4), and low Nutri-Score ratings (D/E).
- **Nutritional Density Bonuses**: Awards points for dietary fiber, lean protein density, minimally processed formulations (NOVA 1/2), and high Nutri-Score ratings (A/B).
- **Transparent Score Breakdown**: Returns every contributing factor, measured nutrient value, point delta, and plain-English explanation for total transparency.
- **Descriptive Grade Bands**: Maps scores to standardized tiers: **Excellent** (90–100), **Good** (75–89), **Fair** (60–74), **Poor** (40–59), and **Very Poor** (<40).

### 🛡️ Deterministic Dietary Compatibility Engine
- **Lifestyle Matching**: Verifies compatibility against Vegetarian, Vegan, Eggetarian, Pescatarian, and Non-Vegetarian dietary regimens.
- **Deep Allergen Detection**: Scans declared allergens, traces, and uncurated ingredient lists against multi-language aliases (Peanuts, Tree Nuts, Milk/Dairy, Lactose, Soy, Egg, Gluten/Wheat, Fish, Shellfish, and Sesame).
- **Dietary Restriction Rules**: Enforces gluten-free, lactose-free, dairy-free, nut-free, peanut-free, soy-free, and egg-free filters.
- **Health Goal Alignment**: Cross-references nutritional content against personal goals including low-sugar, low-sodium, high-protein, and high-fiber.
- **Clear Tri-State Status**: Categorizes products as `compatible` (safe match), `caution` (trace warning or missing critical data), or `not_compatible` (direct conflict).

### 🤖 Grounded Gemini AI Insights
- **Evidence-Grounded Explanations**: Uses the Google Gemini model (`@google/genai`) to generate natural-language product summaries, ingredient breakdowns, and tailored consumer takeaways.
- **Strict Structured Output**: Enforces strict JSON schemas with bounded fields for summary, highlights, concerns, score explanations, and actionable advice.
- **Prompt Injection Defense**: Encapsulates untrusted product names, labels, and ingredient strings inside explicit data boundaries, instructing the model to treat raw product content strictly as data rather than instructions.
- **Zero-Downtime Deterministic Fallback**: If the Gemini API experiences network timeouts, quota limits, or transient outages, the system automatically falls back to a deterministic rule-based insight generator so users always receive meaningful guidance.

### ⚖️ Side-by-Side Product Comparison
- **Multi-Product Matrix**: Compare 2 to 4 food products simultaneously on a responsive comparison grid.
- **Cross-Metric Evaluation**: Compare FoodLens Health Scores, Nutri-Scores, NOVA processing groups, energy, macronutrients, allergens, and dietary compatibility side-by-side.
- **Direct Search & Add**: Add products directly via barcode search modal or from existing scan records.

### 📊 Scan History, Favorites & Personal Analytics
- **Personalized History**: Automatically logs scan events with full product snapshots, scores, and compatibility statuses.
- **Favorites Collection**: Bookmark frequently purchased foods for quick lookup and comparison.
- **Nutritional Analytics**: Aggregates scan history into score distributions, dietary compliance percentages, and average nutrient densities over time.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                               CLIENT                                    │
│         React 19 • Vite • Tailwind CSS v4 • Lucide • Recharts           │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTPS / REST (JSON)
┌────────────────────────────────────▼────────────────────────────────────┐
│                       EXPRESS BACKEND SERVER                            │
│    Helmet Security • CORS Origin Lock • Rate Limiting • Correlation ID  │
└───────┬────────────────────┬────────────────────┬───────────────┬───────┘
        │                    │                    │               │
┌───────▼──────────┐ ┌───────▼──────────┐ ┌───────▼───────┐ ┌─────▼───────┐
│  MULTI-SOURCE    │ │   DETERMINISTIC  │ │   GROUNDED    │ │  PERSISTENCE│
│ PRODUCT RESOLVER │ │  SCORING ENGINES │ │  GEMINI AI    │ │    LAYER    │
├──────────────────┤ ├──────────────────┤ ├───────────────┤ ├─────────────┤
│ Open Food Facts  │ │ FoodLens Score   │ │ Structured    │ │ MongoDB     │
│ Secondary UPC    │ │ (0-100 Baseline) │ │ ResponseSchema│ │ Atlas       │
│ USDA FoodData    │ │ Compatibility    │ │ Deterministic │ │ (Mongoose)  │
│ Canonical Normal │ │ Lifestyle/Allergy│ │ Fallback      │ │             │
└──────────────────┘ └──────────────────┘ └───────────────┘ └─────────────┘
```

### Three-Layer Separation of Concerns

1. **Facts Layer (`server/services/productResolver.js`)**:
   Responsible for retrieving and normalizing raw data. It enforces canonical data schemas where every nutrient is expressed in standard units per 100g, allergen tags are cleaned, and missing values remain explicitly `null` to prevent false confidence.
2. **Deterministic Evaluation Layer (`server/services/scoreService.js`, `compatibilityService.js`)**:
   Pure mathematical functions without external dependencies. They receive normalized product facts and user preferences, outputting deterministic scores, grade classifications, and conflict arrays.
3. **AI Explanation Layer (`server/services/geminiService.js`)**:
   Consumes the verified product facts and deterministic evaluation outputs. Gemini translates structured metrics into accessible consumer guidance, governed by strict JSON schemas and prompt injection mitigations.

### Product Resolution Pipeline

When a user scans or searches for a barcode:
1. **Input Normalization & GS1 Checksum**: Strips non-digits, checks length (8, 12, 13, 14 digits), and validates the GS1 Modulo-10 checksum digit.
2. **In-Memory Cache Check**: Checks the server-side TTL cache to return instant responses for frequently accessed items.
3. **Primary Provider (Open Food Facts)**: Queries the Open Food Facts v2 API for packaging, ingredients, NOVA classification, and nutrient records.
4. **Secondary Provider Fallback**: If Open Food Facts returns a 404 or incomplete record, queries a secondary commercial barcode registry.
5. **USDA Nutrition Enrichment**: If the product is found but lacks critical macronutrients, queries the USDA FoodData Central API by GTIN to fill in missing nutritional metrics.
6. **Canonical Normalization**: Maps all raw provider variations into the FoodLens standardized product object.

### Deterministic Health Score Engine

The FoodLens Health Score is calculated on a 0–100 scale:

$$\text{Final Score} = \operatorname{clamp}\left(100 + \sum \text{Deductions} + \sum \text{Bonuses}, 0, 100\right)$$

| Nutritional Factor | Condition (per 100g) | Score Impact |
| :--- | :--- | :--- |
| **Sugar** | $\le 5\text{g}$ / $\le 10\text{g}$ / $\le 20\text{g}$ / $\le 30\text{g}$ / $> 30\text{g}$ | $0$ / $-3$ / $-6$ / $-10$ / $-15$ |
| **Saturated Fat** | $\le 1.5\text{g}$ / $\le 3\text{g}$ / $\le 5\text{g}$ / $\le 7.5\text{g}$ / $> 7.5\text{g}$ | $0$ / $-3$ / $-6$ / $-10$ / $-15$ |
| **Sodium** | $\le 0.12\text{g}$ / $\le 0.30\text{g}$ / $\le 0.60\text{g}$ / $\le 1.00\text{g}$ / $> 1.00\text{g}$ | $0$ / $-3$ / $-6$ / $-10$ / $-15$ |
| **NOVA Group** | Group 1 / Group 2 / Group 3 / Group 4 | $+3$ / $+2$ / $0$ / $-8$ |
| **Nutri-Score** | Grade A / Grade B / Grade C / Grade D / Grade E | $+3$ / $+2$ / $0$ / $-2$ / $-3$ |
| **Dietary Fiber** | $\ge 5\text{g}$ / $\ge 3\text{g}$ / $\ge 1.5\text{g}$ | $+5$ / $+3$ / $+1$ |
| **Protein** | $\ge 10\text{g}$ / $\ge 7\text{g}$ / $\ge 4\text{g}$ | $+5$ / $+3$ / $+1$ |

### Dietary Compatibility Engine

The compatibility engine evaluates three sequential gates:
1. **Allergen Verification**: Compares declared allergens, cross-contamination traces, and ingredient text against alias lists. Direct allergen presence results in `not_compatible`; cross-contamination trace warnings result in `caution`.
2. **Restriction Verification**: Evaluates restrictions (e.g., gluten-free, dairy-free). If conflicting ingredients or allergens are detected, flags the product as `not_compatible`.
3. **Diet Alignment**: Verifies ingredients against animal meat, poultry, seafood, egg, and dairy term lists for Vegetarian, Vegan, Eggetarian, and Pescatarian diets.
4. **Health Goal Checks**: Appends informational alerts (e.g., highlighting sugar $> 15\text{g}$ for low-sugar goals or protein $\ge 10\text{g}$ for high-protein goals).

### Grounded Gemini AI Layer

The Gemini integration adheres to strict reliability standards:
- **SDK**: Built with the modern `@google/genai` TypeScript/JavaScript SDK.
- **Model Cascade**: Targets `gemini-3.8-flash` with graceful failover across available models.
- **Prompt Injection Defense**: Input product fields are length-capped and passed within untrusted context tags. System instructions explicitly command the model to ignore instruction-like strings inside ingredient text.
- **JSON Schema Validation**: Validates the output structure at runtime. If any required property is missing or malformed, the fallback synthesizer takes over.
- **Automatic Fallback**: If no API key is provided or external services are rate-limited, the system synthesizes a deterministic natural-language summary from the verified metrics without throwing a user-facing error.

---

## Technology Stack

| Domain | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 | Declarative user interface with modern hook patterns |
| **Build Tool** | Vite 6 | Lightning-fast HMR and optimized production bundling |
| **CSS & Design System** | Tailwind CSS v4 | Clean emerald & slate visual system, accessible contrast |
| **Animations** | Motion (`motion/react`) | Smooth route transitions and micro-interactions |
| **Icons** | Lucide React | Consistent, lightweight vector iconography |
| **Data Visualization** | Recharts | Nutrition charts and score distribution graphs |
| **Barcode Processing** | `@zxing/library` | Real-time browser-based video frame binarization |
| **Backend Runtime** | Node.js (ES Modules) | High-concurrency asynchronous runtime |
| **Server Framework** | Express 4.21 | Modular REST API routing and middleware pipeline |
| **Database** | MongoDB Atlas & Mongoose 9 | Document storage for users, history, and favorites |
| **Authentication** | JWT (`jsonwebtoken`) & `bcryptjs` | Stateless authentication with salted password hashes |
| **Security & Headers** | `helmet`, `cors`, `express-rate-limit` | Defense-in-depth against common web vulnerabilities |
| **AI Integration** | `@google/genai` (Gemini API) | Structured multimodal nutrition analysis & insights |
| **Bundling (Server)** | `esbuild` | Compiles backend server into a single production bundle |

---

## Project Directory Structure

```
foodlens-ai/
├── public/                     # Static assets and favicons
├── server/                     # Express backend architecture
│   ├── config/                 # Database connection & env validation
│   ├── controllers/            # Route controllers (Auth, Products, Users, etc.)
│   ├── middleware/             # Auth, error handling, validation, rate limiting
│   ├── models/                 # Mongoose schemas (User, ScanHistory, Favorite)
│   ├── routes/                 # Express API route declarations
│   ├── services/               # Core business logic
│   │   ├── compatibilityService.js # Deterministic dietary compatibility
│   │   ├── geminiService.js        # Google Gemini AI integration & fallback
│   │   ├── productService.js       # Product lookup and caching
│   │   ├── productResolver.js      # Multi-source API cascade & normalization
│   │   └── scoreService.js         # Deterministic FoodLens Score engine
│   ├── tests/                  # Automated test suites
│   ├── utils/                  # Barcode checksums, API errors, score rules
│   ├── app.js                  # Express app setup and middleware chain
│   └── server.js               # Server entry point & Vite middleware setup
├── src/                        # React frontend architecture
│   ├── components/             # Reusable UI components
│   │   ├── animation/          # PageTransition motion wrappers
│   │   ├── common/             # Navbar, Footer, PageHeader, EmptyState
│   │   ├── food/               # ScoreCard, CompatibilityCard, NutritionTable
│   │   ├── layout/             # AppLayout, AuthLayout
│   │   └── ui/                 # Accessible buttons, cards, badges, inputs
│   ├── context/                # AuthContext, AppContext (state management)
│   ├── pages/                  # Top-level view components
│   │   ├── Auth/               # Login and Register pages
│   │   ├── Compare/            # Multi-product comparison
│   │   ├── Dashboard/          # User analytics & quick actions
│   │   ├── Favorites/          # Saved products collection
│   │   ├── History/            # Chronological scan logs
│   │   ├── Landing/            # Public marketing & feature overview
│   │   ├── ProductDetails/     # Full product nutrition & AI insights
│   │   ├── Profile/            # Dietary preferences & account settings
│   │   ├── Scanner/            # Live camera barcode scanner
│   │   └── Search/             # Text-based food search
│   ├── routes/                 # Client routing with protected route guards
│   ├── services/               # Axios API client & service functions
│   ├── App.jsx                 # Root application component
│   ├── index.css               # Tailwind CSS v4 styling rules
│   └── main.jsx                # React DOM entry point
├── .env.example                # Canonical environment variable template
├── index.html                  # HTML entry point with metadata tags
├── package.json                # Project dependencies and operational scripts
└── vite.config.ts              # Vite & Tailwind configuration
```

---

## Getting Started

### Prerequisites

- **Node.js**: Version 20.x or higher
- **Package Manager**: `npm` (comes with Node.js)
- **MongoDB**: A running MongoDB instance (local or MongoDB Atlas connection string)
- **Google Gemini API Key**: *(Optional)* Required for AI insights; the app runs smoothly with deterministic fallbacks if omitted.

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/foodlens-ai.git
   cd foodlens-ai
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in your configuration:
   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/foodlens?retryWrites=true&w=majority
   JWT_SECRET=your_super_secret_key_at_least_16_characters_long
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

### Running the Development Server

Start the full-stack development environment (launches Express with embedded Vite middleware on port 3000):

```bash
npm run dev
```

Visit `http://localhost:3000` in your web browser.

---

## Environment Configuration

All environment variables must be declared in `.env`. Refer to `.env.example` for the complete template:

| Variable | Description | Default | Required in Production |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Application environment (`development` / `production`) | `development` | Yes |
| `PORT` | HTTP port the server binds to | `3000` | Optional (default: 3000) |
| `MONGODB_URI` | MongoDB Atlas or local connection string | — | **Yes** |
| `JWT_SECRET` | Secret key for signing JSON Web Tokens (min 16 chars) | — | **Yes** |
| `GEMINI_API_KEY` | Google Gemini API key for AI insight generation | — | Optional *(falls back to deterministic engine)* |
| `GEMINI_MODEL` | Target Gemini model alias | `gemini-3.8-flash` | Optional |
| `APP_URL` | Public application URL | `http://localhost:3000` | Optional |
| `OPEN_FOOD_FACTS_BASE_URL` | Open Food Facts API v2 base endpoint | `https://world.openfoodfacts.org/api/v2` | Optional |
| `SECONDARY_PRODUCT_API_URL` | Secondary barcode provider endpoint | `https://api.upcitemdb.com/prod/trial/lookup` | Optional |
| `SECONDARY_PRODUCT_API_KEY` | Secondary provider API key (higher limits) | — | Optional |
| `USDA_API_BASE_URL` | USDA FoodData Central API endpoint | `https://api.nal.usda.gov/fdc/v1` | Optional |
| `USDA_API_KEY` | USDA FoodData Central API key | — | Optional |

---

## Testing & Quality Assurance

FoodLens AI includes a complete automated test suite verifying everything from GS1 barcode checksums to adversarial security injections.

### Run All Unit & Integration Tests

```bash
npm test
```

The test runner utilizes Node's built-in test runner (`node --test`) to execute 14 comprehensive test suites:
- **Barcode Validation & Checksums**: GS1 Modulo-10 calculation, leading zero preservation, and edge cases.
- **Multi-Source Product Resolution**: Provider cascading, USDA nutrient enrichment, and truthful normalization.
- **FoodLens Health Score Engine**: Deterministic point adjustments, clamping bounds, and score breakdown verification.
- **Dietary Compatibility Engine**: Allergen alias matching, cross-contamination rules, and dietary conflict flags.
- **Gemini AI Service & Fallbacks**: Response schema validation, prompt injection encapsulation, and deterministic fallbacks.
- **Product Search & Comparison**: Multi-product matrix validation, query sanitization, and duplicate barcode rejection.
- **Security & Environment Audits**: Password hashing verification, JWT token expiration, CORS headers, and secret protection.

### Run Static Type & Lint Checks

```bash
npm run lint
```

Executes `tsc --noEmit` to verify type safety across all TypeScript modules.

---

## Production Build & Deployment

The application is engineered for production deployment on serverless platforms such as Vercel, as well as containerized platforms like Google Cloud Run, Render, AWS, or Docker containers.

### Vercel Serverless Deployment

FoodLens AI includes native Vercel Serverless Function support via `/api/index.js` and `vercel.json`:

1. **Deploy Repository to Vercel**: Connect your GitHub repository to Vercel.
2. **Environment Variables**: Set the following in your Vercel Project Settings (`Settings > Environment Variables`):
   - `MONGODB_URI`: Your production MongoDB Atlas connection string.
   - `JWT_SECRET`: A secure random string (minimum 16 characters).
   - `GEMINI_API_KEY`: (Optional) Your Google Gemini API key for multimodal and nutritional insights.
   - `NODE_ENV`: Set to `production`.
3. **Build Configuration**: Vercel automatically detects the Vite frontend build and routes `/api/*` requests to the serverless function export at `api/index.js` with client-side SPA routing fallbacks.

### Container / Server Deployment

```bash
npm run build
```

This single command:
1. Builds the React 19 frontend into static assets in `dist/`.
2. Bundles the Express backend and all relative imports into a single, self-contained `dist/server.cjs` file using `esbuild`.

### 2. Start the Production Server

```bash
npm start
```

Launches `dist/server.cjs` on port 3000, serving the compiled static assets with SPA routing fallback alongside all API routes.

---

## REST API Reference

All API routes are prefixed with `/api`.

### Health & System

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api` | Service status, version, and documentation metadata | No |
| `GET` | `/api/health` | Liveness probe returning service health | No |
| `GET` | `/api/health/readiness` | Readiness probe checking database connectivity and memory | No |

### Authentication

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register account (`name`, `email`, `password`) | No |
| `POST` | `/api/auth/login` | Login user, issues JWT in response body | No |
| `POST` | `/api/auth/logout` | Invalidate client session | Yes |
| `GET` | `/api/auth/me` | Retrieve authenticated user profile | Yes |

### User Profile & Preferences

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users/profile` | Retrieve user profile and dietary preferences | Yes |
| `PATCH` | `/api/users/profile` | Update account details (`name`) | Yes |
| `PATCH` | `/api/users/preferences` | Update `diet`, `allergies`, `restrictions`, `healthGoals` | Yes |

### Products & Intelligence

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/products/search?q=:query&page=1` | Search food database by product name or brand | Optional |
| `GET` | `/api/products/barcode/:barcode` | Lookup normalized product data by barcode | Optional |
| `GET` | `/api/products/barcode/:barcode/score` | Compute explainable FoodLens Health Score | Optional |
| `GET` | `/api/products/barcode/:barcode/compatibility` | Evaluate product against user dietary preferences | Optional |
| `GET` | `/api/products/barcode/:barcode/insight` | Generate grounded Gemini AI nutritional analysis | Optional |
| `GET` | `/api/products/compare?barcodes=A,B,C` | Compare 2 to 4 food products side-by-side | Optional |

### Scan History & Favorites

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/history?page=1&limit=20` | Retrieve paginated scan history | Yes |
| `POST` | `/api/history` | Log a product scan event | Yes |
| `DELETE` | `/api/history/:id` | Remove a specific scan entry | Yes |
| `DELETE` | `/api/history` | Clear entire scan history | Yes |
| `GET` | `/api/favorites` | Retrieve user's bookmarked products | Yes |
| `POST` | `/api/favorites` | Bookmark a product | Yes |
| `DELETE` | `/api/favorites/:barcode` | Remove a bookmark | Yes |
| `GET` | `/api/favorites/check/:barcode` | Check if a product is currently bookmarked | Yes |

### Analytics

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/analytics/summary` | Aggregate user health scores and dietary compliance | Yes |

---

## Security Architecture

FoodLens AI is built with defense-in-depth principles:

- **Zero Client Secret Exposure**: The Google Gemini API key, MongoDB credentials, and JWT signing secret remain exclusively on the Node.js backend. The frontend communicates through proxy routes.
- **Cryptographic Security**: Passwords are salted and hashed using `bcryptjs` with a cost factor of 12. Authentication utilizes signed JSON Web Tokens.
- **HTTP Header Hardening**: Secured via `helmet` with preconfigured Content Security Policy, X-Content-Type-Options, and Frameguard protections.
- **Granular Rate Limiting**: Dedicated rate limiters on authentication endpoints (`/api/auth/*`) prevent brute-force attacks, while global API limits prevent abuse.
- **Prompt Injection Defense**: All untrusted product strings (names, ingredients, allergen labels) are length-capped and isolated inside dedicated data wrappers with strict system-prompt boundary instructions.
- **Request Traceability**: Every incoming HTTP request is tagged with a unique `X-Correlation-ID` header for end-to-end debugging across microservices and log streams.

---

## Disclaimers

> **Nutritional & Health Disclaimer**
> 
> FoodLens AI provides automated nutritional evaluations and food intelligence for general informational and educational purposes only.
> 
> - FoodLens AI is **not** a medical device and does **not** provide clinical diagnosis, medical advice, or treatment plans.
> - While every effort is made to normalize allergen and nutritional information accurately, product formulations change frequently. Individuals with severe food allergies, celiac disease, or specific medical conditions must **always verify package labels directly** before consuming any product.

---

## License

This project is licensed under the [MIT License](LICENSE).
