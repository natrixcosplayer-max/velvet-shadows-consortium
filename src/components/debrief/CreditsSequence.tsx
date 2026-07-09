import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import altaLogo from "../../assets/alta.png";
import besoVideo from "../../assets/birthday/beso.mp4";
import conductoresVideo from "../../assets/birthday/conductores.mp4";
import gunnoirVideo from "../../assets/birthday/gunnoir.mp4";
import nataphoneVideo from "../../assets/birthday/nataphone.mp4";
import perroVideo from "../../assets/birthday/perro.mp4";
import { playSfx, setControlledAudioVolume, stopControlledAudio } from "../../audio/audiomanager";

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
const DELAYED_DETAIL_SEQUENCE_ORDER: Record<string, number> = {
  "Realizando un operativo": 0,
  "sin sospechar absolutamente nada.": 1,
  "Programando durante dos semanas": 0,
  "para su Michi.": 1,
};
const DELAYED_DETAIL_STEP_MS = 1400;
const DELAYED_DETAIL_BASE_MS = 1400;
const DELAYED_DETAIL_POST_REVEAL_HOLD_MS = 2000;

const CREDIT_BLOCKS: CreditBlock[] = [
  { title: "ALTA MESA", lines: ["presenta"] },
  { title: "OPERACION", lines: ["CUMPLE"] },
  { title: "EL MICHI", lines: ["como AGENTE MANDARIN", "Realizando un operativo", "sin sospechar absolutamente nada."] },
  { title: "LA MICHI", lines: ["como AGENTE MINERVA", "Programando durante dos semanas", "para su Michi."] },
  { title: "MENSAJE CIFRADO", lines: ["Espero que te guste el regalo"] },
  { title: "MENSAJE CIFRADO", lines: ["Y espero que juguemos juntos, jiji"] },
  { title: "DETALLE", lines: ["Me alegra habernos reencontrado", "para esta mision"] },
  { title: "PROMESA", lines: ["Seguiremos sumando", "recuerdos juntos."] },
  { title: "CITA", lines: ["\"Porque naveguemos juntos todas las aguas,", "", "las buenas y las malas,", "", "y salgamos siempre mas fuertes.\""] },
  { title: "TE QUIERO", lines: ["Con amor,", "tu Michi."] },
];

const INTERLUDE_MEDIA_SEQUENCE: InterludeMedia[] = [
  { type: "video", src: conductoresVideo },
  { type: "video", src: gunnoirVideo },
  { type: "video", src: nataphoneVideo },
  { type: "video", src: perroVideo },
  { type: "image", basename: "nata1" },
  { type: "image", basename: "eli2" },
  { type: "image", basename: "nata2" },
  { type: "image", basename: "eli3" },
  { type: "image", basename: "couple0" },
];
const PHOTO_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;
const RETURN_CLOSING_LINES = ["CERRANDO CANAL SEGURO...", "ARCHIVANDO EXPEDIENTE...", "VOLVIENDO A LA COMISION..."] as const;
const RETURN_PARTICLES = [
  { left: "14%", top: "28%", delay: "0s", duration: "12.4s" },
  { left: "24%", top: "62%", delay: "1.8s", duration: "14.3s" },
  { left: "36%", top: "44%", delay: "0.9s", duration: "13.7s" },
  { left: "63%", top: "31%", delay: "2.7s", duration: "15.2s" },
  { left: "74%", top: "59%", delay: "1.2s", duration: "12.8s" },
  { left: "86%", top: "38%", delay: "3.1s", duration: "14.6s" },
] as const;

export function CreditsSequence({ active }: CreditsSequenceProps) {
  const navigate = useNavigate();
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
  const [showReturn, setShowReturn] = useState(false);
  const [returnSealVisible, setReturnSealVisible] = useState(false);
  const [returnOperationVisible, setReturnOperationVisible] = useState(false);
  const [returnCongratsVisible, setReturnCongratsVisible] = useState(false);
  const [returnChannelVisible, setReturnChannelVisible] = useState(false);
  const [returnButtonVisible, setReturnButtonVisible] = useState(false);
  const [returnClosing, setReturnClosing] = useState(false);
  const [returnClosingStep, setReturnClosingStep] = useState(0);

  const timersRef = useRef<number[]>([]);
  const fadeIntervalRef = useRef<number | null>(null);
  const activeVideoResolveRef = useRef<(() => void) | null>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement | null>(null);
  const preloadedVideoSrcRef = useRef<Record<string, string>>({});
  const preloadedVideoObjectUrlsRef = useRef<string[]>([]);
  const preFadeTriggeredRef = useRef(false);
  const returnSequenceTimersRef = useRef<number[]>([]);

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

    const resolvePlayableVideoSrc = async (src: string) => {
      const cached = preloadedVideoSrcRef.current[src];
      if (cached) return cached;

      try {
        const response = await fetch(src, { cache: src === besoVideo ? "no-store" : "force-cache" });
        if (!response.ok) return src;

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        preloadedVideoSrcRef.current[src] = objectUrl;
        preloadedVideoObjectUrlsRef.current.push(objectUrl);
        return objectUrl;
      } catch {
        return src;
      }
    };

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
      // Warm up videos early to minimize buffering pauses in the credits sequence.
      void Promise.all([resolvePlayableVideoSrc(conductoresVideo), resolvePlayableVideoSrc(gunnoirVideo), resolvePlayableVideoSrc(nataphoneVideo), resolvePlayableVideoSrc(perroVideo), resolvePlayableVideoSrc(besoVideo)]);

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
      const delayedDetailLastRevealMs = DELAYED_DETAIL_BASE_MS + DELAYED_DETAIL_STEP_MS;

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
        const animatedVisibleMs = Math.round(baseVisibleMs * longTextMultiplier * characterMultiplier);
        const minHoldForDelayedDetails = isCharacterCreditBlock
          ? delayedDetailLastRevealMs + DELAYED_DETAIL_POST_REVEAL_HOLD_MS
          : 0;
        const visibleMs = Math.max(animatedVisibleMs, minHoldForDelayedDetails);
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

          const playableSrc = await resolvePlayableVideoSrc(media.src);
          if (cancelled) return;

          await playFullscreenVideo(playableSrc, 30000);
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

      await wait(320);
      if (cancelled) return;

      const besoPlayableSrc = await resolvePlayableVideoSrc(besoVideo);
      if (cancelled) return;

      await playFullscreenVideo(besoPlayableSrc, 30000);
      if (cancelled) return;

      await wait(220);
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

      preloadedVideoObjectUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      preloadedVideoObjectUrlsRef.current = [];
      preloadedVideoSrcRef.current = {};

      activeVideoResolveRef.current = null;
      setFullscreenVideoVisible(false);
      setFullscreenVideoSrc(null);
    };
  }, [active]);

  useEffect(() => {
    if (!fullscreenVideoSrc) return;

    const video = fullscreenVideoRef.current;
    if (!video) return;

    let cancelled = false;

    const startPlayback = async () => {
      try {
        preFadeTriggeredRef.current = false;
        video.muted = true;
        video.defaultMuted = true;
        await video.play();
      } catch {
        if (!cancelled) {
          resolveActiveVideo();
        }
      }
    };

    void startPlayback();

    return () => {
      cancelled = true;
    };
  }, [fullscreenVideoSrc]);

  useEffect(() => {
    returnSequenceTimersRef.current.forEach((id) => window.clearTimeout(id));
    returnSequenceTimersRef.current = [];

    setReturnSealVisible(false);
    setReturnOperationVisible(false);
    setReturnCongratsVisible(false);
    setReturnChannelVisible(false);
    setReturnButtonVisible(false);
    setReturnClosing(false);
    setReturnClosingStep(0);

    if (!showReturn) return;

    const addTimer = (ms: number, fn: () => void) => {
      const id = window.setTimeout(fn, ms);
      returnSequenceTimersRef.current.push(id);
    };

    // Keep a cinematic black hold before the final seal appears.
    addTimer(800, () => {
      setReturnSealVisible(true);
      playSfx("/sounds/coin.mp3", 0.14);
    });

    addTimer(2300, () => setReturnOperationVisible(true));
    addTimer(3150, () => setReturnCongratsVisible(true));
    addTimer(3850, () => setReturnChannelVisible(true));

    // Button appears ~5s after the seal reveal (800ms + 5000ms).
    addTimer(5800, () => setReturnButtonVisible(true));

    return () => {
      returnSequenceTimersRef.current.forEach((id) => window.clearTimeout(id));
      returnSequenceTimersRef.current = [];
    };
  }, [showReturn]);

  const handleReturnToCommission = () => {
    if (returnClosing) return;

    setReturnClosing(true);
    setReturnClosingStep(0);

    const step1 = window.setTimeout(() => setReturnClosingStep(1), 270);
    const step2 = window.setTimeout(() => setReturnClosingStep(2), 530);
    const finish = window.setTimeout(() => {
      stopControlledAudio("debrief-credits");
      navigate({ to: "/" });
    }, 800);

    returnSequenceTimersRef.current.push(step1, step2, finish);
  };

  if (!active) return null;

  const handleFullscreenVideoTimeUpdate = () => {
    const video = fullscreenVideoRef.current;
    if (!video || preFadeTriggeredRef.current) return;

    const { duration, currentTime } = video;
    if (!Number.isFinite(duration) || duration <= 0) return;

    if (duration - currentTime <= 0.42) {
      preFadeTriggeredRef.current = true;
      setFullscreenVideoVisible(false);
    }
  };

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
            ref={fullscreenVideoRef}
            key={fullscreenVideoSrc}
            src={fullscreenVideoSrc}
            autoPlay
            muted
            playsInline
            preload="auto"
            onTimeUpdate={handleFullscreenVideoTimeUpdate}
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
                  const delayedOrder = isDelayedDetailLine ? (DELAYED_DETAIL_SEQUENCE_ORDER[line] ?? 0) : 0;

                  return (
                    <p
                      key={`${CREDIT_BLOCKS[activeCreditIndex].title}-${line}`}
                      className={`font-display ${isDelayedDetailLine ? "text-lg text-white/92 md:text-2xl [text-shadow:0_0_8px_rgba(255,255,255,0.12)] [animation:debrief-credit-line-delayed_650ms_ease-out_both]" : "text-2xl text-gold-bright [text-shadow:0_0_10px_rgba(214,173,74,0.16)] md:text-3xl"}`}
                      style={isDelayedDetailLine ? { animationDelay: `${DELAYED_DETAIL_BASE_MS + delayedOrder * DELAYED_DETAIL_STEP_MS}ms` } : undefined}
                    >
                      {line}
                    </p>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {showReturn && (
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className={`pointer-events-none absolute inset-0 bg-black transition-opacity duration-700 ${returnClosing ? "opacity-45" : "opacity-0"}`} />
          <div className="pointer-events-none absolute inset-0 opacity-[0.045] [background-image:linear-gradient(rgba(214,173,74,0.32)_1px,transparent_1px),linear-gradient(90deg,rgba(214,173,74,0.32)_1px,transparent_1px)] [background-size:34px_34px]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(214,173,74,0.22)_0%,rgba(214,173,74,0.08)_30%,transparent_66%)] [animation:debrief-return-haze_1200ms_ease-out_both]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(0,0,0,0.62)_100%)]" />

          {RETURN_PARTICLES.map((particle) => (
            <span
              key={`${particle.left}-${particle.top}-${particle.delay}`}
              className={`pointer-events-none absolute h-[2px] w-[2px] rounded-full bg-gold/35 shadow-[0_0_8px_rgba(214,173,74,0.25)] transition-opacity duration-700 ${returnSealVisible ? "opacity-100" : "opacity-0"}`}
              style={{
                left: particle.left,
                top: particle.top,
                animation: `debrief-final-dust ${particle.duration} ease-in-out ${particle.delay} infinite`,
              }}
            />
          ))}

          <div className={`pointer-events-none absolute flex h-[420px] w-[420px] items-center justify-center [animation:debrief-return-haze_1050ms_ease-out_both] transition-opacity duration-[2000ms] ${returnSealVisible ? "opacity-100" : "opacity-0"}`}>
            <div className="absolute h-[320px] w-[320px] rounded-full bg-gold/10 blur-2xl" />
            <img
              src={altaLogo}
              alt=""
              aria-hidden="true"
              className="relative h-[270px] w-[270px] select-none object-contain opacity-[0.2] brightness-50 drop-shadow-[0_0_20px_rgba(214,173,74,0.28)] [animation:debrief-final-seal-breathe_8.5s_ease-in-out_infinite]"
            />
            <div className="absolute h-[270px] w-[270px] rounded-full border border-gold/20 blur-[1px]" />
          </div>

          <div className="relative flex flex-col items-center text-center">
            <div className={`transition-opacity duration-900 ${returnOperationVisible ? "opacity-100" : "opacity-0"}`}>
              <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-gold-dim md:text-[12px]">OPERACION CUMPLE</p>
              <p className="mt-2 font-display text-3xl text-gold-bright [text-shadow:0_0_14px_rgba(214,173,74,0.24)] md:text-4xl">COMPLETADA</p>
            </div>

            <div className={`mt-7 transition-opacity duration-900 ${returnCongratsVisible ? "opacity-100" : "opacity-0"}`}>
              <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-gold-dim">ENHORABUENA,</p>
              <p className="mt-2 font-display text-xl text-gold-bright [text-shadow:0_0_12px_rgba(214,173,74,0.23)] md:text-2xl">AGENTES MANDARIN Y MINERVA</p>

              <div className="mt-6 flex items-start justify-center gap-[15px]">
                <div
                  className={`group animate-flicker [animation-duration:5.8s] transition-all duration-[800ms] ${returnCongratsVisible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
                  style={{ transitionDelay: "0ms" }}
                >
                  <img
                    src="/images/credits/eli.png"
                    alt="Retrato oficial Mandarin"
                    className="block h-[108px] w-auto border border-gold/60 bg-black/18 object-contain shadow-[0_0_12px_rgba(214,173,74,0.2)] [animation:debrief-portrait-breathe_9.5s_ease-in-out_infinite] md:h-[136px]"
                  />
                  <p className="mt-3 text-center font-mono text-[9px] uppercase tracking-[0.28em] text-gold-dim">MANDARIN</p>
                  <p className="mt-1 text-center font-mono text-[9px] uppercase tracking-[0.28em] text-gold-dim/85">AURUM VII</p>
                </div>

                <div
                  className={`group animate-flicker [animation-duration:6.2s] transition-all duration-[800ms] ${returnCongratsVisible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
                  style={{ transitionDelay: "200ms" }}
                >
                  <img
                    src="/images/credits/nata.png"
                    alt="Retrato oficial Minerva"
                    className="block h-[108px] w-auto -scale-x-100 border border-gold/60 bg-black/18 object-contain shadow-[0_0_12px_rgba(214,173,74,0.2)] [animation:debrief-portrait-breathe_10.2s_ease-in-out_infinite] md:h-[136px]"
                  />
                  <p className="mt-3 text-center font-mono text-[9px] uppercase tracking-[0.28em] text-gold-dim">MINERVA</p>
                  <p className="mt-1 text-center font-mono text-[9px] uppercase tracking-[0.28em] text-gold-dim/85">IMPERIUM</p>
                </div>
              </div>
            </div>

            <div className={`mt-4 space-y-1 transition-opacity duration-900 ${returnChannelVisible ? "opacity-100" : "opacity-0"}`}>
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-gold-dim">CANAL</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-gold-dim">CERRADO</p>
            </div>

            <button
              type="button"
              onClick={handleReturnToCommission}
              className={`mt-8 inline-flex items-center justify-center rounded-sm border border-gold bg-[linear-gradient(135deg,oklch(0.2_0.01_60_/_0.9),oklch(0.16_0.008_60_/_0.95))] px-10 py-4 font-mono text-sm uppercase tracking-[0.3em] text-gold-bright shadow-[0_0_24px_rgba(214,173,74,0.2),0_0_0_1px_rgba(214,173,74,0.2)_inset] transition-opacity duration-700 hover:shadow-[0_0_34px_rgba(214,173,74,0.36),0_0_0_1px_rgba(214,173,74,0.3)_inset] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 ${returnButtonVisible && !returnClosing ? "opacity-100" : "pointer-events-none opacity-0"}`}
            >
              VOLVER A LA COMISION
            </button>

            <div className={`mt-6 min-h-[22px] transition-opacity duration-300 ${returnClosing ? "opacity-100" : "opacity-0"}`}>
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-gold-dim">{RETURN_CLOSING_LINES[returnClosingStep]}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
