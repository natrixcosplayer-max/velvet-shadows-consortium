type IncomingCallProps = {
  callCountdown: number;
  showAcceptButton: boolean;
  callPulse: boolean;
  callSignalBoost: boolean;
  hudDate: string;
  hudTime: string;
  onAccept: () => void;
};

export function IncomingCall({
  callCountdown,
  showAcceptButton,
  callPulse,
  callSignalBoost,
  hudDate,
  hudTime,
  onAccept,
}: IncomingCallProps) {
  return (
    <div className="relative z-10 w-full max-w-2xl space-y-8 text-center">
      <div className="space-y-3">
        <p className="font-mono text-[10px] tracking-[0.38em] uppercase text-gold-dim [text-shadow:0_0_6px_rgba(214,173,74,0.2)]">COMUNICACION PRIORITARIA</p>
        <p className="font-display text-3xl uppercase text-gold [text-shadow:0_0_10px_rgba(214,173,74,0.28)] md:text-4xl">ORIGEN · ROMA · ALTA MESA</p>
      </div>

      <div className="grid grid-cols-1 gap-2 font-mono text-[11px] tracking-[0.28em] uppercase text-gold-dim [text-shadow:0_0_6px_rgba(214,173,74,0.2)]">
        <p>ROMA</p>
        <p>ALTA MESA</p>
        <p>CANAL PRIORITARIO</p>
      </div>

      <div className="pointer-events-none absolute inset-x-6 top-[44%] h-px bg-[linear-gradient(90deg,transparent,rgba(214,173,74,0.35),transparent)] opacity-40 [animation:comm-top-sweep_5.4s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute left-0 right-0 h-px bg-white/15 [animation:debrief-video-scan_14s_linear_infinite]" />

      <div className="space-y-2">
        <p className="font-mono text-[10px] tracking-[0.24em] uppercase text-gold-dim">La comunicacion permanecera disponible durante:</p>
        <p className="font-mono text-3xl tracking-[0.28em] text-gold [text-shadow:0_0_8px_rgba(214,173,74,0.3)]">{callCountdown}s</p>
      </div>

      <button
        onClick={onAccept}
        className={`inline-flex items-center justify-center border border-gold bg-gold/10 px-8 py-3 font-mono text-[11px] uppercase tracking-[0.34em] text-gold transition-all duration-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold ${callPulse ? "bg-gold/16 shadow-[0_0_22px_rgba(212,175,55,0.32)]" : "shadow-[0_0_10px_rgba(212,175,55,0.15)]"} ${showAcceptButton ? "opacity-100" : "opacity-0"}`}
        style={{ pointerEvents: showAcceptButton ? "auto" : "none" }}
      >
        INICIAR LLAMADA
      </button>

      <div className="mx-auto flex w-full max-w-lg items-center justify-between font-mono text-[9px] tracking-[0.2em] uppercase text-gold-dim [text-shadow:0_0_6px_rgba(214,173,74,0.2)]">
        <div className="inline-flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full bg-red-500 [animation:debrief-live-led_1.9s_ease-in-out_infinite] transition-all duration-150 ${callPulse ? "scale-[1.16] brightness-105" : "scale-100"}`} />
          <span>EN DIRECTO</span>
        </div>
        <div className="inline-flex h-4 items-end gap-[2px]">
          {Array.from({ length: 7 }).map((_, i) => (
            <span
              key={`waiting-signal-${i}`}
              className={`w-[3px] origin-bottom bg-gold/70 [animation:debrief-signal-bar_1.9s_ease-in-out_infinite] transition-[filter,opacity] duration-150 ${callSignalBoost ? "brightness-[1.12] opacity-95" : "opacity-80"}`}
              style={{
                animationDelay: `${i * 0.1}s`,
                animationDuration: `${1.6 + (i % 3) * 0.25}s`,
                height: `${7 + (i % 3)}px`,
              }}
            />
          ))}
        </div>
        <div className="text-right">
          <p>{hudDate}</p>
          <p>{hudTime}</p>
        </div>
      </div>
    </div>
  );
}
