# Handoff: Ascend — Full App (Android)

## Overview

Ascend is an Android app that helps adults reduce screen time through **cognitive friction**: when a daily usage timer for a monitored app runs out, the user must complete an escalating challenge (math, typing, etc.) to earn a small grace period. This handoff covers the complete v1 screen set, in user-flow order:

1. Splash
2. Sign In
3. Onboarding Step 1 — Usage Access permission
4. Onboarding Step 2 — Overlay permission
5. Onboarding Step 3 — Select apps to monitor
6. Onboarding Step 4 — Set daily time limits
7. Onboarding Step 5 — Display name & preferences → completion
8. Dashboard (Home tab)
9. Friction Overlay — Standard (Math) + Typing variant
10. Stats tab
11. Leaderboard tab
12. Settings tab (+ Edit Monitored Apps, Edit Time Limits sub-screens)

## About the Design Files

The files in `screens/` are **design references created in HTML** — interactive prototypes showing intended look and behavior. They are NOT production code to copy directly. Your task is to **recreate these designs in the target codebase's environment** (Kotlin/Jetpack Compose is the natural fit for this Android app; React Native or Flutter also work) using its established patterns and libraries. If no codebase exists yet, choose the most appropriate Android stack and implement there.

Each `.dc.html` file opens directly in a browser. The phone-frame chrome (status bar, gesture bar, bezel) is presentation scaffolding (`android-frame.jsx`) — do not implement it. The content INSIDE the frame is the design. Pages also include designer's notes around the phone; those are annotations, not app UI.

## Fidelity

**High-fidelity.** Colors, typography, spacing, radii, copy, and interaction states are final and should be recreated faithfully. All measurements below are CSS px at a 412×892 reference viewport (1× density); convert to dp 1:1.

## Design Tokens

### Colors ("Summit" palette)
| Token | Value | Usage |
|---|---|---|
| Coral (primary) | `oklch(0.62 0.15 38)` ≈ `#D2603F` | Brand surfaces, primary buttons, active states, bars |
| Coral text | `oklch(0.55 0.12 40)` | Coral-tinted text on light bg |
| Cream (background) | `#fbf4ea` | App background, text on dark/coral |
| Coffee (dark) | `#221a13` | Dark cards, secondary buttons, dialogs scrim base |
| Ink (text) | `#2b211a` | Primary text on light |
| Muted text | `#5c5045` (body) / `#8a7a69` / `#9a8a78` (captions) / `#b9a98f` (faint) | |
| Card border | `#eee2d0`; hairline divider `#f6ecdd` | |
| Track / inactive fill | `#f0e3cf`; disabled `#ddd0bb` | |
| Success | `oklch(0.45 0.1 150)` text, `oklch(0.94 0.05 150)` bg | Under-limit, improvement |
| Danger | `oklch(0.5–0.55 0.16–0.17 30)` text, `oklch(0.95 0.03–0.04 30)` bg | Over-limit, destructive, errors |
| Amber accent | `oklch(0.78 0.13 70)` | Time-saved number, rank highlight on dark |
| App identity hues | IG 340, YT 25, TT 200, FB 260, X 290, WA 150, SC 95, RD 45 — chip bg `oklch(0.87 0.06 H)`, chip glyph `oklch(0.42 0.1 H)` | |

### Typography
- **Bricolage Grotesque** (Google Fonts; weights 700/800) — wordmark, headlines, numbers, screen titles.
- **Outfit** (weights 300–600) — all UI text.
- Scale: screen title 27/800 (Bricolage); section label 12.5/600 uppercase, letter-spacing 0.14em; row text 15/500; caption 12–13/400–500; hero numbers 30–44/800; ASCEND wordmark letter-spacing 0.16em.

### Spacing & shape
- Screen padding: 24px horizontal.
- Cards: radius 16–18px, 1px `#eee2d0` border, white bg. Hero cards radius 18px. Dialogs/sheets radius 24–32px.
- Buttons: height 54–56px, radius 18px; secondary text-button height 48px.
- Pills/chips: radius 99px. Progress bars: 7px tall, radius 99px.
- Toggles: 48×29px track, radius 99; thumb 19px on / 13px off.
- Bottom nav: white, 1px top border, 4 equal items, icon 22px + 11.5px label; active = coral icon + `oklch(0.55 0.12 40)` 600 label.
- Toasts: dark `#221a13` pill, cream text, bottom-centered ~110px up.
- Press state: scale(0.98); hover (where applicable): subtle shadow or `#fdf9f1` row tint.

## Screens / Views

### 1. Splash (`01-07 Onboarding Flow…`, phase "splash")
- Full-bleed coral background. Centered column: chevron mark (two stacked up-chevrons, 72px, cream stroke 8, second at 35–40% opacity), "ASCEND" 42/800 Bricolage letter-spacing 0.16em cream, tagline "Break the Scroll. Earn Your Feed." 16/400 cream@75%.
- Loader: 18px cream sun rising over a 3px cream@45% horizon line inside a 64×44 masked box, 2s loop.
- Auto-advance after ~2.6s → Sign In if logged out, Dashboard if logged in. No interaction.

### 2. Sign In (phase "signin")
- Top ~55%: coral hero, bottom-aligned: mark 52px, "ASCEND" 20/700, headline "Take back your time." 44/800 cream, sub "Sign in to start your journey." 17/400 cream@78%.
- Bottom: cream sheet (radius 32 top corners, padding 28) with 3 buttons (56px, radius 18, gap 12):
  - Continue with Google — white bg, 1px `#e5dac9` border, ink text.
  - Continue with Apple — coffee bg, cream text.
  - Continue with Email — transparent, 1.5px coffee border.
  - **Use official Google/Apple brand glyphs in production** (prototype uses dashed placeholder chips).
- Legal: "By continuing, you agree to our Terms & Privacy Policy" 13px, Terms/Privacy are links.
- Behavior: tap → loading row (spinner + "Contacting {provider}…"); failure → dismissible error banner ("We couldn't sign you in. Check your connection and try again.") and retry; success → onboarding (new user) or Dashboard. No back navigation.

### 3–7. Onboarding Steps 1–5 (single flow, no bottom nav)
Shared header: "Step N of 5" caption + 5-segment progress bar (5px, gap 6; done = coral, current = coral@35%, rest `#e5dac9`).

- **Step 1 — Usage Access (PACKAGE_USAGE_STATS):** illustrative weekly-bars card; headline "See where your time goes"; 3 coral-dot bullets (needs usage access to measure time; powers stats and interventions; data stays on device unless explicitly shared). Buttons: "Grant Access" (coral primary) → system Usage Access settings; "I'll do this later" (text). **On every return/resume, re-check the permission**: granted → green success banner + "Continue"; not granted → amber reminder banner ("Without usage access, screen-time tracking and interventions won't work…") + "Continue anyway" outline button. Never mark complete without the actual permission.
- **Step 2 — Overlay (SYSTEM_ALERT_WINDOW):** same pattern; copy explains intervention screens must draw over other apps, otherwise friction challenges can't be enforced. "Allow Overlay" primary, same verified-on-return logic and reminder.
- **Step 3 — Select Apps:** headline "Which apps do you want to control?", sub "You can change this anytime."; multi-select list (IG/YT/TikTok/FB/X/WhatsApp pre-detected; IG/YT/TT preselected). Row: 38px hue chip, name, 26px rounded-square coral checkbox; selected row border `oklch(0.62 0.15 38 / 0.55)`. Validation: ≥1 selected; otherwise inline error "Select at least one app." and Continue blocked.
- **Step 4 — Time Limits:** headline "Set your daily limits", sub explains interventions start when a limit is exceeded. One row per selected app: chip, name, − / + stepper (34px round buttons) around a time label. Range **15 min–4 h, 15-min steps**, default 1h; buttons disable (faded) at bounds. Continue saves all limits.
- **Step 5 — Display Name & prefs → Completion:** name field (required, 3–16 chars, validated inline), challenge-type picker (Math / Trivia / Logic / Typing), grace-period picker (5/10/15 min). Finish Setup → full-coral completion screen → "Enter Ascend" → Dashboard.

### 8. Dashboard — Home (`08 Dashboard.dc.html`)
- Header: greeting ("Good morning," time-aware, 14.5 muted) + display name 27/800; refresh chip ("Updated just now" / spinner "Refreshing…"); 46px avatar circle (coffee bg, initials).
- **Streak banner:** coral, radius 18 — chevron mark 30px, "7-day streak" 18/800 cream, caption "Every day this week under your limits".
- **Today's usage:** card per monitored app — 36px hue chip, name 15.5/500, right-aligned status ("23m left" green / "Over by 12m" red 13/600); below: 7px progress bar (coral; red when over; track `#f0e3cf`) + "48m / 1h" caption. Over-limit card gets red-tinted border `oklch(0.55 0.17 30 / 0.45)`.
- **This week:** white card, 7 bars (today = coral, rest `#f0e3cf`), M–S labels, today's label coral.
- **Time saved:** coffee card — "TIME SAVED" caption + "vs. your limits, this week"; right: "3h 40m" 30/800 amber.
- Bottom nav (Home active). Refresh on screen open; pull/manual refresh updates usage, streak, trend. Handle missing data with an empty state.

### 9. Friction Overlay (`09 Friction Overlay…`) — system overlay, no nav
Shown over the blocked app when its limit is exceeded. Background: blurred/dimmed app content; rising coral card (radius 32 top, ~75% height) containing:
- Cream "ASCEND" wordmark small; frosted "Level N" chip (cream@15% bg, blur).
- Blocked-app row: hue chip + "You've used **Instagram** for 2 hours today." cream.
- Reward line: "Solve to earn **10 more minutes**" (grace period from settings).
- **Standard (Math/Trivia/Logic):** question text 24–28/700 cream; cream input field (radius 14–16); "Check Answer" coffee button; "I'm done for today" cream@70% underlined text-link.
- **Typing variant:** label "Type this sentence to earn 10 more minutes"; reference sentence in a cream@12% card; 3–4 line textarea (placeholder "Start typing…"); live "Accuracy: 94%" indicator (≥95% light green `oklch(0.92 0.11 150)`, 80–94% cream, <80% coffee); Check Answer enabled only when input length ≥ reference length.
- Logic: correct → grant grace period, dismiss overlay (grace pill with countdown); incorrect → escalate difficulty/level, show new challenge with an "escalated" banner; "I'm done for today" → confirmation state that blocks the app for the rest of the day.

### 10. Stats (`10 Stats.dc.html`)
- Title "Stats" + Week/Month segmented toggle (track `#f0e3cf`, active segment coffee pill with cream text). Switching recalculates everything.
- **Improvement summary:** coffee card — "↓ 14%" 34/800 green + "less screen time" / "vs. last week|month".
- **Daily breakdown:** stacked bar chart (IG hue-340 / YT coral / TT hue-200 segments), 110px tall, labels M T W T F S S (or W1–W4 in Month view); legend chips top-right; tapping a bar highlights it and shows "Day F · 4h 30m · IG 1h · YT 1h 50m · TT 45m" in a footer row.
- **Per-app performance:** row per app — chip, name, "Xh Ym total"; right delta pill: "↓ 18%" green pill or "↑ 5%" red pill vs. previous period.
- **Friction stats:** 3-card grid — questions answered (coral card, cream number), highest level reached, times chose to stop (white cards).
- Bottom nav (Stats active). Handle insufficient history ("no previous data") gracefully.

### 11. Leaderboard (`11 Leaderboard.dc.html`)
- Title + "Resets in 2d 14h" pill (coral dot). Caption "This week · ranked by % screen-time reduction".
- **Podium (top 3):** center #1 elevated — 68px avatar with 3px coral ring, coral block (84px) with "#1" + "↓31%" cream; sides 56px avatars, `#f0e3cf` blocks (64/52px).
- **List (#4+):** white rows — rank `#b9a98f` 700, 36px avatar, name + "Xh Ym saved" caption, right "↓19%" green 700. **Ties share a rank** (two #4 at ↓19%; next is #6); tiebreaker display = total time saved.
- **Pinned current-user row:** always visible above bottom nav — coffee card, amber "#7", coral avatar, "EarlyBird (you)", "3h 40m saved · 2 spots to top 5", green "↓14%". Shown regardless of scroll position; updates with standings.
- Respect the "Show me on Leaderboard" privacy setting (hidden users excluded from public display). Bottom nav (Leaderboard active).

### 12. Settings (`12 Settings…`)
- Title "Settings"; **profile card**: white, 52px avatar (light-coral bg, 2px coral ring, initials), display name 18/800, email caption, right "7-day streak" coral pill.
- Sections (12.5/600 uppercase labels) of grouped white cards with hairline dividers:
  - **App Controls:** "Monitored Apps" (value "3 apps", live count) ›; "Time Limits" ›.
  - **Friction Settings:** "Question Type — Math" ›; "Grace Period — 10 minutes" ›; "Display Name — EarlyBird" ›.
  - **Privacy:** "Show me on Leaderboard" toggle (on) + dynamic caption ("Visible as EarlyBird in weekly rankings" / "Hidden from public rankings").
  - **Account:** "Notifications" toggle (on); "Delete Account" and "Sign Out" in danger red.
- Destructive actions open a **confirmation dialog** (scrim `rgba(24,15,9,0.55)` + blur; cream card radius 24; Cancel outline + danger-red confirm). Delete: "This permanently erases your usage history, limits, streak and leaderboard standing from this device. This cannot be undone." Sign out returns to Sign In.
- Footer: "Ascend 1.0 · data stays on this device". Bottom nav (Settings active).

#### Sub-screen: Edit Monitored Apps (no bottom nav)
Back arrow + title + "n selected"; list of all 8 installed apps (IG, YT, TT, FB, X, WhatsApp, Snapchat, Reddit) with the Step-3 checkbox row pattern + "Currently monitored / Not monitored" captions. Sticky footer "Save Changes" (coral; greyed when 0 selected) with ≥1-app validation error banner. Saving: newly added apps get a default 1h limit; removed apps lose monitoring, limits, interventions. Back discards draft.

#### Sub-screen: Edit Time Limits (no bottom nav)
Back arrow + title; one stepper row per monitored app (same as Step 4; 15 min–4 h, 15-min steps, disabled at bounds). Sticky footer Save; "takes effect immediately" note.

## Interactions & Behavior (cross-cutting)

- **Navigation:** bottom nav on the four tabs only; sub-screens and onboarding push with back arrows; splash/sign-in/overlay have no back.
- **Permissions:** re-verify PACKAGE_USAGE_STATS and SYSTEM_ALERT_WINDOW on every onResume — UI state must reflect the real system state, never assume granted.
- **Friction loop:** limit exceeded → overlay (level from escalation history) → correct answer grants grace period → timer resumes → next expiry escalates level. "I'm done for today" ends the session per policy.
- **Toggles:** animate 0.2s ease; thumb grows on. Buttons press to scale(0.98).
- **Toasts:** dark pill, ~1.9s, bottom-centered.
- **Refresh:** dashboard/stats/leaderboard refresh on open; spinner = coral-top ring rotating 0.8s linear.

## State Management

- Auth/session: provider, signed-in user (display name, email, avatar initials).
- Onboarding: per-step completion, permission grant states, selected apps, per-app limits (minutes), challenge type, grace period.
- Tracking: per-app usage today (minutes), 7-day/4-week aggregates, streak count, time-saved.
- Friction: current level per app, question history, "stopped" count, active grace expiry.
- Settings: leaderboard visibility, notifications, monitored-app set + limits (single source of truth shared with onboarding values).

## Assets

- No raster assets. Chevron mark + nav icons are simple SVG paths (in the prototypes' source).
- Fonts: Bricolage Grotesque + Outfit via Google Fonts.
- **Production must replace placeholder provider glyphs (G/A chips) with official Google & Apple sign-in assets, and placeholder app chips with real app icons** (subject to platform branding rules).

## Files

All in `screens/`, numbered in flow order:
- `01-07 Onboarding Flow (Splash + Sign In + Steps 1-5).dc.html` — one interactive prototype: splash auto-advance, sign-in, all 5 onboarding steps incl. mock Android settings screens; jump rail below the phone to reach any moment.
- `08 Dashboard.dc.html`
- `09 Friction Overlay (Math + Typing).dc.html` — both variants side by side, replayable.
- `10 Stats.dc.html` — Week/Month toggle live.
- `11 Leaderboard.dc.html`
- `12 Settings (+ Monitored Apps, Time Limits).dc.html` — sub-screens navigable in-prototype.
- `android-frame.jsx`, `support.js` — prototype scaffolding only; not part of the design.

### How to open the prototypes

- **`standalone/` — double-click to open.** Self-contained single-file HTML bundles that run fully offline in any browser. Use these to view/interact with the designs. (Same screens, same numbering.)
- **`screens/` — source `.dc.html` files** for reference/editing. These load helper files at runtime, so opening them directly from disk shows a "Failed to fetch" error — view them through `standalone/` instead, or serve `screens/` over a local web server.
