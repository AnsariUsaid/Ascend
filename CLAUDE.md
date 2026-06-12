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
- Discovered Expo Go on the user's phone supports only SDK 54; re-pinning the scaffold from SDK 56 → 54.
- **Next:** finish SDK 54 scaffold, add Expo Router, build design-system theme + first screens (Splash, Sign-in, Dashboard).
