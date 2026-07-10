import { useEffect, useState } from "react";
import { Sigil } from "./AppShell";
import altaLogo from "../assets/alta.png";
import { attenuateMusicTemporarily, playUnlockSound, primeUnlockSound } from "../audio/audiomanager";
const LINES = [
  "> ESTABLECIENDO CANAL CIFRADO...",
  "> VALIDANDO CREDENCIALES DEL OPERATIVO...",
  "> CONECTANDO DESDE 4.3.3.9 VALENCIA...",
  "> EXPEDIENTE LOCALIZADO.",
  "> NIVEL DE AUTORIZACIÓN VII.",
  "> ACCESO CONCEDIDO.",
];

export function ClearanceGate({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showAccessButton, setShowAccessButton] = useState(false);

  useEffect(() => {
    if (step >= LINES.length) {
      setProgress(100);
      const t = setTimeout(() => setShowAccessButton(true), 300);
      return () => clearTimeout(t);
    }

    setShowAccessButton(false);

    const t = setTimeout(() => {
      if (typeof window !== "undefined") {
        const beep = new Audio("/sounds/beep.mp3");
        beep.currentTime = 0;
        beep.play().catch(() => {});
      }
      setStep((s) => s + 1);
    }, 1800 + Math.random() * 800);

    return () => clearTimeout(t);
  }, [step, onComplete]);

  useEffect(() => {
    if (step >= LINES.length) return;

    const id = setInterval(() => {
      setProgress((p) =>
        Math.min(100, p + 100 / LINES.length / 6)
      );
    }, 380);

    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center font-mono text-sm scanlines overflow-hidden"> 


      <div className="absolute inset-0 pointer-events-none grid-bg opacity-45 [mask-image:radial-gradient(circle_at_center,black_55%,transparent_100%)]" />

      <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent animate-scan" />

      <div className="relative w-full max-w-2xl px-6">

        <div className="flex flex-col items-center mb-8 animate-flicker">

          <img
  src={altaLogo}
  alt="Alta Mesa"
  className="w-28 h-28 object-contain drop-shadow-[0_0_12px_rgba(212,175,55,0.45)]"
/>

          <div className="mt-4 text-center">

            <p className="font-display text-gold text-2xl tracking-[0.22em]">
              EX COMMISSIO
            </p>

            <p className="font-display text-gold text-4xl tracking-[0.18em]">
              ALTA MESA
            </p>

            <p className="text-gold-dim text-[11px] tracking-[0.45em] mt-3 uppercase">
              Red Interna de la Comisión
            </p>

          </div>

        </div>

        <div className="noir-panel gold-corners p-6 min-h-[280px]">

          <div className="flex items-center justify-between mb-4 text-[10px] tracking-[0.3em] text-gold-dim uppercase">

            <span>· CANAL PRIVADO DE LA COMISIÓN ·</span>

            <span className="text-gold">
              {Math.floor(progress)}%
            </span>

          </div>

          <div className="h-px bg-gold-dim mb-4" />

          <div className="space-y-2 text-gold">

            {LINES.slice(0, step).map((line, i) => (

              <div key={i} className="flex items-start gap-2">

                <span className="text-gold-dim">
                  [{String(i + 1).padStart(2, "0")}]
                </span>

                <span className={i === step - 1 ? "font-bold text-gold-bright" : "opacity-70"}>
                  {line}
                </span>

                {i === LINES.length - 1 &&
                  i === step - 1 && (
                    <span className="text-gold-bright animate-blink">
                      █
                    </span>
                  )}

              </div>

            ))}

            {step < LINES.length && (

              <div className="flex items-center gap-2 text-gold-dim">

                <span>
                  [{String(step + 1).padStart(2, "0")}]
                </span>

                <span className="animate-blink">
                  █
                </span>

              </div>

            )}

          </div>

          <div className="mt-6 h-1 bg-secondary border border-gold-dim">

            <div
              className="h-full animate-progress-alert bg-[linear-gradient(90deg,oklch(0.55_0.08_80)_0%,oklch(0.78_0.13_85)_24%,oklch(0.9_0.1_88_/_0.55)_40%,oklch(0.88_0.16_88)_50%,oklch(0.9_0.1_88_/_0.55)_60%,oklch(0.78_0.13_85)_76%,oklch(0.55_0.08_80)_100%)] bg-[length:220%_100%] shadow-[0_0_8px_oklch(0.88_0.16_88_/_0.45)] transition-all"
              style={{ width: `${progress}%` }}
            />

          </div>

          {showAccessButton && (
            <div className="mt-6 flex justify-center animate-fade-up">
              <button
                type="button"
                onPointerDown={() => {
                  primeUnlockSound();
                }}
                onTouchStart={() => {
                  primeUnlockSound();
                }}
                onClick={() => {
                  primeUnlockSound();
                  attenuateMusicTemporarily(0.5, 9000);
                  void playUnlockSound(1);
                  onComplete();
                }}
                className="mx-auto flex flex-col items-center border border-gold bg-black px-10 py-4 text-gold font-mono tracking-[0.3em] uppercase text-center hover:bg-gold hover:text-black transition"
              >
                <span>ACCEDER</span>
              </button>
            </div>
          )}

        </div>

        <p className="text-center text-gold-dim text-[10px] tracking-[0.4em] mt-6 uppercase">

          La presente comunicación queda registrada conforme a los Estatutos de la Comisión.

        </p>

      </div>

    </div>
  );
}
