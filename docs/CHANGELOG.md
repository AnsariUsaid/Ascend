# Build Journal — every commit, explained

A chronological account of how Ascend was built, commit by commit, so a new
contributor can understand *what* changed and *why*. Feature commits are the
milestones; `docs:` commits just update the [logbook](../CLAUDE.md); `chore:`/`fix:`
are housekeeping and bug fixes.

> Reading tip: each milestone is independently runnable. The hard parts have a
> short "what we learned" note, because several were non-obvious.

---

## Milestone 1 — Scaffold, design system, first screens

**`959c3d4` Milestone 1: Expo SDK 54 scaffold, design system, Splash/Sign-in/Dashboard**
The foundation. Created the Expo + Expo Router + TypeScript app in `mobile/`, pinned
to **SDK 54** (an early constraint: the test phone's Expo Go only supported 54).
Built the "Summit" **design system** (`src/theme`) — colors (with an OKLCH→hex
converter so app-brand hues are exact), Bricolage + Outfit fonts, spacing tokens —
plus the first reusable components and three screens: Splash, Sign-in (stubbed), and
the Dashboard. Bottom-tab navigation with placeholders for the other tabs.

**`926d36d` docs: log Milestone 1 completion**

---

## Milestone 2 — All screens on mock data

**`345380f` Milestone 2: full screen set on mock data**
Built every remaining screen against mock data: the 5-step **onboarding**, **Settings**
(+ Edit Apps / Edit Limits), **Stats** (week/month, tap-to-inspect chart), **Leaderboard**
(podium + pinned user row), and the **Friction overlay** (math/trivia/logic + typing
variant, with correct/wrong/escalate/grace/done states). Introduced **Zustand** as the
shared config store (selected apps, limits, question type, grace period, …).

**`cf1841e` fix(router): anchor root stack so app boots at splash, not the friction modal**
*What we learned:* two subtle Expo Router bugs. (1) A **route collision** — `app/index.tsx`
(splash) and `app/(tabs)/index.tsx` (dashboard) both resolved to `/` because route
groups like `(tabs)` are invisible in the URL; fixed by moving the dashboard to
`/home`. (2) A **modal with no anchor** — declaring the friction modal as the only
`<Stack.Screen>` child made it the de-facto initial route; fixed with Expo's documented
modal pattern (`unstable_settings = { anchor: 'index' }` + declaring `index` first).

**`aa2c0c3` docs: log Milestone 2 + routing fixes**

---

## Milestone 3 — The friction engine + persistence

**`0920e1d` Milestone 3: friction-ladder engine + persistence + question bank**
Turned the friction *screen* into a real *engine* (`src/store/useFrictionStore.ts`):
per-app, per-day state (current level, grace expiry, blocked-for-today, counters) with
the real rules — correct answer grants grace and climbs a level; **skip** costs +1 level
and no grace; **midnight reset**. Both stores now **persist** via `zustand/persist` +
AsyncStorage (grace countdowns survive an app restart because they're stored as a
timestamp). Added a curated **question bank** and a `/friction?app=…` route param.

> Product decision recorded here: **no 7-day waiting period** for the baseline (a
> deviation from the blueprint). Instead the baseline is computed from the *past* 7
> days on first launch, so friction works from day one.

**`99a5972` docs: log Milestone 3 completion**

---

## Milestone 4 — Going native (the hard milestone)

This is where the app stops being a mockup and starts actually controlling screen time.
It required leaving Expo Go for a custom **development build** that can run our own
Kotlin code.

### Phase A — the dev build

**`9a59892` Phase A: convert to a custom dev build (Expo Go → dev client)**
Added `expo-dev-client` and ran `expo prebuild` to generate the native `android/`
project (which we now **commit**, since we hand-edit the manifest/Gradle). Trimmed the
build to `arm64-v8a` for speed. This phase adds **no features** — its only job is to
prove a custom build compiles and runs the existing app on the phone, so that later,
when Kotlin breaks something, we know it's *our* Kotlin and not the toolchain.

*Toolchain set up here:* JDK 17 (the build rejects newer JDKs), Android cmdline-tools
+ NDK via `sdkmanager`, `ANDROID_HOME`/`JAVA_HOME` on PATH.

**`92f14ba` docs: log Phase A + toolchain**

### Phase B — native permissions

**`3d4caf4` Phase B: native permissions module + wired onboarding**
The first real Kotlin: a local Expo module (`modules/ascend-native`) exposing four
functions — `hasUsageAccess` / `openUsageAccessSettings` (PACKAGE_USAGE_STATS via
`AppOpsManager`) and `hasOverlayPermission` / `openOverlaySettings` (SYSTEM_ALERT_WINDOW).
These two are "special" permissions: declaring them in the manifest isn't enough — the
user must flip a switch in Settings. The onboarding screens now open the real Settings
and **re-verify on return** (a `usePermissionStatus` hook that re-checks when the app
comes back to the foreground).

*The naming chain that must line up:* Kotlin `Name("AscendNative")` ↔
`expo-module.config.json` class path ↔ JS `requireNativeModule('AscendNative')`.

**`d00538a` docs: log Phase B**

### Phase C — real usage data + real apps

**`048b100` chore: stop tracking design handoff + AGENTS.md**
Housekeeping — the design-handoff folder and a stray `AGENTS.md` are local reference
only; untracked + gitignored so they don't clutter commits.

**`7f08a36` Phase C: real usage data + dynamic installed apps**
Two big fixes driven by on-device testing:
- **Accuracy.** The first usage implementation used the aggregate `totalTimeInForeground`
  API, which **overcounted ~2×**. Rewrote `getUsage` to be **event-based** (replay each
  app's resumed→paused intervals, split across day buckets) — this matches Android's
  Digital Wellbeing closely (which uses the same `UsageStatsManager` source; there is no
  public API to read Wellbeing's number directly).
- **Real apps.** The app list was a hardcoded catalog (showed TikTok/X you may not have,
  hid Snapchat you do). Added native `getInstalledApps()` (PackageManager + a `<queries>`
  manifest entry — Play-Store-safe), and refactored the whole app to be **dynamic and
  keyed by package name**. The Dashboard and Stats (Week) now show real numbers; the
  baseline is computed from real past-7-day data.

**`4193fa8` docs: log Phase C**

## Milestone 4 · Phase D — background limit watcher (auto-trigger)

**Phase D: the friction screen now appears on its own.**
Until now the overlay only opened from a dev button. Phase D adds a background
**foreground service** that watches which app is in front and, when a monitored app
crosses its daily limit (and you're not in a grace window or blocked for the day),
relaunches Ascend at `ascend://friction?app=<pkg>` right on top of it.

The split stays clean: **the friction "brain" remains in JS** — native only *watches*
and *triggers*. They stay in sync through `SharedPreferences`:

- New Kotlin: `UsageReader` (the event-based usage read, now shared by the JS module and
  the service; adds a **stateful** "current foreground app" that survives long sessions in
  one app — a naive "last event in 10s" reads as empty when you sit still), `MonitorStore`
  (the shared state: enabled flag, per-app limits, and **self-expiring** grace timestamps /
  blocked-day strings, so the service stays correct even with the JS app closed),
  `MonitorService` (the foreground service — polls every 3s, 5s cooldown), `BootReceiver`
  (re-arms after a reboot).
- The native module gained `startWatching`/`stopWatching`/`isWatching` and the sync setters
  `setGrace`/`setBlockedToday`/`clearFriction`/`clearAllFriction`.
- JS: a `useMonitorSync` hook arms the watcher exactly when both permissions are granted and
  at least one app is monitored (and disarms otherwise); the friction store mirrors each
  outcome to native. The dev button is kept for quick testing.

*What we learned:* (1) in a **library** manifest the service/receiver names must be
**fully qualified** — a leading `.` resolves against the app's package and silently breaks
the merge; (2) Android 14+ needs a **typed** foreground service — we use `specialUse` with a
written justification; (3) if the laptop sleeps mid-build the Gradle daemon hangs — stop the
daemons and rerun. Verified on the S23: the service runs as a special-use FGS and a low limit
auto-triggers friction within seconds.

**`<pending>` Phase D: foreground service + auto overlay trigger + boot receiver**

---

## Still to come

- **Phase E** — hardening (permission-revoked screen, battery-optimization exemption,
  request POST_NOTIFICATIONS, Samsung/OEM background-kill quirks), then a release APK to
  run unplugged.
- **M5** — backend + sync and a real leaderboard.
