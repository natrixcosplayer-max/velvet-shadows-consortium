import { EntryGate } from "../components/EntryGate";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type CSSProperties } from "react";
import { AppShell, Panel, StatBlock } from "../components/AppShell";
import { ClearanceGate } from "../components/ClearanceGate";
import { ensureMusicPlayback, playSfx } from "../audio/atrium-audio-engine";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EX COMMISSIO ALTA MESA" },
      { name: "description", content: "Red Interna de la Comisión. Acceso restringido a operativos autorizados." },
    ],
  }),
  component: Index,
});

const SKIP_COMMISSION_GATES_KEY = "skip-commission-gates-once";
const ORDER_BLOCKS = [
  "La Comisión le asigna un operativo de prioridad máxima.",
  "Recupere el activo.",
  "No comprometa la seguridad, el anonimato ni los intereses de la Alta Mesa.",
  "Consulte el expediente OPERATIVO.",
] as const;

type SignalPhase = "intro" | "interference" | "stable";

function Index() {
  const [entered, setEntered] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.sessionStorage.getItem(SKIP_COMMISSION_GATES_KEY) === "1") {
      setEntered(true);
      setUnlocked(true);
      window.sessionStorage.removeItem(SKIP_COMMISSION_GATES_KEY);
    }

    setBootstrapped(true);
  }, []);

  const handle = () => {
    setUnlocked(true);
  };

  if (!bootstrapped) {
    return null;
  }

  if (!entered) {
    return (
      <EntryGate
        onEnter={() => setEntered(true)}
      />
    );
  }

  if (!unlocked) {
    return <ClearanceGate onComplete={handle} />;
  }

  return <Atrium />;
}

function Atrium() {
  const [showComunicado, setShowComunicado] = useState(false);
  const [showAgent, setShowAgent] = useState(false);
  const [visibleOrderCount, setVisibleOrderCount] = useState(0);
  const [showFinalOrder, setShowFinalOrder] = useState(false);
  const [operativoPulse, setOperativoPulse] = useState(false);
  const [transmissionGlitch, setTransmissionGlitch] = useState(false);
  const [transmissionFlicker, setTransmissionFlicker] = useState(false);
  const [signalPhase, setSignalPhase] = useState<SignalPhase>("intro");
  const [transmissionShift, setTransmissionShift] = useState(0);
  const [lineShiftIndex, setLineShiftIndex] = useState<number | null>(null);
  const [lineShiftPx, setLineShiftPx] = useState(0);
  const [packetLossTarget, setPacketLossTarget] = useState<{ line: number; word: string } | null>(null);
  const [encryptedSwapTarget, setEncryptedSwapTarget] = useState<{ line: number; word: string; replacement: string } | null>(null);
  const [interferenceSweepY, setInterferenceSweepY] = useState<number | null>(null);
  const [titleInterference, setTitleInterference] = useState(false);
  const [isIPhone, setIsIPhone] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    setIsIPhone(/iPhone/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const addTimeout = (fn: () => void, ms: number) => {
      const id = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
      timeouts.push(id);
    };

    addTimeout(() => setShowComunicado(true), 700);
    addTimeout(() => setShowAgent(true), 4200);

    ORDER_BLOCKS.forEach((line, index) => {
      addTimeout(() => {
        setVisibleOrderCount(index + 1);
        if (line.includes("OPERATIVO")) {
          setOperativoPulse(true);
          addTimeout(() => setOperativoPulse(false), 950);
        }

      }, 6200 + index * 2800);
    });

    addTimeout(() => {
      playSfx("/sounds/luxbeep2.mp3", 0.2);
      window.dispatchEvent(new CustomEvent("operativo-attention"));
      navigator.vibrate?.(20);
    }, 6200 + ORDER_BLOCKS.length * 2800 + 1120);

    addTimeout(() => {
      window.sessionStorage.setItem("comunicado-seen", "1");
    }, 6200 + ORDER_BLOCKS.length * 2800 + 1320);

    return () => {
      cancelled = true;
      timeouts.forEach((id) => clearTimeout(id));
    };
  }, []);

  useEffect(() => {
    if (!showComunicado) return;

    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const addTimeout = (fn: () => void, ms: number) => {
      const id = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
      timeouts.push(id);
    };

    setSignalPhase("intro");
    addTimeout(() => setSignalPhase("interference"), 260);
    addTimeout(() => setSignalPhase("stable"), 1900);

    return () => {
      cancelled = true;
      timeouts.forEach((id) => clearTimeout(id));
    };
  }, [showComunicado]);

  useEffect(() => {
    if (signalPhase === "intro") return;

    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const addTimeout = (fn: () => void, ms: number) => {
      const id = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
      timeouts.push(id);
    };

    const pickVisibleLineIndex = () => {
      const visible: number[] = [];

      if (showAgent) visible.push(0);

      for (let i = 0; i < visibleOrderCount; i += 1) {
        visible.push(1 + i);
      }

      if (showFinalOrder) visible.push(1 + ORDER_BLOCKS.length);

      if (!visible.length) return null;
      return visible[Math.floor(Math.random() * visible.length)];
    };

    const triggerSignalEvent = () => {
      const shift = Math.floor(Math.random() * 13) - 6;
      const glitchDuration = signalPhase === "interference"
        ? 90 + Math.floor(Math.random() * 110)
        : 80 + Math.floor(Math.random() * 80);

      setTransmissionShift(shift);
      setTransmissionGlitch(true);

      const shouldFlicker = Math.random() < (signalPhase === "interference" ? 0.92 : 0.62);
      if (shouldFlicker) {
        const flickerDuration = Math.random() < 0.5 ? 16 : 50;
        setTransmissionFlicker(true);
        addTimeout(() => setTransmissionFlicker(false), flickerDuration);
      }

      const shouldDisplaceLine = Math.random() < (signalPhase === "interference" ? 0.9 : 0.68);
      if (shouldDisplaceLine) {
        const targetLine = pickVisibleLineIndex();
        if (targetLine !== null) {
          const amount = (Math.random() < 0.5 ? -1 : 1) * (2 + Math.floor(Math.random() * 5));
          setLineShiftIndex(targetLine);
          setLineShiftPx(amount);
          addTimeout(() => {
            setLineShiftIndex(null);
            setLineShiftPx(0);
          }, 52);
        }
      }

      const shouldSweep = Math.random() < (signalPhase === "interference" ? 0.78 : 0.42);
      if (shouldSweep) {
        setInterferenceSweepY(10 + Math.floor(Math.random() * 80));
        addTimeout(() => setInterferenceSweepY(null), 72 + Math.floor(Math.random() * 40));
      }

      const packetLossCandidates: Array<{ line: number; word: string }> = [];
      if (visibleOrderCount > 1) packetLossCandidates.push({ line: 2, word: "Comisión" });
      if (visibleOrderCount > 2) packetLossCandidates.push({ line: 3, word: "activo" });
      if (visibleOrderCount > 4) packetLossCandidates.push({ line: 5, word: "OPERATIVO" });

      const shouldDropWord = packetLossCandidates.length > 0 && Math.random() < (signalPhase === "interference" ? 0.48 : 0.22);
      if (shouldDropWord) {
        const selection = packetLossCandidates[Math.floor(Math.random() * packetLossCandidates.length)];
        setPacketLossTarget(selection);
        addTimeout(() => setPacketLossTarget(null), Math.random() < 0.5 ? 16 : 34);
      }

      addTimeout(() => {
        setTransmissionGlitch(false);
        setTransmissionShift(0);
      }, glitchDuration);
    };

    const scheduleNextEvent = () => {
      const minDelay = signalPhase === "interference" ? 420 : 1700;
      const maxDelay = signalPhase === "interference" ? 1500 : 4200;
      const delay = minDelay + Math.floor(Math.random() * (maxDelay - minDelay + 1));

      addTimeout(() => {
        triggerSignalEvent();
        scheduleNextEvent();
      }, delay);
    };

    scheduleNextEvent();

    return () => {
      cancelled = true;
      timeouts.forEach((id) => clearTimeout(id));
    };
  }, [signalPhase, showAgent, visibleOrderCount, showFinalOrder]);

  useEffect(() => {
    if (!showAgent) return;

    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const addTimeout = (fn: () => void, ms: number) => {
      const id = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
      timeouts.push(id);
    };

    const scheduleTitleInterference = () => {
      const delay = 900 + Math.floor(Math.random() * 900);
      addTimeout(() => {
        setTitleInterference(true);
        addTimeout(() => setTitleInterference(false), 120 + Math.floor(Math.random() * 70));
        scheduleTitleInterference();
      }, delay);
    };

    scheduleTitleInterference();

    return () => {
      cancelled = true;
      timeouts.forEach((id) => clearTimeout(id));
    };
  }, [showAgent]);

  useEffect(() => {
    if (!showAgent) return;

    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const addTimeout = (fn: () => void, ms: number) => {
      const id = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
      timeouts.push(id);
    };

    const scheduleEncryptedSwap = () => {
      const delay = 3600 + Math.floor(Math.random() * 4200);
      addTimeout(() => {
        const candidates: Array<{ line: number; word: string; replacement: string }> = [];

        if (visibleOrderCount > 0) candidates.push({ line: 1, word: "Comisión", replacement: "C0MISION" });
        if (visibleOrderCount > 1) candidates.push({ line: 2, word: "activo", replacement: "ASSET-7" });
        if (visibleOrderCount > 2) {
          candidates.push({ line: 3, word: "seguridad", replacement: "segurid4d" });
          candidates.push({ line: 3, word: "anonimato", replacement: "anonimat0" });
          candidates.push({ line: 3, word: "Mesa", replacement: "M3SA" });
        }
        if (visibleOrderCount > 3) {
          candidates.push({ line: 4, word: "OPERATIVO", replacement: "0P-7X" });
          candidates.push({ line: 4, word: "expediente", replacement: "exped13nte" });
        }

        if (!candidates.length) {
          scheduleEncryptedSwap();
          return;
        }

        const selected = candidates[Math.floor(Math.random() * candidates.length)];
        setEncryptedSwapTarget(selected);
        setTransmissionGlitch(true);

        addTimeout(() => setEncryptedSwapTarget(null), 180);
        addTimeout(() => setTransmissionGlitch(false), 200);
        scheduleEncryptedSwap();
      }, delay);
    };

    scheduleEncryptedSwap();

    return () => {
      cancelled = true;
      timeouts.forEach((id) => clearTimeout(id));
    };
  }, [showAgent, showFinalOrder, visibleOrderCount]);

  const renderSignalWord = (line: number, word: string, className = "") => {
    if (line === ORDER_BLOCKS.length + 1) {
      return <span className={className}>{word}</span>;
    }

    const isEncryptedSwap = encryptedSwapTarget?.line === line && encryptedSwapTarget.word === word;
    const isPacketLoss = packetLossTarget?.line === line && packetLossTarget.word === word;

    return (
      <span className={`${className} ${isPacketLoss ? "signal-packet-loss" : ""} ${isEncryptedSwap ? "signal-encrypted-swap" : ""}`.trim()}>
        {isEncryptedSwap ? encryptedSwapTarget.replacement : word}
      </span>
    );
  };

  const renderParagraph = (text: string, line: number) => {
    const marker = "OPERATIVO";
    const finalMarker = "La misión comienza ahora.";

    if (text === finalMarker) {
      return (
        <strong className="comm-final-sheen text-gold-bright uppercase tracking-[0.18em] [text-shadow:0_0_12px_oklch(0.88_0.16_88_/_0.35)]">
          LA MISIÓN COMIENZA AHORA
        </strong>
      );
    }

    const markerIndex = text.indexOf(marker);
    if (markerIndex !== -1) {
      const before = text.slice(0, markerIndex);
      const marked = text.slice(markerIndex, markerIndex + marker.length);
      const after = text.slice(markerIndex + marker.length);

      return (
        <>
          {before}
          <strong className={`text-gold-bright transition-shadow duration-700 ${operativoPulse ? "comm-operativo-burst shadow-[0_0_8px_oklch(0.88_0.16_88_/_0.5)]" : ""}`}>
            {renderSignalWord(line, marked)}
          </strong>
          {after}
        </>
      );
    }

    const packetKeywords = ["Comisión", "activo", "seguridad", "anonimato", "Mesa", "expediente"] as const;
    for (const keyword of packetKeywords) {
      const keywordIndex = text.indexOf(keyword);
      if (keywordIndex !== -1) {
        const before = text.slice(0, keywordIndex);
        const after = text.slice(keywordIndex + keyword.length);
        return (
          <>
            {before}
            {renderSignalWord(line, keyword)}
            {after}
          </>
        );
      }
    }

    return text;
  };

  return (
    <AppShell title="MANDARIN" latin="Bienvenido, Agente">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatBlock label="Autorización" value="AURUM VII" sub="Autorizado por la Alta Mesa" />
        <div className="border border-gold-dim p-4 bg-background/40">
          <p className="font-mono text-[10px] tracking-[0.3em] text-gold-dim uppercase">Saldo en Monedas</p>
          <div className="mt-1 inline-flex items-center gap-2">
            <p className="font-display text-2xl text-gold">6</p>
            <span className="inline-grid h-5 w-5 place-items-center rounded-full border border-gold/70 bg-gold/20 text-gold text-[11px] leading-none">
              ⊙
            </span>
          </div>
          <p className="font-mono text-[10px] text-muted-foreground mt-1">Marcadores en circulación: 1</p>
        </div>
        <div className="border border-gold-dim p-4 bg-background/40">
          <p className="font-mono text-[10px] tracking-[0.3em] text-gold-dim uppercase">Operación</p>
          <p className="font-display text-2xl text-gold mt-1">EN CURSO</p>
          <div className="mt-3 h-1 bg-secondary border border-gold-dim">
            <div className="h-full w-[65%] animate-progress-alert bg-[linear-gradient(90deg,oklch(0.55_0.08_80)_0%,oklch(0.78_0.13_85)_24%,oklch(0.9_0.1_88_/_0.65)_40%,oklch(0.88_0.16_88)_50%,oklch(0.9_0.1_88_/_0.65)_60%,oklch(0.78_0.13_85)_76%,oklch(0.55_0.08_80)_100%)] bg-[length:220%_100%] shadow-[0_0_10px_oklch(0.88_0.16_88_/_0.58)]" />
          </div>
        </div>
        <StatBlock label="Estatus" value="In Bonis" sub="Sin deudas pendientes" />
      </div>

      <section className="relative mb-16 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 alta-mesa-secure-scanlines" />
        <div className={`pointer-events-none absolute inset-0 alta-mesa-secure-grain ${signalPhase === "interference" ? "is-interference" : "is-stable"}`} />
        <div className={`pointer-events-none absolute inset-0 alta-mesa-terminal-artifacts ${transmissionGlitch ? "is-glitch" : ""}`} />
        <div className="pointer-events-none absolute inset-0 opacity-[0.11] [background-image:linear-gradient(oklch(0.78_0.13_85_/_13%)_1px,transparent_1px),linear-gradient(90deg,oklch(0.78_0.13_85_/_13%)_1px,transparent_1px)] [background-size:32px_32px] animate-comm-grid-drift" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-gold/80 to-transparent opacity-[0.62] [animation:scan_4.8s_linear_infinite]" />
        <div className="pointer-events-none absolute inset-x-0 top-6 h-px bg-gradient-to-r from-transparent via-gold/62 to-transparent opacity-[0.56] [animation:scan_7.6s_linear_infinite]" />
        <div className="pointer-events-none absolute inset-x-0 top-12 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent opacity-[0.34] [animation:scan_10.4s_linear_infinite]" />
        <div className={`pointer-events-none absolute inset-0 bg-black transition-opacity duration-75 ${transmissionFlicker ? "opacity-[0.16]" : "opacity-0"}`} />
        <div
          className={`pointer-events-none absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-gold/70 to-transparent transition-opacity duration-75 ${interferenceSweepY === null ? "opacity-0" : "opacity-95"}`}
          style={interferenceSweepY === null ? undefined : ({ top: `${interferenceSweepY}%` } as CSSProperties)}
        />

        <div
          className={`relative mx-auto max-w-[680px] space-y-10 px-4 text-left md:px-4 alta-mesa-transmission ${signalPhase === "interference" ? "is-interference" : "is-stable"} ${transmissionGlitch ? "is-glitch" : ""}`}
          style={{ "--comm-shift": `${transmissionShift}px` } as CSSProperties}
        >
          <div className={`relative overflow-hidden rounded-[24px] border border-gold/20 bg-[linear-gradient(180deg,oklch(0.05_0.003_60_/_0.98),oklch(0.075_0.003_60_/_0.985))] px-5 py-6 shadow-[0_0_0_1px_rgba(214,173,74,0.06)_inset,0_0_42px_rgba(214,173,74,0.09)] md:px-8 md:py-8 ${isIPhone ? "comm-iphone" : ""}`}>
            <div className="pointer-events-none absolute inset-0 alta-mesa-comm-scanlines opacity-[0.18]" />
            <div className="pointer-events-none absolute inset-0 alta-mesa-comm-noise opacity-[0.55]" />
            <div className="pointer-events-none absolute inset-x-0 top-[18%] z-[40] h-px bg-[linear-gradient(90deg,transparent,rgba(214,173,74,0.24),rgba(214,173,74,0.58),rgba(214,173,74,0.24),transparent)] opacity-[0.32] [animation:comm-line-scan_7.4s_linear_infinite]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(214,173,74,0.08),transparent_30%),radial-gradient(circle_at_center,rgba(0,0,0,0.1),transparent_58%)]" />
            <div className={`pointer-events-none absolute inset-0 border border-gold/10 transition-opacity duration-500 ${showComunicado ? "opacity-100" : "opacity-0"}`} />

            <div className="relative space-y-7 md:space-y-8">
              <div className="space-y-3">
                <p className={`comm-header-sync font-mono text-[10px] uppercase tracking-[0.34em] text-gold-dim/76 ${showComunicado ? "opacity-100" : "opacity-0"}`}>
                  CANAL CLASIFICADO
                </p>
                <p className={`comm-header-sync delay-150 font-display text-[18px] uppercase tracking-[0.2em] text-gold-dim/84 ${showComunicado ? "opacity-100" : "opacity-0"}`}>
                  COMUNICADO OFICIAL
                </p>
              </div>

              <div className="space-y-4">
                <h2
                  className={`comm-agent-reveal font-display tracking-[0.12em] text-gold transition-opacity duration-[700ms] md:text-[48px] ${isIPhone ? "text-[43px]" : "text-[36px]"} ${showAgent ? "opacity-100" : "opacity-0"} ${lineShiftIndex === 0 ? "signal-line-jitter" : ""} ${titleInterference ? "agent-title-interference" : ""}`}
                  style={lineShiftIndex === 0 ? ({ "--line-shift": `${lineShiftPx}px` } as CSSProperties) : undefined}
                >
                  AGENTE MANDARIN
                </h2>
              </div>

              <div className="space-y-7 md:space-y-8">
                {ORDER_BLOCKS.map((paragraph, index) => {
                  const isVisible = visibleOrderCount > index;
                  return (
                    <p
                      key={`comm-order-${index}`}
                      className={`comm-order-reveal font-display leading-[2] tracking-[0.035em] text-gold/78 md:text-[16px] ${isIPhone ? "text-[17px]" : "text-[14px]"} ${isVisible ? "opacity-100" : "opacity-0"} ${lineShiftIndex === index + 1 ? "signal-line-jitter" : ""}`}
                      style={lineShiftIndex === index + 1 ? ({ "--line-shift": `${lineShiftPx}px` } as CSSProperties) : undefined}
                    >
                      {renderParagraph(paragraph, index + 1)}
                    </p>
                  );
                })}

                <p
                  className={`comm-final-order comm-final-order-lock font-display uppercase tracking-[0.17em] text-gold-bright md:text-[24px] ${isIPhone ? "text-[24px]" : "text-[20px]"} ${visibleOrderCount >= ORDER_BLOCKS.length ? "opacity-100" : "opacity-0"} ${lineShiftIndex === ORDER_BLOCKS.length + 1 ? "signal-line-jitter" : ""}`}
                  style={lineShiftIndex === ORDER_BLOCKS.length + 1 ? ({ "--line-shift": `${lineShiftPx}px` } as CSSProperties) : undefined}
                >
                  EJECUTE SUS {renderSignalWord(ORDER_BLOCKS.length + 1, "ÓRDENES")}.
                </p>
              </div>

              <p className={`comm-signature pt-3 font-mono text-[9px] uppercase tracking-[0.32em] text-gold-dim/70 ${showFinalOrder ? "opacity-100" : "opacity-0"}`}>
                EX COMMISSIONE ALTA MESA
              </p>
            </div>
          </div>
        </div>
      </section>

<div className="grid md:grid-cols-4 gap-4 mb-8">

  <StatBlock
    label="Nivel"
    value="VII"
    sub="Autorización concedida"
  />

  <StatBlock
    label="Estado"
    value="ACTIVO"
  />

  <StatBlock
    label="Canal"
    value="CIFRADO"
  />

  <StatBlock
    label="Objetivo"
    value="ASIGNADO"
  />

</div>

<div className="grid md:grid-cols-2 gap-6">

  <Link
    to="/missions"
    onClick={() => {
      ensureMusicPlayback(180);
      playSfx("/sounds/operatives.mp3", 0.32);
    }}
    className="border border-gold-dim p-8 hover:border-gold transition block animate-pulse-gold"
  >

    <p className="font-display text-2xl text-gold">
      LOCALIZAR ACTIVO
    </p>

    <p className="mt-3 text-sm text-muted-foreground">
      Consultar la localización del activo y abrir las coordenadas.
    </p>

  </Link>

  <Link
    to="/dossiers"
    onClick={() => {
      ensureMusicPlayback(180);
      playSfx("/sounds/dossier.mp3", 0.3);
    }}
    className="border border-gold-dim p-8 hover:border-gold transition block animate-pulse-gold"
  >

    <p className="font-display text-2xl text-gold">
      AGENTES DESIGNADOS
    </p>

    <p className="mt-3 text-sm text-muted-foreground">
      Acceder a los expedientes de los agentes asignados a la operación.
    </p>

  </Link>

</div>
    </AppShell>
  );
}

