# Push Notifications — Manual Setup Guide

Follow these steps **after** the technical implementation lands. None of this can be done from code — it's all credential/console work.

---

## 1. Apple (iOS)

### 1.1 Create an APNs authentication key

1. Go to [Apple Developer → Certificates, Identifiers & Profiles → Keys](https://developer.apple.com/account/resources/authkeys/list).
2. Click **+** to create a new key.
3. Name it `100cims APNs` (or similar).
4. Check **Apple Push Notifications service (APNs)**.
5. Click **Continue**, then **Register**.
6. **Download the `.p8` file** — you only get ONE chance to download it. Store it somewhere safe (1Password or similar).
7. Note down the **Key ID** (shown on the key detail page) and your **Team ID** (top-right of the developer portal).

### 1.2 Upload the APNs key to EAS

From the repo root:

```bash
cd packages/app
eas credentials
```

- Select **iOS** → **production** (and repeat for **development** / **preview** if needed).
- Choose **Push Notifications: Manage your Apple Push Notifications Key**.
- Select **Set up a new push key** (or **Use an existing one**).
- Upload the `.p8` file, enter the Key ID and Team ID when prompted.

EAS will attach this to all future iOS builds automatically.

> **Note**: The bundle identifier `app.100cims.100cims` is already configured. No Xcode capability work needed — the `expo-notifications` plugin handles entitlements at build time.

---

## 2. Android (Firebase Cloud Messaging)

### 2.1 Create / reuse a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com).
2. If 100cims already has a Firebase project, use it. Otherwise click **Add project**, name it `100cims`, accept defaults.

### 2.2 Add the Android app to Firebase

1. In your Firebase project → **Project Settings** (gear icon) → **Your apps** → **Add app** → Android.
2. **Android package name**: `app.x100cims.x100cims` (must match exactly).
3. App nickname: `100cims Android` (optional).
4. SHA-1 certificate: not required for push, skip.
5. Click **Register app**.
6. **Download `google-services.json`**.

### 2.3 Wire `google-services.json` into the app

Place the file at `packages/app/google-services.json` and reference it in `app.config.ts`:

```ts
android: {
  // ...existing fields
  googleServicesFile: "./google-services.json",
  package: "app.x100cims.x100cims",
},
```

**Do NOT commit `google-services.json` to git** — add it to `.gitignore` and upload via EAS secrets instead:

```bash
eas secret:create --scope project --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json
```

Then in `app.config.ts`:
```ts
googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
```

### 2.4 Generate FCM V1 service account key

Expo's push service needs this to deliver to Android (legacy FCM server keys are no longer supported).

1. Firebase Console → **Project Settings** → **Service Accounts** tab.
2. Click **Generate new private key** → confirm → download the JSON file.
3. Store it securely.

### 2.5 Upload the FCM service account to EAS

```bash
cd packages/app
eas credentials
```

- Select **Android** → your build profile.
- Choose **Push Notifications: Manage your Google Service Account Key for Push Notifications (FCM V1)**.
- Upload the service account JSON.

---

## 3. Expo push security (optional but recommended)

By default, anyone with an Expo push token can send to it. To lock this down:

1. Go to [Expo Dashboard → Account Settings → Access Tokens](https://expo.dev/accounts/[your-account]/settings/access-tokens).
2. Create a new token, name it `100cims-api-push`.
3. Add it as an environment variable in Vercel (production + preview):
   - **Name**: `EXPO_ACCESS_TOKEN`
   - **Value**: the token
4. Also add to your local `.env` if you want to test against production Expo tokens locally.

The API code already reads `EXPO_ACCESS_TOKEN` and passes it as `Authorization: Bearer <token>` when present.

Once set, enable **Enhanced Push Security** in the Expo dashboard → project settings. Any push without the access token header will be rejected.

---

## 4. Build and install new dev clients

`expo-notifications` ships native code, so the existing dev client won't work — **and Expo Go does not support push notifications at all**. You must use a custom dev build. Build new ones:

```bash
cd packages/app
eas build --profile development --platform ios
eas build --profile development --platform android
```

Install the resulting builds on physical test devices (see next section).

---

## 5. Local testing

### 5.1 What you need

- **Physical iOS device** (iPhone/iPad) signed into your Apple ID.
- **Physical Android device** with Google Play services.
- ⚠️ **Simulators and emulators don't receive push tokens.** `expo-notifications` returns `null` on simulators — the code handles this gracefully, but you can't test end-to-end without real hardware.
- Both devices connected to the internet (cellular or wifi).

### 5.2 Setup

1. Run the API locally (`yarn api dev`) pointed at your dev database, or against staging.
2. Install the new dev build on both devices.
3. Point the app at your local API (usual `EXPO_PUBLIC_API_URL` workflow) or at deployed API.
4. Sign into a different account on each device.

### 5.3 Verify token registration

1. Sign in on device A. Accept the notification permission prompt.
2. Query the DB:
   ```sql
   SELECT id, email, expo_push_token, push_notifications_enabled
   FROM "user"
   WHERE email = 'device-a-account@example.com';
   ```
3. Confirm `expo_push_token` is populated with a string like `ExponentPushToken[xxxxxxxx...]`.

### 5.4 Send a test push manually

Use Expo's push tool to verify tokens work before testing the full flow:

- Browser: [expo.dev/notifications](https://expo.dev/notifications) — paste the token, send a test message.
- CLI:
  ```bash
  curl -H "Content-Type: application/json" \
       -X POST https://exp.host/--/api/v2/push/send \
       -d '{"to":"ExponentPushToken[...]","title":"Test","body":"Hello"}'
  ```

If this works, the credential setup is correct.

### 5.5 End-to-end flow tests

1. **Plan join**:
   - Device A creates a plan.
   - Device B joins the plan.
   - Device A should receive a push within ~5 seconds.

2. **Plan leave**:
   - Device B leaves the plan.
   - Device A receives a push.

3. **Plan chat**:
   - Device A and B are both in a plan.
   - Device B sends a chat message.
   - Device A receives a push with the plan title + message preview.

4. **Opt-out**:
   - Manually set `push_notifications_enabled = false` for device A's user in the DB.
   - Device B triggers an event → device A should NOT get a push.
   - Reset to `true` and verify pushes resume.

5. **Permission revocation**:
   - On device A, go to OS settings → 100cims → disable notifications.
   - Reopen the app.
   - Verify the API received a null token (DB column cleared).

6. **Tap routing**:
   - Receive a chat push.
   - Tap it.
   - Verify the app opens directly to the correct plan screen.

### 5.6 Common issues

| Symptom | Likely cause |
|---|---|
| Token is `null` on device | Simulator, or permission denied, or missing `projectId` |
| Push sent but not delivered (iOS) | APNs `.p8` not uploaded, or wrong Team/Key ID |
| Push sent but not delivered (Android) | FCM service account not uploaded, or `google-services.json` package name mismatch |
| `DeviceNotRegistered` in Expo response | Old token, user uninstalled app; API will auto-clear it |
| 401 from Expo push API | `EXPO_ACCESS_TOKEN` invalid or missing after enabling Enhanced Security |
| Android user reports "no notifications" | They may have force-stopped the app in OS settings — pushes stop until they reopen it. Not a code bug. |
| Notifications arrive but no sound/banner on Android | Android notification channel not created. Our code creates a `default` channel on first run; if a user had the app before this change, reinstalling (or `setNotificationChannelAsync` on every startup) fixes it. |

---

## 6. Known limitations (don't file as bugs)

Per Expo/Apple/Google docs:

- **No delivery guarantee** — push is best-effort. Apple and Google can drop notifications under device battery/Doze conditions.
- **Apple rate limit** — keep background/data-only pushes to ≤2–3 per user per hour. User-action-triggered pushes (plan join, chat) are fine; future cron-driven reminders need to respect this.
- **Android force-stop** — if a user force-stops the app in OS settings, notifications stop until they reopen the app manually. This is an OS-level behavior, not a bug.
- **Simulators/emulators never receive pushes** — this is by design.
- **Cold-start taps** — when a user taps a notification that launches the app from a terminated state, the app routes via `useLastNotificationResponse` on mount. If the app is already running, the in-memory listener handles the tap.

## 7. Production checklist

Before shipping:

- [ ] APNs `.p8` uploaded to EAS for production profile
- [ ] FCM V1 service account uploaded to EAS for production profile
- [ ] `google-services.json` wired via EAS secret (not committed)
- [ ] `EXPO_ACCESS_TOKEN` set in Vercel production env (if using Enhanced Security)
- [ ] Production build installed on a physical device and tested end-to-end
- [ ] Verified opt-out works (`push_notifications_enabled = false` blocks delivery)
