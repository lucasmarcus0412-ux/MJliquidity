# Replit Agent Guide — MJ Liquidity

## Overview

MJ Liquidity is a mobile-first trading community app built with Expo (React Native) and an Express backend. It provides market analysis posts, community chat, and a subscription system for traders. The app features an admin system where authenticated admins can publish analysis, manage chat, and configure subscription URLs. Data is currently stored locally via AsyncStorage on the client side, with a PostgreSQL-backed server available for future expansion.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend — Expo / React Native
- **Framework**: Expo SDK 54 with expo-router for file-based routing
- **Navigation**: 5-tab layout — Home (index), Gold Intraday, Pro Markets, Trading Hub, Profile
- **Routing**: `app/(tabs)/` directory contains the five main screens plus hidden legacy routes; `app/_layout.tsx` is the root layout
- **Tab Details**:
  - **Home** (`index.tsx`): Free daily analysis feed with admin compose functionality
  - **Gold Intraday** (`gold-intraday.tsx`): XAUUSD VIP analysis feed + members-only chat (toggle between Analysis/Chat)
  - **Pro Markets** (`pro-markets.tsx`): Multi-asset (NQ/ES/BTC/XAU) analysis feed + members-only chat (toggle)
  - **Trading Hub** (`trading-hub.tsx`): Brokers, Prop Firms, Copy Trading partner links
  - **Profile** (`profile.tsx`): Subscriptions (3 tiers), Education (sub-screen), Legal, Settings, Admin login
- **State Management**: React Context (`lib/AppContext.tsx`) for global app state (admin status, username, subscription URL). TanStack React Query (`@tanstack/react-query`) is set up for server data fetching via `lib/query-client.ts`
- **Local Storage**: AsyncStorage (`lib/storage.ts`) handles persistence for analysis posts, chat messages, admin login state, and user preferences. This acts as the primary data store currently — the server-side storage is minimal
- **Styling**: Dark theme enforced (`userInterfaceStyle: "dark"` in app.json). Color constants in `constants/colors.ts` use a gold/black luxury aesthetic. DM Sans font family loaded via `@expo-google-fonts/dm-sans`
- **Platform Support**: iOS, Android, and Web. Platform-specific handling exists (e.g., `KeyboardAwareScrollViewCompat` for web vs native, tab bar styling differences)

### Backend — Express Server
- **Location**: `server/` directory with `index.ts` (entry point), `routes.ts` (API route registration), and `storage.ts` (in-memory storage)
- **Current State**: The server is minimal — it has CORS setup, serves static files in production, and has an in-memory user storage implementation. API routes are prefixed with `/api`
- **Storage Interface**: `IStorage` interface in `server/storage.ts` defines the storage contract. Currently uses `MemStorage` (in-memory Map). This is designed to be swapped for a database-backed implementation
- **Build**: Server is bundled with esbuild for production (`server:build` script)

### Database — PostgreSQL with Drizzle ORM
- **Schema**: Defined in `shared/schema.ts` — currently only has a `users` table with id (UUID), username, and password
- **ORM**: Drizzle ORM with `drizzle-zod` for validation schema generation
- **Config**: `drizzle.config.ts` points to `DATABASE_URL` env variable, outputs migrations to `./migrations`
- **Push**: Use `npm run db:push` to sync schema to the database
- **Note**: The schema is minimal. Most app data (analysis posts, chat messages) is still in client-side AsyncStorage and would need server-side tables added for a production setup

### Admin System
- **Authentication**: Simple password-based admin login (hardcoded password `mjliquid2024` in `lib/AppContext.tsx`). This is client-side only — not a secure auth system
- **Capabilities**: Admins can create/delete analysis posts, send admin-tagged chat messages, and configure the subscription URL

### Key Scripts
- `npm run expo:dev` — Start Expo dev server (configured for Replit domain proxying)
- `npm run server:dev` — Start Express dev server with tsx
- `npm run server:prod` — Run production server from built files
- `npm run db:push` — Push Drizzle schema to PostgreSQL
- `npm run expo:static:build` — Build static web bundle via custom `scripts/build.js`

### Build & Deployment
- `scripts/build.js` handles static web export from Expo, with Replit deployment domain detection
- Production server serves the static web bundle and handles API routes
- Server build uses esbuild to bundle `server/index.ts` into `server_dist/`

## External Dependencies

### Database
- **PostgreSQL** — Connected via `DATABASE_URL` environment variable. Used with Drizzle ORM for schema management and queries

### Key Libraries
- **Expo SDK 54** — Core mobile framework with router, splash screen, haptics, image picker, location, linear gradient, blur effects
- **Express 5** — Backend HTTP server
- **Drizzle ORM + drizzle-zod** — Database ORM and validation
- **TanStack React Query** — Server state management and data fetching
- **AsyncStorage** — Client-side persistent storage
- **React Native Reanimated / Gesture Handler / Screens** — Native navigation and animation primitives
- **http-proxy-middleware** — Dev server proxying for Expo/Express integration on Replit

### Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (required for database operations)
- `EXPO_PUBLIC_DOMAIN` — Public domain for API requests from the client
- `REPLIT_DEV_DOMAIN` — Replit development domain (used for CORS and Expo proxy)
- `REPLIT_DOMAINS` — Comma-separated list of allowed CORS origins
- `REPLIT_INTERNAL_APP_DOMAIN` — Used during deployment builds for domain resolution