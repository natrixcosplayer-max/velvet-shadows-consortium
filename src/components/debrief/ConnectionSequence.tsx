import { MESSAGES } from "./types";

import { useEffect, useMemo, useRef, useState } from "react";

type ConnectionSequenceProps = {
  phase: "starting" | "priority" | "link";
  progress: number;
  messageIndex: number;
  waitingVisible: boolean;
  priorityRevealStep: number;
  linkProgress: number;
  linkStable: boolean;
  onPriorityAccept: () => void;
};

const PROTOCOL_STATES: Array<{ primary: string; secondary: string }> = [
  { primary: "INICIALIZANDO", secondary: "PROTOCOLO ALTA MESA" },
  { primary: "VALIDANDO", secondary: "IDENTIDAD" },
  { primary: "VERIFICANDO", secondary: "AURUM VII" },
  { primary: "AUTENTICANDO", secondary: "CANAL SEGURO" },
  { primary: "NEGOCIANDO", secondary: "CIFRADO" },
  { primary: "ESTABLECIENDO", secondary: "ENLACE SAT-COM VII" },
  { primary: "SINCRONIZANDO", secondary: "NODOS CONTINENTALES" },
  { primary: "ENRUTANDO", secondary: "COMUNICACION" },
  { primary: "PREPARANDO", secondary: "AUDIENCIA PRIVADA" },
  { primary: "CANAL", secondary: "LISTO" },
];

const BAR_MILESTONE_COUNT = 5;

export function ConnectionSequence({
  phase,
  progress,
  messageIndex,
  waitingVisible,
  priorityRevealStep,
  linkProgress,
  linkStable,
  onPriorityAccept,
}: ConnectionSequenceProps) {
  const [priorityAccepted, setPriorityAccepted] = useState(false);
  const [flashMilestone, setFlashMilestone] = useState<number | null>(null);
  const milestoneRef = useRef(0);

  useEffect(() => {
    if (phase !== "priority") {
      setPriorityAccepted(false);
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== "starting") {
      milestoneRef.current = 0;
      setFlashMilestone(null);
      return;
    }

    const reached = Math.min(BAR_MILESTONE_COUNT, Math.floor(progress / 20));
    if (reached <= milestoneRef.current) return;

    milestoneRef.current = reached;
    setFlashMilestone(reached);

    const timer = window.setTimeout(() => {
      setFlashMilestone((prev) => (prev === reached ? null : prev));
    }, 340);

    return () => {
      window.clearTimeout(timer);
    };
  }, [phase, progress]);

  const statusPair = useMemo(() => {
    if (progress >= 100) {
      return { primary: "CANAL PREPARADO", secondary: "AUDIENCIA DISPONIBLE" };
    }

    const index = Math.min(PROTOCOL_STATES.length - 1, Math.floor(progress / (100 / PROTOCOL_STATES.length)));
    return PROTOCOL_STATES[index];
  }, [progress]);

  const telemetry = useMemo(() => {
    const latency = 10 + Math.round((Math.sin(progress * 0.2) + 1) * 1.1);
    const integrity = (99.7 + ((Math.cos(progress * 0.16) + 1) * 0.1)).toFixed(1);
    return {
      latency,
      integrity,
      trama: messageIndex + 1,
    };
  }, [messageIndex, progress]);

  const handlePriorityAccept = () => {
    if (priorityAccepted) return;
    setPriorityAccepted(true);
    onPriorityAccept();
  };

  return (
    <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-8 px-4 py-12 text-center md:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(212,175,55,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.08)_1px,transparent_1px)] [background-size:40px_40px] [animation:debrief-protocol-grid-breathe_11s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02)_0%,rgba(0,0,0,0.45)_75%)] [animation:debrief-protocol-breathe_9s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute left-0 right-0 h-px bg-white/20 [animation:debrief-video-scan_13s_linear_infinite]" />

      {phase === "starting" && (
        <div className="w-full space-y-7">
          <div className="space-y-2">
            <p className="font-mono text-[10px] tracking-[0.42em] uppercase text-gold-dim">PROTOCOLO INTERNO · ALTA MESA</p>
            <p className="font-mono text-[16px] md:text-[20px] tracking-[0.24em] uppercase text-gold-bright [text-shadow:0_0_10px_rgba(214,173,74,0.22)]">{statusPair.primary}</p>
            <p className="font-mono text-[11px] md:text-[12px] tracking-[0.28em] uppercase text-gold-dim">{statusPair.secondary}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-left md:grid-cols-4">
            <div className="border border-gold-dim/35 bg-black/35 px-3 py-2">
              <p className="font-mono text-[9px] tracking-[0.24em] uppercase text-gold-dim">LATENCIA</p>
              <p className="mt-1 font-mono text-[12px] uppercase tracking-[0.22em] text-gold-bright">{telemetry.latency} ms</p>
            </div>
            <div className="border border-gold-dim/35 bg-black/35 px-3 py-2">
              <p className="font-mono text-[9px] tracking-[0.24em] uppercase text-gold-dim">CANAL</p>
              <p className="mt-1 font-mono text-[12px] uppercase tracking-[0.22em] text-gold-bright">VII</p>
            </div>
            <div className="border border-gold-dim/35 bg-black/35 px-3 py-2">
              <p className="font-mono text-[9px] tracking-[0.24em] uppercase text-gold-dim">INTEGRIDAD</p>
              <p className="mt-1 font-mono text-[12px] uppercase tracking-[0.22em] text-gold-bright">{telemetry.integrity} %</p>
            </div>
            <div className="border border-gold-dim/35 bg-black/35 px-3 py-2">
              <p className="font-mono text-[9px] tracking-[0.24em] uppercase text-gold-dim">NODO</p>
              <p className="mt-1 font-mono text-[12px] uppercase tracking-[0.22em] text-gold-bright">ROMA</p>
            </div>
          </div>

          <div className="relative h-4 w-full overflow-hidden rounded-full border border-gold/75 bg-black/55 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,oklch(0.55_0.08_80)_0%,oklch(0.78_0.13_85)_35%,oklch(0.9_0.1_88_/_0.65)_50%,oklch(0.78_0.13_85)_65%,oklch(0.55_0.08_80)_100%)] bg-[length:200%_100%] animate-progress-flow transition-all duration-300 shadow-[0_0_14px_rgba(212,175,55,0.48)]"
              style={{ width: `${progress}%` }}
            />
            <div className="pointer-events-none absolute inset-0 [animation:debrief-link-sweep_2.2s_linear_infinite] bg-[linear-gradient(100deg,transparent_0%,rgba(255,255,255,0.02)_38%,rgba(255,255,255,0.22)_50%,rgba(255,255,255,0.02)_62%,transparent_100%)]" />
            {progress >= 100 && <div className="pointer-events-none absolute inset-0 bg-gold/20 [animation:debrief-link-complete-flash_380ms_ease-out_1]" />}

            <div className="pointer-events-none absolute inset-0">
              {Array.from({ length: BAR_MILESTONE_COUNT }).map((_, idx) => {
                const milestone = idx + 1;
                const reached = progress >= milestone * 20;
                const isFlash = flashMilestone === milestone;
                return (
                  <span
                    key={`spark-${milestone}`}
                    className={`absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full border border-gold/60 ${reached ? "bg-gold/85 shadow-[0_0_8px_rgba(214,173,74,0.62)]" : "bg-gold/20"} ${isFlash ? "[animation:debrief-link-spark_360ms_ease-out_1]" : ""}`}
                    style={{ left: `calc(${milestone * 20}% - 3px)` }}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-gold-dim">
            <span>{progress}%</span>
            <span>{MESSAGES[Math.min(messageIndex, MESSAGES.length - 1)]}</span>
            <span>TRAMA {telemetry.trama}</span>
          </div>
        </div>
      )}

      {phase === "priority" && (
        <div className={`space-y-4 transition-all duration-700 ${waitingVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}>
          <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-gold-dim transition-opacity duration-500">COMUNICACION PRIORITARIA</p>
          <p className={`font-mono text-sm tracking-[0.35em] uppercase text-gold-dim [text-shadow:0_0_6px_rgba(214,173,74,0.2)] transition-opacity duration-500 ${priorityRevealStep >= 1 ? "opacity-100" : "opacity-0"}`}>ORIGEN</p>
          <p className={`font-mono text-4xl md:text-5xl tracking-[0.35em] uppercase text-gold [text-shadow:0_0_8px_rgba(214,173,74,0.24)] transition-opacity duration-500 ${priorityRevealStep >= 2 ? "opacity-100" : "opacity-0"}`}>ROMA</p>
          <p className={`font-mono text-sm tracking-[0.35em] uppercase text-gold-dim [text-shadow:0_0_6px_rgba(214,173,74,0.2)] transition-opacity duration-500 ${priorityRevealStep >= 3 ? "opacity-100" : "opacity-0"}`}>ALTA MESA</p>
          <button
            onClick={handlePriorityAccept}
            className={`mx-auto inline-flex items-center justify-center border border-gold/85 px-8 py-3 font-mono text-[11px] uppercase tracking-[0.34em] text-gold transition-all duration-250 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold ${priorityAccepted ? "bg-gold/35 shadow-[0_0_30px_rgba(212,175,55,0.55)]" : "bg-gold/12 shadow-[0_0_18px_rgba(212,175,55,0.22)] hover:scale-[1.03] hover:bg-gold/20 hover:shadow-[0_0_24px_rgba(212,175,55,0.35)] [animation:pulse-gold_1.7s_ease-in-out_infinite]"} ${priorityRevealStep >= 3 ? "opacity-100" : "pointer-events-none opacity-0"}`}
            style={{ pointerEvents: priorityRevealStep >= 3 && !priorityAccepted ? "auto" : "none" }}
          >
            ¿Quién llama?
          </button>
          <div className="pointer-events-none absolute inset-x-6 top-[52%] h-px bg-[linear-gradient(90deg,transparent,rgba(214,173,74,0.45),transparent)] opacity-45 [animation:comm-top-sweep_4.6s_ease-in-out_infinite]" />
        </div>
      )}

      {phase === "link" && (
        <div className="w-full max-w-xl space-y-5">
          <p className="font-mono text-[10px] tracking-[0.35em] uppercase text-gold-dim [text-shadow:0_0_6px_rgba(214,173,74,0.2)]">ESTABLECIENDO ENLACE...</p>
          <div className="h-3 w-full border border-gold-dim/60 bg-black/35">
            <div
              className="h-full bg-[linear-gradient(90deg,oklch(0.55_0.08_80),oklch(0.88_0.16_88),oklch(0.55_0.08_80))] bg-[length:200%_100%] animate-progress-flow transition-all duration-150"
              style={{ width: `${linkProgress}%` }}
            />
          </div>
          <p className="font-mono text-sm tracking-[0.28em] uppercase text-gold [text-shadow:0_0_8px_rgba(214,173,74,0.28)]">{linkStable ? "SENAL ESTABLE" : `${linkProgress}%`}</p>
        </div>
      )}
    </div>
  );
}
