import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Ascend",
  description:
    "Ascend keeps everything on your phone: no accounts, no servers, no analytics, no data collection. Read exactly what it accesses and stores, and why.",
};

const POP = "var(--font-poppins)";

const INK = "#2A211A";
const COR = "#C35A41";
const MUT = "#6B5C50";

const LAST_UPDATED = "25 June 2026";
const CONTACT = "usaidanzer@gmail.com";

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: POP,
        fontWeight: 700,
        fontSize: "clamp(22px,3vw,28px)",
        letterSpacing: "-.01em",
        color: INK,
        marginTop: 48,
        marginBottom: 14,
      }}
    >
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 16.5, lineHeight: 1.65, color: "#4A3F36", marginTop: 14 }}>{children}</p>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li style={{ fontSize: 16.5, lineHeight: 1.6, color: "#4A3F36", marginTop: 12 }}>
      <span style={{ fontFamily: POP, fontWeight: 600, color: INK }}>{label}</span> — {children}
    </li>
  );
}

export default function PrivacyPolicy() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* top bar */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px clamp(20px,5vw,48px)",
          borderBottom: "1px solid rgba(42,33,26,.08)",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none" }}>
          <svg width="24" height="19" viewBox="0 0 26 21" fill="none">
            <polyline points="3.5,11 13,3 22.5,11" stroke={COR} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="3.5,18 13,10 22.5,18" stroke={COR} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" opacity={0.5} />
          </svg>
          <span style={{ fontFamily: POP, fontWeight: 700, letterSpacing: ".3em", fontSize: 15, color: INK }}>ASCEND</span>
        </Link>
        <Link
          href="/"
          style={{ fontFamily: POP, fontWeight: 600, fontSize: 14, color: MUT, textDecoration: "none" }}
        >
          ← Back to home
        </Link>
      </header>

      <main style={{ flex: 1, width: "100%", maxWidth: 760, margin: "0 auto", padding: "clamp(40px,7vw,72px) clamp(20px,5vw,40px) 80px" }}>
        <h1 style={{ fontFamily: POP, fontWeight: 800, fontSize: "clamp(36px,6vw,56px)", letterSpacing: "-.02em", color: INK, lineHeight: 1.05 }}>
          Privacy Policy
        </h1>
        <p style={{ marginTop: 14, fontFamily: POP, fontWeight: 500, fontSize: 14, color: MUT, letterSpacing: ".02em" }}>
          Last updated: {LAST_UPDATED}
        </p>

        <P>
          Ascend is built around one promise: <strong style={{ color: INK }}>your data stays on your phone.</strong>{" "}
          Ascend has no accounts, no servers, no analytics, and no third-party trackers. It cannot sell or
          share your information, because it never collects or receives any.
        </P>
        <P>
          In one line: Ascend reads your Android screen-time data <em>on your device</em> to know when you&apos;ve
          passed a daily limit you set for an app, then shows a challenge over that app. All of it happens locally.
        </P>

        <H2>What Ascend accesses on your device — and why</H2>
        <P>Ascend asks only for what it needs to enforce the limits you set. Each permission is used solely for the purpose below, and nothing it reads is uploaded.</P>
        <ul style={{ paddingLeft: 20, marginTop: 6 }}>
          <Item label="Usage access (screen time)">
            Ascend reads how long you spend in each app using Android&apos;s usage statistics. This is how it knows
            when you&apos;ve hit a limit and how it shows your stats. Read and processed on your device.
          </Item>
          <Item label="Display over other apps">
            Lets Ascend show the full-screen challenge on top of the app you&apos;re using, and lets its background
            checker bring that screen up. No data is collected through this.
          </Item>
          <Item label="Background service & restart-on-boot">
            A lightweight background service watches for the moment you cross a limit, and restarts itself after a
            reboot so protection keeps working. It only processes usage on-device.
          </Item>
          <Item label="Notifications">
            Android requires an ongoing notification for that background service. Ascend uses it only to show that the
            limit checker is running.
          </Item>
          <Item label="Your installed apps">
            To build the app picker, Ascend asks Android for the list of apps that have a launcher icon. It does{" "}
            <em>not</em> use the broad &quot;query all packages&quot; access, and the list is used only to let you choose which
            apps to limit.
          </Item>
          <Item label="Vibration">Short haptic feedback inside the app.</Item>
          <Item label="Internet">
            Ascend includes the standard Android internet permission that nearly all apps declare, but it does not use
            it to send your data anywhere — the app works fully offline.
          </Item>
        </ul>

        <H2>What Ascend stores on your device</H2>
        <P>
          Everything below is saved in Ascend&apos;s private on-device storage and never transmitted:
        </P>
        <ul style={{ paddingLeft: 20, marginTop: 6 }}>
          <Item label="Your limits">The apps you chose to monitor and each app&apos;s daily time budget.</Item>
          <Item label="Your preferences">
            Challenge type (math, trivia, logic, or typing), grace-period length, a display name you pick, and whether
            notifications are on.
          </Item>
          <Item label="A baseline figure">
            Your average daily usage of the monitored apps, measured once on your device, used to show how much
            you&apos;ve cut down.
          </Item>
          <Item label="Your day-to-day progress">
            The current challenge difficulty, any active grace period, whether you&apos;ve chosen to stop an app for the
            day, and simple counts of answers and skips. This resets each day.
          </Item>
        </ul>

        <H2>What Ascend does not do</H2>
        <ul style={{ paddingLeft: 20, marginTop: 6 }}>
          <Item label="No account or sign-up">
            You never give Ascend an email, phone number, password, or any name beyond the display name you type.
          </Item>
          <Item label="No servers">Ascend has no backend. Your information has nowhere external to go.</Item>
          <Item label="No analytics or tracking">
            There are no analytics tools, advertising IDs, crash-reporting services, or third-party trackers in the app.
          </Item>
          <Item label="No selling or sharing">
            Ascend does not sell, rent, or share your information with anyone, because it never collects it.
          </Item>
        </ul>

        <H2>Your controls</H2>
        <ul style={{ paddingLeft: 20, marginTop: 6 }}>
          <Item label="Clear everything">
            Open <span style={{ fontFamily: POP, fontWeight: 600, color: INK }}>Settings → Clear all data</span> inside
            Ascend. This erases all of the above, stops the background checker, and returns the app to a fresh state.
          </Item>
          <Item label="Uninstall">Removing Ascend deletes all of its on-device data.</Item>
        </ul>

        <H2>Children</H2>
        <P>
          Ascend does not knowingly collect data from anyone, including children, because it collects no data at all.
        </P>

        <H2>Changes to this policy</H2>
        <P>
          If this policy changes, the &quot;Last updated&quot; date above will change with it and the new version will be
          posted on this page.
        </P>

        <H2>Contact</H2>
        <P>
          Questions about privacy? Reach us at{" "}
          <a href={`mailto:${CONTACT}`} style={{ color: COR, fontWeight: 600, textDecoration: "none" }}>
            {CONTACT}
          </a>
          .
        </P>
      </main>

      <footer
        style={{
          background: INK,
          color: "rgba(247,236,225,.55)",
          padding: "26px clamp(20px,5vw,48px)",
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 13,
        }}
      >
        <Link href="/" style={{ color: "rgba(247,236,225,.8)", textDecoration: "none", fontFamily: POP, fontWeight: 600, letterSpacing: ".06em" }}>
          ASCEND
        </Link>
        <span>© 2026 · Made for focus</span>
      </footer>
    </div>
  );
}
