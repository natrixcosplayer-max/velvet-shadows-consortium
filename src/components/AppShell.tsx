import { Link, useRouterState } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import altaLogo from "../assets/alta.png";
import {
  playSfx,
} from "../audio/atrium-audio-engine";

const SKIP_COMMISSION_GATES_KEY = "skip-commission-gates-once";
const UNLOCK_SOUND_PLAYED_KEY = "unlock-sound-played";
const COMMUNICADO_SEEN_KEY = "comunicado-seen";

const NAV = [
  { to: "/", label: "Comisión", latin: "Comissio" },
  { to: "/dossiers", label: "Expedientes", latin: "Expedia" },
  { to: "/missions", label: "Operativo", latin: "Operativi" },
  { to: "/comms", label: "Comunicaciones", latin: "Nuntii" },
  { to: "/atlas", label: "Continentales", latin: "Orbis" },
  { to: "/treasury", label: "Tesorería", latin: "Aerarium" },
] as const;

export function AppShell({ children, title, latin }: { children: ReactNode; title: string; latin: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [now, setNow] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hudChannel, setHudChannel] = useState("CANAL SEGURO");
  const [hudCipher, setHudCipher] = useState("AES-512");
  const [hudGlitch, setHudGlitch] = useState(false);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const formatted = new Intl.DateTimeFormat("es-ES", {
        timeZone: "Europe/Madrid",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(d);

      setNow(`${formatted} CEST`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const channelId = setInterval(() => {
      setHudChannel((prev) => (prev === "CANAL SEGURO" ? "CANAL ESTABLE" : "CANAL SEGURO"));
    }, 9000);

    const cipherId = setInterval(() => {
      setHudCipher((prev) => (prev === "AES-512" ? "AES-1024" : "AES-512"));
    }, 10500);

    const scheduleGlitch = () => {
      const delay = 45000 + Math.floor(Math.random() * 15000);
      const id = setTimeout(() => {
        if (cancelled) return;
        setHudGlitch(true);
        const clearId = setTimeout(() => {
          if (!cancelled) setHudGlitch(false);
        }, 85);
        timeouts.push(clearId);
        scheduleGlitch();
      }, delay);
      timeouts.push(id);
    };

    scheduleGlitch();

    return () => {
      cancelled = true;
      clearInterval(channelId);
      clearInterval(cipherId);
      timeouts.forEach((id) => clearTimeout(id));
    };
  }, []);
   
  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Top bar */}
      <header className="border-b border-gold-dim bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 md:px-8 h-14">
          <Link
            to="/"
            onClick={() => {
              window.sessionStorage.removeItem(SKIP_COMMISSION_GATES_KEY);
              window.sessionStorage.removeItem(UNLOCK_SOUND_PLAYED_KEY);
              window.sessionStorage.removeItem(COMMUNICADO_SEEN_KEY);
              setMobileOpen(false);
            }}
            className="flex items-center gap-3"
            aria-label="Reiniciar secuencia de acceso"
          >
            <img
  src={altaLogo}
  alt="Alta Mesa"
  className="w-8 h-8 object-contain"
/>
            <div className="leading-none">
              <p className="font-display text-gold text-sm tracking-[0.25em]">EX COMISSIO</p>
              <p className="font-mono text-[10px] text-gold-dim tracking-[0.3em]">ALTA MESA</p>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-6 font-mono text-[11px] text-gold-dim">
            <span className={`flex items-center gap-2 ${hudGlitch ? "animate-hud-micro-glitch" : ""}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse-gold" />
              {hudChannel} · {hudCipher}
            </span>
            <span>{now}</span>
            <span className="text-gold">AGENTE · {AGENT_ID}</span>
          </div>
          <button
            className="md:hidden text-gold border border-gold-dim px-2 py-1 text-xs font-mono"
            onClick={() => {
              if (typeof navigator !== "undefined" && /iPhone/i.test(navigator.userAgent)) {
                playSfx("/sounds/luxbeep.mp3", 0.45);
              }
              setMobileOpen((v) => !v);
            }}
            aria-label="Alternar navegación"
          >
            {mobileOpen ? "CERRAR" : "MENÚ"}
          </button>
        </div>
        <nav className={`${mobileOpen ? "block" : "hidden"} md:block border-t border-gold-dim`}>
          <div className="flex flex-col md:flex-row md:items-center px-4 md:px-8 overflow-x-auto">
            {NAV.map((item) => {
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => {
  let sound = "/sounds/luxbeep.mp3";

  switch (item.to) {
    case "/dossiers":
      sound = "/sounds/dossier.mp3";
      break;

    case "/missions":
      sound = "/sounds/operatives.mp3";
      break;

    case "/comms":
      sound = "/sounds/comm.mp3";
      break;

    case "/atlas":
      sound = "/sounds/luxbeep2.mp3";
      break;

    case "/treasury":
      sound = "/sounds/coin.mp3";
      break;
  }

 playSfx(sound, 0.45);

  if (item.to === "/missions") {
    navigator.vibrate?.(20);
  }

  setMobileOpen(false);

  if (item.to === "/") {
    window.sessionStorage.setItem(SKIP_COMMISSION_GATES_KEY, "1");
  }
}}
                  className={`relative font-mono text-base md:text-[11px] font-normal tracking-[0.18em] md:tracking-[0.25em] uppercase py-3 md:py-2.5 md:mr-8 transition-colors ${active ? "text-gold font-bold border border-gold/60 bg-secondary/35 px-2 md:px-3" : "text-gold-dim hover:text-gold"}`}
                >
                  {item.label}
                  <span className="ml-2 text-[9px] opacity-60 font-display">· {item.latin}</span>
                  {active && <span className="hidden md:block absolute -bottom-px left-0 right-0 h-px bg-gold" />}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="flex-1 px-4 md:px-8 py-8 md:py-12 max-w-[1400px] w-full mx-auto">
        <div className="mb-10 animate-fade-up">
          <p className="font-mono text-[10px] tracking-[0.4em] text-gold-dim uppercase">{latin}</p>
          <h1 className="font-display text-4xl md:text-5xl text-gold mt-2">{title}</h1>
          <div className="mt-4 h-px w-56 bg-gradient-to-r from-gold to-transparent" />
        </div>
        {children}
      </main>

      <footer className="border-t border-gold-dim mt-16 py-6 px-4 md:px-8 font-mono text-[10px] text-gold-dim tracking-[0.25em] flex flex-col md:flex-row justify-between gap-2">
        <span>EX UMBRA · IN SOLEM</span>
        <span>LA ALTA MESA TODO LO VE</span>
        <span>© MMXXVI · CONTINENTAL HOTELS GROUP</span>
      </footer>
    </div>
  );
}

const AGENT_ID = "0734·MANDARIN";


export function Sigil({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="text-gold">
      <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="32" cy="32" r="24" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
      <path d="M32 8 L40 32 L32 56 L24 32 Z" fill="currentColor" opacity="0.85" />
      <circle cx="32" cy="32" r="3" fill="var(--background)" />
      <circle cx="32" cy="32" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function Panel({ children, className = "", title, latin }: { children: ReactNode; className?: string; title?: string; latin?: string }) {
  return (
    <section className={`noir-panel gold-corners p-6 md:p-8 ${className}`}>
      {(title || latin) && (
        <div className="mb-5 flex items-baseline justify-between gap-3 border-b border-gold-dim pb-3">
          <h2 className="font-display text-xl text-gold">{title}</h2>
          {latin && <span className="font-mono text-[10px] tracking-[0.3em] text-gold-dim uppercase">{latin}</span>}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatBlock({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border border-gold-dim p-4 bg-background/40">
      <p className="font-mono text-[10px] tracking-[0.3em] text-gold-dim uppercase">{label}</p>
      <p className="font-display text-2xl text-gold mt-1">{value}</p>
      {sub && <p className="font-mono text-[10px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}
