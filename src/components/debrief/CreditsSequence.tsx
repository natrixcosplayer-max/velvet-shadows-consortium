import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import altaLogo from "../../assets/alta.png";
import besoVideo from "../../assets/birthday/beso.mp4";
import gunnoirVideo from "../../assets/birthday/gunnoir.mp4";
import { setControlledAudioVolume, stopControlledAudio } from "../../audio/audiomanager";

type CreditsSequenceProps = {
  active: boolean;
};

type CreditBlock = {
  title: string;
  lines: string[];
};

type PhotoDriftDirection = "left" | "right";

type InterludeMedia =
  | { type: "image"; basename: string }
  | { type: "video"; src: string };

const EXTENDED_CREDIT_TITLES = new Set(["EL MICHI", "LA MICHI"]);
const DELAYED_DETAIL_LINES = new Set([
  "Realizando un operativo",
  "sin sospechar absolutamente nada.",
  "Programando durante dos semanas",
  "para su Michi.",
]);

const CREDIT_BLOCKS: CreditBlock[] = [
  { title: "ALTA MESA", lines: ["presenta"] },
  { title: "OPERACION", lines: ["CUMPLE"] },
  { title: "EL MICHI", lines: ["como AGENTE MANDARIN", "Realizando un operativo", "sin sospechar absolutamente nada."] },
  { title: "LA MICHI", lines: ["como AGENTE MINERVA", "Programando durante dos semanas", "para su Michi."] },
  { title: "MENSAJE CIFRADO", lines: ["Espero que te guste el regalo"] },
  { title: "MENSAJE CIFRADO", lines: ["Y espero que juguemos juntos, jiji"] },
  { title: "DETALLE", lines: ["Me alegra habernos reencontrado", "para esta mision"] },
  { title: "PROMESA", lines: ["Seguimos sumando", "recuerdos juntos."] },
  { title: "CITA", lines: ["\"Porque naveguemos juntos todas las aguas,", "", "las buenas y las malas,", "", "y salgamos siempre mas fuertes.\""] },
  { title: "TE QUIERO", lines: ["Con amor,", "tu Michi."] },
];

const INTERLUDE_MEDIA_SEQUENCE: InterludeMedia[] = [
  { type: "image", basename: "running" },
  { type: "video", src: gunnoirVideo },
  { type: "image", basename: "nata" },
  { type: "image", basename: "eli1" },
  { type: "image", basename: "nata1" },
  { type: "image", basename: "eli2" },
  { type: "image", basename: "nata2" },
  { type: "image", basename: "eli3" },
  { type: "image", basename: "couple0" },
];
const PHOTO_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;

export function CreditsSequence({ active }: CreditsSequenceProps) {
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [activeCreditIndex, setActiveCreditIndex] = useState<number | null>(null);
  const [creditVisible, setCreditVisible] = useState(false);
  const [photoVisible, setPhotoVisible] = useState(false);
  const [firstPhotoFadeFromBlack, setFirstPhotoFadeFromBlack] = useState(false);
  const [photoCurrent, setPhotoCurrent] = useState<string | null>(null);
  const [photoPrevious, setPhotoPrevious] = useState<string | null>(null);
  const [photoCurrentDirection, setPhotoCurrentDirection] = useState<PhotoDriftDirection>("right");
  const [photoPreviousDirection, setPhotoPreviousDirection] = useState<PhotoDriftDirection>("left");
  const [fullscreenVideoSrc, setFullscreenVideoSrc] = useState<string | null>(null);
  const [fullscreenVideoVisible, setFullscreenVideoVisible] = useState(false);
  const [showFinalCommission, setShowFinalCommission] = useState(false);
  const [showReturn, setShowReturn] = useState(false);

  const timersRef = useRef<number[]>([]);
  const fadeIntervalRef = useRef<number | null>(null);
  const activeVideoResolveRef = useRef<(() => void) | null>(null);

  const resolveActiveVideo = () => {
    const resolve = activeVideoResolveRef.current;
    if (!resolve) return;
    activeVideoResolveRef.current = null;
    resolve();
  };

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

    const playFullscreenVideo = (src: string, fallbackMs = 18000) =>
      new Promise<void>((resolve) => {
        if (cancelled) {
          resolve();
          return;
        }

        const fallbackId = window.setTimeout(() => {
          resolveActiveVideo();
        }, fallbackMs);
        timersRef.current.push(fallbackId);

        activeVideoResolveRef.current = () => {
          if (cancelled) {
            resolve();
            return;
          }

          setFullscreenVideoVisible(false);
          const hideId = window.setTimeout(() => {
            if (!cancelled) {
              setFullscreenVideoSrc(null);
            }
            resolve();
          }, 280);
          timersRef.current.push(hideId);
        };

        setFullscreenVideoSrc(src);
        const showId = window.setTimeout(() => {
          if (!cancelled) {
            setFullscreenVideoVisible(true);
          }
        }, 20);
        timersRef.current.push(showId);
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
      const imageBasenames = INTERLUDE_MEDIA_SEQUENCE.filter((media): media is { type: "image"; basename: string } => media.type === "image").map((media) => media.basename);
      const resolvedPhotoEntries = await Promise.all(imageBasenames.map(async (basename) => [basename, await resolvePhotoSrc(basename)] as const));
      const resolvedPhotoMap = new Map<string, string>(resolvedPhotoEntries);
      if (cancelled) return;

      const CREDIT_VISIBLE_MS = 2280;
      const CITA_VISIBLE_MS = 2850;
      const DEDICATION_VISIBLE_MS = 3040;
      const LONG_TEXT_MULTIPLIER = 1.2;
      const LONG_TEXT_MIN_CHARS = 64;
      const LONG_TEXT_MIN_LINES = 3;
      const CHARACTER_CREDIT_MULTIPLIER = 1.25;
      const PHOTO_CROSSFADE_MS = 1200;
      const PHOTO_HOLD_MS = 1900;
      const PHOTO_FADEOUT_MS = 550;
      const citaBlockIndex = CREDIT_BLOCKS.findIndex((block) => block.title === "CITA");

      setShowLogo(true);
      await wait(2700);
      if (cancelled) return;

      setShowLogo(false);
      // Let logo fade-out finish fully before credits start.
      await wait(2300);
      if (cancelled) return;

      let lastPhoto: string | null = null;
      let lastPhotoDirection: PhotoDriftDirection = "right";

      for (let i = 0; i < CREDIT_BLOCKS.length; i += 1) {
        setActiveCreditIndex(i);
        setCreditVisible(true);
        const block = CREDIT_BLOCKS[i];
        const linesWithContent = block.lines.filter((line) => line.trim().length > 0);
        const textChars = linesWithContent.join(" ").replace(/\s+/g, "").length;
        const isLongTextBlock = linesWithContent.length >= LONG_TEXT_MIN_LINES || textChars >= LONG_TEXT_MIN_CHARS;
        const isDedicationBlock = i === CREDIT_BLOCKS.length - 1;
        const isCitaBlock = i === citaBlockIndex;
        const isCharacterCreditBlock = EXTENDED_CREDIT_TITLES.has(block.title);
        const baseVisibleMs = isDedicationBlock ? DEDICATION_VISIBLE_MS : isCitaBlock ? CITA_VISIBLE_MS : CREDIT_VISIBLE_MS;
        const longTextMultiplier = isLongTextBlock ? LONG_TEXT_MULTIPLIER : 1;
        const characterMultiplier = isCharacterCreditBlock ? CHARACTER_CREDIT_MULTIPLIER : 1;
        const visibleMs = Math.round(baseVisibleMs * longTextMultiplier * characterMultiplier);
        await wait(visibleMs);
        if (cancelled) return;

        if (i === CREDIT_BLOCKS.length - 1) {
          setCreditVisible(false);
          await wait(900);
          if (cancelled) return;
          continue;
        }

        const mediaIndex = Math.min(i, Math.max(0, INTERLUDE_MEDIA_SEQUENCE.length - 1));
        const media = INTERLUDE_MEDIA_SEQUENCE[mediaIndex];

        if (media?.type === "video") {
          setCreditVisible(false);
          await wait(420);
          if (cancelled) return;

          await playFullscreenVideo(media.src, 22000);
          if (cancelled) return;

          await wait(300);
          if (cancelled) return;
          continue;
        }

        const nextPhoto = media?.type === "image" ? (resolvedPhotoMap.get(media.basename) ?? null) : null;
        if (nextPhoto) {
          const isFirstPhoto = mediaIndex === 0;
          const nextDirection: PhotoDriftDirection = mediaIndex % 2 === 0 ? "right" : "left";
          if (isFirstPhoto) {
            setFirstPhotoFadeFromBlack(true);
          }

          setPhotoPreviousDirection(lastPhotoDirection);
          setPhotoCurrentDirection(nextDirection);
          setPhotoPrevious(lastPhoto);
          setPhotoCurrent(nextPhoto);
          setPhotoVisible(true);
          setCreditVisible(false);

          await wait(PHOTO_CROSSFADE_MS);
          if (cancelled) return;
          setPhotoPrevious(null);
          if (isFirstPhoto) {
            setFirstPhotoFadeFromBlack(false);
          }

          await wait(PHOTO_HOLD_MS);
          if (cancelled) return;

          setPhotoVisible(false);
          await wait(PHOTO_FADEOUT_MS);
          if (cancelled) return;

          lastPhoto = nextPhoto;
          lastPhotoDirection = nextDirection;
        } else {
          setCreditVisible(false);
          await wait(900);
          if (cancelled) return;
        }
      }

      setShowFinalCommission(true);
      await wait(3840);
      if (cancelled) return;

      setShowFinalCommission(false);
      await wait(260);
      if (cancelled) return;

      await playFullscreenVideo(besoVideo, 22000);
      if (cancelled) return;

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

      activeVideoResolveRef.current = null;
      setFullscreenVideoVisible(false);
      setFullscreenVideoSrc(null);
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
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[2000ms] will-change-transform ${photoPreviousDirection === "right" ? "[animation:debrief-credit-pan-right_7000ms_ease-out_forwards]" : "[animation:debrief-credit-pan-left_7000ms_ease-out_forwards]"} ${photoVisible ? "opacity-0" : "opacity-[0.85]"}`}
            />
          )}

          {photoCurrent && (
            <img
              src={photoCurrent}
              alt="Creditos"
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[2000ms] will-change-transform ${photoCurrentDirection === "right" ? "[animation:debrief-credit-pan-right_7000ms_ease-out_forwards]" : "[animation:debrief-credit-pan-left_7000ms_ease-out_forwards]"} ${photoVisible ? "opacity-[0.85]" : "opacity-0"}`}
            />
          )}

          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_52%,rgba(0,0,0,0.26)_100%)]" />
          <div className={`absolute inset-0 bg-black transition-opacity duration-[1700ms] ease-out ${firstPhotoFadeFromBlack ? "opacity-100" : "opacity-0"}`} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.54)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-[34vh] bg-[linear-gradient(to_top,rgba(0,0,0,0.6),transparent)]" />
        </div>
      )}

      {fullscreenVideoSrc && (
        <div className={`absolute inset-0 z-[35] bg-black transition-opacity duration-500 ${fullscreenVideoVisible ? "opacity-100" : "opacity-0"}`}>
          <video
            key={fullscreenVideoSrc}
            src={fullscreenVideoSrc}
            autoPlay
            playsInline
            preload="auto"
            onEnded={resolveActiveVideo}
            onError={resolveActiveVideo}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="absolute inset-0 flex items-center justify-center px-6">
        <div className="text-center">
          <div className={`mx-auto w-[220px] md:w-[280px] transition-opacity duration-[2000ms] ease-out ${showLogo ? "opacity-95" : "opacity-0"}`}>
            <img
              src={altaLogo}
              alt="Alta Mesa"
              className={`w-full bg-transparent drop-shadow-[0_0_24px_rgba(214,173,74,0.35)] ${showLogo ? "animate-flicker" : ""}`}
            />
          </div>

          {activeCreditIndex !== null && (
            <div className={`mt-16 transition-opacity duration-[900ms] ${creditVisible ? "opacity-100" : "opacity-0"}`}>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.42em] text-gold-dim/85 [text-shadow:0_0_8px_rgba(214,173,74,0.12)] md:text-[13px]">
                {CREDIT_BLOCKS[activeCreditIndex].title}
              </h3>
              <div className="mt-5 space-y-2 md:space-y-3">
                {CREDIT_BLOCKS[activeCreditIndex].lines.map((line, lineIndex) => {
                  const isDelayedDetailLine = DELAYED_DETAIL_LINES.has(line);
                  const delayedOrder = isDelayedDetailLine ? lineIndex % 2 : 0;

                  return (
                    <p
                      key={`${CREDIT_BLOCKS[activeCreditIndex].title}-${line}`}
                      className={`font-display ${isDelayedDetailLine ? "text-lg text-white/92 md:text-2xl [text-shadow:0_0_8px_rgba(255,255,255,0.12)] [animation:debrief-credit-line-delayed_650ms_ease-out_both]" : "text-2xl text-gold-bright [text-shadow:0_0_10px_rgba(214,173,74,0.16)] md:text-3xl"}`}
                      style={isDelayedDetailLine ? { animationDelay: `${360 + delayedOrder * 180}ms` } : undefined}
                    >
                      {line}
                    </p>
                  );
                })}
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
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(214,173,74,0.22)_0%,rgba(214,173,74,0.08)_30%,transparent_66%)] [animation:debrief-return-haze_1200ms_ease-out_both]" />
          <div className="pointer-events-none absolute flex h-[280px] w-[280px] items-center justify-center [animation:debrief-return-haze_1050ms_ease-out_both]">
            <div className="absolute h-[230px] w-[230px] rounded-full bg-gold/10 blur-2xl" />
            <img
              src={altaLogo}
              alt=""
              aria-hidden="true"
              className="relative h-[180px] w-[180px] select-none object-contain opacity-[0.2] drop-shadow-[0_0_20px_rgba(214,173,74,0.28)] animate-flicker"
            />
            <div className="absolute h-[180px] w-[180px] rounded-full border border-gold/20 blur-[1px]" />
          </div>
          <div className="relative flex flex-col items-center gap-4 [animation:debrief-return-hero_900ms_cubic-bezier(0.2,0.9,0.2,1)_both]">
            <Link
              to="/"
              onClick={() => stopControlledAudio("debrief-credits")}
              className="inline-flex items-center justify-center rounded-sm border border-gold bg-[linear-gradient(135deg,oklch(0.2_0.01_60_/_0.9),oklch(0.16_0.008_60_/_0.95))] px-10 py-4 font-mono text-sm uppercase tracking-[0.3em] text-gold-bright shadow-[0_0_28px_rgba(214,173,74,0.28),0_0_0_1px_rgba(214,173,74,0.22)_inset] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_36px_rgba(214,173,74,0.4),0_0_0_1px_rgba(214,173,74,0.3)_inset] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 animate-pulse-gold"
            >
              VOLVER A LA COMISION
            </Link>
            <p className="font-display text-xl text-gold-bright [text-shadow:0_0_14px_rgba(214,173,74,0.25)] md:text-2xl">
              Enhorabuena, agentes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
