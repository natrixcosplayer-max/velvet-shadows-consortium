import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import altaLogo from "../../assets/alta.png";

type CreditsSequenceProps = {
  active: boolean;
};

type CreditBlock = {
  title: string;
  lines: string[];
};

const CREDIT_BLOCKS: CreditBlock[] = [
  { title: "OPERACION", lines: ["MINERVA"] },
  { title: "ELENCO", lines: ["Los Michis"] },
  { title: "AGENTE OPERATIVO", lines: ["MANDARIN"] },
  { title: "AGENTE DE APOYO", lines: ["MINERVA"] },
  { title: "CAPITULO", lines: ["VALENCIA"] },
  { title: "LOCALIZACION", lines: ["HOTEL WESTIN CONTINENTAL", "VALENCIA"] },
  { title: "COMISION", lines: ["ROMA"] },
  { title: "PRODUCCION", lines: ["Hecho con mucho carino", "para un agente muy especial."] },
  {
    title: "DEDICATORIA",
    lines: ["Que nunca nos falten", "las risas,", "", "las aventuras", "", "y los nuevos horizontes", "por descubrir."],
  },
  { title: "REGISTRO", lines: ["Operacion completada", "Activo recuperado", "Expediente archivado", "Canal cerrado"] },
  { title: "HASTA LA PROXIMA MISION", lines: ["AGENTE MANDARIN"] },
  { title: "EX COMMISSIONE", lines: ["ALTA MESA"] },
];

const CREDIT_PHOTOS = [
  "/images/credits/couple.jpg",
  "/images/credits/couple0.jpg",
  "/images/credits/couple1.jpg",
  "/images/credits/eli1.jpg",
  "/images/credits/eli2.jpg",
  "/images/credits/eli3.jpg",
  "/images/credits/nata1.jpg",
  "/images/credits/nata2.jpg",
  "/images/credits/nata3.jpg",
  "/images/credits/nata4.jpg",
];

export function CreditsSequence({ active }: CreditsSequenceProps) {
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [showPresenta, setShowPresenta] = useState(false);
  const [rollStarted, setRollStarted] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showFinalCommission, setShowFinalCommission] = useState(false);
  const [showFin, setShowFin] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [photoEnabled, setPhotoEnabled] = useState(CREDIT_PHOTOS.length > 0);

  const timersRef = useRef<number[]>([]);
  const photoLoopRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;

    const addTimer = (ms: number, fn: () => void) => {
      const id = window.setTimeout(fn, ms);
      timersRef.current.push(id);
    };

    const fadeOutCreditsMusic = (ms = 2200) => {
      const audio = audioRef.current;
      if (!audio) return;

      if (fadeIntervalRef.current) {
        window.clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }

      const initialVolume = audio.volume;
      const steps = Math.max(1, Math.floor(ms / 100));
      const step = initialVolume / steps;

      fadeIntervalRef.current = window.setInterval(() => {
        const current = audioRef.current;
        if (!current) return;

        current.volume = Math.max(0, current.volume - step);
        if (current.volume <= 0.001) {
          current.volume = 0;
          current.pause();
          current.currentTime = 0;
          if (fadeIntervalRef.current) {
            window.clearInterval(fadeIntervalRef.current);
            fadeIntervalRef.current = null;
          }
        }
      }, 100);
    };

    const startCreditsMusic = () => {
      if (!audioRef.current) return;

      if (fadeIntervalRef.current) {
        window.clearInterval(fadeIntervalRef.current);
      }

      const target = 0.34;
      const step = target / 20;
      fadeIntervalRef.current = window.setInterval(() => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.volume = Math.min(target, audio.volume + step);
        if (audio.volume >= target && fadeIntervalRef.current) {
          window.clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
        }
      }, 100);
    };

    const startPhotoLoop = () => {
      if (!photoEnabled) return;

      setShowPhoto(true);
      setPhotoIndex(0);

      const cycle = () => {
        setShowPhoto(true);

        const fadeOut = window.setTimeout(() => {
          setShowPhoto(false);
        }, 5000);
        timersRef.current.push(fadeOut);

        const switchImage = window.setTimeout(() => {
          setPhotoIndex((prev) => (prev + 1) % CREDIT_PHOTOS.length);
          setShowPhoto(true);
        }, 5600);
        timersRef.current.push(switchImage);
      };

      cycle();
      photoLoopRef.current = window.setInterval(cycle, 7000);
    };

    const stopPhotoLoop = () => {
      if (photoLoopRef.current) {
        window.clearInterval(photoLoopRef.current);
        photoLoopRef.current = null;
      }
      setShowPhoto(false);
    };

    const music = new Audio("/sounds/credits.mp3");
    music.preload = "auto";
    music.volume = 0;
    music.loop = true;
    audioRef.current = music;

    // Trigger playback again when we begin fade-in, keeping volume at 0 until then.
    music.play().catch(() => {});

    const raf = window.requestAnimationFrame(() => {
      setOverlayVisible(true);
    });

    addTimer(2500, () => {
      startCreditsMusic();
      setShowLogo(true);
    });

    addTimer(4500, () => {
      setShowPresenta(true);
    });

    addTimer(6400, () => {
      setRollStarted(true);
      startPhotoLoop();
    });

    // Slow cinematic roll, then final cards and return action.
    addTimer(70600, () => {
      stopPhotoLoop();
      setRollStarted(false);
    });

    addTimer(72600, () => {
      setShowFinalCommission(true);
    });

    addTimer(76600, () => {
      setShowFinalCommission(false);
    });

    addTimer(77200, () => {
      setShowFin(true);
    });

    addTimer(79200, () => {
      fadeOutCreditsMusic(2600);
      setShowFin(false);
      setShowReturn(true);
    });

    return () => {
      window.cancelAnimationFrame(raf);
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];

      if (photoLoopRef.current) {
        window.clearInterval(photoLoopRef.current);
        photoLoopRef.current = null;
      }

      if (fadeIntervalRef.current) {
        window.clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    };
  }, [active, photoEnabled]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[12000] overflow-hidden bg-black" style={{ opacity: overlayVisible ? 1 : 0, transition: "opacity 1500ms ease" }}>
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(214,173,74,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(214,173,74,0.45)_1px,transparent_1px)] [background-size:36px_36px]" />

      <div className="absolute inset-0">
        {photoEnabled && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4">
            <img
              src={CREDIT_PHOTOS[photoIndex]}
              alt="Creditos"
              className={`h-[68vh] w-[92vw] max-w-[980px] object-contain transition-opacity duration-[2000ms] ${showPhoto ? "opacity-88" : "opacity-0"}`}
              onError={() => {
                setPhotoEnabled(false);
              }}
            />
          </div>
        )}

        <div className="pointer-events-none absolute top-[16vh] left-1/2 -translate-x-1/2 text-center">
          <img
            src={altaLogo}
            alt="Alta Mesa"
            className={`mx-auto w-[78px] md:w-[92px] transition-opacity duration-[2000ms] ${showLogo ? "opacity-90" : "opacity-0"}`}
          />
          <div className={`mt-6 font-mono text-[11px] uppercase tracking-[0.42em] text-gold-bright [text-shadow:0_0_10px_rgba(214,173,74,0.2)] transition-opacity duration-[1600ms] ${showPresenta ? "opacity-100" : "opacity-0"}`}>
            <div>ALTA MESA</div>
            <div className="mt-2 text-gold-dim">presenta</div>
          </div>
        </div>

        {rollStarted && (
          <div className="pointer-events-none absolute inset-x-0 bottom-[-54vh] flex justify-center [animation:debrief-credits-roll_64s_linear_forwards]">
            <div className="w-full max-w-[760px] px-8 text-center">
              {CREDIT_BLOCKS.map((block) => (
                <section key={block.title} className="mb-20 md:mb-28">
                  <h3 className="font-mono text-[11px] uppercase tracking-[0.4em] text-gold-dim [text-shadow:0_0_10px_rgba(214,173,74,0.12)] md:text-[13px]">
                    {block.title}
                  </h3>
                  <div className="mt-5 space-y-2 md:mt-6 md:space-y-3">
                    {block.lines.map((line, index) => (
                      <p key={`${block.title}-${index}`} className="font-display text-xl text-gold-bright [text-shadow:0_0_12px_rgba(214,173,74,0.18)] md:text-2xl">
                        {line || <span className="opacity-0">_</span>}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className={`text-center transition-opacity duration-[900ms] ${showFinalCommission ? "opacity-100" : "opacity-0"}`}>
            <p className="font-mono text-[12px] uppercase tracking-[0.42em] text-gold-dim md:text-[14px]">EX COMMISSIONE</p>
            <p className="mt-4 font-display text-3xl text-gold-bright [text-shadow:0_0_14px_rgba(214,173,74,0.2)] md:text-4xl">ALTA MESA</p>
          </div>

          <div className={`absolute text-center transition-opacity duration-[700ms] ${showFin ? "opacity-100" : "opacity-0"}`}>
            <p className="font-display text-3xl tracking-[0.28em] text-gold-bright [text-shadow:0_0_12px_rgba(214,173,74,0.2)] md:text-4xl">FIN</p>
          </div>
        </div>

        {showReturn && (
          <div className="absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2">
            <Link
              to="/"
              className="inline-flex border border-gold-dim bg-transparent px-6 py-2 font-mono text-[10px] uppercase tracking-[0.34em] text-gold-bright transition hover:border-gold hover:bg-gold/10"
            >
              VOLVER A LA COMISION
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
