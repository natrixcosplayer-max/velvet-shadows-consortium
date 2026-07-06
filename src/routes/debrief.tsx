import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell, Panel } from "../components/AppShell";
import { playSfx } from "../audio/audiomanager";

export const Route = createFileRoute("/debrief")({
  head: () => ({
    meta: [
      { title: "Informe Final — Continental" },
      { name: "description", content: "Pantalla final cinematográfica de la Alta Mesa." },
    ],
  }),
  component: Debrief,
});

const MESSAGES = [
  "Verificando identidad...",
  "Comprobando autorización...",
  "Escaneando canal...",
  "Negociando cifrado...",
  "Activando enlace Continental...",
];

const HUD_ITEMS = [
  { label: "CANAL SEGURO", value: "ACTIVO" },
  { label: "ROMA", value: "PRESIDIO" },
  { label: "LATENCIA", value: "12 ms" },
  { label: "CIFRADO", value: "RSA-4096" },
  { label: "ESTADO", value: "EN LÍNEA" },
];

type Phase =
  | "starting"
  | "secure"
  | "incoming"
  | "waiting"
  | "glitch"
  | "video"
  | "finished";

function Debrief() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [phase, setPhase] = useState<Phase>("starting");
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    if (phase !== "starting") return;
    let progressValue = 0;
    let messageValue = 0;
    const interval = window.setInterval(() => {
      messageValue = Math.min(messageValue + 1, MESSAGES.length - 1);
      progressValue = Math.min(100, progressValue + 8);
      setMessageIndex(messageValue);
      setProgress(progressValue);
      playSfx("/sounds/beep.mp3", 0.22);
      if (progressValue >= 100) {
        window.clearInterval(interval);
        setTimeout(() => {
          playSfx("/sounds/luxbeep.mp3", 0.3);
          setPhase("secure");
        }, 900);
      }
    }, 320);
    return () => window.clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase !== "secure") return;
    const timeout = window.setTimeout(() => {
      playSfx("/sounds/beep.mp3", 0.26);
      setPhase("incoming");
    }, 1500);
    return () => window.clearTimeout(timeout);
  }, [phase]);

  useEffect(() => {
    if (phase !== "incoming") return;
    const timeout = window.setTimeout(() => {
      setGlitch(true);
      playSfx("/sounds/luxbeep.mp3", 0.26);
      const next = window.setTimeout(() => {
        setGlitch(false);
        setPhase("waiting");
      }, 700);
      return () => window.clearTimeout(next);
    }, 1200);
    return () => window.clearTimeout(timeout);
  }, [phase]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onEnded = () => {
      setPhase("finished");
    };
    video.addEventListener("ended", onEnded);
    return () => video.removeEventListener("ended", onEnded);
  }, []);

  return (
    <AppShell title="Transmisión Final" latin="Alta Mesa · Informe">
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[1240px]">
          <Panel className="relative overflow-hidden border border-gold-dim/60 bg-black/95">
            <div
              className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${
                phase === "video" ? "opacity-100" : "opacity-0"
              }`}
            />
            <div className="relative flex min-h-[70vh] flex-col justify-center overflow-hidden">
              {(phase === "starting" || phase === "secure" || phase === "incoming" ||   phase === "waiting" || phase === "glitch") && (
                <div
                  className={`relative mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-8 px-8 py-12 text-center transition-all duration-700 ${
                    glitch ? "bg-white/5 backdrop-blur-sm" : ""
                  }`}
                >
                  <div className="space-y-6">
                    <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-gold-dim">
                      ESTABLECIENDO CANAL SEGURO
                    </p>
                    <div className="space-y-2">
                      <p className="font-mono text-5xl tracking-[0.35em] uppercase text-gold">ROMA</p>
                      <p className="font-mono text-sm tracking-[0.35em] uppercase text-gold-dim">
                        CONSEJO MAGISTRAL
                      </p>
                    </div>
                  </div>

                  {phase === "starting" && (
                    <div className="w-full space-y-6">
                      <div className="h-3 w-full overflow-hidden rounded-full border border-gold-dim bg-white/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-gold via-gold/90 to-transparent transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-gold-dim">
                        <span>{progress}%</span>
                        <span>{MESSAGES[messageIndex]}</span>
                      </div>
                    </div>
                  )}

                  {phase === "secure" && (
                    <div className="space-y-6">
                      <div className="font-mono text-[10px] tracking-[0.4em] uppercase text-gold-dim">
                        CANAL SEGURO ESTABLECIDO
                      </div>
                      <div className="font-mono text-4xl tracking-[0.2em] uppercase text-gold">
                        TRANSMISIÓN ENTRANTE
                      </div>
                      <p className="font-mono text-sm uppercase tracking-[0.35em] text-gold-dim">
                        MAGISTRADA DE LA ALTA MESA
                      </p>
                    </div>
                  )}

                  {phase === "incoming" && (
                    <div className="space-y-4">
                      <div className="font-mono text-[10px] tracking-[0.4em] uppercase text-gold-dim">
                        TRANSMISIÓN ENTRANTE
                      </div>
                      <div className="font-mono text-3xl tracking-[0.2em] uppercase text-gold">
                        PREPARANDO ENLACE
                      </div>
                      <div className="mx-auto h-px w-32 bg-gold/30 animate-pulse" />
                    </div>
                  )}
{phase === "waiting" && (
  <div className="space-y-8 text-center">

    <div className="space-y-4">
      <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-gold-dim">
        SOLICITUD DE ENLACE
      </p>

      <p className="font-display text-4xl text-gold">
        MAGISTRADA DE LA ALTA MESA
      </p>

      <p className="font-mono text-sm tracking-[0.3em] uppercase text-gold-dim">
        La comunicación requiere su autorización.
      </p>
    </div>

   <button
  onClick={() => {

    playSfx("/sounds/luxbeep.mp3", 0.3);

    setPhase("video");

    requestAnimationFrame(() => {

      const video = videoRef.current;

      if (!video) return;

      video.currentTime = 0;

      video.play().catch(console.error);

    });

  }}
      className="rounded-full border border-gold px-10 py-4 font-mono text-[11px] tracking-[0.35em] uppercase text-gold hover:bg-gold hover:text-black transition"
    >
      ACEPTAR TRANSMISIÓN
    </button>

  </div>
)}
                  {phase === "glitch" && (
                    <div className="space-y-4">
                      <div className="font-mono text-[10px] tracking-[0.4em] uppercase text-gold-dim">
                        INTERFERENCIAS DETECTADAS
                      </div>
                      <div className="inline-flex rounded-full border border-gold/20 bg-black/70 px-4 py-2 text-[11px] uppercase tracking-[0.35em] text-gold">
                        GLITCH MÍNIMO
                      </div>
                    </div>
                  )}
                </div>
              )}

              {phase === "video" && (
                <div className="relative mx-auto w-full max-w-6xl space-y-8 px-4 pb-8 pt-6">
                  <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                    <div className="space-y-2">
                      <p className="font-mono text-[10px] tracking-[0.35em] uppercase text-gold-dim">CANAL SEGURO</p>
                      <p className="font-display text-4xl tracking-[0.25em] text-gold">ROMA</p>
                    </div>
                    <div className="grid gap-2 rounded-3xl border border-gold-dim/40 bg-black/80 p-4 text-right">
                      {HUD_ITEMS.map((item) => (
                        <div key={item.label} className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold-dim">
                          <span className="block">{item.label}</span>
                          <span className="font-display text-base text-gold">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-[2rem] border border-gold/70 bg-black/80 shadow-[0_0_120px_rgba(212,175,55,0.15)]">
                   <video
  ref={videoRef}
  src="/videos/oldwoman.mp4"
  playsInline
  controls
  className="w-full aspect-video bg-black"
/>
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between px-6 py-4 text-[10px] uppercase tracking-[0.35em] text-gold-dim">
                      <span>TRANSMISIÓN SEGURA</span>
                      <span>ALTA MESA</span>
                    </div>
                  </div>
                </div>
              )}

              {phase === "finished" && (
                <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-8 px-8 py-16 text-center">
                  <div className="space-y-6">
                    <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-gold-dim">
                      TRANSMISIÓN FINALIZADA
                    </p>
                    <p className="font-display text-5xl uppercase text-gold">OPERACIÓN MINERVA</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    {[
                      { label: "ACTIVO RECUPERADO" },
                      { label: "MISIÓN COMPLETADA" },
                      { label: "CANAL CERRADO" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-3xl border border-gold-dim/50 bg-black/80 px-8 py-6"
                      >
                        <p className="font-mono text-[10px] tracking-[0.35em] uppercase text-gold-dim">
                          {item.label}
                        </p>
                      </div>
                    ))}
                  </div>
                  <Link
                    to="/"
                    className="inline-flex rounded-full border border-gold bg-gold px-10 py-3 font-mono text-[11px] uppercase tracking-[0.35em] text-black transition hover:bg-gold/90"
                  >
                    CERRAR EXPEDIENTE
                  </Link>
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}

export default Debrief;