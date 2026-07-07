import { MESSAGES } from "./types";

type ConnectionSequenceProps = {
  phase: "starting" | "priority" | "link";
  progress: number;
  messageIndex: number;
  waitingVisible: boolean;
  priorityRevealStep: number;
  linkProgress: number;
  linkStable: boolean;
};

export function ConnectionSequence({
  phase,
  progress,
  messageIndex,
  waitingVisible,
  priorityRevealStep,
  linkProgress,
  linkStable,
}: ConnectionSequenceProps) {
  return (
    <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-8 px-4 py-12 text-center md:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:repeating-linear-gradient(0deg,transparent_0,transparent_3px,rgba(255,255,255,0.88)_3px,rgba(255,255,255,0.88)_5px)] mix-blend-overlay" />
      <div className="pointer-events-none absolute left-0 right-0 h-px bg-white/20 [animation:debrief-video-scan_13s_linear_infinite]" />

      {phase === "starting" && (
        <div className="w-full space-y-6">
          <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-gold-dim">DESBLOQUEO DE CONSOLA SEGURA</p>
          <div className="h-4 w-full overflow-hidden rounded-full border border-gold/70 bg-white/10 shadow-[0_0_18px_rgba(212,175,55,0.22)]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,oklch(0.55_0.08_80)_0%,oklch(0.78_0.13_85)_35%,oklch(0.9_0.1_88_/_0.65)_50%,oklch(0.78_0.13_85)_65%,oklch(0.55_0.08_80)_100%)] bg-[length:200%_100%] animate-progress-flow transition-all duration-300 shadow-[0_0_14px_rgba(212,175,55,0.48)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-gold-dim">
            <span>{progress}%</span>
            <span>{MESSAGES[messageIndex]}</span>
          </div>
        </div>
      )}

      {phase === "priority" && (
        <div className={`space-y-4 transition-all duration-700 ${waitingVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}>
          <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-gold-dim transition-opacity duration-500">COMUNICACION PRIORITARIA</p>
          <p className={`font-mono text-sm tracking-[0.35em] uppercase text-gold-dim [text-shadow:0_0_6px_rgba(214,173,74,0.2)] transition-opacity duration-500 ${priorityRevealStep >= 1 ? "opacity-100" : "opacity-0"}`}>ORIGEN</p>
          <p className={`font-mono text-4xl md:text-5xl tracking-[0.35em] uppercase text-gold [text-shadow:0_0_8px_rgba(214,173,74,0.24)] transition-opacity duration-500 ${priorityRevealStep >= 2 ? "opacity-100" : "opacity-0"}`}>ROMA</p>
          <p className={`font-mono text-sm tracking-[0.35em] uppercase text-gold-dim [text-shadow:0_0_6px_rgba(214,173,74,0.2)] transition-opacity duration-500 ${priorityRevealStep >= 3 ? "opacity-100" : "opacity-0"}`}>ALTA MESA</p>
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
