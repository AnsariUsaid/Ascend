"use client";

/* eslint-disable @next/next/no-img-element */
// Screenshots are positioned/measured by the flying-phone choreography, so we use
// plain <img> rather than next/image (which wraps elements and complicates layout reads).

import { useEffect, useRef, useState } from "react";

const POP = "var(--font-poppins)";
const DM = "var(--font-dm-sans)";

const STEPS = [
  {
    num: "01",
    label: "Choose apps",
    title: "Choose your apps",
    desc: "Pick the apps that pull you in — Instagram, YouTube, TikTok, whatever quietly steals your hours. Add or remove them anytime.",
  },
  {
    num: "02",
    label: "Set limits",
    title: "Set daily limits",
    desc: "Give each app a daily budget. The moment you go over, ASCEND steps in — no willpower required, just a line you drew yourself.",
  },
  {
    num: "03",
    label: "Earn time back",
    title: "Earn your time back",
    desc: "Hit a limit and a challenge appears right over the app. Solve it to unlock 10 more minutes — a beat of friction that makes you choose on purpose.",
  },
  {
    num: "04",
    label: "Track progress",
    title: "Watch your time drop",
    desc: "Streaks, weekly totals and per-app trends. Stay under every limit and build a run you genuinely don’t want to break.",
  },
];

const BAR_HEIGHTS = [34, 44, 53, 62, 72, 84, 100];

// Step screenshots for the mobile how-it-works, in STEPS order.
const STEP_IMG = ["/img/select-apps.jpg", "/img/limits.jpg", "/img/friction.jpg", "/img/stats.jpg"];

export default function Landing() {
  // ---- interactive state ----
  const [step, setStep] = useState(0);
  const [streak, setStreak] = useState(4);
  const [used, setUsed] = useState(20);
  const [limit] = useState(30);
  const [denied, setDenied] = useState(0);
  const [pa, setPa] = useState(11);
  const [pb, setPb] = useState(8);
  const [ans, setAns] = useState("");
  const [pstate, setPstate] = useState<"idle" | "solved" | "wrong">("idle");

  // ---- refs for the scroll choreography ----
  const howRef = useRef<HTMLElement | null>(null);
  const anchorARef = useRef<HTMLDivElement | null>(null);
  const anchorBRef = useRef<HTMLDivElement | null>(null);
  const flyRef = useRef<HTMLDivElement | null>(null);
  const fxRef = useRef<HTMLDivElement | null>(null);
  const chipLRef = useRef<HTMLDivElement | null>(null);
  const chipRRef = useRef<HTMLDivElement | null>(null);
  const scrHomeRef = useRef<HTMLImageElement | null>(null);
  const scrRefs = useRef<(HTMLImageElement | null)[]>([]);
  const stat1Ref = useRef<HTMLSpanElement | null>(null);
  const stat2Ref = useRef<HTMLSpanElement | null>(null);
  const badgeRef = useRef<HTMLDivElement | null>(null);
  const stepRef = useRef(0);

  // ---- mobile how-it-works carousel ----
  const howTrackRef = useRef<HTMLDivElement | null>(null);
  const [howSlide, setHowSlide] = useState(0);
  const onHowScroll = () => {
    const el = howTrackRef.current;
    if (el) setHowSlide(Math.round(el.scrollLeft / el.clientWidth));
  };
  const goSlide = (i: number) => {
    const el = howTrackRef.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  useEffect(() => {
    const frame = () => {
      const a = anchorARef.current;
      const b = anchorBRef.current;
      const fly = flyRef.current;
      const how = howRef.current;
      if (!a || !b || !fly || !how) return;
      if (window.innerWidth <= 860) return; // mobile uses the static layout; skip the choreography
      const vh = window.innerHeight;
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();

      // flight progress: from one screen before #how until #how pins
      const howTop = how.offsetTop;
      const sc = window.scrollY || document.documentElement.scrollTop || 0;
      const start = howTop - vh;
      const end = howTop;
      let t = end > start ? (sc - start) / (end - start) : 0;
      t = Math.min(1, Math.max(0, t));
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // easeInOutQuad

      const left = ar.left + (br.left - ar.left) * e;
      const top = ar.top + (br.top - ar.top) * e;
      const w = ar.width + (br.width - ar.width) * e;
      fly.style.width = w + "px";
      fly.style.transform = "translate(" + left + "px," + top + "px)";
      fly.style.opacity = "1";

      // hero decorations: pinned to the hero slot, drifting away + fading on descent
      const eOut = 1 - Math.pow(1 - t, 2);
      const drift = eOut * 220;
      const fade = Math.max(0, 1 - t * 1.7);
      if (fxRef.current) {
        fxRef.current.style.width = ar.width + "px";
        fxRef.current.style.height = ar.height + "px";
        fxRef.current.style.transform =
          "translate(" + (ar.left + drift * 0.5) + "px," + (ar.top - drift * 0.4) + "px)";
        fxRef.current.style.opacity = String(fade);
      }
      if (chipLRef.current) {
        chipLRef.current.style.transform =
          "translate(" + (ar.left - 40 - drift) + "px," + (ar.top + ar.height * 0.16 - drift * 0.35) + "px)";
        chipLRef.current.style.opacity = String(fade);
      }
      if (chipRRef.current) {
        chipRRef.current.style.transform =
          "translate(" + (ar.left + ar.width - 78 + drift) + "px," + (ar.top + ar.height * 0.7 + drift * 0.3) + "px)";
        chipRRef.current.style.opacity = String(fade);
      }

      // step within #how (after landing)
      const total = how.offsetHeight - vh;
      const passed = Math.min(Math.max(-how.getBoundingClientRect().top, 0), total);
      const p = total > 0 ? passed / total : 0;
      const s = Math.min(3, Math.max(0, Math.floor(p * 4)));

      // screen crossfade: home until landed, then the active step
      const landed = t >= 0.82 ? (t - 0.82) / 0.18 : 0;
      if (scrHomeRef.current) scrHomeRef.current.style.opacity = String(1 - landed);
      scrRefs.current.forEach((el, i) => {
        if (el) el.style.opacity = String(i === s ? landed : 0);
      });

      if (s !== stepRef.current) {
        stepRef.current = s;
        setStep(s);
      }
    };

    const onScroll = () => frame();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    window.addEventListener("load", onScroll);
    [0, 50, 150, 300, 600, 1000].forEach((d) => setTimeout(frame, d));
    requestAnimationFrame(() => {
      frame();
      requestAnimationFrame(frame);
    });

    // count-up hero stats
    const countUp = (el: HTMLSpanElement | null, target: number, dur: number) => {
      if (!el) return;
      const startT = performance.now();
      const tick = (now: number) => {
        const tt = Math.min(1, (now - startT) / dur);
        const eased = 1 - Math.pow(1 - tt, 3);
        el.textContent = String(Math.round(eased * target));
        if (tt < 1) requestAnimationFrame(tick);
      };
      setTimeout(() => requestAnimationFrame(tick), 350);
    };
    countUp(stat1Ref.current, 37, 1400);
    countUp(stat2Ref.current, 7, 1100);

    // reveal on scroll
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = el.getAttribute("data-reveal-delay");
            if (delay) el.style.transitionDelay = delay + "ms";
            el.classList.add("in");
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => io.observe(el));

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("load", onScroll);
      io.disconnect();
    };
  }, []);

  // ---- derived: how-it-works ----
  const cur = step;

  // ---- derived: streak card ----
  const streakFull = streak >= 7;
  const markLabel = streakFull ? "7-day streak ✓" : "Mark today +1";
  const streakDesc =
    streak === 0
      ? "Back to zero. That sting is exactly the point."
      : streakFull
        ? "Seven clean days. Now you really don’t want to break it."
        : "Day " + streak + " of 7, climbing. Slip once and it resets.";
  const markDay = () => setStreak((s) => Math.min(7, s + 1));
  const breakStreak = () => setStreak(0);

  // ---- derived: limit card ----
  const left = Math.max(0, limit - used);
  const locked = used >= limit;
  const usedLabel = used + "m / " + limit + "m";
  const leftLabel = left + "m left";
  const leftColor = left === 0 ? "#F26D6D" : "rgba(247,236,225,.55)";
  const usePct = Math.min(100, (used / limit) * 100) + "%";
  const deniedMsg = denied > 0 ? "Blocked " + denied + "× — the limit doesn’t budge." : "";
  const useMore = () => setUsed((u) => Math.min(limit, u + 5));
  const denyOpen = () => {
    setDenied((d) => d + 1);
    const el = badgeRef.current;
    if (el) {
      el.style.animation = "none";
      void el.offsetWidth;
      el.style.animation = "shake .45s ease";
    }
  };

  // ---- derived: puzzle card ----
  const inputBorder =
    pstate === "solved" ? "#1F7A4D" : pstate === "wrong" ? "#F26D6D" : "rgba(247,236,225,.2)";
  const solved = pstate === "solved";
  const resultMsg = pstate === "wrong" ? "Not quite — try again." : "";
  const onAns = (ev: React.ChangeEvent<HTMLInputElement>) => {
    setAns(String(ev.target.value).replace(/[^0-9]/g, ""));
    setPstate("idle");
  };
  const checkAns = () =>
    setPstate(ans !== "" && parseInt(ans, 10) === pa * pb ? "solved" : "wrong");
  const newPuzzle = () => {
    setPa(6 + Math.floor(Math.random() * 7));
    setPb(4 + Math.floor(Math.random() * 7));
    setAns("");
    setPstate("idle");
  };

  return (
    <div style={{ position: "relative", width: "100%", overflowX: "clip" }}>
      {/* ============ NAV ============ */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px clamp(20px,5vw,64px)",
          background: "rgba(247,236,225,.82)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(42,33,26,.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <svg width="26" height="21" viewBox="0 0 26 21" fill="none">
            <polyline points="3.5,11 13,3 22.5,11" stroke="#C35A41" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="3.5,18 13,10 22.5,18" stroke="#C35A41" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" opacity={0.5} />
          </svg>
          <span style={{ fontFamily: POP, fontWeight: 700, letterSpacing: ".32em", fontSize: 16, color: "#2A211A" }}>
            ASCEND
          </span>
        </div>
        <a
          href="#get"
          style={{
            textDecoration: "none",
            fontFamily: POP,
            fontWeight: 600,
            fontSize: 14,
            color: "#F7ECE1",
            background: "#C35A41",
            padding: "11px 22px",
            borderRadius: 100,
            boxShadow: "0 6px 18px rgba(195,90,65,.28)",
            whiteSpace: "nowrap",
          }}
        >
          Get the app
        </a>
      </nav>

      {/* ===== DESKTOP layout (>= 861px): flying-phone choreography ===== */}
      <div className="dsk-only">
      {/* ============ FLYING PHONE ============ */}
      <div
        ref={flyRef}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          zIndex: 40,
          width: 300,
          pointerEvents: "none",
          willChange: "transform",
          opacity: 0,
        }}
      >
        <div style={{ position: "absolute", inset: -26, background: "radial-gradient(closest-side,rgba(195,90,65,.20),transparent)", filter: "blur(8px)" }} />
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "738/1536",
            background: "#1c1712",
            borderRadius: 46,
            padding: 11,
            boxShadow: "0 40px 80px -20px rgba(42,18,8,.5),0 0 0 1px rgba(0,0,0,.4)",
          }}
        >
          <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 36, overflow: "hidden", background: "#F7ECE1" }}>
            <img ref={scrHomeRef} src="/img/home.jpg" alt="Ascend home" style={imgFill(1, ".3s linear")} />
            <img ref={(el) => { scrRefs.current[0] = el; }} src="/img/select-apps.jpg" alt="Choose your apps" style={imgFill(0)} />
            <img ref={(el) => { scrRefs.current[1] = el; }} src="/img/limits.jpg" alt="Set daily limits" style={imgFill(0)} />
            <img ref={(el) => { scrRefs.current[2] = el; }} src="/img/friction.jpg" alt="Earn your time back" style={imgFill(0)} />
            <img ref={(el) => { scrRefs.current[3] = el; }} src="/img/stats.jpg" alt="Watch your time drop" style={imgFill(0)} />
          </div>
        </div>
      </div>

      {/* ============ HERO DECORATIONS ============ */}
      <div ref={fxRef} style={{ position: "fixed", left: 0, top: 0, zIndex: 41, pointerEvents: "none", willChange: "transform,opacity", opacity: 0 }}>
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <svg viewBox="0 0 220 460" width="190" style={{ position: "absolute", top: "50%", left: "100%", transform: "translate(-44%,-52%)", overflow: "visible" }} fill="none" aria-hidden="true">
            <path d="M40 30 C 168 96, 184 250, 60 432" stroke="#C35A41" strokeWidth="4" strokeLinecap="round" strokeDasharray="560" style={{ animation: "drawArc 2.4s cubic-bezier(.6,0,.2,1) .5s both, dashFloat 5s ease-in-out 2.9s infinite" }} opacity={0.8} />
            <path d="M60 432 L 44 406 M60 432 L 88 420" stroke="#C35A41" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="60" style={{ animation: "drawArc 0.5s ease 2.7s both" }} opacity={0.8} />
          </svg>
          <svg width="22" height="22" viewBox="0 0 24 24" style={{ position: "absolute", top: -6, left: -22, animation: "twinkle 2.6s ease-in-out infinite" }} aria-hidden="true">
            <path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z" fill="#C35A41" />
          </svg>
          <svg width="14" height="14" viewBox="0 0 24 24" style={{ position: "absolute", bottom: 60, left: -30, animation: "twinkle 3.2s ease-in-out .8s infinite" }} aria-hidden="true">
            <path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z" fill="#E6A15C" />
          </svg>
        </div>
      </div>
      <div ref={chipLRef} style={{ position: "fixed", left: 0, top: 0, zIndex: 41, pointerEvents: "none", willChange: "transform,opacity", opacity: 0 }}>
        <div style={{ animation: "floatA 5.5s ease-in-out infinite", display: "flex", alignItems: "center", gap: 8, background: "#fff", padding: "9px 13px", borderRadius: 14, boxShadow: "0 14px 30px -10px rgba(42,18,8,.28)" }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: "#1F7A4D", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <div>
            <div style={{ fontFamily: POP, fontWeight: 700, fontSize: 12.5, color: "#2A211A", lineHeight: 1.1 }}>Limit held</div>
            <div style={{ fontSize: 10.5, color: "#8A7868" }}>YouTube · today</div>
          </div>
        </div>
      </div>
      <div ref={chipRRef} style={{ position: "fixed", left: 0, top: 0, zIndex: 41, pointerEvents: "none", willChange: "transform,opacity", opacity: 0 }}>
        <div style={{ animation: "floatB 6.2s ease-in-out infinite", display: "flex", alignItems: "center", gap: 8, background: "#fff", padding: "9px 13px", borderRadius: 14, boxShadow: "0 14px 30px -10px rgba(42,18,8,.28)" }}>
          <div style={{ fontFamily: POP, fontWeight: 800, fontSize: 18, color: "#C35A41" }}>7</div>
          <div>
            <div style={{ fontFamily: POP, fontWeight: 700, fontSize: 12.5, color: "#2A211A", lineHeight: 1.1 }}>day streak</div>
            <div style={{ fontSize: 10.5, color: "#8A7868" }}>keep it going</div>
          </div>
        </div>
      </div>

      {/* ============ HERO ============ */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", padding: "120px clamp(20px,5vw,64px) 60px", overflow: "hidden" }}>
        {/* marquee bg */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "90px 0", pointerEvents: "none" }}>
          <div style={{ display: "flex", width: "max-content", animation: "mqL 38s linear infinite", willChange: "transform" }}>
            <span style={marqueeStroke()}>DOOMSCROLL · YOUTUBE · TIKTOK · REELS · DOOMSCROLL · YOUTUBE · TIKTOK · REELS · </span>
            <span style={marqueeStroke()}>DOOMSCROLL · YOUTUBE · TIKTOK · REELS · DOOMSCROLL · YOUTUBE · TIKTOK · REELS · </span>
          </div>
          <div style={{ display: "flex", width: "max-content", animation: "mqR 44s linear infinite" }}>
            <span style={marqueeFill()}>INSTAGRAM · SHORTS · FACEBOOK · X · INSTAGRAM · SHORTS · FACEBOOK · X · </span>
            <span style={marqueeFill()}>INSTAGRAM · SHORTS · FACEBOOK · X · INSTAGRAM · SHORTS · FACEBOOK · X · </span>
          </div>
        </div>

        <div className="hero-grid" style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "1.15fr .85fr", gap: 40, alignItems: "center" }}>
          <div>
            <div data-reveal style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "rgba(195,90,65,.1)", border: "1px solid rgba(195,90,65,.22)", padding: "7px 15px", borderRadius: 100, marginBottom: 26 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#1F7A4D", boxShadow: "0 0 0 3px rgba(31,122,77,.18)" }} />
              <span style={{ fontFamily: POP, fontWeight: 600, fontSize: 12.5, letterSpacing: ".04em", color: "#A8472F" }}>No account needed · 100% on-device</span>
            </div>
            <h1 data-reveal data-reveal-delay="80" style={{ fontFamily: POP, fontWeight: 800, fontSize: "clamp(44px,6.6vw,88px)", lineHeight: 0.97, letterSpacing: "-.02em", color: "#2A211A" }}>
              Break the scroll.<br />
              <span style={{ color: "#C35A41" }}>Reclaim your focus.</span>
            </h1>
            <p data-reveal data-reveal-delay="160" style={{ marginTop: 24, maxWidth: 440, fontSize: "clamp(16px,1.5vw,19px)", lineHeight: 1.55, color: "#6B5C50" }}>
              ASCEND turns your daily limits into a challenge. Go over your time on an app and a puzzle stands between you and the next scroll — so you actually pause.
            </p>
            <div data-reveal data-reveal-delay="240" style={{ marginTop: 34, display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center" }}>
              <a href="#get" style={{ textDecoration: "none", fontFamily: POP, fontWeight: 600, fontSize: 16, color: "#F7ECE1", background: "#C35A41", padding: "16px 34px", borderRadius: 100, boxShadow: "0 12px 30px rgba(195,90,65,.32)" }}>Get Started</a>
              <a href="#how" style={{ textDecoration: "none", fontFamily: POP, fontWeight: 600, fontSize: 16, color: "#2A211A", padding: "16px 26px", borderRadius: 100, border: "1.5px solid rgba(42,33,26,.16)" }}>See how it works</a>
            </div>
            <div data-reveal data-reveal-delay="320" style={{ marginTop: 40, display: "flex", gap: 30 }}>
              <div>
                <div style={{ fontFamily: POP, fontWeight: 800, fontSize: 30, color: "#2A211A" }}><span ref={stat1Ref}>0</span>%</div>
                <div style={{ fontSize: 13, color: "#8A7868", marginTop: 2 }}>less screen time</div>
              </div>
              <div style={{ width: 1, background: "rgba(42,33,26,.12)" }} />
              <div>
                <div style={{ fontFamily: POP, fontWeight: 800, fontSize: 30, color: "#2A211A" }}><span ref={stat2Ref}>0</span>-day</div>
                <div style={{ fontSize: 13, color: "#8A7868", marginTop: 2 }}>streaks built</div>
              </div>
            </div>
          </div>

          <div data-reveal data-reveal-delay="200" style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ position: "relative" }}>
              {/* invisible anchor — the flying phone + decorations lerp here */}
              {/* width is also capped by viewport height (via min(..,vh)) so the tall phone never overflows short screens */}
              <div ref={anchorARef} style={{ width: "min(clamp(240px,28vw,310px), 38vh)", aspectRatio: "738/1536", visibility: "hidden" }} />
            </div>
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS (pinned) ============ */}
      <section id="how" ref={howRef} style={{ position: "relative", height: "420vh" }}>
        <div style={{ position: "sticky", top: 0, height: "100vh", display: "flex", alignItems: "center", overflow: "hidden" }}>
          {/* marquee divider behind */}
          <div style={{ position: "absolute", top: "50%", left: 0, right: 0, transform: "translateY(-50%)", zIndex: 0, pointerEvents: "none", opacity: 0.6 }}>
            <div style={{ display: "flex", width: "max-content", animation: "mqL 50s linear infinite" }}>
              <span style={{ fontFamily: POP, fontWeight: 800, fontSize: "clamp(120px,18vw,260px)", lineHeight: 0.9, whiteSpace: "nowrap", color: "transparent", WebkitTextStroke: "1.5px rgba(42,33,26,.06)" }}>PAUSE · BREATHE · CHOOSE · PAUSE · BREATHE · CHOOSE · </span>
            </div>
          </div>

          <div className="how-grid" style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 1180, margin: "0 auto", padding: "0 clamp(20px,5vw,64px)", display: "grid", gridTemplateColumns: "1fr 360px", gap: "clamp(30px,6vw,80px)", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: POP, fontWeight: 700, fontSize: 13, letterSpacing: ".28em", color: "#C35A41", marginBottom: 26 }}>HOW ASCEND WORKS</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
                <span style={{ fontFamily: POP, fontWeight: 800, fontSize: "clamp(40px,5vw,62px)", lineHeight: 1, color: "rgba(195,90,65,.28)" }}>{STEPS[cur].num}</span>
                <h2 style={{ fontFamily: POP, fontWeight: 800, fontSize: "clamp(34px,5vw,60px)", lineHeight: 1.02, letterSpacing: "-.02em", color: "#2A211A" }}>{STEPS[cur].title}</h2>
              </div>
              <p style={{ marginTop: 20, maxWidth: 430, fontSize: "clamp(16px,1.4vw,18.5px)", lineHeight: 1.6, color: "#6B5C50", minHeight: 90 }}>{STEPS[cur].desc}</p>

              <div style={{ marginTop: 30, display: "flex", flexDirection: "column", gap: 2, maxWidth: 430 }}>
                {STEPS.map((s, i) => {
                  const active = i === cur;
                  const done = i < cur;
                  return (
                    <div key={s.num} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 0", transition: "opacity .4s", opacity: active ? 1 : done ? 0.8 : 0.42 }}>
                      <div style={{ position: "relative", width: 3, alignSelf: "stretch", background: "rgba(42,33,26,.1)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: active ? "0" : done ? "0" : "100%", background: "#C35A41", borderRadius: 3, transition: "bottom .5s cubic-bezier(.2,.7,.2,1)" }} />
                      </div>
                      <span style={{ fontFamily: POP, fontWeight: 600, fontSize: 11, color: "#8A7868", width: 18 }}>{s.num}</span>
                      <span style={{ fontFamily: POP, fontWeight: active ? 700 : 500, fontSize: 17, color: active ? "#2A211A" : "#6B5C50", transition: "all .4s" }}>{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* right device (invisible anchor — flying phone lands here) */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div ref={anchorBRef} style={{ width: "min(clamp(230px,26vw,300px), 34vh)", aspectRatio: "738/1536", visibility: "hidden" }} />
            </div>
          </div>
        </div>
      </section>
      </div>
      {/* ===== /DESKTOP layout ===== */}

      {/* ===== MOBILE layout (<= 860px): static stacked ===== */}
      <div className="mob-only">
        {/* mobile hero */}
        <section style={{ padding: "108px 22px 52px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "rgba(195,90,65,.1)", border: "1px solid rgba(195,90,65,.22)", padding: "7px 14px", borderRadius: 100, marginBottom: 22 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#1F7A4D", boxShadow: "0 0 0 3px rgba(31,122,77,.18)" }} />
            <span style={{ fontFamily: POP, fontWeight: 600, fontSize: 12, letterSpacing: ".03em", color: "#A8472F" }}>No account needed · 100% on-device</span>
          </div>
          <h1 style={{ fontFamily: POP, fontWeight: 800, fontSize: "clamp(34px,9.5vw,50px)", lineHeight: 1.02, letterSpacing: "-.02em", color: "#2A211A" }}>
            Break the scroll.<br />
            <span style={{ color: "#C35A41" }}>Reclaim your focus.</span>
          </h1>
          <p style={{ margin: "18px auto 0", maxWidth: 400, fontSize: 16, lineHeight: 1.55, color: "#6B5C50" }}>
            ASCEND turns your daily limits into a challenge. Go over your time on an app and a puzzle stands between you and the next scroll — so you actually pause.
          </p>
          <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
            <a href="#get" style={{ textDecoration: "none", fontFamily: POP, fontWeight: 600, fontSize: 16, color: "#F7ECE1", background: "#C35A41", padding: "15px 38px", borderRadius: 100, boxShadow: "0 12px 30px rgba(195,90,65,.32)" }}>Get Started</a>
            <a href="#how-m" style={{ textDecoration: "none", fontFamily: POP, fontWeight: 600, fontSize: 15, color: "#2A211A" }}>See how it works</a>
          </div>
          <div style={{ marginTop: 40 }}>
            <PhoneShot src="/img/home.jpg" alt="Ascend home" width="min(74vw, 280px)" />
          </div>
          <div style={{ marginTop: 38, display: "flex", gap: 26, justifyContent: "center", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: POP, fontWeight: 800, fontSize: 28, color: "#2A211A" }}>37%</div>
              <div style={{ fontSize: 12.5, color: "#8A7868", marginTop: 2 }}>less screen time</div>
            </div>
            <div style={{ width: 1, alignSelf: "stretch", background: "rgba(42,33,26,.12)" }} />
            <div>
              <div style={{ fontFamily: POP, fontWeight: 800, fontSize: 28, color: "#2A211A" }}>7-day</div>
              <div style={{ fontSize: 12.5, color: "#8A7868", marginTop: 2 }}>streaks built</div>
            </div>
          </div>
        </section>

        {/* mobile how-it-works */}
        <section id="how-m" style={{ padding: "44px 0 50px" }}>
          <div data-reveal style={{ textAlign: "center", marginBottom: 24, padding: "0 22px" }}>
            <div style={{ width: 40, height: 3, borderRadius: 3, background: "rgba(195,90,65,.55)", margin: "0 auto 18px" }} />
            <div style={{ fontFamily: POP, fontWeight: 700, fontSize: 12.5, letterSpacing: ".26em", color: "#C35A41", marginBottom: 12 }}>HOW IT WORKS</div>
            <h2 style={{ fontFamily: POP, fontWeight: 800, fontSize: "clamp(30px,8vw,40px)", lineHeight: 1.05, letterSpacing: "-.02em", color: "#2A211A" }}>Four steps to<br />your time back.</h2>
          </div>

          {/* carousel: one step per screen, swipe horizontally or tap the dots */}
          <div
            ref={howTrackRef}
            onScroll={onHowScroll}
            className="hide-sb"
            style={{ display: "flex", overflowX: "auto", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", height: "min(600px, 78vh)" }}
          >
            {STEPS.map((s, i) => (
              <div key={s.num} style={{ flex: "0 0 100%", scrollSnapAlign: "center", padding: "0 22px", boxSizing: "border-box", display: "flex" }}>
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    background: "#fff",
                    border: "1px solid rgba(42,33,26,.07)",
                    borderRadius: 28,
                    padding: "32px 22px",
                    boxShadow: "0 22px 54px -28px rgba(42,18,8,.32)",
                  }}
                >
                  <span style={{ fontFamily: POP, fontWeight: 800, fontSize: 11.5, letterSpacing: ".12em", color: "#C35A41", background: "rgba(195,90,65,.1)", padding: "4px 13px", borderRadius: 99, marginBottom: 14 }}>STEP {s.num}</span>
                  <h3 style={{ fontFamily: POP, fontWeight: 800, fontSize: "clamp(24px,6.5vw,32px)", lineHeight: 1.08, letterSpacing: "-.02em", color: "#2A211A", maxWidth: 320 }}>{s.title}</h3>
                  <p style={{ marginTop: 12, fontSize: 14.5, lineHeight: 1.55, color: "#6B5C50", maxWidth: 330 }}>{s.desc}</p>
                  <div style={{ marginTop: 22 }}>
                    <PhoneShot src={STEP_IMG[i]} alt={s.title} width="min(52vw, 24vh)" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* dots */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 22 }}>
            {STEPS.map((s, i) => (
              <button
                key={s.num}
                aria-label={"Go to step " + s.num}
                onClick={() => goSlide(i)}
                style={{ width: i === howSlide ? 24 : 8, height: 8, borderRadius: 99, border: "none", padding: 0, cursor: "pointer", background: i === howSlide ? "#C35A41" : "rgba(42,33,26,.18)", transition: "width .3s ease, background .3s ease" }}
              />
            ))}
          </div>
        </section>
      </div>
      {/* ===== /MOBILE layout ===== */}

      {/* ============ MECHANICS ============ */}
      <section id="mechanics" style={{ position: "relative", background: "#2A211A", color: "#F7ECE1", padding: "clamp(80px,11vw,150px) clamp(20px,5vw,64px)", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 0, pointerEvents: "none", opacity: 0.5 }}>
          <div style={{ display: "flex", width: "max-content", animation: "mqR 46s linear infinite" }}>
            <span style={{ fontFamily: POP, fontWeight: 800, fontSize: "clamp(90px,14vw,200px)", lineHeight: 1, whiteSpace: "nowrap", color: "transparent", WebkitTextStroke: "1.5px rgba(247,236,225,.08)" }}>REAL FOCUS · REAL FOCUS · REAL FOCUS · </span>
          </div>
        </div>
        <div style={{ position: "relative", zIndex: 2, maxWidth: 1180, margin: "0 auto" }}>
          <div data-reveal style={{ fontFamily: POP, fontWeight: 700, fontSize: 13, letterSpacing: ".28em", color: "#E6A15C", marginBottom: 22 }}>THREE KINDS OF FRICTION</div>
          <h2 data-reveal data-reveal-delay="60" style={{ fontFamily: POP, fontWeight: 800, fontSize: "clamp(34px,5.2vw,68px)", lineHeight: 1.02, letterSpacing: "-.02em", maxWidth: 820 }}>
            Friction you&apos;ll<br />actually thank.
          </h2>
          <p data-reveal data-reveal-delay="120" style={{ marginTop: 22, maxWidth: 500, fontSize: "clamp(16px,1.4vw,18px)", lineHeight: 1.6, color: "rgba(247,236,225,.62)" }}>
            No lectures, no blockers you&apos;ll just disable. Three small moments of friction that make the next scroll a choice — not a reflex.
          </p>

          <div style={{ marginTop: 60, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 22 }}>
            {/* CARD 1 — STREAK */}
            <div data-reveal style={cardStyle}>
              <div style={cardHead}>
                <span style={{ fontFamily: POP, fontWeight: 800, fontSize: 15, color: "rgba(230,161,92,.5)" }}>01</span>
                <span style={cardTag}>THE STREAK</span>
              </div>
              <div style={{ marginTop: 26, background: "rgba(0,0,0,.22)", borderRadius: 18, padding: "20px 18px" }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 96 }}>
                  {BAR_HEIGHTS.map((h, i) => {
                    const filled = i < streak;
                    const active = i === streak - 1;
                    return (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: h + "%",
                          borderRadius: "6px 6px 3px 3px",
                          position: "relative",
                          background: filled
                            ? active
                              ? "linear-gradient(180deg,#E6A15C,#C35A41)"
                              : "rgba(195,90,65," + (0.34 + i * 0.08).toFixed(2) + ")"
                            : "rgba(247,236,225,.09)",
                          transition: "background .35s ease, height .35s ease",
                        }}
                      >
                        {active && (
                          <div style={{ position: "absolute", top: -9, left: "50%", transform: "translateX(-50%)", width: 11, height: 11, borderRadius: "50%", background: "#F7ECE1", animation: "glowPulse 2.2s ease-in-out infinite" }} />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 10, letterSpacing: ".08em", color: "rgba(247,236,225,.38)" }}>
                  <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
                </div>
              </div>
              <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <button className="btn-gold" onClick={markDay} style={btnGold}>{markLabel}</button>
                <button className="btn-ghost" onClick={breakStreak} style={btnGhost}>Break a limit ↺</button>
              </div>
              <h3 style={cardTitle}>A streak worth keeping</h3>
              <p style={cardDesc}>{streakDesc}</p>
            </div>

            {/* CARD 2 — LIMIT */}
            <div data-reveal data-reveal-delay="100" style={cardStyle}>
              <div style={cardHead}>
                <span style={{ fontFamily: POP, fontWeight: 800, fontSize: 15, color: "rgba(230,161,92,.5)" }}>02</span>
                <span style={cardTag}>THE LIMIT</span>
              </div>
              <div style={{ marginTop: 26, background: "rgba(0,0,0,.22)", borderRadius: 18, padding: "22px 18px", display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 7, background: "#F26D6D", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: POP, fontWeight: 700, fontSize: 12, color: "#fff" }}>Y</div>
                      <span style={{ fontSize: 13, color: "rgba(247,236,225,.8)" }}>YouTube · {usedLabel}</span>
                    </div>
                    <span style={{ fontFamily: POP, fontWeight: 700, fontSize: 12, color: leftColor }}>{leftLabel}</span>
                  </div>
                  <div style={{ height: 9, background: "rgba(247,236,225,.12)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: usePct, background: "linear-gradient(90deg,#E6A15C,#C35A41)", borderRadius: 99, transition: "width .35s ease" }} />
                  </div>
                </div>
                {!locked && (
                  <button className="btn-gold" onClick={useMore} style={{ ...btnGold, alignSelf: "flex-start" }}>Watch 5 more min</button>
                )}
                {locked && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div ref={badgeRef} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(195,90,65,.16)", border: "1px solid rgba(195,90,65,.35)", padding: "8px 14px", borderRadius: 11 }}>
                      <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
                        <rect x="1.5" y="6.5" width="11" height="8" rx="2" stroke="#E6A15C" strokeWidth="1.6" />
                        <path d="M4 6.5V4.5a3 3 0 0 1 6 0v2" stroke="#E6A15C" strokeWidth="1.6" />
                      </svg>
                      <span style={{ fontFamily: POP, fontWeight: 700, fontSize: 11.5, letterSpacing: ".1em", color: "#E6A15C", whiteSpace: "nowrap" }}>LIMIT REACHED</span>
                    </div>
                    <button className="btn-ghost" onClick={denyOpen} style={btnGhostSm}>Open anyway</button>
                  </div>
                )}
                <div style={{ fontSize: 12.5, color: "rgba(242,109,109,.85)", minHeight: 16 }}>{deniedMsg}</div>
              </div>
              <h3 style={cardTitle}>A limit that holds</h3>
              <p style={cardDesc}>When today&apos;s budget runs out, the app closes. No &quot;just five more minutes.&quot;</p>
            </div>

            {/* CARD 3 — PUZZLE */}
            <div data-reveal data-reveal-delay="200" style={cardStyle}>
              <div style={cardHead}>
                <span style={{ fontFamily: POP, fontWeight: 800, fontSize: 15, color: "rgba(230,161,92,.5)" }}>03</span>
                <span style={cardTag}>THE CHALLENGE</span>
              </div>
              <div style={{ marginTop: 26, background: "rgba(0,0,0,.22)", borderRadius: 18, padding: "24px 18px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                <div style={{ fontFamily: POP, fontWeight: 800, fontSize: 38, letterSpacing: ".02em", color: "#F7ECE1", lineHeight: 1 }}>{pa} × {pb}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: POP, fontWeight: 600, fontSize: 24, color: "rgba(247,236,225,.4)" }}>=</span>
                  <input
                    value={ans}
                    onChange={onAns}
                    inputMode="numeric"
                    placeholder="?"
                    style={{ width: 72, textAlign: "center", fontFamily: POP, fontWeight: 700, fontSize: 21, color: "#F7ECE1", background: "rgba(247,236,225,.06)", border: "2px solid " + inputBorder, borderRadius: 12, padding: "6px 8px", outline: "none", transition: "border-color .2s" }}
                  />
                  <button className="btn-gold" onClick={checkAns} style={{ cursor: "pointer", fontFamily: POP, fontWeight: 700, fontSize: 13, color: "#2A211A", background: "#E6A15C", border: "none", padding: "11px 16px", borderRadius: 12 }}>Check</button>
                </div>
                {solved && (
                  <div style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(31,122,77,.18)", border: "1px solid rgba(31,122,77,.42)", padding: "7px 15px", borderRadius: 99, animation: "glowPulse 2.4s ease-in-out infinite" }}>
                    <span style={{ fontFamily: POP, fontWeight: 800, fontSize: 14, color: "#43C98B" }}>+10:00</span>
                    <span style={{ fontSize: 12, color: "rgba(247,236,225,.62)" }}>earned — back to your day</span>
                  </div>
                )}
                <div style={{ fontSize: 12.5, color: "#F26D6D", minHeight: 15 }}>{resultMsg}</div>
                <button onClick={newPuzzle} style={{ cursor: "pointer", fontFamily: DM, fontSize: 12, color: "rgba(247,236,225,.45)", background: "transparent", border: "none", textDecoration: "underline" }}>try another</button>
              </div>
              <h3 style={cardTitle}>A puzzle that buys time</h3>
              <p style={cardDesc}>Ten more minutes costs one moment of thought. Usually, you just close the app.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section id="get" style={{ position: "relative", background: "#C35A41", color: "#F7ECE1", padding: "clamp(90px,13vw,170px) clamp(20px,5vw,64px)", overflow: "hidden", textAlign: "center" }}>
        <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "40px 0", opacity: 0.9 }}>
          <div style={{ display: "flex", width: "max-content", animation: "mqL 40s linear infinite" }}>
            <span style={{ fontFamily: POP, fontWeight: 800, fontSize: "clamp(70px,11vw,150px)", lineHeight: 1, whiteSpace: "nowrap", color: "transparent", WebkitTextStroke: "1.5px rgba(247,236,225,.14)" }}>EARN YOUR FEED · EARN YOUR FEED · EARN YOUR FEED · </span>
          </div>
          <div style={{ display: "flex", width: "max-content", animation: "mqR 48s linear infinite" }}>
            <span style={{ fontFamily: POP, fontWeight: 800, fontSize: "clamp(70px,11vw,150px)", lineHeight: 1, whiteSpace: "nowrap", color: "rgba(247,236,225,.08)" }}>BREAK THE SCROLL · BREAK THE SCROLL · BREAK THE SCROLL · </span>
          </div>
        </div>
        <div data-reveal style={{ position: "relative", zIndex: 2, maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 4, marginBottom: 26 }}>
            <svg width="48" height="38" viewBox="0 0 48 38" fill="none">
              <polyline points="6,20 24,5 42,20" stroke="#F7ECE1" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "bobChev 3s ease-in-out infinite" }} />
              <polyline points="6,33 24,18 42,33" stroke="#F7ECE1" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity={0.45} style={{ animation: "bobChev 3s ease-in-out infinite .15s" }} />
            </svg>
          </div>
          <h2 style={{ fontFamily: POP, fontWeight: 800, fontSize: "clamp(44px,7vw,92px)", lineHeight: 0.98, letterSpacing: "-.02em" }}>Take back<br />your time.</h2>
          <p style={{ marginTop: 24, fontSize: "clamp(16px,1.6vw,20px)", color: "rgba(247,236,225,.78)" }}>Let&apos;s start your journey.</p>
          <div style={{ marginTop: 38, display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center" }}>
            <a href="#" style={{ textDecoration: "none", fontFamily: POP, fontWeight: 700, fontSize: 17, color: "#C35A41", background: "#F7ECE1", padding: "18px 44px", borderRadius: 100, boxShadow: "0 16px 40px rgba(42,18,8,.3)" }}>Get Started</a>
          </div>
          <p style={{ marginTop: 26, fontSize: 14, color: "rgba(247,236,225,.66)" }}>No account needed. Everything stays private on your device.</p>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer style={{ background: "#2A211A", color: "rgba(247,236,225,.55)", padding: "34px clamp(20px,5vw,64px)", display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="22" height="18" viewBox="0 0 26 21" fill="none">
            <polyline points="3.5,11 13,3 22.5,11" stroke="#C35A41" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="3.5,18 13,10 22.5,18" stroke="#C35A41" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" opacity={0.5} />
          </svg>
          <span style={{ fontFamily: POP, fontWeight: 700, letterSpacing: ".28em", fontSize: 13, color: "#F7ECE1" }}>ASCEND</span>
        </div>
        <span style={{ fontSize: 13 }}>Break the Scroll. Earn Your Feed.</span>
        <span style={{ fontSize: 13, display: "flex", gap: 14, alignItems: "center" }}>
          <a href="/privacy" style={{ color: "rgba(247,236,225,.78)", textDecoration: "none" }}>Privacy</a>
          <span style={{ opacity: 0.5 }}>© 2026 · Made for focus</span>
        </span>
      </footer>
    </div>
  );
}

// ---- shared style helpers ----
function imgFill(opacity: number, transition = ".5s ease"): React.CSSProperties {
  return {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    opacity,
    transition: "opacity " + transition,
  };
}
function marqueeStroke(): React.CSSProperties {
  return {
    fontFamily: POP,
    fontWeight: 800,
    fontSize: "clamp(80px,13vw,190px)",
    lineHeight: 0.9,
    whiteSpace: "nowrap",
    color: "transparent",
    WebkitTextStroke: "1.5px rgba(42,33,26,.09)",
  };
}
function marqueeFill(): React.CSSProperties {
  return {
    fontFamily: POP,
    fontWeight: 800,
    fontSize: "clamp(80px,13vw,190px)",
    lineHeight: 0.9,
    whiteSpace: "nowrap",
    color: "rgba(42,33,26,.045)",
  };
}

// Static framed phone screenshot for the mobile layout (no choreography).
function PhoneShot({ src, alt, width }: { src: string; alt: string; width: string }) {
  return (
    <div style={{ width, margin: "0 auto" }}>
      <div style={{ position: "relative", width: "100%", aspectRatio: "738/1536", background: "#1c1712", borderRadius: 40, padding: 9, boxShadow: "0 30px 60px -18px rgba(42,18,8,.45),0 0 0 1px rgba(0,0,0,.4)" }}>
        <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 32, overflow: "hidden", background: "#F7ECE1" }}>
          <img src={src} alt={alt} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  background: "rgba(247,236,225,.035)",
  border: "1px solid rgba(247,236,225,.1)",
  borderRadius: 26,
  padding: 28,
};
const cardHead: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between" };
const cardTag: React.CSSProperties = { fontFamily: POP, fontWeight: 600, fontSize: 11, letterSpacing: ".14em", color: "rgba(247,236,225,.45)" };
const cardTitle: React.CSSProperties = { marginTop: 22, fontFamily: POP, fontWeight: 700, fontSize: 21, color: "#F7ECE1" };
const cardDesc: React.CSSProperties = { marginTop: 10, fontSize: 14.5, lineHeight: 1.55, color: "rgba(247,236,225,.6)" };
const btnGold: React.CSSProperties = { cursor: "pointer", fontFamily: POP, fontWeight: 700, fontSize: 13, color: "#2A211A", background: "#E6A15C", border: "none", padding: "10px 16px", borderRadius: 99 };
const btnGhost: React.CSSProperties = { cursor: "pointer", fontFamily: POP, fontWeight: 600, fontSize: 13, color: "rgba(247,236,225,.7)", background: "transparent", border: "1px solid rgba(247,236,225,.18)", padding: "10px 14px", borderRadius: 99 };
const btnGhostSm: React.CSSProperties = { ...btnGhost, padding: "9px 14px" };
