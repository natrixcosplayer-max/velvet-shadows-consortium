import { CLOSING_LINES } from "./types";

type ClosingSequenceProps = {
  showTransmissionDone: boolean;
  typedClosingLines: string[];
  activeClosingLine: number | null;
  showPermanentRecord: boolean;
  closingTime: string;
  showCommissionMark: boolean;
  showThanks: boolean;
  showCloseButton: boolean;
  onCloseDossier: () => void;
};

export function ClosingSequence({
  showTransmissionDone,
  typedClosingLines,
  activeClosingLine,
  showPermanentRecord,
  closingTime,
  showCommissionMark,
  showThanks,
  showCloseButton,
  onCloseDossier,
}: ClosingSequenceProps) {
  return (
    <div className="relative z-[60] mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-8 px-4 py-16 text-center md:px-8">
      <div className={`space-y-3 transition-opacity duration-700 ${showTransmissionDone ? "opacity-100" : "opacity-0"}`}>
        <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-gold-dim">TRANSMISION FINALIZADA</p>
      </div>

      <div className="w-full max-w-[700px] space-y-3">
        {typedClosingLines.map((line, idx) => (
          <p key={CLOSING_LINES[idx]} className="text-center font-mono text-[11px] uppercase tracking-[0.2em] text-gold-dim md:text-[12px] md:tracking-[0.3em]">
            {line}
            {activeClosingLine === idx && <span className="animate-blink">█</span>}
          </p>
        ))}
      </div>

      <div
        className={`w-full max-w-[560px] border border-gold-dim/45 bg-black/70 px-4 py-5 text-center scanlines transition-all duration-700 md:px-6 md:text-left ${
          showPermanentRecord ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.35em] text-gold">REGISTRO PERMANENTE</p>
        <div className="grid grid-cols-1 gap-y-2 font-mono text-[11px] uppercase tracking-[0.14em] text-gold-dim md:grid-cols-[170px_1fr] md:tracking-[0.18em]">
          <span>ID</span>
          <span className="text-gold">AURUM VII · 0734</span>
          <span>HORA DE CIERRE</span>
          <span className="text-gold">{closingTime || "--/--/---- --:--:--"}</span>
          <span>ESTADO</span>
          <span className="text-gold">ARCHIVADO</span>
        </div>
      </div>

      <div className={`space-y-2 transition-all duration-1000 ${showCommissionMark ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}>
        <p className="font-display text-3xl uppercase text-gold md:text-4xl">EX COMMISSIONE</p>
        <p className="font-display text-xl uppercase tracking-[0.2em] text-gold-dim md:text-2xl">ALTA MESA</p>
      </div>

      <div className={`space-y-2 transition-opacity duration-[1400ms] ${showThanks ? "opacity-100" : "opacity-0"}`}>
        <p className="font-mono text-[12px] tracking-[0.12em] text-gold-dim">La Comision agradece sus servicios.</p>
        <p className="font-mono text-[12px] tracking-[0.12em] text-gold-dim">Hasta la proxima mision.</p>

        {showCloseButton && (
          <button
            type="button"
            onClick={onCloseDossier}
            className="mx-auto mt-5 inline-flex border border-gold bg-gold/15 px-10 py-3.5 font-mono text-[12px] uppercase tracking-[0.38em] text-gold shadow-[0_0_16px_rgba(201,165,92,0.28)] transition hover:-translate-y-0.5 hover:bg-gold/25 hover:shadow-[0_0_22px_rgba(201,165,92,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/55 animate-pulse"
          >
            CERRAR EXPEDIENTE
          </button>
        )}
      </div>
    </div>
  );
}
