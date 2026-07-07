import { RefObject, useEffect, useRef, useState } from "react";

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
  const [oscPath, setOscPath] = useState("M 34 20 L 266 20");
  const [oscGlitchPath, setOscGlitchPath] = useState("M 34 20 L 266 20");
  const [glitchActive, setGlitchActive] = useState(false);

  const oscRafRef = useRef<number | null>(null);
  const oscGlitchStateRef = useRef(false);
  const oscLastTsRef = useRef(0);
  const oscElapsedRef = useRef(0);
  const oscAmpRef = useRef(0.12);
  const oscSpeechRef = useRef(0);
  const oscSpeakingRef = useRef(true);
  const oscSpeechTimerRef = useRef(0.9);
  const oscGlitchUntilRef = useRef(0);

  useEffect(() => {
    if (phase !== "video") {
      if (oscRafRef.current !== null) {
        window.cancelAnimationFrame(oscRafRef.current);
        oscRafRef.current = null;
      }
      setOscPath("M 34 20 L 266 20");
      setOscGlitchPath("M 34 20 L 266 20");
      setGlitchActive(false);
      return;
    }

    const drawStart = 34;
    const drawEnd = 266;
    const width = drawEnd - drawStart;
    const baseline = 20;
    const points = 42;
    const frameInterval = 38;

    const tick = (ts: number) => {
      if (oscLastTsRef.current === 0) {
        oscLastTsRef.current = ts;
      }

      const deltaMs = ts - oscLastTsRef.current;
      if (deltaMs < frameInterval) {
        oscRafRef.current = window.requestAnimationFrame(tick);
        return;
      }

      oscLastTsRef.current = ts;
      const dt = deltaMs / 1000;
      oscElapsedRef.current += dt;

      if (fx.microGlitch || fx.signalLoss) {
        oscGlitchUntilRef.current = Math.max(oscGlitchUntilRef.current, ts + 150);
      }

      const glitchNow = ts < oscGlitchUntilRef.current;
      if (glitchNow !== oscGlitchStateRef.current) {
        oscGlitchStateRef.current = glitchNow;
        setGlitchActive(glitchNow);
      }

      oscSpeechTimerRef.current -= dt;
      if (oscSpeechTimerRef.current <= 0) {
        oscSpeakingRef.current = !oscSpeakingRef.current;
        oscSpeechTimerRef.current = oscSpeakingRef.current
          ? 0.8 + Math.random() * 1.6
          : 0.35 + Math.random() * 1.1;
      }

      const speechTarget = oscSpeakingRef.current ? 1 : 0;
      oscSpeechRef.current += (speechTarget - oscSpeechRef.current) * 0.14;

      const stableMode = oscElapsedRef.current > 9;
      const stability = stableMode ? 0.78 : 1;
      const floorAmp = stableMode ? 0.12 : 0.15;
      const ceilingAmp = stableMode ? 0.27 : 0.37;

      let targetAmp = 0.14 + oscSpeechRef.current * 0.2 + (Math.random() - 0.5) * 0.035;
      targetAmp = Math.max(floorAmp, Math.min(ceilingAmp, targetAmp * stability));

      if (glitchNow) {
        targetAmp = Math.min(0.42, targetAmp + 0.1);
      }

      oscAmpRef.current += (targetAmp - oscAmpRef.current) * 0.28;
      const amp = Math.max(0.11, Math.min(0.42, oscAmpRef.current));

      let mainPath = "";
      let glitchPath = "";

      for (let i = 0; i < points; i += 1) {
        const x = drawStart + (i / (points - 1)) * width;
        const t = oscElapsedRef.current;
        const harmonicA = Math.sin(i * 0.63 + t * 7.1) * amp * 10.4;
        const harmonicB = Math.sin(i * 1.33 - t * 4.6) * amp * 5.7;
        const breath = Math.sin(i * 0.3 + t * 1.9) * amp * 2.2;
        const jitter = (Math.random() - 0.5) * amp * 3.2;

        let y = baseline + harmonicA + harmonicB + breath + jitter;

        const peakChance = oscSpeakingRef.current ? 0.16 : 0.03;
        if (Math.random() < peakChance) {
          y -= amp * (oscSpeakingRef.current ? 11.8 : 5.2);
        }

        if (glitchNow && (i % 6 === 0 || i % 7 === 0)) {
          y += (Math.random() - 0.5) * amp * 19;
        }

        const cmd = i === 0 ? "M" : "L";
        mainPath += `${cmd} ${x.toFixed(2)} ${y.toFixed(2)} `;

        const gy = y + (Math.random() - 0.5) * amp * (glitchNow ? 9 : 2.2);
        glitchPath += `${cmd} ${x.toFixed(2)} ${gy.toFixed(2)} `;
      }

      setOscPath(mainPath.trim());
      setOscGlitchPath(glitchPath.trim());

      oscRafRef.current = window.requestAnimationFrame(tick);
    };

    oscLastTsRef.current = 0;
    oscElapsedRef.current = 0;
    oscAmpRef.current = 0.16;
    oscSpeechRef.current = 0.2;
    oscSpeakingRef.current = true;
    oscSpeechTimerRef.current = 0.95;
    oscGlitchUntilRef.current = 0;

    oscRafRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (oscRafRef.current !== null) {
        window.cancelAnimationFrame(oscRafRef.current);
        oscRafRef.current = null;
      }
      oscGlitchStateRef.current = false;
      setGlitchActive(false);
    };
  }, [phase, fx.microGlitch, fx.signalLoss]);

  return (
    <div ref={layerRef} className="fixed inset-0 z-[9999] isolate w-[100vw] h-[100dvh] overflow-hidden bg-black" style={{ width: "100vw", height: "100dvh" }}>
      <video
        ref={videoRef}
        src="/videos/oldwoman.mp4"
        onEnded={onEnded}
        playsInline
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
              bottom: "max(calc(0.2rem + env(safe-area-inset-bottom)), 2px)",
              width: "clamp(175px, 50vw, 420px)",
            }}
          >
            <div className="text-center font-mono text-[8px] font-semibold uppercase tracking-[0.22em] text-gold-bright [text-shadow:0_0_8px_rgba(214,173,74,0.2)] md:text-[10px]">
              INTENSIDAD DE SENAL
            </div>
            <div className={`mt-1 h-[28px] w-full ${signalPerturbation ? "[animation:debrief-signal-glitch-bump_220ms_ease-out_1]" : ""}`}>
              <svg viewBox="0 0 300 40" preserveAspectRatio="none" className="h-full w-full overflow-visible">
                <defs>
                  <linearGradient id="debrief-osc-gradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgba(214,173,74,0)" />
                    <stop offset="14%" stopColor="rgba(214,173,74,0.78)" />
                    <stop offset="50%" stopColor="rgba(245,211,94,0.96)" />
                    <stop offset="86%" stopColor="rgba(214,173,74,0.78)" />
                    <stop offset="100%" stopColor="rgba(214,173,74,0)" />
                  </linearGradient>
                  <linearGradient id="debrief-osc-gradient-soft" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgba(245,211,94,0)" />
                    <stop offset="14%" stopColor="rgba(245,211,94,0.48)" />
                    <stop offset="50%" stopColor="rgba(245,211,94,0.8)" />
                    <stop offset="86%" stopColor="rgba(245,211,94,0.48)" />
                    <stop offset="100%" stopColor="rgba(245,211,94,0)" />
                  </linearGradient>
                  <filter id="debrief-osc-glow" x="-20%" y="-120%" width="150%" height="320%">
                    <feGaussianBlur stdDeviation="1.45" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <path
                  d={oscPath}
                  fill="none"
                  stroke="url(#debrief-osc-gradient)"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#debrief-osc-glow)"
                />

                <path
                  d={oscGlitchPath}
                  fill="none"
                  stroke="url(#debrief-osc-gradient-soft)"
                  strokeWidth={0.9}
                  strokeLinecap="round"
                  strokeDasharray={glitchActive ? "2 4" : "0"}
                  opacity={glitchActive ? 0.86 : 0.36}
                />
              </svg>
            </div>
            <div className="mt-0.5 text-center font-mono text-[8px] font-medium uppercase tracking-[0.18em] text-gold-bright [text-shadow:0_0_8px_rgba(214,173,74,0.18)] md:text-[9px]">
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
