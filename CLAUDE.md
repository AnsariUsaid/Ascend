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
- **Next (Milestone 4):** native Kotlin module — `UsageStatsManager` (real per-app usage + past-7-day baseline), `SYSTEM_ALERT_WINDOW` overlay, foreground service. Switch from Expo Go to a dev build (`expo prebuild` + `expo-dev-client`).
