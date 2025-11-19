<p align='center'>
  <img src="https://i.imgur.com/UtFHXCj.png" alt="cims"  />
</p>

# [Cims](https://cims-sempre-amunt.app)

Cims is a mobile mountaineering app with analytics powered by [reactanalytics.app](https://reactanalytics.app).

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

- Node.js >= 18.0.0
- Yarn 1.22.22
- PostgreSQL (for API)
- Expo Go app (for mobile development)

### Quick Start

1. **Clone and install dependencies**:

```bash
git clone https://github.com/expofast/100cims.git
cd 100cims
yarn install
```

2. **Set up environment variables**:

   - Copy `packages/app/.env.example` to `packages/app/.env.local`
   - Copy `packages/api/.env.example` to `packages/api/.env.local`
   - Fill in the required values (see package READMEs for details)

3. **Start development**:

```bash
# Terminal 1: Start the API server
yarn dev:api

# Terminal 2: Start the mobile app
yarn dev:app
```

## 🎯 Development Workflow

### Workspace Commands

```bash
# Run commands in specific packages
yarn app <command>      # Run command in mobile app
yarn api <command>      # Run command in API

# Development servers
yarn dev:app            # Start Expo dev server
yarn dev:api            # Start Next.js dev server

# Build commands
yarn build:app          # Build mobile app for production
yarn build:api          # Build API for production

# Linting and type-checking
yarn lint               # Run ESLint on all packages
yarn type-check         # Run TypeScript checks
```

### Package-Specific Commands

See individual package READMEs for detailed commands:
- [Mobile App Commands](./packages/app/README.md)
- [API Commands](./packages/api/README.md)

## 🛠️ Tech Stack

### Monorepo & Tooling
- **Yarn Workspaces** - Dependency management
- **TypeScript 5** - Type safety across all packages
- **ESLint + Prettier** - Code quality and formatting
- **Git** - Version control

### Mobile App (`packages/app`)
- **Expo SDK 54** - React Native development platform
- **React Native 0.81** - Mobile framework (new architecture enabled)
- **expo-router 6** - File-based navigation
- **NativeWind 4** - Tailwind CSS for React Native
- **React Query 5** - Server state management
- **OpenAPI TypeScript** - Type-safe API client
- **React Intl** - Internationalization (en, ca, es)
- **React Native Maps** - Mountain location mapping
- **Expo Auth** - Google & Apple OAuth
- **Analytics** - [reactanalytics.app](https://reactanalytics.app)

### Backend API (`packages/api`)
- **Next.js 15** - React framework (App Router)
- **Elysia 1.4** - Fast TypeScript API framework
- **Drizzle ORM** - Type-safe SQL toolkit
- **PostgreSQL** - Relational database
- **AWS S3** - Image storage (avatars, summit photos)
- **Google Sheets API** - Error/suggestion logging
- **JWT** - Authentication & authorization
- **Swagger** - API documentation

## 🔐 Authentication

The app supports both **Google** and **Apple** sign-in via OAuth 2.0.

- Backend validates tokens and issues JWTs
- Protected API routes require valid JWT bearer tokens
- See [API Authentication docs](./packages/api/README.md#authentication) for details

## 🌍 Internationalization

Cims supports three languages:
- 🇬🇧 English (en)
- 🇪🇸 Catalan (ca)
- 🇪🇸 Spanish (es)

Translations are managed with FormatJS. See [app README](./packages/app/README.md#translations) for update workflow.

## 📦 Try the App

- [Cims for iOS](https://apps.apple.com/us/app/100cims-mountain-challenges/id6740161401?platform=iphone)
- [Cims for Android](https://play.google.com/store/apps/details?id=app.x100cims.x100cims)

## 🚀 Deployment

- **Mobile App**: Deployed via [EAS Build](https://expo.dev/eas) (Expo Application Services)
- **Backend API**: Deployed on [Vercel](https://vercel.com) (see `vercel.json`)

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
