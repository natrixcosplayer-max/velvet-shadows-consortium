import { useEffect, useMemo, useRef, useState } from "react";
import { playSfx } from "../audio/audiomanager";

type SignalDecryptorProps = {
  image: string;
  targetFrequency: number;
  archiveName: string;
  onCompleted: () => void;
  mobileRaised?: boolean;
};

type Stage = "idle" | "tuning" | "locked" | "decrypting" | "done";

const FREQUENCY_MIN = 48;
const FREQUENCY_MAX = 72;
const AUTO_LOCK_TOLERANCE = 2;
const MAGNET_RADIUS = 3.5;
const LOCKED_PROGRESS_MS = 2000;
const LOCK_SIGNAL_DELAY_MS = 240;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatFrequency(value: number) {
  return `${value.toFixed(1)} MHz`;
}

function createEffectStrength(distance: number) {
  const normalized = clamp(distance / 10, 0, 1);
  return 1 - normalized;
}

function createSignalFilter(effectStrength: number, stage: Stage) {
  const blur = stage === "done" ? 0.08 : 12 * (1 - effectStrength);
  const contrast = stage === "done" ? 1.04 : 0.78 + effectStrength * 0.72;
  const brightness = stage === "done" ? 0.86 : 0.45 + effectStrength * 0.7;
  const saturate = stage === "done" ? 1.9 : 1.35 + effectStrength * 2.35;
  const sepia = 0.92;
  const hueRotate = stage === "done" ? 6 : -18 + effectStrength * 14;
  const grayscale = stage === "done" ? 0.08 : 0.14 + (1 - effectStrength) * 0.28;

  return [
    `grayscale(${grayscale.toFixed(2)})`,
    `sepia(${sepia.toFixed(2)})`,
    `saturate(${saturate.toFixed(2)})`,
    `contrast(${contrast.toFixed(2)})`,
    `brightness(${brightness.toFixed(2)})`,
    `hue-rotate(${hueRotate.toFixed(2)}deg)`,
    `blur(${blur.toFixed(2)}px)`,
  ].join(" ");
}

export function SignalDecryptor({ image, targetFrequency, archiveName, onCompleted, mobileRaised = false }: SignalDecryptorProps) {
  const [stage, setStage] = useState<Stage>("idle");
  const [frequency, setFrequency] = useState(48);
  const [displayFrequency, setDisplayFrequency] = useState(48);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("SEÑAL ENCRIPTADA");
  const [lockPulse, setLockPulse] = useState(false);

  const autoLockingRef = useRef(false);
  const lockStartedRef = useRef(false);
  const completionReportedRef = useRef(false);
  const lockTimerRef = useRef<number | null>(null);
  const pulseTimerRef = useRef<number | null>(null);

  const distance = Math.abs(frequency - targetFrequency);
  const effectStrength = createEffectStrength(distance);
  const magnetStrength = stage === "tuning" ? clamp(1 - distance / MAGNET_RADIUS, 0, 1) : 0;

  const style = useMemo(() => {
    const opacity = stage === "done" ? 0.88 : 0.95;

    return {
      filter: createSignalFilter(effectStrength, stage),
      opacity,
      transform: stage === "done" ? "scale(1)" : `scale(${(1 - (1 - effectStrength) * 0.012).toFixed(4)})`,
      transition: "filter 120ms linear, opacity 220ms ease, transform 220ms ease",
    } as const;
  }, [effectStrength, stage]);

  useEffect(() => {
    if (stage === "tuning") {
      if (magnetStrength > 0) {
        const pull = 0.78 * magnetStrength;
        const blended = frequency + (targetFrequency - frequency) * pull;
        setDisplayFrequency(clamp(blended, FREQUENCY_MIN, FREQUENCY_MAX));
      } else {
        setDisplayFrequency(frequency);
      }
      return;
    }

    setDisplayFrequency(frequency);
  }, [frequency, magnetStrength, stage, targetFrequency]);

  useEffect(() => {
    return () => {
      if (lockTimerRef.current !== null) {
        window.clearTimeout(lockTimerRef.current);
      }
      if (pulseTimerRef.current !== null) {
        window.clearTimeout(pulseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (stage !== "tuning") {
      if (lockTimerRef.current !== null) {
        window.clearTimeout(lockTimerRef.current);
        lockTimerRef.current = null;
      }
      autoLockingRef.current = false;
      return;
    }

    if (distance > AUTO_LOCK_TOLERANCE) {
      if (lockTimerRef.current !== null) {
        window.clearTimeout(lockTimerRef.current);
        lockTimerRef.current = null;
      }
      autoLockingRef.current = false;
      return;
    }

    if (autoLockingRef.current || lockStartedRef.current || lockTimerRef.current !== null) return;

    autoLockingRef.current = true;
    setFrequency(targetFrequency);
    setDisplayFrequency(targetFrequency);
    setLockPulse(true);

    playSfx("/sounds/shortbeep.mp3", 0.22);
    navigator.vibrate?.(30);

    pulseTimerRef.current = window.setTimeout(() => {
      setLockPulse(false);
      pulseTimerRef.current = null;
    }, 260);

    lockTimerRef.current = window.setTimeout(() => {
      lockTimerRef.current = null;
      setStage("locked");
      setStatusText("SIGNAL LOCKED");
      autoLockingRef.current = false;
      lockStartedRef.current = true;
    }, LOCK_SIGNAL_DELAY_MS);
  }, [distance, stage, targetFrequency]);

  useEffect(() => {
    if (stage !== "locked") return;

    setProgress(0);
    setStatusText("DECRYPTING...");

    const transitionTimeout = window.setTimeout(() => {
      setStage("decrypting");
    }, 260);

    return () => window.clearTimeout(transitionTimeout);
  }, [stage]);

  useEffect(() => {
    if (stage !== "decrypting") return;

    const startedAt = window.setTimeout(() => {
      const interval = window.setInterval(() => {
        setProgress((current) => {
          const next = current + 2.5;

          if (next >= 100) {
            window.clearInterval(interval);

            if (!completionReportedRef.current) {
              completionReportedRef.current = true;
              window.setTimeout(() => {
                setStage("done");
                setStatusText("ARCHIVO DESCLASIFICADO");
                onCompleted();
              }, 180);
            }

            return 100;
          }

          return next;
        });
      }, LOCKED_PROGRESS_MS / 40);

      return () => window.clearInterval(interval);
    }, 40);

    return () => window.clearTimeout(startedAt);
  }, [onCompleted, stage]);

  const renderNoiseLayers = stage !== "done";

  return (
    <section className="noir-panel gold-corners max-w-full overflow-x-hidden p-5 md:p-6">
      <div className="flex items-baseline justify-between gap-3 border-b border-gold-dim pb-3">
        <h3 className="font-display text-xl text-gold">PISTA VISUAL</h3>
        <span className="font-mono text-[10px] tracking-[0.3em] text-gold-dim uppercase">ARCHIVO DE VIGILANCIA</span>
      </div>

      <div className="mt-5 grid max-w-full gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)] lg:items-start">
        <div className="min-w-0 space-y-4">
          <div className="max-w-full overflow-x-hidden border border-gold-dim bg-black/85 p-4 md:p-5">
            <div className="flex items-start justify-between gap-4 border-b border-gold-dim/50 pb-3">
              <div>
                <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-gold-dim">ARCHIVO:</p>
                <p className="mt-1 font-display text-2xl text-gold">{archiveName}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-gold-dim">ESTADO:</p>
                <p className="mt-1 font-display text-2xl text-gold">{statusText}</p>
              </div>
            </div>

            <div className="relative mt-4 max-w-full overflow-hidden border border-gold-dim/70 bg-black">
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0,transparent_2px,transparent_14px,rgba(255,255,255,0.02)_15px)] opacity-50" />
              {renderNoiseLayers && (
                <>
                  <div className="pointer-events-none absolute inset-0 opacity-[0.22] [background-image:linear-gradient(rgba(214,173,74,0.12)_1px,transparent_1px)] [background-size:100%_5px]" />
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_0%,transparent_55%)]" />
                  <div className="pointer-events-none absolute inset-0 animate-flicker bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.05)_50%,transparent_100%)] opacity-60" />
                </>
              )}
              <img
                src={image}
                alt={archiveName}
                className="mx-auto block h-auto w-full max-w-full object-contain"
                style={style}
              />
              {renderNoiseLayers && (
                <>
                  <div className="pointer-events-none absolute inset-0 mix-blend-screen opacity-[0.35] [background-image:linear-gradient(0deg,rgba(255,0,0,0.15),rgba(255,0,0,0.03)),linear-gradient(90deg,rgba(0,255,255,0.06),rgba(0,0,0,0))]" />
                  <div className="pointer-events-none absolute inset-0 [background-image:repeating-linear-gradient(180deg,transparent_0,transparent_4px,rgba(0,0,0,0.2)_5px)] opacity-45" />
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gold/30 shadow-[0_0_18px_rgba(214,173,74,0.8)]" />
                </>
              )}
            </div>

            <p className="mt-4 font-mono text-[11px] italic tracking-[0.16em] text-gold-dim">
              "Solo para uso de operativos autorizados."
            </p>
          </div>

          {stage === "idle" && (
            <button
              type="button"
              onClick={() => {
                setStage("tuning");
                setStatusText("SEÑAL ENCRIPTADA");
                setProgress(0);
                setFrequency(48);
                setDisplayFrequency(48);
                lockStartedRef.current = false;
                playSfx("/sounds/beep.mp3", 0.24);
                setLockPulse(true);
                window.setTimeout(() => setLockPulse(false), 240);
              }}
              className="inline-flex w-full items-center justify-center border border-gold px-5 py-3 font-mono text-[10px] uppercase tracking-[0.34em] text-gold-bright transition hover:border-gold hover:bg-gold/10 sm:w-auto"
            >
              [ INICIAR RECONSTRUCCIÓN ]
            </button>
          )}

          {(stage === "tuning" || stage === "locked") && (
            <div className="space-y-4 rounded-sm border border-gold-dim/70 bg-black/70 p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-gold-dim">FRECUENCIA DE RECONSTRUCCIÓN</p>
                <p className={`font-display text-xl text-gold transition-transform duration-300 ${lockPulse ? "scale-105" : "scale-100"}`}>
                  {formatFrequency(displayFrequency)}
                </p>
              </div>

              <input
                type="range"
                min={FREQUENCY_MIN}
                max={FREQUENCY_MAX}
                step={0.1}
                value={frequency}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setFrequency(next);
                  const nextDistance = Math.abs(next - targetFrequency);
                  const nextMagnetStrength = clamp(1 - nextDistance / MAGNET_RADIUS, 0, 1);
                  if (stage === "tuning" && nextMagnetStrength > 0) {
                    const pull = 0.78 * nextMagnetStrength;
                    const blended = next + (targetFrequency - next) * pull;
                    setDisplayFrequency(clamp(blended, FREQUENCY_MIN, FREQUENCY_MAX));
                    setLockPulse(nextDistance <= AUTO_LOCK_TOLERANCE);
                    return;
                  }

                  setDisplayFrequency(next);
                  setLockPulse(false);
                }}
                className="tactile-range w-full"
                disabled={stage !== "tuning"}
              />

              <div className="flex items-center justify-between text-[10px] font-mono tracking-[0.25em] uppercase text-gold-dim">
                <span>{FREQUENCY_MIN.toFixed(0)} MHz</span>
                <span>{targetFrequency.toFixed(1)} MHz</span>
                <span>{FREQUENCY_MAX.toFixed(0)} MHz</span>
              </div>

              <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-gold-dim">
                El campo se estabiliza gradualmente al aproximarse al valor objetivo.
              </p>
            </div>
          )}

          {stage === "decrypting" && (
            <div className={`space-y-4 rounded-sm border border-gold-dim/70 bg-black/70 p-4 ${mobileRaised ? "-mt-2 sm:mt-0" : ""}`}>
              <div className="flex items-center justify-between gap-4">
                <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-gold-dim">FRECUENCIA DE RECONSTRUCCIÓN</p>
                <p className="font-display text-xl text-gold">{formatFrequency(targetFrequency)}</p>
              </div>

              <div className="h-2 overflow-hidden border border-gold-dim/70 bg-secondary">
                <div
                  className="h-full bg-[linear-gradient(90deg,oklch(0.58_0.1_84)_0%,oklch(0.82_0.14_87)_40%,oklch(0.95_0.11_90_/_0.8)_50%,oklch(0.82_0.14_87)_60%,oklch(0.58_0.1_84)_100%)] bg-[length:200%_100%] shadow-[0_0_12px_rgba(214,173,74,0.45)] transition-[width] duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="font-mono text-[10px] tracking-[0.34em] uppercase text-gold-bright">DECRYPTING...</p>
            </div>
          )}

          {stage === "done" && (
            <div className={`space-y-3 rounded-sm border border-gold-dim/70 bg-black/70 p-4 ${mobileRaised ? "-mt-2 sm:mt-0" : ""}`}>
              <p className="font-display text-2xl text-gold-bright">ARCHIVO DESCLASIFICADO</p>
              <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-gold-dim">ARCHIVO RECUPERADO - TONO FORENSE BLOQUEADO</p>
            </div>
          )}
        </div>

        <aside className="min-w-0 max-w-full space-y-3 overflow-x-hidden border border-gold-dim bg-black/80 p-4">
          <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-gold-dim">ESTADO OPERATIVO</p>
          <div className="h-px bg-gold-dim/50" />
          <p className="text-gold leading-7">
            La Alta Mesa ha recuperado varias transmisiones parcialmente dañadas. Reconstruya las señales para acceder a la evidencia.
          </p>
          <div className="grid grid-cols-3 gap-2 pt-2 text-[10px] font-mono tracking-[0.25em] uppercase text-gold-dim">
            <span className="rounded border border-gold-dim/60 px-2 py-2 text-center">CCTV</span>
            <span className="rounded border border-gold-dim/60 px-2 py-2 text-center">ANÁLISIS</span>
            <span className="rounded border border-gold-dim/60 px-2 py-2 text-center">SIGILO</span>
          </div>
        </aside>
      </div>
    </section>
  );
}