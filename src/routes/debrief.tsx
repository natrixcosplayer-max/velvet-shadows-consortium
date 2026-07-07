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
    playSfx("/sounds/beep.mp3", 0.24);
    const interval = window.setInterval(() => {
      messageValue = Math.min(messageValue + 1, MESSAGES.length - 1);
      progressValue = Math.min(100, progressValue + 8);
      setMessageIndex(messageValue);
      setProgress(progressValue);
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
  useEffect(() => {

  if (phase !== "video") return;

  const video = videoRef.current;

  if (!video) return;

  video.currentTime = 0;
  video.muted = false;
  video.volume = 1;

  video.play().catch(console.error);

}, [phase]);

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
                      <div className="h-4 w-full overflow-hidden rounded-full border border-gold/70 bg-white/10 shadow-[0_0_18px_rgba(212,175,55,0.22)]">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,oklch(0.55_0.08_80)_0%,oklch(0.78_0.13_85)_35%,oklch(0.9_0.1_88_/_0.65)_50%,oklch(0.78_0.13_85)_65%,oklch(0.55_0.08_80)_100%)] bg-[length:200%_100%] animate-progress-flow transition-all duration-300 shadow-[0_0_14px_rgba(212,175,55,0.48)]"
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

  }}
  className="inline-flex items-center justify-center border border-gold bg-gold/12 px-8 py-3 font-mono text-[11px] uppercase tracking-[0.34em] text-gold shadow-[0_0_20px_rgba(212,175,55,0.24)] transition hover:bg-gold/22 hover:shadow-[0_0_28px_rgba(212,175,55,0.34)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold animate-pulse-gold"
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
                <div className="fixed inset-0 z-50 bg-black overflow-hidden">
                  <video
                    ref={videoRef}
                    src="/videos/oldwoman.mp4"
                    playsInline
                    controls
                    className="h-full w-full object-cover"
                  />

                  <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/65 to-transparent" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/65 to-transparent" />
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