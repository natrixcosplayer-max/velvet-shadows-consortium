import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell, Panel } from "../components/AppShell";
import { playSfx, stopMusic } from "../audio/audiomanager";

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

const CLOSING_LINES = [
  "CANAL SEGURO CERRADO ✔",
  "EXPEDIENTE ARCHIVADO ✔",
  "ACTIVO RECUPERADO ✔",
  "MISION COMPLETADA ✔",
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
  const [videoFade, setVideoFade] = useState(false);
  const [showTransmissionDone, setShowTransmissionDone] = useState(false);
  const [typedClosingLines, setTypedClosingLines] = useState<string[]>(Array(CLOSING_LINES.length).fill(""));
  const [activeClosingLine, setActiveClosingLine] = useState<number | null>(null);
  const [showPermanentRecord, setShowPermanentRecord] = useState(false);
  const [closingTime, setClosingTime] = useState("");
  const [showCommissionMark, setShowCommissionMark] = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  const [showCloseButton, setShowCloseButton] = useState(false);

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

  useEffect(() => {
    if (phase !== "finished") return;

    let cancelled = false;
    const timers: Array<number | ReturnType<typeof setTimeout>> = [];

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const id = window.setTimeout(() => resolve(), ms);
        timers.push(id);
      });

    const typeLine = async (lineIndex: number, text: string) => {
      setActiveClosingLine(lineIndex);
      for (let i = 1; i <= text.length; i += 1) {
        if (cancelled) return;
        setTypedClosingLines((prev) => {
          const next = [...prev];
          next[lineIndex] = text.slice(0, i);
          return next;
        });
        await wait(34);
      }
      setActiveClosingLine(null);
    };

    const runClosingSequence = async () => {
      stopMusic();
      setVideoFade(false);
      setShowTransmissionDone(false);
      setTypedClosingLines(Array(CLOSING_LINES.length).fill(""));
      setShowPermanentRecord(false);
      setShowCommissionMark(false);
      setShowThanks(false);
      setShowCloseButton(false);

      await wait(500);
      if (cancelled) return;

      setVideoFade(true);
      playSfx("/sounds/final1.wav", 0.2);

      await wait(600);
      if (cancelled) return;

      setShowTransmissionDone(true);

      await wait(420);
      if (cancelled) return;

      for (let lineIndex = 0; lineIndex < CLOSING_LINES.length; lineIndex += 1) {
        await typeLine(lineIndex, CLOSING_LINES[lineIndex]);
        if (cancelled) return;

        if (lineIndex === 1 || lineIndex === 3) {
          playSfx("/sounds/final2.wav", 0.2);
        }

        await wait(220);
        if (cancelled) return;
      }

      await wait(1000);
      if (cancelled) return;

      setClosingTime(
        new Intl.DateTimeFormat("es-ES", {
          timeZone: "Europe/Madrid",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(new Date())
      );
      setShowPermanentRecord(true);
      playSfx("/sounds/final3.wav", 0.2);

      await wait(1000);
      if (cancelled) return;

      setShowCommissionMark(true);

      await wait(2000);
      if (cancelled) return;

      setShowThanks(true);

      await wait(1300);
      if (cancelled) return;

      setShowCloseButton(true);
    };

    runClosingSequence();

    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
    };
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

              {(phase === "video" || phase === "finished") && (
                <div className="fixed inset-0 z-50 bg-black overflow-hidden">
                  <video
                    ref={videoRef}
                    src="/videos/oldwoman.mp4"
                    playsInline
                    controls
                    className="h-full w-full object-cover"
                  />

                  <div
                    className={`pointer-events-none absolute inset-0 bg-black transition-opacity duration-[600ms] ${
                      videoFade ? "opacity-100" : "opacity-0"
                    }`}
                  />

                  <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/65 to-transparent" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/65 to-transparent" />
                </div>
              )}

              {phase === "finished" && (
                <div className="relative z-[60] mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-8 px-8 py-16 text-center">
                  <div className={`space-y-3 transition-opacity duration-700 ${showTransmissionDone ? "opacity-100" : "opacity-0"}`}>
                    <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-gold-dim">
                      TRANSMISION FINALIZADA
                    </p>
                  </div>

                  <div className="w-full max-w-[700px] space-y-3">
                    {typedClosingLines.map((line, idx) => (
                      <p
                        key={`closing-line-${idx}`}
                        className="font-mono text-[12px] tracking-[0.3em] uppercase text-gold-dim"
                      >
                        {line}
                        {activeClosingLine === idx && <span className="animate-blink">█</span>}
                      </p>
                    ))}
                  </div>

                  <div
                    className={`w-full max-w-[560px] border border-gold-dim/45 bg-black/70 px-6 py-5 text-left scanlines transition-all duration-700 ${
                      showPermanentRecord ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                    }`}
                  >
                    <p className="font-mono text-[10px] tracking-[0.35em] uppercase text-gold mb-4">REGISTRO PERMANENTE</p>
                    <div className="grid grid-cols-[170px_1fr] gap-y-2 font-mono text-[11px] tracking-[0.18em] uppercase text-gold-dim">
                      <span>ID</span>
                      <span className="text-gold">AURUM VII · 0734</span>
                      <span>HORA DE CIERRE</span>
                      <span className="text-gold">{closingTime || "--/--/---- --:--:--"}</span>
                      <span>ESTADO</span>
                      <span className="text-gold">ARCHIVADO</span>
                    </div>
                  </div>

                  <div className={`space-y-2 transition-all duration-1000 ${showCommissionMark ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
                    <p className="font-display text-3xl md:text-4xl text-gold uppercase">EX COMMISSIONE</p>
                    <p className="font-display text-xl md:text-2xl text-gold-dim uppercase tracking-[0.2em]">ALTA MESA</p>
                  </div>

                  <div className={`space-y-2 transition-opacity duration-[1400ms] ${showThanks ? "opacity-100" : "opacity-0"}`}>
                    <p className="font-mono text-[12px] tracking-[0.12em] text-gold-dim">La Comision agradece sus servicios.</p>
                    <p className="font-mono text-[12px] tracking-[0.12em] text-gold-dim">Hasta la proxima mision.</p>
                  </div>

                  {showCloseButton && (
                    <Link
                      to="/"
                      className="inline-flex border border-gold bg-gold/10 px-8 py-3 font-mono text-[11px] uppercase tracking-[0.35em] text-gold transition hover:bg-gold/20"
                    >
                      CERRAR EXPEDIENTE
                    </Link>
                  )}
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