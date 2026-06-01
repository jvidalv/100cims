<p align='center'>
  <img src="https://i.imgur.com/UtFHXCj.png" alt="cims"  />
</p>

# [Cims](https://fescims.com)

## 🏔️ What is Cims?

Cims is a mobile app to track your mountain summits and join hiking challenges. Users can:

- Log mountain summits and view their progress
- Join curated regional hiking challenges (Catalonia, GR-20, Alps…)
- Organize group hikes via **Plans** and coordinate through **Chat**
- Earn points based on mountain difficulty
- Climb the rankings and celebrate your achievements

## 📁 Monorepo Structure

This is a Yarn workspaces monorepo containing:

```
100cims/
├── packages/
│   ├── app/     # React Native mobile app (Expo)
│   └── api/     # Backend API (Next.js + Elysia)
├── package.json  # Root workspace configuration
└── README.md     # This file
```

### Packages

- **[`packages/app`](./packages/app)** - Mobile application built with Expo and React Native
- **[`packages/api`](./packages/api)** - Backend API built with Next.js and Elysia

## 🧑‍💻 Getting Started

### Prerequisites

- **Node.js >= 24.0.0** (pinned in root `package.json` engines)
- **Yarn 1.22.19+** (Yarn Classic — the repo uses workspaces, not Berry)
- **Docker** — used to run a local Postgres for the API (`yarn api db`)
- **Xcode 26.4+** (iOS dev builds) and/or Android Studio (Android dev builds)
- A custom **development build** of the mobile app (Expo Go is **not** supported — the app uses native modules that require a dev client; see [Mobile app — first run](#mobile-app--first-run))

### Quick Start

1. **Clone and install dependencies**:

```bash
git clone https://github.com/jvidalv/100cims.git
cd 100cims
yarn install
```

2. **Set up environment variables**:

   - Copy `packages/app/.env.example` to `packages/app/.env.local`
   - Copy `packages/api/.env.example` to `packages/api/.env.local`
   - Fill in the required values (see package READMEs for details)

3. **Start the local database** (Postgres in Docker):

```bash
yarn api db          # starts the dockerized Postgres
yarn api db:migrate  # applies drizzle migrations
```

4. **Start development**:

```bash
# Terminal 1: API server (Next.js, port 3000)
yarn dev:api

# Terminal 2: Metro bundler for the mobile app
yarn dev:app
```

### Mobile app — first run

The mobile app needs a **custom development build** installed on a device/simulator before `yarn dev:app` can connect — Expo Go cannot run it because the project uses native modules (maps, sharing, dynamic app icons, etc.).

First-time setup (or after adding any native dependency):

```bash
# iOS (simulator or connected device)
yarn app build:development:ios

# Android
yarn app build:development:android
```

After that, `yarn dev:app` just starts Metro and the installed dev client connects to it. Cloud builds via EAS are also available — see [`packages/app/README.md`](./packages/app/README.md).

## 🎯 Development Workflow

### Workspace Commands

```bash
# Run an arbitrary command inside a package
yarn app <command>      # → yarn workspace @100cims/app <command>
yarn api <command>      # → yarn workspace @100cims/api <command>

# Development servers
yarn dev:app            # Metro bundler for the mobile app
yarn dev:api            # Next.js dev server for the API

# API production build (also runs db:migrate)
yarn build:api

# Mobile production builds go through EAS — see packages/app/README.md
```

### Lint & type-check

There's no monorepo-wide `lint` / `type-check` script. Run them per package:

```bash
# packages/app
yarn app lint
./node_modules/.bin/tsc --noEmit -p packages/app/tsconfig.json

# packages/api
yarn api lint
./packages/api/node_modules/.bin/tsc --noEmit -p packages/api/tsconfig.json
```

### Package-Specific Commands

See individual package READMEs for detailed commands:
- [Mobile App Commands](./packages/app/README.md)
- [API Commands](./packages/api/README.md)

## 🛠️ Tech Stack

### Monorepo & Tooling
- **Yarn Workspaces (Classic 1.x)** - Dependency management
- **TypeScript** - 6.0 in `packages/app`, 5.x in `packages/api`
- **ESLint + Prettier** - Code quality and formatting

### Mobile App (`packages/app`)
- **Expo SDK 56** - React Native development platform
- **React Native 0.85** - Mobile framework (new architecture enabled)
- **React 19.2**
- **expo-router 56** - File-based navigation
- **NativeWind 5 (preview)** - Tailwind CSS for React Native
- **React Query 5** - Server state management
- **OpenAPI TypeScript** - Type-safe API client
- **React Intl** - Internationalization (en, ca, es)
- **React Native Maps** - Mountain location mapping
- **Expo Auth Session** - Google & Apple OAuth
- **Analytics** - [reactanalytics.app](https://reactanalytics.app)

### Backend API (`packages/api`)
- **Next.js 16** - React framework (App Router)
- **Elysia 1.4** - Fast TypeScript API framework mounted under Next
- **Drizzle ORM + drizzle-kit** - Type-safe SQL toolkit + versioned migrations
- **PostgreSQL** - Relational database (local via Docker, prod on Railway)
- **AWS S3** - Image storage (avatars, summit photos)
- **Google Sheets API** - Error/suggestion logging
- **JWT** - Authentication & authorization
- **Swagger** - API documentation (`/api/swagger/json` in dev)

## 🔐 Authentication

The app supports both **Google** and **Apple** sign-in via OAuth 2.0.

- Backend validates tokens and issues JWTs
- Protected API routes require valid JWT bearer tokens
- See [API Authentication docs](./packages/api/README.md#authentication) for details

## 🌍 Internationalization

Cims supports three languages:
- 🇬🇧 English (en)
- 🏴󠁥󠁳󠁣󠁴󠁿 Catalan (ca)
- 🇪🇸 Spanish (es)

Translations are managed with FormatJS. See [app README](./packages/app/README.md#translations) for the update workflow.

## 📦 Try the App

- [Cims for iOS](https://apps.apple.com/us/app/100cims-mountain-challenges/id6740161401?platform=iphone)
- [Cims for Android](https://play.google.com/store/apps/details?id=app.x100cims.x100cims)

## 🚀 Deployment

- **Mobile App**: Deployed via [EAS Build](https://expo.dev/eas) (Expo Application Services)
- **Backend API**: Deployed on [Railway](https://railway.app) from `packages/api/Dockerfile`. Migrations apply automatically on each deploy (`next build && yarn db:migrate`).
- **Domains**: `fescims.com` is the canonical domain; the legacy `cims-sempre-amunt.app` 301-redirects to it.

## 📊 Analytics

This project uses [reactanalytics.app](https://reactanalytics.app) for privacy-focused mobile analytics.

---

Made with ❤️ by [@jvidalv](https://www.linkedin.com/in/josepvidalvidal/)

## 🖼️ Media

<p align='center'>
  <img src="https://i.imgur.com/Ff7d87p.png" alt="media 1"  />
  <img src="https://i.imgur.com/URj0pL0.png" alt="media 2"  />
  <img src="https://i.imgur.com/PipStcD.png" alt="media 3"  />
</p>
