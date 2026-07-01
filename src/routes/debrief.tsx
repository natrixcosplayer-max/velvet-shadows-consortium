import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  playMusic,
  playSfx,
  stopMusic,
  playVoiceQueue,
} from "../audio/audiomanager";

export const Route = createFileRoute("/debrief")({
  component: Debrief,
});

const LINES = [
  "TRANSMISIÓN ENTRANTE...",
  "ESTABLECIENDO CANAL PRIVADO...",
  "VALIDANDO FIRMA DIGITAL...",
  "OPERATIVO IDENTIFICADO.",
  "AGENTE MANDARIN // NIVEL VII",
  "RECUPERANDO INFORME FINAL...",
];

function Debrief() {
  const [step, setStep] = useState(0);
   const [fade, setFade] = useState(false);
   const [voicesStarted, setVoicesStarted] = useState(false);
  

  useEffect(() => {
    if (step >= LINES.length) return;

    const t = setTimeout(() => {
  playSfx("/sounds/beep.mp3", 0.5);
  setStep((s) => s + 1);
}, 850);
    

    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
  playMusic("/sounds/john.mp3", 0.08, false, 10);

  return () => {
    stopMusic();
  };
}, []);

  useEffect(() => {
  if (step !== LINES.length) return;

  const t = setTimeout(() => {
    setFade(true);
  }, 2000);

  return () => clearTimeout(t);
}, [step]);
useEffect(() => {

  if (!fade) return;
  if (voicesStarted) return;

  setVoicesStarted(true);

  playVoiceQueue([
    "/sounds/final1.wav",
    "/sounds/final2.wav",
    "/sounds/final3.wav",
    "/sounds/final4.wav",
  ]);

}, [fade, voicesStarted]);

  return (
    <main className="relative min-h-screen bg-black flex items-center justify-center overflow-hidden">

      <div className="max-w-4xl w-full px-10">

        <div className="border border-gold/40 p-10 bg-black/80">

          {LINES.slice(0, step).map((line, i) => (

            <p
              key={i}
              className="font-mono uppercase tracking-[0.35em] text-gold mb-6"
            >
              {line}
            </p>

          ))}

          {step >= LINES.length && (

            <>

              <div className="border-t border-gold-dim mt-10 pt-8">

                <p className="font-mono uppercase tracking-[0.35em] text-gold-dim">

                  ESPERANDO TRANSMISIÓN...

                </p>

              </div>

            </>

          )}

        </div>
<div
  className={`absolute inset-0 bg-black transition-opacity duration-[1500ms] ${
    fade ? "opacity-100" : "opacity-0 pointer-events-none"
  }`}
/>
      </div>

    </main>
  );
}