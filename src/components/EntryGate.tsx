import altaLogo from "../assets/alta.png";
import { useEffect, useRef, useState } from "react";
import {
  fadeMusicVolume,
  isDevAudioMuted,
  playMusic,
  playSfx,
  primeUnlockSound,
  setDevAudioMuted,
} from "../audio/atrium-audio-engine";

type Props = {
  onEnter: () => void;
};

export function EntryGate({ onEnter }: Props) {
  const [devMuted, setDevMuted] = useState(() => (import.meta.env.DEV ? isDevAudioMuted() : false));
  const [goldPress, setGoldPress] = useState(false);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
      }
    };
  }, []);

  const toggleDevMute = () => {
    const next = !devMuted;
    setDevAudioMuted(next);
    setDevMuted(next);
  };

  return (
    <main className="fixed inset-0 bg-background flex items-center justify-center scanlines overflow-hidden">

      {/* Rejilla digital de fondo */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none grid-bg opacity-60 [mask-image:radial-gradient(circle_at_center,black_58%,transparent_100%)]"
      />

      {/* Línea de escaneo que recorre la pantalla */}
      <div
        aria-hidden
        className="absolute left-0 right-0 z-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent animate-scan"
      />

      {/* Viñeta / resplandor de tubo de rayos */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none [background:radial-gradient(circle_at_center,transparent_55%,rgba(0,0,0,0.55)_100%)]"
      />

      {import.meta.env.DEV && (
        <button
          type="button"
          onClick={toggleDevMute}
          className="absolute right-4 top-4 z-20 border border-gold-dim bg-background/70 px-3 py-1.5 font-mono text-[10px] tracking-[0.22em] text-gold-dim uppercase hover:border-gold hover:text-gold"
          aria-label="Alternar mute de desarrollo"
        >
          {devMuted ? "DEV AUDIO OFF" : "DEV AUDIO ON"}
        </button>
      )}

      <div className="relative z-10 text-center max-w-xl w-full px-8 animate-flicker">

        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-6 top-16 -bottom-4 rounded-[2rem] bg-[radial-gradient(circle_at_center,rgba(214,173,74,0.16),transparent_68%)] blur-3xl opacity-95"
        />

        <div className="relative z-10 w-32 h-32 mx-auto mb-8">
          <div
            aria-hidden
            className="absolute inset-0 rounded-full bg-gold/25 blur-2xl scale-125"
          />
          <img
            src={altaLogo}
            alt="Alta Mesa"
            className="relative w-32 h-32 object-contain"
          />
        </div>

        <h1 className="relative z-10 font-display text-5xl text-gold">
          EX COMMISSIO
        </h1>

        <h2 className="relative z-10 font-display text-3xl text-gold mb-10">
          ALTA MESA
        </h2>

        <button
          onPointerDown={() => {
            primeUnlockSound();
            setGoldPress(true);
          }}
          onTouchStart={() => {
            primeUnlockSound();
            setGoldPress(true);
          }}
          onTouchEnd={() => {
            setGoldPress(false);
          }}
          onTouchCancel={() => {
            setGoldPress(false);
          }}
          onPointerUp={() => {
            setGoldPress(false);
          }}
          onPointerLeave={() => {
            setGoldPress(false);
          }}
          onClick={() => {
            const proceed = () => {
              primeUnlockSound();
              onEnter();
              playSfx("/sounds/luxbeep.mp3", 0.14);
              playMusic("/sounds/john.mp3", 0, true, 42);
              fadeMusicVolume(0.064, 650);
            };

            if (pressTimerRef.current) {
              clearTimeout(pressTimerRef.current);
            }

            pressTimerRef.current = setTimeout(() => {
              setGoldPress(false);
              proceed();
            }, 120);
          }}
          className={`relative z-10 mx-auto flex flex-col items-center border border-gold px-10 py-4 text-gold font-mono tracking-[0.3em] uppercase text-center hover:bg-gold hover:text-black transition animate-pulse-gold ${goldPress ? "bg-gold/28 text-gold-bright shadow-[0_0_18px_rgba(212,175,55,0.52)]" : ""}`}
        >
          <span>acceder</span>
        </button>

      </div>
    </main>
  );
}