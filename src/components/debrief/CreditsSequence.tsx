import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import altaLogo from "../../assets/alta.png";
import { setControlledAudioVolume, stopControlledAudio } from "../../audio/audiomanager";

type CreditsSequenceProps = {
  active: boolean;
};

type CreditBlock = {
  title: string;
  lines: string[];
};

const CREDIT_BLOCKS: CreditBlock[] = [
  { title: "ALTA MESA", lines: ["presenta"] },
  { title: "OPERACION", lines: ["CUMPLE"] },
  { title: "ELENCO", lines: ["Los Michis"] },
  { title: "LA MICHI", lines: ["Programando durante dos semanas", "para su Michi."] },
  { title: "EL MICHI", lines: ["Realizando un operativo", "sin sospechar absolutamente nada."] },
  { title: "MENSAJE", lines: ["Espero que te guste todo, amor.", "", "Hecho con mucho carino durante estas semanas por tu Michi."] },
  { title: "CITA", lines: ["\"Porque naveguemos juntos todas las aguas,", "", "las buenas y las malas,", "", "y salgamos siempre mas fuertes.", "Te quiero.\""] },
];

const PHOTO_BASENAMES = ["eli1", "nata1", "eli2", "nata2", "eli3", "couple0", "nata3", "eli", "nata"] as const;
const PHOTO_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;

export function CreditsSequence({ active }: CreditsSequenceProps) {
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [activeCreditIndex, setActiveCreditIndex] = useState<number | null>(null);
  const [creditVisible, setCreditVisible] = useState(false);
  const [photoVisible, setPhotoVisible] = useState(false);
  const [photoCurrent, setPhotoCurrent] = useState<string | null>(null);
  const [photoPrevious, setPhotoPrevious] = useState<string | null>(null);
  const [showFinalCommission, setShowFinalCommission] = useState(false);
  const [showReturn, setShowReturn] = useState(false);

  const timersRef = useRef<number[]>([]);
  const fadeIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    const addTimer = (ms: number, fn: () => void) => {
      const id = window.setTimeout(fn, ms);
      timersRef.current.push(id);
    };

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const id = window.setTimeout(() => resolve(), ms);
        timersRef.current.push(id);
      });

    const resolvePhotoSrc = async (basename: string) => {
      for (const ext of PHOTO_EXTENSIONS) {
        const candidate = `/images/credits/${basename}.${ext}`;
        const exists = await new Promise<boolean>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = candidate;
        });

        if (exists) return candidate;
      }

      // Fallback to jpg path if none resolved.
      return `/images/credits/${basename}.jpg`;
    };

    setControlledAudioVolume("debrief-credits", 0);

    let volume = 0;
    const step = 0.38 / 20;
    fadeIntervalRef.current = window.setInterval(() => {
      volume = Math.min(0.38, volume + step);
      setControlledAudioVolume("debrief-credits", volume);
      if (volume >= 0.38 && fadeIntervalRef.current) {
        window.clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }
    }, 100);

    const raf = window.requestAnimationFrame(() => {
      setOverlayVisible(true);
    });

    const run = async () => {
      const resolvedPhotos = await Promise.all(PHOTO_BASENAMES.map((name) => resolvePhotoSrc(name)));
      if (cancelled) return;

      setShowLogo(true);
      await wait(3000);
      if (cancelled) return;

      setShowLogo(false);
      await wait(1000);
      if (cancelled) return;

      let lastPhoto: string | null = null;

      for (let i = 0; i < CREDIT_BLOCKS.length; i += 1) {
        setActiveCreditIndex(i);
        setCreditVisible(true);
        await wait(2800);
        if (cancelled) return;

        const photoIndex = Math.floor((i / Math.max(1, CREDIT_BLOCKS.length - 1)) * Math.max(0, resolvedPhotos.length - 1));
        const nextPhoto = resolvedPhotos[photoIndex] || null;
        if (nextPhoto) {
          setPhotoPrevious(lastPhoto);
          setPhotoCurrent(nextPhoto);
          setPhotoVisible(true);
          setCreditVisible(false);

          // Let previous image crossfade out over ~2s while new image fades in.
          await wait(2100);
          if (cancelled) return;
          setPhotoPrevious(null);

          await wait(3500);
          if (cancelled) return;

          setPhotoVisible(false);
          await wait(900);
          if (cancelled) return;

          lastPhoto = nextPhoto;
        } else {
          setCreditVisible(false);
          await wait(900);
          if (cancelled) return;
        }
      }

      setShowFinalCommission(true);
      await wait(4200);
      if (cancelled) return;

      setShowFinalCommission(false);
      setShowReturn(true);
    };

    void run();

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf);
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];

      if (fadeIntervalRef.current) {
        window.clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }
    };
  }, [active]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[12000] overflow-hidden bg-black" style={{ opacity: overlayVisible ? 1 : 0, transition: "opacity 1500ms ease" }}>
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(214,173,74,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(214,173,74,0.35)_1px,transparent_1px)] [background-size:36px_36px]" />

      {(photoCurrent || photoPrevious) && (
        <div className="pointer-events-none absolute inset-0">
          {photoPrevious && (
            <img
              src={photoPrevious}
              alt="Creditos anterior"
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[2000ms] ${photoVisible ? "opacity-0" : "opacity-[0.85]"}`}
            />
          )}

          {photoCurrent && (
            <img
              src={photoCurrent}
              alt="Creditos"
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[2000ms] ${photoVisible ? "opacity-[0.85]" : "opacity-0"}`}
            />
          )}

          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.54)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-[34vh] bg-[linear-gradient(to_top,rgba(0,0,0,0.6),transparent)]" />
        </div>
      )}

      <div className="absolute inset-0 flex items-center justify-center px-6">
        <div className="text-center">
          <img
            src={altaLogo}
            alt="Alta Mesa"
            className={`mx-auto w-[78px] md:w-[92px] transition-opacity duration-[2000ms] ${showLogo ? "opacity-90" : "opacity-0"}`}
          />

          {activeCreditIndex !== null && (
            <div className={`mt-16 transition-opacity duration-[900ms] ${creditVisible ? "opacity-100" : "opacity-0"}`}>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.42em] text-gold-dim [text-shadow:0_0_10px_rgba(214,173,74,0.15)] md:text-[13px]">
                {CREDIT_BLOCKS[activeCreditIndex].title}
              </h3>
              <div className="mt-5 space-y-2 md:space-y-3">
                {CREDIT_BLOCKS[activeCreditIndex].lines.map((line) => (
                  <p key={`${CREDIT_BLOCKS[activeCreditIndex].title}-${line}`} className="font-display text-2xl text-gold-bright [text-shadow:0_0_12px_rgba(214,173,74,0.18)] md:text-3xl">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className={`mt-16 transition-opacity duration-[1000ms] ${showFinalCommission ? "opacity-100" : "opacity-0"}`}>
            <p className="font-mono text-[11px] uppercase tracking-[0.42em] text-gold-dim md:text-[13px]">EX COMMISSIONE</p>
            <p className="mt-4 font-display text-3xl text-gold-bright [text-shadow:0_0_14px_rgba(214,173,74,0.2)] md:text-4xl">ALTA MESA</p>
          </div>
        </div>
      </div>

      {showReturn && (
        <div className="absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2">
          <Link
            to="/"
            onClick={() => stopControlledAudio("debrief-credits")}
            className="inline-flex border border-gold-dim bg-transparent px-6 py-2 font-mono text-[10px] uppercase tracking-[0.34em] text-gold-bright transition hover:border-gold hover:bg-gold/10"
          >
            VOLVER A LA COMISION
          </Link>
        </div>
      )}
    </div>
  );
}
