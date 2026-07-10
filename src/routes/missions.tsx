import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell, Panel } from "../components/AppShell";
import { SignalDecryptor } from "../components/SignalDecryptor";
import { playSfx } from "../audio/atrium-audio-engine";
import mercado from "../assets/graphics/mercado.jpg";

export const Route = createFileRoute("/missions")({
  head: () => ({
    meta: [
      { title: "Operativo" },
      {
        name: "description",
        content: "Operación activa de la Comisión.",
      },
    ],
  }),
  component: Missions,
});

const OPERATION = {
  objective: "Recuperar el activo",
  location: "Consultar Coordenadas",
  address: "Enviada ubicación encriptada",
  status: "EN CURSO",
  window: "22:30 - 23:59",
  risk: "ALTO",
  maps:
    "https://www.google.com/maps/dir/?api=1&destination=39.469900,-0.376300",
};

const PROTOCOL_ORDERS = [
  {
    number: "01",
    label: "Desplazamiento",
    text: "Diríjase al punto de extracción siguiendo las coordenadas proporcionadas.",
  },
  {
    number: "02",
    label: "Credenciales",
    text: "Descifre las credenciales.",
  },
  {
    number: "03",
    label: "Inteligencia",
    text: 'Consulte "Pista Visual" si fuera necesario.',
  },
  {
    number: "04",
    label: "Cobertura",
    text: "Si detecta seguimiento, adopte cobertura civil tomando un cóctel con Minerva.",
  },
  {
    number: "05",
    label: "Recuperación",
    text: "Recupere el activo.",
  },
  {
    number: "06",
    label: "Confirmación",
    text: "Informe a la Comisión.",
  },
  {
    number: "07",
    label: "Extracción",
    text: "Abandone la zona discretamente. El vehículo asignado aguardará en el punto de extracción.",
  },
] as const;

function Missions() {
  const [nowCest, setNowCest] = useState("");
  const navigateButtonRef = useRef<HTMLAnchorElement | null>(null);
  const coordinatesSectionRef = useRef<HTMLDivElement | null>(null);
  const sealedCodeSectionRef = useRef<HTMLDivElement | null>(null);
  const visualReferenceSectionRef = useRef<HTMLDivElement | null>(null);
  const [objectiveElapsed, setObjectiveElapsed] = useState(17);
  const [reliability, setReliability] = useState("99.8 %");
  const [originIndex, setOriginIndex] = useState(0);
  const [signalPhase, setSignalPhase] = useState(0);
  const [moduleGlowId, setModuleGlowId] = useState<string | null>(null);
  const moduleGlowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastModuleFeedbackAtRef = useRef(0);

  const ORIGIN_STATES = [
    "SAT-COM VII",
    "SAT-COM VII · LOCK",
    "SAT-COM VII · TRACKING",
  ] as const;

  const formatElapsed = (totalSeconds: number) => {
    if (totalSeconds < 60) return `${totalSeconds} s`;

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")} min ${String(seconds).padStart(2, "0")} s`;
  };

  const jumpToNavigationButton = () => {
    if (!navigateButtonRef.current) return;

    navigateButtonRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => {
      navigateButtonRef.current?.focus({ preventScroll: true });
    }, 320);
  };

  const jumpToSection = (sectionRef: React.RefObject<HTMLDivElement | null>) => {
    if (!sectionRef.current) return;

    sectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const triggerModuleFeedback = (moduleNumber: string) => {
    const now = Date.now();
    if (now - lastModuleFeedbackAtRef.current < 180) return;
    lastModuleFeedbackAtRef.current = now;

    playSfx("/sounds/luxbeep2.mp3", 0.24);
    setModuleGlowId(moduleNumber);

    if (moduleGlowTimerRef.current) {
      clearTimeout(moduleGlowTimerRef.current);
    }

    moduleGlowTimerRef.current = setTimeout(() => {
      setModuleGlowId((current) => (current === moduleNumber ? null : current));
      moduleGlowTimerRef.current = null;
    }, 260);
  };

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const formatted = new Intl.DateTimeFormat("es-ES", {
        timeZone: "Europe/Madrid",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(d);

      setNowCest(`${formatted} CEST`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setObjectiveElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const next = (95 + Math.random() * 5).toFixed(1);
      setReliability(`${next} %`);
    }, 2600);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setOriginIndex((prev) => (prev + 1) % ORIGIN_STATES.length);
    }, 5500);
    return () => clearInterval(id);
  }, [ORIGIN_STATES.length]);

  useEffect(() => {
    const id = setInterval(() => {
      setSignalPhase((prev) => (prev + 1) % 6);
    }, 1200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    return () => {
      if (moduleGlowTimerRef.current) {
        clearTimeout(moduleGlowTimerRef.current);
      }
    };
  }, []);

  return (
  <AppShell title="Operativo" latin="Missio Activa">

    <div className="grid md:grid-cols-2 gap-5">

      <Panel title="Objetivo" latin="Finis Missionis">
        <p className="font-display text-3xl text-gold">
          {OPERATION.objective}
        </p>
      </Panel>

      <Panel title="Estado" latin="Status">
        <div className="flex items-center gap-3">

          <span className="relative inline-flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full rounded-full bg-green-400/80 animate-ping" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.9)]" />
          </span>

          <p className="font-display text-3xl text-gold">
            {OPERATION.status}
          </p>

        </div>

        <div className="mt-4 h-1 bg-secondary border border-gold-dim">
          <div className="h-full w-[65%] animate-progress-flow bg-[linear-gradient(90deg,oklch(0.55_0.08_80)_0%,oklch(0.78_0.13_85)_35%,oklch(0.9_0.1_88_/_0.55)_50%,oklch(0.78_0.13_85)_65%,oklch(0.55_0.08_80)_100%)] bg-[length:200%_100%] shadow-[0_0_8px_oklch(0.88_0.16_88_/_0.42)]" />
        </div>
      </Panel>

      <Panel title="Destino" latin="Locus">
        <p className="font-display text-2xl text-gold text-center">
          {OPERATION.location}
        </p>

        <button
          type="button"
          onClick={jumpToNavigationButton}
          className="mt-3 flex w-fit mx-auto items-center gap-2 border border-gold-dim bg-background/50 px-3 py-2 font-mono text-[11px] tracking-[0.2em] uppercase text-gold hover:border-gold hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold transition animate-pulse-gold"
        >
          PULSE PARA CONSULTAR UBICACION
        </button>
      </Panel>

      <Panel title="Ventana Operativa" latin="Tempus">
        <p className="font-display font-bold text-2xl text-gold text-center">
          {OPERATION.window}
        </p>
        <p className="mt-3 font-mono text-base md:text-lg tracking-[0.18em] text-gold uppercase text-center">
          {nowCest}
        </p>
      </Panel>

      <Panel title="Estado del Objetivo" latin="Objectivum">
        <div className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent opacity-70 shadow-[0_0_10px_rgba(212,175,55,0.6)] [animation:scan-objective_6s_linear_infinite]"
          />

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <span className="relative inline-flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-400/70 animate-pulse" />
                <span className="relative inline-flex h-4 w-4 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.65)]" />
              </span>

              <span className="font-display text-xl text-gold">
                ACTIVO LOCALIZADO
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-gold-dim">SEÑAL GPS</p>
                <div className="mt-2 flex items-end gap-1">
                  {Array.from({ length: 10 }).map((_, i) => {
                    const base = [0.34, 0.45, 0.56, 0.68, 0.8, 0.7, 0.6, 0.52, 0.44, 0.38][i];
                    const intensity = ((signalPhase + i) % 6) / 12;
                    return (
                      <span
                        key={i}
                        className="w-2 bg-gold transition-all duration-700"
                        style={{
                          height: `${10 + Math.round(base * 16)}px`,
                          opacity: Math.min(1, base + intensity),
                          transitionDelay: `${i * 70}ms`,
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="h-px bg-gold-dim/40" />

              <div>
                <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-gold-dim">ÚLTIMA ACTUALIZACIÓN</p>
                <p className="mt-1 font-display text-2xl text-gold">{formatElapsed(objectiveElapsed)}</p>
              </div>

              <div>
                <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-gold-dim">FIABILIDAD</p>
                <p className="mt-1 font-display text-2xl text-gold transition-opacity duration-700">{reliability}</p>
              </div>

              <div>
                <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-gold-dim">ORIGEN</p>
                <p className="mt-1 font-mono text-sm tracking-[0.2em] uppercase text-gold transition-all duration-700">
                  {ORIGIN_STATES[originIndex]}
                </p>
              </div>
            </div>
          </div>
        </div>

      </Panel>

    </div>

    <Panel title="Protocolo Operativo" latin="Mandatum" className="mt-8">

      <div className="mx-auto max-w-4xl">
        <div className="border-y border-gold/30 py-5 text-center">
          <p className="font-mono text-[9px] tracking-[0.45em] uppercase text-gold-dim">
            OPERACIÓN CUMPLIUM
          </p>
          <p className="mt-2 font-mono text-[10px] tracking-[0.35em] uppercase text-gold/80">
            AUTORIDAD: COMISIÓN
          </p>
        </div>

        <ol className="mt-6 divide-y divide-gold/20 border-y border-gold/20">
          {PROTOCOL_ORDERS.map((order) => {
            const onActivate =
              order.number === "01"
                ? () => jumpToSection(coordinatesSectionRef)
                : order.number === "02"
                  ? () => jumpToSection(sealedCodeSectionRef)
                  : order.number === "03"
                    ? () => jumpToSection(visualReferenceSectionRef)
                    : undefined;

            return (
              <li
                key={order.number}
                className="protocol-operativo-row py-4 sm:py-5"
              >
                <div className="grid gap-2 sm:grid-cols-[96px_1fr] sm:gap-5">
                  <p className="font-display text-xl tracking-[0.16em] text-gold sm:text-2xl">
                    {order.number}
                  </p>

                  <div>
                    <p className="font-mono text-[10px] tracking-[0.32em] uppercase text-gold/90">
                      {order.label}
                    </p>
                    <p className="mt-2 font-mono text-sm leading-7 text-gold/85 sm:text-base">
                      {order.text}
                    </p>

                    {onActivate && (
                      <button
                        type="button"
                        onClick={onActivate}
                        onPointerDown={() => triggerModuleFeedback(order.number)}
                        onTouchStart={() => triggerModuleFeedback(order.number)}
                        className={`protocol-operativo-cta mt-3 font-mono text-[10px] tracking-[0.28em] uppercase text-gold-dim ${moduleGlowId === order.number ? "border-gold text-gold bg-gold/15 shadow-[0_0_16px_rgba(212,175,55,0.45)]" : ""}`}
                        aria-label={`Abrir modulo ${order.number}: ${order.label}`}
                      >
                        <span>Abrir modulo</span>
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

    </Panel>

    <div ref={coordinatesSectionRef}>
    <Panel title="Coordenadas" latin="Geolocatio" className="mt-8">

      <div className="grid md:grid-cols-[1fr_280px] gap-8 items-center">

        <div>

          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-gold-dim">
            POSICIÓN VERIFICADA
          </p>

          <p className="font-mono text-gold-dim uppercase tracking-[0.25em]">
  LAT 39.45896
</p>

<p className="font-mono text-gold-dim uppercase tracking-[0.25em]">
  LON -0.38198
</p>

          <p className="mt-6 text-gold-dim font-mono uppercase tracking-[0.2em]">
            Última actualización · Hace 2 minutos
          </p>

        </div>

        <div className="flex flex-col gap-4">

        <div className="flex flex-col gap-4">

  <a
    href="https://maps.app.goo.gl/huh44bQw9ePxUGBx9"
    target="_blank"
    rel="noopener noreferrer"
    className="border border-gold p-4 text-center uppercase font-mono tracking-[0.25em] text-gold hover:bg-gold hover:text-primary-foreground transition animate-pulse-gold"
  >
    📍 Ver ubicación
  </a>

  <a
    ref={navigateButtonRef}
    href="https://www.google.com/maps/dir/?api=1&destination=C%2F+de+Ciril+Amor%C3%B3s%2C+62%2C+46004+Val%C3%A8ncia&travelmode=walking"
    target="_blank"
    rel="noopener noreferrer"
    className="border border-gold p-4 text-center uppercase font-mono tracking-[0.25em] text-gold hover:bg-gold hover:text-primary-foreground transition animate-pulse-gold"
  >
    🧭 Iniciar navegación
  </a>

</div>

        </div>

      </div>

      <figure className="mt-8 relative overflow-hidden scanlines">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gold/95 shadow-[0_0_20px_rgba(214,173,74,1)] animate-scan pointer-events-none" />
        <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,transparent_45%,rgba(0,0,0,0.55)_100%)]" />
        <img
          src={mercado}
          alt="Punto de recuperación · Mercado de Colón"
          className="relative z-0 w-full h-56 md:h-80 object-cover object-center grayscale contrast-125 brightness-80 opacity-90 animate-flicker animate-surveillance-pan"
        />
        <figcaption className="mt-2 font-mono text-[10px] tracking-[0.3em] uppercase text-gold-dim text-center">
          · Punto de recuperación · Vigilancia activa ·
        </figcaption>
      </figure>

    </Panel>
    </div>

    <Panel title="Nivel de Riesgo" latin="Periculum" className="mt-8">
      <p className="font-display text-2xl text-red-400">
        {OPERATION.risk}
      </p>

      <div className="mt-4 h-px bg-gold-dim/60" />

      <p className="mt-4 font-mono text-[10px] tracking-[0.3em] text-gold-dim uppercase">
        Amenazas Activas
      </p>

      <div className="mt-3 space-y-3">
        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-gold uppercase flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            CONSORCIO OBSIDIANA
          </p>
          <p className="ml-4 text-[11px] text-muted-foreground">Actividad confirmada</p>
        </div>

        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-gold uppercase flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-gold-dim" />
            OPERATIVOS HOSTILES
          </p>
          <p className="ml-4 text-[11px] text-muted-foreground">3 detectados</p>
        </div>

        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-gold uppercase flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
            OBJETIVO PROTEGIDO
          </p>
          <p className="ml-4 text-[11px] text-muted-foreground">Seguimiento activo</p>
        </div>
      </div>

      <div className="mt-5 border border-gold-dim/60 bg-black/25 p-3 md:p-4">
        <p className="font-mono text-[10px] tracking-[0.3em] text-gold-dim uppercase text-center">VIGILANCIA ACTIVA</p>
        <SurveillanceMonitor />
      </div>

      <div className="mt-4 h-px bg-gold-dim/60" />

      <div className="mt-4 space-y-1">
        <p className="font-mono text-[11px] tracking-[0.12em] text-gold-dim">
          Probabilidad de contacto: <span className="text-gold">47%</span>
        </p>
        <p className="font-mono text-[10px] tracking-[0.14em] text-gold-dim uppercase animate-pulse">
          Actualizado hace menos de 30 segundos
        </p>
      </div>
    </Panel>

    <div ref={sealedCodeSectionRef}>
      <SealedCode />
    </div>

    <div ref={visualReferenceSectionRef}>
      <VisualReferenceSequence />
    </div>

    <Panel title="Observaciones de la Comisión" className="mt-8">

      <div className="space-y-4 text-gold leading-8">
        <p className="font-mono text-sm tracking-[0.22em] uppercase text-gold-dim">Nota Interna</p>
        <blockquote className="border-l-2 border-gold/70 pl-4 text-gold">
          La Comisión mantiene vigilancia permanente sobre los agentes <strong>Mandarin</strong> y <strong>Minerva</strong>. El desempeño de ambos durante la presente operación está siendo altamente satisfactorio. Continúen conforme al protocolo. La Alta Mesa observa.
        </blockquote>
      </div>

    </Panel>

  </AppShell>
  );
  }

const RULE = "══════════════════════════════";
const DECRYPT_TEXT = "DESCIFRANDO...";

function SurveillanceMonitor() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [monitorBooted, setMonitorBooted] = useState(false);

  useEffect(() => {
    const bootId = window.setTimeout(() => {
      setMonitorBooted(true);
    }, 70);

    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      const playPromise = video.play();
      if (playPromise) {
        void playPromise.catch(() => {
          // Keep muted+inline autoplay attributes; browser policy may still defer playback.
        });
      }
    }

    return () => {
      window.clearTimeout(bootId);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    };
  }, []);

  return (
    <div className="mt-3 flex justify-center">
      <div className="relative w-[78%] max-w-[360px] min-w-[220px]">
        <div className="pointer-events-none absolute -inset-[2px] rounded-sm bg-gold/20 blur-md opacity-35" />

        <div className="relative overflow-hidden rounded-sm border border-gold-dim bg-black shadow-[inset_0_0_0_1px_rgba(212,175,55,0.1),0_0_14px_rgba(212,175,55,0.18)]">
          <div className="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.08),transparent_58%)]" />
          <div className="pointer-events-none absolute inset-0 z-20 opacity-[0.08] [background-image:repeating-linear-gradient(0deg,transparent_0,transparent_2px,rgba(255,255,255,0.75)_2px,rgba(255,255,255,0.75)_3px)]" />
          <div className="pointer-events-none absolute left-0 right-0 z-20 h-px bg-white/20 [animation:debrief-video-scan_12s_linear_infinite]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-gold/80 to-transparent" />

          <video
            ref={videoRef}
            src="/videos/mercado.mp4"
            autoPlay
            muted
            playsInline
            loop
            preload="auto"
            controls={false}
            disablePictureInPicture
            disableRemotePlayback
            className={`relative z-10 w-full h-auto max-h-[70vh] object-cover transition-all duration-700 ${monitorBooted ? "opacity-100 brightness-[0.9]" : "opacity-0 brightness-[0.2] scale-[1.01]"}`}
            aria-label="Transmision de vigilancia del punto de entrega"
          />

          <div className={`pointer-events-none absolute inset-0 z-30 bg-black transition-opacity duration-700 ${monitorBooted ? "opacity-0" : "opacity-45"}`} />
        </div>

        <p className="mt-2 text-center font-mono text-[9px] tracking-[0.24em] uppercase text-gold-dim">
          TRANSMISIÓN EN DIRECTO · MERCADO BAJO OBSERVACIÓN
        </p>
      </div>
    </div>
  );
}

function SealedCode() {
  const [phase, setPhase] = useState<"idle" | "decrypting" | "done">("idle");
  const [typed, setTyped] = useState("");
  const [progress, setProgress] = useState(0);
  const [flash, setFlash] = useState(false);
  const [isAgentPromptOpen, setIsAgentPromptOpen] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [agentError, setAgentError] = useState("");

  const start = () => {
    if (phase === "decrypting") return;
    playSfx("/sounds/luxbeep.mp3", 0.3);
    setTyped("");
    setProgress(0);
    setPhase("decrypting");
    setFlash(true);
  };

  const openAgentPrompt = () => {
    if (phase === "decrypting") return;
    setAgentError("");
    setAgentName("");
    setIsAgentPromptOpen(true);
  };

  const confirmAgent = () => {
    if (agentName.trim().toLowerCase() === "mandarin") {
      setAgentError("");
      setIsAgentPromptOpen(false);
      setAgentName("");
      start();
      return;
    }

    setAgentError("Acceso denegado. Introduce el nombre de agente correcto.");
  };

  // Parpadeo de pantalla al iniciar
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(false), 180);
    return () => clearTimeout(t);
  }, [flash]);

  // Efecto de escritura + barra de progreso durante el descifrado
  useEffect(() => {
    if (phase !== "decrypting") return;

    let i = 0;
    const typer = setInterval(() => {
      i++;
      setTyped(DECRYPT_TEXT.slice(0, i));
      if (i >= DECRYPT_TEXT.length) clearInterval(typer);
    }, 90);

    const bar = setInterval(() => {
      setProgress((p) => (p >= 10 ? 10 : p + 1));
    }, 220);

    return () => {
      clearInterval(typer);
      clearInterval(bar);
    };
  }, [phase]);

  // Al completar la barra, revelar credenciales
  useEffect(() => {
    if (phase === "decrypting" && progress >= 10) {
      const t = setTimeout(() => setPhase("done"), 500);
      return () => clearTimeout(t);
    }
  }, [phase, progress]);

  return (
    <Panel title="Código Sellado" latin="Codex Signatus" className="mt-8">

      {flash && (
        <div
          aria-hidden
          className="fixed inset-0 z-50 bg-gold/40 pointer-events-none animate-flicker"
        />
      )}

      <div className="text-center font-mono">

        <p className="text-gold-dim tracking-[0.15em] select-none overflow-hidden">{RULE}</p>

        {isAgentPromptOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 px-4">
            <div className="w-full max-w-md border border-gold bg-[#0b0b0b]/95 p-6 text-left shadow-[0_0_30px_rgba(214,173,74,0.25)]">
              <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-gold-dim">
                Autenticación de acceso
              </p>
              <p className="mt-3 text-gold tracking-[0.2em] uppercase">
                Introduce el identificador de acceso
              </p>
              <input
                autoFocus
                value={agentName}
                onChange={(event) => {
                  setAgentName(event.target.value);
                  if (agentError) setAgentError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    confirmAgent();
                  }
                }}
                placeholder=""
                className="mt-4 w-full border border-gold/70 bg-background/70 px-3 py-2 font-mono text-sm uppercase tracking-[0.2em] text-gold outline-none"
              />
              {agentError && (
                <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-red-400">
                  {agentError}
                </p>
              )}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  onClick={() => {
                    setIsAgentPromptOpen(false);
                    setAgentError("");
                    setAgentName("");
                  }}
                  className="border border-gold/70 px-4 py-2 text-[10px] tracking-[0.3em] uppercase text-gold transition hover:bg-gold hover:text-primary-foreground"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmAgent}
                  className="border border-gold px-4 py-2 text-[10px] tracking-[0.3em] uppercase text-gold transition hover:bg-gold hover:text-primary-foreground"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        {phase === "idle" && (
          <div className="py-6 animate-fade-up">
            <p className="text-gold tracking-[0.3em] uppercase">
              Acceso a Depósito Continental
            </p>
            <button
              onClick={() => {
                playSfx("/sounds/beep.mp3", 0.28);
                openAgentPrompt();
              }}
              className="mt-6 border border-gold px-8 py-3 text-gold tracking-[0.3em] uppercase hover:bg-gold hover:text-primary-foreground transition animate-pulse-gold"
            >
              [ Desclasificar Credenciales ]
            </button>
          </div>
        )}

        {phase === "decrypting" && (
          <div className="py-6 scanlines">
            <p className="text-gold-bright tracking-[0.3em] uppercase">
              {typed}
              <span className="animate-blink">█</span>
            </p>
            <p className="mt-4 text-gold text-2xl tracking-[0.35em]">
              {"■".repeat(progress)}
              {"□".repeat(10 - progress)}
            </p>
          </div>
        )}

        {phase === "done" && (
          <div className="py-6 animate-fade-up">
            <p className="text-green-400 tracking-[0.3em] uppercase">
              Credenciales Válidas
            </p>

            <div className="grid grid-cols-3 gap-4 mt-6 max-w-md mx-auto">
              <SealField label="Cajón" value="409" />
              <SealField label="Tipo" value="L" />
              <SealField label="Código" value="840731" />
            </div>

            <p className="mt-6 text-gold tracking-[0.3em] uppercase animate-flicker">
              ✦ Autorización Concedida ✦
            </p>
          </div>
        )}

        <p className="text-gold-dim tracking-[0.15em] select-none overflow-hidden">{RULE}</p>

      </div>
    </Panel>
  );
}

function SealField({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gold-dim p-3">
      <p className="font-mono text-[9px] tracking-[0.3em] text-gold-dim uppercase">{label}</p>
      <p className="font-display text-2xl text-gold mt-1">{value}</p>
    </div>
  );
}

function ProtocolOrderCard({
  order,
  index,
  total,
  onActivate,
}: {
  order: (typeof PROTOCOL_ORDERS)[number];
  index: number;
  total: number;
  onActivate?: () => void;
}) {
  const [revealStage, setRevealStage] = useState(0);
  const [flashVisible, setFlashVisible] = useState(true);

  useEffect(() => {
    const revealTimeline = [0, 120, 240, 360, 500];
    const timers: number[] = [];

    revealTimeline.forEach((delay, stage) => {
      const id = window.setTimeout(() => {
        setRevealStage(stage);
      }, index * 100 + delay);
      timers.push(id);
    });

    const flashId = window.setTimeout(() => setFlashVisible(false), index * 100 + 300);

    return () => {
      timers.forEach((timerId) => window.clearTimeout(timerId));
      window.clearTimeout(flashId);
    };
  }, [index]);

  const visibleTitleLength = Math.min(
    order.label.length,
    revealStage === 0 ? 0 : revealStage === 1 ? 1 : revealStage === 2 ? Math.max(2, Math.ceil(order.label.length * 0.45)) : revealStage === 3 ? Math.max(3, Math.ceil(order.label.length * 0.75)) : order.label.length,
  );

  const titleText =
    visibleTitleLength >= order.label.length
      ? order.label
      : `${order.label.slice(0, visibleTitleLength)}${"█".repeat(order.label.length - visibleTitleLength)}`;

  const isInteractive = typeof onActivate === "function";

  return (
    <div
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={isInteractive ? onActivate : undefined}
      onKeyDown={
        isInteractive
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onActivate?.();
              }
            }
          : undefined
      }
      className={`group relative overflow-hidden border border-gold/30 bg-black/55 px-5 py-6 transition-all duration-300 ease-out sm:px-6 sm:py-7 md:px-8 hover:border-gold/70 hover:bg-black/65 hover:-translate-y-[2px] ${
        isInteractive
          ? "cursor-pointer active:translate-y-[1px] active:border-gold/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/70"
          : ""
      }`}
      style={{
        opacity: revealStage === 0 ? 0 : 1,
        animationDelay: `${index * 100}ms`,
      }}
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(214,173,74,0.14)_0%,transparent_58%)] transition-opacity duration-300 ${
          flashVisible ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent"
      />

      <div className="relative grid gap-4 md:grid-cols-[96px_1fr] md:gap-6">
        <div className="flex items-start md:justify-center">
          <div className="min-w-[72px] border border-gold/25 bg-black/35 px-3 py-3 text-center">
            <p className="font-display text-2xl tracking-[0.18em] text-gold">
              {order.number}
            </p>
            <p className="mt-1 font-mono text-[9px] tracking-[0.3em] uppercase text-gold-dim">
              Secuencia
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="font-mono text-[9px] tracking-[0.38em] uppercase text-gold-dim">
              {index === 0 ? "PROTOCOLO EMITIDO" : "ORDEN ACTIVA"}
            </p>
            <p className="font-display font-bold text-2xl sm:text-[2rem] tracking-[0.18em] uppercase text-gold">
              {titleText}
            </p>
            {isInteractive && (
              <p className="font-mono text-[9px] tracking-[0.28em] uppercase text-gold/75 md:hidden animate-pulse">
                tocar para abrir modulo
              </p>
            )}
          </div>

          <div className="h-px bg-gold/20" />

          <p className="max-w-3xl text-balance font-mono text-[15px] leading-8 text-gold/86 sm:text-base sm:leading-8">
            {order.text}
          </p>

          <div className="flex items-center gap-3 pt-1">
            <span
              className="h-2 w-2 rounded-full bg-gold/70 shadow-[0_0_0_1px_rgba(212,175,55,0.18)] animate-pulse"
              style={{ animationDuration: "5.5s" }}
            />
            <p className="font-mono text-[10px] tracking-[0.32em] uppercase text-gold-dim">
              PENDIENTE
            </p>
          </div>
        </div>
      </div>

      {index < total - 1 && (
        <div aria-hidden className="mt-6 h-px bg-gold/18 sm:mt-7" />
      )}
    </div>
  );
}

type VisualPhase = "first" | "between" | "second" | "analysis";

function VisualReferenceSequence() {
  const [phase, setPhase] = useState<VisualPhase>("first");
  const [analysisReady, setAnalysisReady] = useState(false);

  useEffect(() => {
    if (phase !== "analysis") {
      setAnalysisReady(false);
      return;
    }

    const t = window.setTimeout(() => setAnalysisReady(true), 2100);
    return () => window.clearTimeout(t);
  }, [phase]);

  return (
    <div className="mt-8 space-y-4">
      {phase === "first" && (
        <SignalDecryptor
          image="/images/locker_1.jpg"
          targetFrequency={61.4}
          archiveName="VISUAL_REFERENCE.enc"
          onCompleted={() => setPhase("between")}
        />
      )}

      {phase === "between" && (
        <Panel title="ARCHIVOS ASOCIADOS DETECTADOS" latin="Relatio Secreta" className="mt-4">
          <div className="space-y-4 text-center font-mono">
            <p className="text-gold-dim tracking-[0.15em] select-none overflow-hidden">────────────────────────</p>
            <p className="text-gold-bright tracking-[0.3em] uppercase">1 de 2 RECUPERADOS</p>
            <p className="text-gold leading-7">
              Se ha localizado una segunda transmisión relacionada.
            </p>
            <button
              type="button"
              onClick={() => setPhase("second")}
              className="mt-2 inline-flex w-full items-center justify-center border border-gold px-5 py-3 font-mono text-[10px] uppercase tracking-[0.34em] text-gold-bright transition hover:border-gold hover:bg-gold/10 sm:w-auto"
            >
              [ ANALIZAR SIGUIENTE TRANSMISIÓN ]
            </button>
            <p className="text-gold-dim tracking-[0.15em] select-none overflow-hidden">────────────────────────</p>
          </div>
        </Panel>
      )}

      {phase === "second" && (
        <SignalDecryptor
          image="/images/locker_2.jpg"
          targetFrequency={58.9}
          archiveName="VISUAL_REFERENCE_02.enc"
          onCompleted={() => setPhase("analysis")}
          mobileRaised
        />
      )}

      {phase === "analysis" && (
        <Panel title="ANÁLISIS CRUZADO" latin="Comparatio" className="mt-4">
          {!analysisReady ? (
            <div className="space-y-4 text-center font-mono">
              <p className="text-gold-bright tracking-[0.32em] uppercase animate-pulse">COMPARANDO EVIDENCIAS...</p>
              <div className="h-2 overflow-hidden border border-gold-dim/70 bg-secondary">
                <div className="h-full w-[78%] bg-[linear-gradient(90deg,oklch(0.58_0.1_84)_0%,oklch(0.82_0.14_87)_40%,oklch(0.95_0.11_90_/_0.8)_50%,oklch(0.82_0.14_87)_60%,oklch(0.58_0.1_84)_100%)] bg-[length:200%_100%] shadow-[0_0_12px_rgba(214,173,74,0.45)] animate-progress-flow" />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-center font-mono text-[10px] tracking-[0.32em] uppercase text-gold-bright">MATCH FOUND</p>

              <div className="grid gap-4 md:grid-cols-2">
                <figure className="relative max-w-full overflow-hidden border border-gold-dim bg-black scanlines">
                  <div className="pointer-events-none absolute inset-0 z-20 bg-[repeating-linear-gradient(180deg,rgba(255,255,255,0.16)_0px,rgba(255,255,255,0.16)_1px,transparent_1px,transparent_5px)] mix-blend-screen opacity-60" />
                  <div className="pointer-events-none absolute inset-0 z-20 animate-flicker bg-[linear-gradient(180deg,rgba(255,180,70,0.28)_0%,transparent_18%,transparent_82%,rgba(255,255,255,0.12)_100%)] opacity-85" />
                  <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-1 bg-gold/80 shadow-[0_0_18px_rgba(214,173,74,0.95)] animate-pulse" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-1 bg-orange-400/60 shadow-[0_0_16px_rgba(251,146,60,0.75)] animate-pulse" />
                  <img
                    src="/images/locker_1.jpg"
                    alt="Archivo 01 recuperado"
                    className="relative z-0 mx-auto block h-auto w-full max-w-full object-contain"
                    style={{
                      filter: "grayscale(0.08) sepia(1) saturate(2.75) contrast(1.35) brightness(0.78) hue-rotate(10deg) blur(0.08px)",
                      opacity: 0.88,
                    }}
                  />
                </figure>
                <figure className="relative max-w-full overflow-hidden border border-gold-dim bg-black scanlines">
                  <div className="pointer-events-none absolute inset-0 z-20 bg-[repeating-linear-gradient(180deg,rgba(255,255,255,0.16)_0px,rgba(255,255,255,0.16)_1px,transparent_1px,transparent_5px)] mix-blend-screen opacity-60" />
                  <div className="pointer-events-none absolute inset-0 z-20 animate-flicker bg-[linear-gradient(180deg,rgba(255,180,70,0.28)_0%,transparent_18%,transparent_82%,rgba(255,255,255,0.12)_100%)] opacity-85" />
                  <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-1 bg-gold/80 shadow-[0_0_18px_rgba(214,173,74,0.95)] animate-pulse" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-1 bg-orange-400/60 shadow-[0_0_16px_rgba(251,146,60,0.75)] animate-pulse" />
                  <img
                    src="/images/locker_2.jpg"
                    alt="Archivo 02 recuperado"
                    className="relative z-0 mx-auto block h-auto w-full max-w-full object-contain"
                    style={{
                      filter: "grayscale(0.08) sepia(1) saturate(2.75) contrast(1.35) brightness(0.78) hue-rotate(10deg) blur(0.08px)",
                      opacity: 0.88,
                    }}
                  />
                </figure>
              </div>

              <div className="space-y-3 text-center font-mono text-gold">
                <p className="tracking-[0.2em] uppercase">────────────────────────</p>
                <p className="tracking-[0.24em] uppercase">ARCHIVO 01 ✔</p>
                <p className="tracking-[0.24em] uppercase">ARCHIVO 02 ✔</p>
                <p className="tracking-[0.24em] uppercase">COINCIDENCIA DETECTADA</p>
                <p className="tracking-[0.24em] uppercase">LOCALIZACIÓN VALIDADA</p>
                <p className="text-gold-dim leading-7">"La Alta Mesa considera que dispone de información suficiente para localizar el depósito."</p>
                <p className="tracking-[0.2em] uppercase">────────────────────────</p>
              </div>
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
