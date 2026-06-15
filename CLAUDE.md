# Ascend — Project Knowledge Base & Logbook

> This file is the single source of truth for how we work and what we've done.
> It is BOTH a knowledge base (decisions, constraints, architecture) and a running logbook.

## Working Rules (always follow)

1. **Commit regularly, local only.** Make a git commit after each meaningful piece of work. Do NOT push to any remote for now — everything stays local.
2. **This file is the logbook.** After every meaningful piece of work, come back here and append an entry to the Logbook section below (date, what changed, why, what's next). Read this file at the start of a session to know where we left off.

## What Ascend Is

A React Native (Expo) **Android** app for screen-time control via **cognitive friction**: when a per-app daily limit is hit, an overlay makes the user answer escalating questions (Math/Trivia/Logic/Typing) to earn a grace period (5/10/15 min). Difficulty climbs each round and never resets until midnight. Wrong → retry same question or skip (skip = +1 level, no grace). The idea: never hard-block; make the effort outgrow the urge to scroll.

## Source-of-Truth Docs (in repo, ~90% accurate, not followed 100%)

- `Docx/Ascend_Product_Blueprint_v1.1.docx` — product blueprint (features, DB schema, API, 17-screen list, build phases).
- `design_handoff_ascend_app 2/README.md` — high-fidelity design handoff (Summit palette, fonts, tokens, per-screen specs). Interactive HTML prototypes in `design_handoff_ascend_app 2/standalone/`.

## Key Decisions

- **Frontend-first; mock everything.** Backend (Node/Express + Postgres + Firebase Auth) and real auth are DEFERRED. Sign-in is a stub; data is local/mock until later.
- **Match the handoff designs closely** (Summit palette, Bricolage Grotesque + Outfit fonts). Blueprint governs logic/data.
- **Expo SDK 54** for now — the user's Expo Go app only supports SDK 54, and we want to view on-device during the frontend phase. (The scaffold defaulted to SDK 56; pinned back to 54.)
- **Native module (Kotlin) is deferred.** Usage tracking (`UsageStatsManager`) + overlay (`SYSTEM_ALERT_WINDOW`) + foreground service need native code. When we add it, we switch from Expo Go to a **dev build** (`expo prebuild` + `expo-dev-client`) — Expo Go can't run native modules. Until then, the friction loop is simulated in-app with a dev trigger.

## Repo Layout

```
Ascend/
  CLAUDE.md          <- this file (knowledge base + logbook)
  Docx/              <- product blueprint
  design_handoff_ascend_app 2/   <- design handoff + HTML prototypes
  mobile/            <- Expo SDK 54 app (React Native + Expo Router + TS)
  (server/ later)
```

Single git repo at the root, local only.

## Milestones

1. Skeleton + design system + key screens (Splash, Sign-in, Dashboard) ← **in progress**
2. All 17 screens on mock data
3. Friction loop fully in-app, with a "simulate limit reached" dev trigger (Zustand state)
4. Native Kotlin module (usage tracking + overlay + foreground service) → switch to dev build
5. Backend + sync (Node/Express + Postgres + Firebase Auth)

## Toolchain

node 22, npm 10, java 20. No global expo — use `npx expo`. Phone: Expo Go (SDK 54 only).

---

## Logbook

### 2026-06-12
- Read both source docs (blueprint v1.1 + design handoff). Agreed on plan: frontend-first, mock backend, match designs closely.
- Set up this CLAUDE.md as knowledge base + logbook with working rules.
- Discovered Expo Go on the user's phone supports only SDK 54; re-pinned the scaffold from SDK 56 → 54.
- **Milestone 1 DONE** (commit `959c3d4`):
  - Expo SDK 54 + Expo Router + TS app in `mobile/`. Entry = `expo-router/entry`; app.json has scheme `ascend`, typedRoutes, coral splash, android package `com.ascend.app`.
  - Design system in `mobile/src/theme/`: `colors.ts` (Summit palette + `oklchToHex` so app-identity hues are exact), `typography.ts` (Bricolage + Outfit via @expo-google-fonts), `spacing.ts`.
  - Components in `mobile/src/components/`: ChevronMark (SVG), Button (5 variants), Card, AppChip, ProgressBar, Wordmark, Placeholder.
  - Routes: `app/index.tsx` Splash (auto-advance 2.6s → sign-in), `app/sign-in.tsx` (stubbed providers → tabs), `app/(tabs)/` with Dashboard built + Stats/Leaderboard/Settings placeholders.
  - Mock data in `mobile/src/data/mock.ts`. Verified: `tsc --noEmit` clean + `expo export --platform android` bundles OK.
  - Fonts: installed with `--legacy-peer-deps` (react-dom peer conflict under npm); `@expo/vector-icons` added (not in blank template).
- **Break after Milestone 1.** To run: `cd mobile && npx expo start`, scan QR with Expo Go (SDK 54).
- **Milestone 2 DONE** (commits `345380f`, `cf1841e`):
  - `zustand` store `src/store/useAppStore.ts` = shared editable config (selected apps, per-app limits, question type, grace period, display name, leaderboard opt-in, notifications). App catalog (8 apps) + limit bounds in `src/data/apps.ts`.
  - Onboarding `(onboarding)/`: usage-access, overlay-permission, select-apps, time-limits, preferences (+ completion). Wired to store with validation.
  - Settings tab rebuilt + `app/edit-apps.tsx` / `app/edit-limits.tsx` sub-screens (draft-then-save, confirm dialogs for delete/sign-out).
  - Stats tab (week/month, stacked breakdown w/ tap-to-inspect, per-app delta pills, friction stat cards) + Leaderboard tab (podium, shared-rank list, pinned user row, respects opt-in).
  - Friction overlay `app/friction.tsx` (transparent modal): math/trivia/logic + typing variant, with correct/wrong/escalate/grace/done states. Placeholder question generator in `src/data/questions.ts` (real bank + ladder = M3).
  - Dashboard has a "Simulate limit reached" dev trigger → `/friction`.
  - **Two routing bugs found & fixed (good lessons):**
    1. *Route collision at `/`* — `app/index.tsx` (splash) and `app/(tabs)/index.tsx` both mapped to `/` (route groups `(tabs)` are invisible in the URL). Renamed Home tab to `app/(tabs)/home.tsx`; dashboard now at `/home`, splash keeps `/`.
    2. *Modal had no anchor* — declaring `<Stack.Screen name="friction">` as the only explicit child of the root `<Stack>` made the modal the de-facto initial route (a modal with no anchor wipes the base screen). Fixed per Expo's documented modal pattern: declare `<Stack.Screen name="index" />` first + `export const unstable_settings = { anchor: 'index' }` in `app/_layout.tsx`. NOTE: Expo Router does NOT use an `initialRouteName` prop on `<Stack>`; first-route config lives in `unstable_settings` (`anchor` for SDK 54). Confirmed working on device.
  - Verified: `tsc --noEmit` clean + `expo export --platform android`, no collision warnings, boots to splash on device.
- **Milestone 3 DONE** (commit `0920e1d`):
  - `src/store/useFrictionStore.ts` = the ladder engine. Per-app/per-day state: `level`, `graceExpiresAt`, `blockedForToday`, counters (`answered`/`skipped`/`stopped`/`maxLevel`). Actions: `ensureToday` (midnight reset), `answerCorrect` (grant grace + climb a level), `skip` (+1 level, no grace), `doneForToday`. Persisted via `zustand/persist` + AsyncStorage (`partialize` drops the action fns).
  - `src/store/useAppStore.ts` now wrapped in `persist` (config survives restarts). Added `baselineMinutes` (seeded mock, `TODO(M4)`: real past-7-day query).
  - `src/data/questionBank.ts` replaces `questions.ts`: curated trivia/logic/typing levels 1–5 + generated math; `getQuestion()` avoids immediate repeats.
  - `src/lib/date.ts`: `todayKey()` / `isNewDay()`.
  - `app/friction.tsx`: rewired to the engine — app via `?app=` route param, real escalation/skip/grace(from stored expiry)/done.
  - `app/(tabs)/home.tsx`: runs `ensureToday()` on open; per-app live grace-countdown / "Blocked today" pills; trigger targets the over-limit app; added a dev **"Reset day"** button.
  - `app/(tabs)/stats.tsx`: friction stat cards add live today counters on top of mock history.
  - Added `@react-native-async-storage/async-storage`.
  - **Baseline decision:** NO 7-day waiting period (deviates from blueprint). Baseline = past-7-day usage query on first launch (real in M4); mock seed for now. No "Day X of 7" UI.
  - Verified: `tsc --noEmit` clean + `expo export --platform android`, no warnings. (Device test pending user.)
- Milestone 3 confirmed working on device by the user.

### 2026-06-14 — Milestone 4 (native), Phase A
- **Phase A DONE** (commit `9a59892`): converted Expo Go → custom **dev build**.
  - `npx expo install expo-dev-client`; `npx expo prebuild -p android` generated `mobile/android/`.
  - **We commit `android/`** (bare workflow — hand-edit manifest/gradle/native). Removed `/android` from both root `.gitignore` and `mobile/.gitignore`; build artifacts excluded by `mobile/android/.gitignore`; `ios/` stays ignored; `.idea/` ignored.
  - Trimmed `reactNativeArchitectures=arm64-v8a` in `mobile/android/gradle.properties` (S23 is 64-bit; faster builds).
  - **Verified on device:** `BUILD SUCCESSFUL`, `com.ascend.app` installed + running on the Galaxy S23 (model SM-S911B) via Metro over USB. Same JS app as M3; no Kotlin yet — this is the container Phase B plugs into.
- **Toolchain set up (one-time, persisted in `~/.zshrc`):**
  - `ANDROID_HOME=$HOME/Library/Android/sdk`, `platform-tools` on PATH (adb).
  - **JDK 17** via `brew install openjdk@17` → `JAVA_HOME=/opt/homebrew/opt/openjdk@17` on PATH (system had JDK 20/21; RN 0.81 wants 17).
  - Android **cmdline-tools** (build 14742923) + **NDK 27.1.12297006** installed via `sdkmanager` (the Gradle auto-downloader stalled; sdkmanager is resumable). Licenses accepted.
- **Build command** (run from `mobile/`): `npx expo run:android` (env above). First clean build ~17 min (downloads NDK ~1GB + Maven deps); incremental rebuilds are far faster. JS edits hot-reload over USB with no rebuild; Kotlin edits need a rebuild.
- **Device:** Galaxy S23, USB debugging. Must be plugged in + authorized (`adb devices` shows `device`) for builds/installs. Samsung One UI kills background services aggressively — relevant for Phase D/E (battery-opt exemption).
- **Gotcha learned:** the user is on flaky mobile data (not WiFi); every "stall" today was a dropped download. Big downloads are now cached (~4.7GB); future builds need little internet; the app runs offline (fonts bundled).
- **Phase B DONE** (commit `3d4caf4`): native permissions module + wired onboarding. Verified on S23.
  - Local Expo module `mobile/modules/ascend-native/` (Kotlin, Expo Modules API). Functions: `hasUsageAccess`/`openUsageAccessSettings` (PACKAGE_USAGE_STATS via `AppOpsManager.unsafeCheckOpNoThrow`), `hasOverlayPermission`/`openOverlaySettings` (SYSTEM_ALERT_WINDOW via `Settings.canDrawOverlays`). Permissions declared in the module's `AndroidManifest.xml` (merged into the app at build).
  - Naming chain that must align: Kotlin `Name("AscendNative")` ↔ `expo-module.config.json` class `expo.modules.ascendnative.AscendNativeModule` ↔ JS `requireNativeModule('AscendNative')`. Import `requireNativeModule` from `expo-modules-core` (not `expo`) for SDK 54.
  - JS: `modules/ascend-native/src/AscendNative.ts` + `index.ts`. `src/hooks/usePermissionStatus.ts` re-checks on `AppState` 'active' (return from Settings). `src/components/PermissionBanner.tsx` (green/amber). `usage-access.tsx` + `overlay-permission.tsx` open real Settings, re-verify on return, gate Continue on actual state.
  - Added `modules/ascend-native/.gitignore` (its `android/build/` was getting staged — the app's android/.gitignore doesn't cover the module path).
  - Incremental rebuild after a Kotlin change ≈ 24s, zero new downloads (all cached). Harmless warning: `unsafeCheckOpNoThrow` deprecated (still correct API on Q+).
  - To RE-TEST the not-granted flow: revoke in Android Settings (Usage access / Display over other apps → toggle Ascend off).
- **Phase C DONE** (commits `7f08a36`, chore `048b100`): real usage data + dynamic installed apps. Verified on S23 — numbers match Digital Wellbeing, picker shows the user's real apps.
  - Native: `getUsage` is **event-based** (`queryEvents`, pair ACTIVITY_RESUMED→PAUSED, split intervals across day buckets). The aggregate `totalTimeInForeground` overcounted ~2×; event-based matches Digital Wellbeing (which uses the same UsageStatsManager source — there is NO public API to read DW's number directly). `getInstalledApps()` via PackageManager + a `<queries>` manifest entry (Play-safe; no QUERY_ALL_PACKAGES).
  - JS: apps are now **dynamic, identified by package name** (no hardcoded catalog). `src/data/installedApps.ts` (cached `getInstalledApps()` + `getApp()`), `src/data/appMeta.ts` (known-brand chip colors / hashed fallback + first-letter glyph). `apps.ts` trimmed to limit bounds only. Store keyed by package name (`selected`/`limits`); `toggleApp` seeds a default limit. `src/usage/useUsage.ts` reads real per-app/day minutes → today/week totals, time-saved, streak, and computes the real `baselineMinutes` once on first launch (`baselineComputed` flag).
  - Dashboard + Stats(Week) show real data + usage-access prompt + empty states. Stats(Month) stays sample data (Android keeps ~7 days of per-app daily history). Select/Edit Apps, Time/Edit Limits, and friction all use the device's real apps; friction route `?app=` is now a package name.
  - **Decisions honored:** monitored apps only (not total device); Dashboard+Stats-Week real, Month mock; letter-chips for now (real icons deferred to polish).
  - Repo hygiene: design handoff folder + root `AGENTS.md` are now **untracked + gitignored** (local reference only).
  - **Disk gotcha:** the user's data volume hit 99% (builds need ~1–2 GB scratch → got an `ENOSPC`). Keep ~10 GB free for builds. Our footprint ~7 GB (NDK/Gradle caches).
- **Next (Phase D, evening):** foreground service polling `UsageStatsManager` → when a monitored app passes its limit (and not in grace / not blocked), deep-link to `ascend://friction?app=<pkg>`. JS↔native grace/blocked sync via SharedPreferences (module: `setLimits`/`setGraceUntil`/`setBlocked`). Boot receiver. Replaces the "Simulate limit reached" dev button.
