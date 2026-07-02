import { useEffect, useState } from "react";
import { Sigil } from "./AppShell";
import altaLogo from "../assets/alta.png";
import mandarinPortrait from "../assets/agents/mandarin.jpg";
const beep = new Audio("/sounds/beep.mp3");
const LINES = [
  "> ESTABLECIENDO CANAL SEGURO...",
  "> VALIDANDO CREDENCIALES...",
  "> ANALIZANDO BIOMETRÍA FACIAL...",
  "> RETINA VERIFICADA...",
  "> ESTRUCTURA ÓSEA COINCIDENTE...",
  "> ADN COMPATIBLE...",
  "> AGENTE IDENTIFICADO: MANDARIN",
  "> NIVEL DE AUTORIZACIÓN: AURUM VII",
  "> ENLACE CON LA ALTA MESA ESTABLECIDO...",
  "> ACCESO CONCEDIDO",
];

export function ClearanceGate({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
  if (step >= LINES.length) {

  setFadeOut(true);

  const t = setTimeout(onComplete, 1000);

  return () => clearTimeout(t);
}

  const t = setTimeout(() => {
    beep.currentTime = 0;
    beep.play().catch(() => {});
    setStep((s) => s + 1);
  }, 1800 + Math.random() * 800);

  return () => clearTimeout(t);
}, [step, onComplete]);

  useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) =>
        Math.min(100, p + 100 / LINES.length / 4)
      );
    }, 300);

    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center font-mono text-sm scanlines overflow-hidden"> 


      <div className="absolute inset-0 grid-bg opacity-30" />

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

          <div className="grid md:grid-cols-[220px_1fr] gap-8 items-start">

  <div>

    {step >= 2 && (

      <div className="relative border border-gold-dim p-2 overflow-hidden animate-fade-in">

        <img
          src={mandarinPortrait}
          alt="Agent Mandarin"
          className="w-full grayscale brightness-90 contrast-125"
        />

        <div className="scan-face" />

        <div className="absolute bottom-2 left-2 right-2 text-center">

          <p className="font-mono text-[10px] tracking-[0.25em] text-gold uppercase">
            AGENTE MANDARIN
          </p>

          <p className="font-mono text-[9px] text-gold-dim">
            NIVEL VII · IDENTIDAD EN VERIFICACIÓN
          </p>

        </div>

      </div>

    )}

  </div>

  <div className="space-y-2 text-gold">

    {LINES.slice(0, step).map((line, i) => (

      <div key={i} className="flex items-start gap-2">

        <span className="text-gold-dim">
          [{String(i + 1).padStart(2, "0")}]
        </span>

        <span className={i === step - 1 ? "" : "opacity-70"}>
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

</div>

            {LINES.slice(0, step).map((line, i) => (

              <div key={i} className="flex items-start gap-2">

                <span className="text-gold-dim">
                  [{String(i + 1).padStart(2, "0")}]
                </span>

                <span className={i === step - 1 ? "" : "opacity-70"}>
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
              className="h-full bg-gradient-to-r from-gold-dim to-gold transition-all"
              style={{ width: `${progress}%` }}
            />

          </div>

        </div>

        <p className="text-center text-gold-dim text-[10px] tracking-[0.4em] mt-6 uppercase">

          La presente comunicación queda registrada conforme a los Estatutos de la Comisión.

        </p>

      </div>

    
);
}
