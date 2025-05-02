<p align='center'>
  <img src="https://i.imgur.com/UtFHXCj.png" alt="100cims"  />
</p>

# [100cims](https://100cims.app)

100cims is a mobile mountaineering app built with [Expo](https://expo.dev), powered by [expofast.app](https://expofast.app).

> This repo is part of the **[ExpoFast](https://expofast.app)** platform — a suite of tools to build, launch, and scale React Native apps 10x faster. From icon/splash generation to analytics and store asset automation — check it out.

## 🏔️ What is 100cims?

100cims is a mobile app to track your mountain summits and join hiking challenges. Users can:

- Log mountain summits and view their progress
- Join curated regional hiking challenges (Catalonia, GR-20, Alps…)
- Organize group hikes via **Plans** and coordinate through **Chat**
- Earn points based on mountain difficulty
- Climb the rankings and celebrate your achievements

## 🧑‍💻 Getting Started

```bash
yarn
```

Then:

```bash
yarn start # or: expo start
```

## 🌐 Environment Variables

Before running the project, leverage the`.env.example` file to fill the required environment variables:

```env
EXPO_PUBLIC_API_URL=http://localhost:8081/
DATABASE_URL=postgresql://admin:admin@localhost:5432/my_local_db

MY_AWS_ACCESS_KEY=
AWS_ACCESS_SECRET_KEY=
AWS_PUBLIC_BUCKET_NAME=
AWS_BUCKET_REGION=

APP_NAME=

SHEETS_CLIENT_EMAIL=
SHEETS_PRIVATE_KEY=

EXPO_PUBLIC_EXPOFAST_ANALYTICS_KEY=
```

- `AWS_*` → used to store summit images on S3.
- `SHEETS_*` → optional: logs API errors to Google Sheets.
- `EXPO_PUBLIC_EXPOFAST_ANALYTICS_KEY` → integrates [expofast analytics](https://expofast.app/#join).

## 🔐 Auth

Authentication supports both **Google** and **Apple** sign-in.

- For **Google OAuth**, you need:

  ```env
  EXPO_PUBLIC_ANDROID_CLIENT_ID=
  EXPO_PUBLIC_IOS_CLIENT_ID=
  EXPO_PUBLIC_WEB_CLIENT_ID=
  ```

  Also, generate and include your `google-services.json`.

- For **Apple OAuth**, follow [Expo’s official Apple Auth setup guide](https://docs.expo.dev/versions/latest/sdk/apple-authentication/).

- For JWT auth, generate a UUID and assign it to `AUTH_SECRET`:
  ```env
  AUTH_SECRET=
  ```

## 🌍 Translations

To update translations:

```bash
yarn translations
```

This will extract messages and update `translations/raw-en.json`. Copy the new keys manually into `ca.json` and `es.json`.

## 💄 Database

```bash
yarn db:local:up     # Starts local DB via Docker
yarn db:push         # Push latest schema to the DB (use correct env vars)
```

Then, manually run the SQL in `api/db/init-script.sql` to initialize basic data.

## 🩱 Stack Highlights

- **Expo + React Native**: unified dev workflow across iOS/Android/web
- **expo-router**: File-system routing like Next.js
- **Elysia.js + Drizzle ORM**: API routes with type-safety
- **eden**: end-to-end API types across client/server
- **nativewind**: Tailwind-style utility classes in React Native

## 📦 Try the app

- [100cims for iOS](https://apps.apple.com/us/app/100cims-mountain-challenges/id6740161401?platform=iphone)
- [100cims for Android](https://play.google.com/store/apps/details?id=app.x100cims.x100cims)

## 🚀 Powered by ExpoFast

Want to build apps like this, faster? Visit [expofast.app](https://expofast.app).

> This project uses the full suite of ExpoFast services including analytics, asset automation, and store review flows.

---

Made with ❤️ by [@jvidalv](https://www.linkedin.com/in/josepvidalvidal/)

## 🖼️ Media

<p align='center'>
  <img src="https://i.imgur.com/Ff7d87p.png" alt="media 1"  />
  <img src="https://i.imgur.com/URj0pL0.png" alt="media 2"  />
  <img src="https://i.imgur.com/PipStcD.png" alt="media 3"  />
</p>
