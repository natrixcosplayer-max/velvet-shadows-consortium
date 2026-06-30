import { useEffect, useState } from "react";
import { Sigil } from "./AppShell";

const LINES = [
  "> INICIANDO ENLACE SEGURO...",
  "> NEGOCIANDO CIFRADO · AES-512-GCM · OK",
  "> ESCANEANDO FIRMA BIOMÉTRICA...",
  "> COTEJANDO REGISTRO DE LA MESA ALTA...",
  "> VERIFICANDO JURAMENTO DE SANGRE · MARCADOR #0734",
  "> AUTORIZACIÓN: AURUM · NIVEL III",
  "> BIENVENIDO, ADJUDICADOR.",
];

export function ClearanceGate({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (step >= LINES.length) {
      const t = setTimeout(onComplete, 700);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), 380 + Math.random() * 220);
    return () => clearTimeout(t);
  }, [step, onComplete]);

  useEffect(() => {
    const id = setInterval(() => setProgress((p) => Math.min(100, p + 100 / LINES.length / 4)), 100);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center font-mono text-sm scanlines overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent animate-scan" />

      <div className="relative w-full max-w-2xl px-6">
        <div className="flex flex-col items-center mb-8 animate-flicker">
          <Sigil size={64} />
          <p className="font-display text-gold text-2xl tracking-[0.4em] mt-4">CONTINENTAL</p>
          <p className="text-gold-dim text-[10px] tracking-[0.5em] mt-1">SUB · ROSA · MMXXVI</p>
        </div>

        <div className="noir-panel gold-corners p-6 min-h-[280px]">
          <div className="flex items-center justify-between mb-4 text-[10px] tracking-[0.3em] text-gold-dim uppercase">
            <span>· TERMINAL SEGURO ·</span>
            <span className="text-gold">{Math.floor(progress)}%</span>
          </div>
          <div className="h-px bg-gold-dim mb-4" />
          <div className="space-y-2 text-gold">
            {LINES.slice(0, step).map((line, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-gold-dim">[{String(i + 1).padStart(2, "0")}]</span>
                <span className={i === step - 1 ? "" : "opacity-70"}>{line}</span>
                {i === LINES.length - 1 && i === step - 1 && (
                  <span className="text-gold-bright animate-blink">█</span>
                )}
              </div>
            ))}
            {step < LINES.length && (
              <div className="flex items-center gap-2 text-gold-dim">
                <span>[{String(step + 1).padStart(2, "0")}]</span>
                <span className="animate-blink">█</span>
              </div>
            )}
          </div>
          <div className="mt-6 h-1 bg-secondary border border-gold-dim">
            <div className="h-full bg-gradient-to-r from-gold-dim to-gold transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <p className="text-center text-gold-dim text-[10px] tracking-[0.4em] mt-6 uppercase">
          El acceso no autorizado infringe los Artículos de la Mesa Alta
        </p>
      </div>
    </div>
  );
}
