import { EntryGate } from "../components/EntryGate";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type CSSProperties } from "react";
import { AppShell, Panel, StatBlock } from "../components/AppShell";
import { ClearanceGate } from "../components/ClearanceGate";
import { playSfx } from "../audio/atrium-audio-engine";

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
  "Identidad verificada.",
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
  const [showIdentity, setShowIdentity] = useState(false);
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
  const [interferenceSweepY, setInterferenceSweepY] = useState<number | null>(null);

  useEffect(() => {
    const seenBefore = typeof window !== "undefined" && window.sessionStorage.getItem("comunicado-seen") === "1";
    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const addTimeout = (fn: () => void, ms: number) => {
      const id = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
      timeouts.push(id);
    };

    if (seenBefore) {
      setShowComunicado(true);
      setShowAgent(true);
      setShowIdentity(true);
      setVisibleOrderCount(ORDER_BLOCKS.length);
      setShowFinalOrder(true);
    } else {
      let timeline = 0;

      addTimeout(() => setShowComunicado(true), timeline);
      timeline += 500;

      addTimeout(() => setShowAgent(true), timeline);
      timeline += 500;

      addTimeout(() => setShowIdentity(true), timeline);
      timeline += 550;

      ORDER_BLOCKS.forEach((line, index) => {
        addTimeout(() => {
          setVisibleOrderCount(index + 1);
          if (line.includes("OPERATIVO")) {
            setOperativoPulse(true);
            addTimeout(() => setOperativoPulse(false), 1300);
          }
        }, timeline + index * 820);
      });

      timeline += ORDER_BLOCKS.length * 820;

      addTimeout(() => setShowFinalOrder(true), timeline + 360);
      addTimeout(() => {
        playSfx("/sounds/luxbeep2.mp3", 0.2);
        window.dispatchEvent(new CustomEvent("operativo-attention"));
        navigator.vibrate?.(20);
      }, timeline + 1020);

      addTimeout(() => {
        window.sessionStorage.setItem("comunicado-seen", "1");
      }, timeline + 1000);
    }

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
    addTimeout(() => setSignalPhase("stable"), 1320);

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
      if (showIdentity) visible.push(1);

      for (let i = 0; i < visibleOrderCount; i += 1) {
        visible.push(2 + i);
      }

      if (showFinalOrder) visible.push(2 + ORDER_BLOCKS.length);

      if (!visible.length) return null;
      return visible[Math.floor(Math.random() * visible.length)];
    };

    const triggerSignalEvent = () => {
      const shift = Math.floor(Math.random() * 7) - 3;
      const glitchDuration = signalPhase === "interference"
        ? 80 + Math.floor(Math.random() * 100)
        : 60 + Math.floor(Math.random() * 40);

      setTransmissionShift(shift);
      setTransmissionGlitch(true);

      const shouldFlicker = Math.random() < (signalPhase === "interference" ? 0.8 : 0.45);
      if (shouldFlicker) {
        const flickerDuration = Math.random() < 0.5 ? 16 : 34;
        setTransmissionFlicker(true);
        addTimeout(() => setTransmissionFlicker(false), flickerDuration);
      }

      const shouldDisplaceLine = Math.random() < (signalPhase === "interference" ? 0.5 : 0.2);
      if (shouldDisplaceLine) {
        const targetLine = pickVisibleLineIndex();
        if (targetLine !== null) {
          const amount = (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * 3));
          setLineShiftIndex(targetLine);
          setLineShiftPx(amount);
          addTimeout(() => {
            setLineShiftIndex(null);
            setLineShiftPx(0);
          }, 34);
        }
      }

      const shouldSweep = Math.random() < (signalPhase === "interference" ? 0.55 : 0.25);
      if (shouldSweep) {
        setInterferenceSweepY(10 + Math.floor(Math.random() * 80));
        addTimeout(() => setInterferenceSweepY(null), 72 + Math.floor(Math.random() * 40));
      }

      const packetLossCandidates: Array<{ line: number; word: string }> = [];
      if (showAgent) packetLossCandidates.push({ line: 0, word: "MANDARIN" });
      if (showIdentity) packetLossCandidates.push({ line: 1, word: "VERIFICADA" });
      if (visibleOrderCount > 1) packetLossCandidates.push({ line: 3, word: "Comisión" });
      if (visibleOrderCount > 2) packetLossCandidates.push({ line: 4, word: "activo" });
      if (visibleOrderCount > 4) packetLossCandidates.push({ line: 6, word: "OPERATIVO" });
      if (showFinalOrder) packetLossCandidates.push({ line: ORDER_BLOCKS.length + 2, word: "ÓRDENES" });

      const shouldDropWord = packetLossCandidates.length > 0 && Math.random() < (signalPhase === "interference" ? 0.35 : 0.14);
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
      const minDelay = signalPhase === "interference" ? 900 : 12000;
      const maxDelay = signalPhase === "interference" ? 3600 : 20000;
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
  }, [signalPhase, showAgent, showIdentity, visibleOrderCount, showFinalOrder]);

  const renderSignalWord = (line: number, word: string, className = "") => (
    <span className={`${className} ${packetLossTarget?.line === line && packetLossTarget.word === word ? "signal-packet-loss" : ""}`.trim()}>
      {word}
    </span>
  );

  const renderParagraph = (text: string, line: number) => {
    const marker = "OPERATIVO";
    const finalMarker = "La misión comienza ahora.";

    if (text === finalMarker) {
      return (
        <strong className="text-gold-bright uppercase tracking-[0.18em] [text-shadow:0_0_12px_oklch(0.88_0.16_88_/_0.35)]">
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
          <strong className={`text-gold-bright transition-shadow duration-700 ${operativoPulse ? "shadow-[0_0_8px_oklch(0.88_0.16_88_/_0.5)]" : ""}`}>
            {renderSignalWord(line, marked)}
          </strong>
          {after}
        </>
      );
    }

    const packetKeywords = ["Comisión", "activo"] as const;
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
        <div className={`pointer-events-none absolute inset-0 bg-black transition-opacity duration-75 ${transmissionFlicker ? "opacity-[0.09]" : "opacity-0"}`} />
        <div
          className={`pointer-events-none absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-gold/55 to-transparent transition-opacity duration-75 ${interferenceSweepY === null ? "opacity-0" : "opacity-85"}`}
          style={interferenceSweepY === null ? undefined : ({ top: `${interferenceSweepY}%` } as CSSProperties)}
        />

        <div
          className={`relative mx-auto max-w-[620px] space-y-10 px-1 text-left md:px-4 alta-mesa-text-lumen alta-mesa-transmission ${signalPhase === "interference" ? "is-interference" : "is-stable"} ${transmissionGlitch ? "is-glitch" : ""}`}
          style={{ "--comm-shift": `${transmissionShift}px` } as CSSProperties}
        >
          <div className="space-y-3">
            <p className={`font-mono text-[10px] uppercase tracking-[0.34em] text-gold-dim/76 transition-opacity duration-[360ms] ${showComunicado ? "opacity-100" : "opacity-0"}`}>
              CANAL CLASIFICADO
            </p>
            <p className={`font-display text-[18px] uppercase tracking-[0.2em] text-gold-dim/84 transition-opacity duration-[420ms] ${showComunicado ? "opacity-100" : "opacity-0"}`}>
              COMUNICADO OFICIAL
            </p>
          </div>

          <div className="space-y-4">
            <h2
              className={`font-display text-[36px] tracking-[0.12em] text-gold transition-opacity duration-[420ms] md:text-[48px] ${showAgent ? "opacity-100" : "opacity-0"} ${lineShiftIndex === 0 ? "signal-line-jitter" : ""}`}
              style={lineShiftIndex === 0 ? ({ "--line-shift": `${lineShiftPx}px` } as CSSProperties) : undefined}
            >
              AGENTE {renderSignalWord(0, "MANDARIN")}
            </h2>
            <p
              className={`font-mono text-[10px] uppercase tracking-[0.3em] text-gold-dim/80 transition-opacity duration-[360ms] ${showIdentity ? "opacity-100" : "opacity-0"} ${lineShiftIndex === 1 ? "signal-line-jitter" : ""}`}
              style={lineShiftIndex === 1 ? ({ "--line-shift": `${lineShiftPx}px` } as CSSProperties) : undefined}
            >
              ✓ IDENTIDAD {renderSignalWord(1, "VERIFICADA")}
            </p>
          </div>

          <div className="space-y-8 md:space-y-10">
            {ORDER_BLOCKS.map((paragraph, index) => {
              const isVisible = visibleOrderCount > index;
              return (
                <p
                  key={`comm-order-${index}`}
                  className={`font-display text-[14px] leading-[2] tracking-[0.035em] text-gold/76 transition-opacity duration-[420ms] md:text-[16px] ${isVisible ? "opacity-100" : "opacity-0"} ${lineShiftIndex === index + 2 ? "signal-line-jitter" : ""}`}
                  style={lineShiftIndex === index + 2 ? ({ "--line-shift": `${lineShiftPx}px` } as CSSProperties) : undefined}
                >
                  {renderParagraph(paragraph, index + 2)}
                </p>
              );
            })}

            <p
              className={`font-display text-[20px] uppercase tracking-[0.17em] text-gold-bright [text-shadow:0_0_9px_oklch(0.88_0.16_88_/_0.3)] [animation:alta-mesa-lumen_2.8s_ease-in-out_infinite] transition-opacity duration-[620ms] md:text-[24px] ${showFinalOrder ? "opacity-100" : "opacity-0"} ${lineShiftIndex === ORDER_BLOCKS.length + 2 ? "signal-line-jitter" : ""}`}
              style={lineShiftIndex === ORDER_BLOCKS.length + 2 ? ({ "--line-shift": `${lineShiftPx}px` } as CSSProperties) : undefined}
            >
              EJECUTE SUS {renderSignalWord(ORDER_BLOCKS.length + 2, "ÓRDENES")}.
            </p>
          </div>

          <p className={`pt-3 font-mono text-[9px] uppercase tracking-[0.32em] text-gold-dim/70 transition-opacity duration-[420ms] ${showFinalOrder ? "opacity-100" : "opacity-0"}`}>
            EX COMMISSIONE ALTA MESA
          </p>
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

