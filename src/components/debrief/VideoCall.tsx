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

  return (
    <div ref={layerRef} className="fixed inset-0 z-[140] isolate h-screen w-screen overflow-hidden bg-black" style={{ height: "100dvh" }}>
      <video
        ref={videoRef}
        src="/videos/oldwoman.mp4"
        onEnded={onEnded}
        playsInline
        preload="auto"
        controls={false}
        disablePictureInPicture
        className={`absolute inset-0 z-0 h-screen w-screen object-cover ${fx.microGlitch ? "translate-x-[1px] -translate-y-[1px]" : ""}`}
        style={{
          height: "100dvh",
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
        <div
          className="pointer-events-none absolute left-2 right-2 z-20 flex items-start justify-between font-mono text-[8px] uppercase leading-[1.1] tracking-[0.14em] text-gold-bright [text-shadow:0_0_8px_rgba(214,173,74,0.24)] md:left-4 md:right-4 md:text-[10px] md:tracking-[0.22em]"
          style={{ top: "max(0.5rem, env(safe-area-inset-top))" }}
        >
          <div className="inline-flex max-w-[34vw] flex-col gap-0.5 md:max-w-none md:gap-1">
            <span>ROMA</span>
            <span>MAGISTRADA</span>
            <span>ALTA MESA</span>
          </div>

          <div className="inline-flex max-w-[44vw] flex-col items-end gap-0.5 text-right md:max-w-none md:gap-1">
            <div className="inline-flex items-center gap-2 text-gold-bright">
              <span className="h-2 w-2 rounded-full bg-white/95 [animation:debrief-live-white_2.1s_ease-in-out_infinite]" />
              <span>EN DIRECTO</span>
            </div>
            <span>CANAL VII</span>
            <span>{hudDate}</span>
            <span>{hudTime}</span>
          </div>
        </div>
      )}

      <div className={`pointer-events-none absolute inset-0 z-30 bg-black transition-opacity ${fx.endingCut ? "duration-[220ms]" : "duration-[600ms]"} ${fx.fade ? "opacity-100" : "opacity-0"}`} />
    </div>
  );
}
