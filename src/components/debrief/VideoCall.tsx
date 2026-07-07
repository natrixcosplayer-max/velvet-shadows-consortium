import { RefObject } from "react";

type VideoFxState = {
  microGlitch: boolean;
  bootNoise: boolean;
  signalLoss: boolean;
  endingCut: boolean;
  fade: boolean;
};

type VideoCallProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  layerRef: RefObject<HTMLDivElement | null>;
  phase: "video" | "finished";
  fx: VideoFxState;
  hudDate: string;
  hudTime: string;
  onEnded: () => void;
};

export function VideoCall({ videoRef, layerRef, phase, fx, hudDate, hudTime, onEnded }: VideoCallProps) {
  const activeFilter = fx.signalLoss || fx.bootNoise || fx.microGlitch;
  const signalPerturbation = fx.microGlitch || fx.signalLoss;

  return (
    <div ref={layerRef} className="fixed inset-0 z-[9999] isolate w-[100vw] h-[100dvh] overflow-hidden bg-black" style={{ width: "100vw", height: "100dvh" }}>
      <video
        ref={videoRef}
        src="/videos/oldwoman.mp4"
        onEnded={onEnded}
        playsInline
        autoPlay
        muted={false}
        preload="auto"
        controls={false}
        disablePictureInPicture
        disableRemotePlayback
        className={`absolute inset-0 z-0 w-full h-full object-cover ${fx.microGlitch ? "translate-x-[1px] -translate-y-[1px]" : ""}`}
        style={{
          width: "100%",
          height: "100%",
          filter: activeFilter
            ? [
                `brightness(${fx.signalLoss ? 0.96 : 1})`,
                `contrast(${fx.signalLoss ? 1.06 : fx.bootNoise ? 1.03 : 1})`,
                `saturate(${fx.signalLoss ? 0.92 : fx.bootNoise ? 0.94 : 1})`,
                fx.microGlitch ? "drop-shadow(-1px 0 rgba(255,52,52,0.13)) drop-shadow(1px 0 rgba(70,120,255,0.13))" : "",
              ]
                .filter(Boolean)
                .join(" ")
            : "none",
        }}
      />

      <div className="pointer-events-none absolute left-0 right-0 z-10 h-px bg-white/20 [animation:debrief-video-scan_10.5s_linear_infinite]" />
      {(fx.bootNoise || fx.signalLoss) && (
        <div className="pointer-events-none absolute inset-0 z-10 opacity-[0.028] [background-image:repeating-linear-gradient(0deg,transparent_0,transparent_3px,rgba(255,255,255,0.85)_3px,rgba(255,255,255,0.85)_5px)] mix-blend-overlay" />
      )}
      {fx.signalLoss && <div className="pointer-events-none absolute inset-0 z-10 bg-black/28" />}

      {phase === "video" && (
        <>
          <div
            className="pointer-events-none absolute left-2 right-2 z-20 flex items-start justify-between font-mono text-[9px] font-medium uppercase leading-[1.15] tracking-[0.16em] text-gold-bright [text-shadow:0_0_8px_rgba(214,173,74,0.2)] md:left-4 md:right-4 md:text-[12px] md:tracking-[0.24em]"
            style={{ top: "max(0.5rem, env(safe-area-inset-top))" }}
          >
            <div className="inline-flex max-w-[34vw] flex-col gap-0.5 brightness-110 md:max-w-none md:gap-1">
              <span>ROMA</span>
              <span>MAGISTRADA LIVIA</span>
              <span>ALTA MESA</span>
            </div>

            <div className="inline-flex max-w-[44vw] flex-col items-end gap-0.5 text-right brightness-110 md:max-w-none md:gap-1">
              <div className="inline-flex items-center gap-2 text-gold-bright">
                <span className="h-[11px] w-[11px] rounded-full bg-[#ff3b30] [animation:debrief-live-red_1.8s_ease-in-out_infinite]" />
                <span className="font-semibold">EN DIRECTO</span>
              </div>
              <span className="font-semibold">CANAL VII</span>
              <span>{hudDate}</span>
              <span>{hudTime}</span>
            </div>
          </div>

          <div
            className="pointer-events-none absolute left-1/2 z-20 -translate-x-1/2"
            style={{
              bottom: "max(calc(0.9rem + env(safe-area-inset-bottom)), 12px)",
              width: "clamp(175px, 50vw, 420px)",
            }}
          >
            <div className="text-center font-mono text-[9px] font-semibold uppercase tracking-[0.24em] text-gold-bright [text-shadow:0_0_8px_rgba(214,173,74,0.2)] md:text-[11px]">
              INTENSIDAD DE SENAL
            </div>
            <div className={`mt-1 h-[40px] w-full ${signalPerturbation ? "[animation:debrief-signal-glitch-bump_220ms_ease-out_1]" : ""}`}>
              <div className="mx-auto grid h-full w-full grid-cols-14 items-end gap-x-[3px]">
                {Array.from({ length: 14 }).map((_, col) => (
                  <div key={`sat-col-${col}`} className="grid h-full grid-rows-5 gap-y-[2px]">
                    {Array.from({ length: 5 }).map((__, row) => (
                      <span
                        key={`sat-cell-${col}-${row}`}
                        className="w-full rounded-[1px] bg-gold-bright/90 shadow-[0_0_5px_rgba(245,211,94,0.42)]"
                        style={{
                          opacity: 0.2 + ((col + row) % 4) * 0.18,
                          animation: `debrief-sat-square ${2.9 + (col % 4) * 0.55}s ease-in-out ${(col * 0.08) + (row * 0.06)}s infinite`,
                          transformOrigin: "center bottom",
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-0.5 text-center font-mono text-[9px] font-medium uppercase tracking-[0.2em] text-gold-bright [text-shadow:0_0_8px_rgba(214,173,74,0.18)] md:text-[10px]">
              <span className="inline-block [animation:debrief-signal-status_16s_step-end_infinite]">ESTABLE</span>
              <span className="inline-block [animation:debrief-signal-status-alt_16s_step-end_infinite]">OPTIMA</span>
            </div>
          </div>
        </>
      )}

      <div className={`pointer-events-none absolute inset-0 z-30 bg-black transition-opacity ${fx.endingCut ? "duration-[220ms]" : "duration-[600ms]"} ${fx.fade ? "opacity-100" : "opacity-0"}`} />
    </div>
  );
}
