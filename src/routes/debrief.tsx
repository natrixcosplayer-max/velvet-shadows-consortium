import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell, Panel } from "../components/AppShell";
import {
  fadeMusicVolume,
  playControlledAudio,
  playMusic,
  playSfx,
  stopControlledAudio,
  stopMusic,
} from "../audio/audiomanager";

export const Route = createFileRoute("/debrief")({
  head: () => ({
    meta: [
      { title: "Informe Final — Continental" },
      { name: "description", content: "Pantalla final cinematografica de la Alta Mesa." },
    ],
  }),
  component: Debrief,
});

const MESSAGES = [
  "Verificando identidad...",
  "Comprobando autorizacion...",
  "Escaneando canal...",
  "Negociando cifrado...",
  "Activando enlace Continental...",
];

const AUTH_LINES = ["IDENTIDAD", "OPERATIVO", "CIFRADO", "CANAL"];

const CLOSING_LINES = [
  "CANAL SEGURO CERRADO ✔",
  "EXPEDIENTE ARCHIVADO ✔",
  "ACTIVO RECUPERADO ✔",
  "MISION COMPLETADA ✔",
];

const CREDIT_SEQUENCE: Array<{ type: "text" | "image"; title?: string; body?: string; src?: string }> = [
  { type: "text", title: "ELENCO", body: "Los Michis" },
  { type: "image", src: "/images/credits/01.jpg" },
  { type: "text", title: "PRODUCCION", body: "Hecho con mucho carino para un agente muy especial." },
  { type: "image", src: "/images/credits/02.jpg" },
  { type: "text", title: "DEDICATORIA", body: "Que nunca nos falten las risas, las aventuras y los nuevos horizontes por descubrir." },
  { type: "image", src: "/images/credits/03.jpg" },
  { type: "text", title: "CIERRE", body: "Hasta la proxima mision, Agente Mandarin." },
  { type: "text", title: "EX COMMISSIONE", body: "ALTA MESA" },
];

const CREDITS_DURATION_MS = 56000;
const FINAL_BEEP = "/sounds/shortbeep.mp3";

const SFX = {
  incomingCall: "/sounds/debrief/incoming_call.mp3",
  interference: "/sounds/debrief/interference.mp3",
  accept: "/sounds/debrief/accept_communication.mp3",
  authenticate: "/sounds/debrief/authenticate.mp3",
  secureLink: "/sounds/debrief/secure_link.mp3",
  glitch: "/sounds/debrief/glitch.mp3",
  ambience: "/sounds/debrief/ambience.mp3",
  archive: "/sounds/debrief/archive.mp3",
  commission: "/sounds/debrief/comission.mp3",
} as const;

type Phase =
  | "starting"
  | "priority"
  | "waiting"
  | "auth"
  | "link"
  | "video"
  | "finished";

function Debrief() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoTeardownRef = useRef<number | null>(null);
  const callPulseClearRef = useRef<number | null>(null);
  const ringIntervalRef = useRef<number | null>(null);
  const [phase, setPhase] = useState<Phase>("starting");
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  const [globalGlitch, setGlobalGlitch] = useState(false);
  const [waitingVisible, setWaitingVisible] = useState(false);
  const [callPulse, setCallPulse] = useState(false);
  const [callSignalBoost, setCallSignalBoost] = useState(false);
  const [preCallSignalLoss, setPreCallSignalLoss] = useState(false);
  const [acceptFreeze, setAcceptFreeze] = useState(false);
  const [callCountdown, setCallCountdown] = useState(20);
  const [waitingFlicker, setWaitingFlicker] = useState(false);

  const [authStep, setAuthStep] = useState(-1);
  const [authFlashIndex, setAuthFlashIndex] = useState<number | null>(null);
  const [linkProgress, setLinkProgress] = useState(0);
  const [linkStable, setLinkStable] = useState(false);
  const [stableFlash, setStableFlash] = useState(false);

  const [showVideoLayer, setShowVideoLayer] = useState(false);
  const [videoFade, setVideoFade] = useState(false);
  const [videoMicroGlitch, setVideoMicroGlitch] = useState(false);
  const [videoFlicker, setVideoFlicker] = useState(false);
  const [videoExposureKick, setVideoExposureKick] = useState(0);
  const [videoBootNoise, setVideoBootNoise] = useState(true);
  const [videoSignalLoss, setVideoSignalLoss] = useState(false);
  const [videoEndingCut, setVideoEndingCut] = useState(false);
  const [hudDate, setHudDate] = useState("");
  const [hudTime, setHudTime] = useState("");

  const [showTransmissionDone, setShowTransmissionDone] = useState(false);
  const [typedClosingLines, setTypedClosingLines] = useState<string[]>(Array(CLOSING_LINES.length).fill(""));
  const [activeClosingLine, setActiveClosingLine] = useState<number | null>(null);
  const [showPermanentRecord, setShowPermanentRecord] = useState(false);
  const [closingTime, setClosingTime] = useState("");
  const [showCommissionMark, setShowCommissionMark] = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  const [showCloseButton, setShowCloseButton] = useState(false);
  const [showCreditsFade, setShowCreditsFade] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [showFinalSlate, setShowFinalSlate] = useState(false);

  const clearCallPulse = () => {
    if (callPulseClearRef.current) {
      window.clearTimeout(callPulseClearRef.current);
      callPulseClearRef.current = null;
    }
    setCallPulse(false);
  };

  const triggerIncomingPulse = () => {
    playControlledAudio("debrief-call", SFX.incomingCall, 0.24, false);
    setCallPulse(true);
    setCallSignalBoost(true);
    if (callPulseClearRef.current) {
      window.clearTimeout(callPulseClearRef.current);
    }
    callPulseClearRef.current = window.setTimeout(() => {
      setCallPulse(false);
      setCallSignalBoost(false);
    }, 360);
  };

  const tickHudClock = () => {
    const now = new Date();
    const dateText = new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
      .format(now)
      .replace(".", "")
      .toUpperCase();

    const timeText = new Intl.DateTimeFormat("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZoneName: "short",
    })
      .format(now)
      .toUpperCase();

    setHudDate(dateText);
    setHudTime(timeText);
  };

  const handleVideoEnded = () => {
    const video = videoRef.current;

    if (video) {
      video.pause();
      video.controls = false;
      video.currentTime = 0;
    }

    stopControlledAudio("debrief-ambience");
    setVideoEndingCut(true);

    if (videoTeardownRef.current) {
      window.clearTimeout(videoTeardownRef.current);
    }

    videoTeardownRef.current = window.setTimeout(() => {
      playSfx(SFX.glitch, 0.16);
      setVideoSignalLoss(true);
      setVideoMicroGlitch(true);
      setVideoBootNoise(true);
      setVideoFlicker(true);

      window.setTimeout(() => {
        setVideoMicroGlitch(false);
      }, 90);

      window.setTimeout(() => {
        setVideoFade(true);
      }, 140);

      window.setTimeout(() => {
        playSfx(SFX.archive, 0.2);
        setShowVideoLayer(false);

        if (videoRef.current) {
          videoRef.current.removeAttribute("src");
          videoRef.current.load();
        }

        setVideoSignalLoss(false);
        setVideoEndingCut(false);
        setPhase("finished");
      }, 280);
    }, 400);
  };

  useEffect(() => {
    if (phase !== "starting") return;

    let progressValue = 0;
    let messageValue = 0;
    playSfx("/sounds/beep.mp3", 0.22);

    const interval = window.setInterval(() => {
      messageValue = Math.min(messageValue + 1, MESSAGES.length - 1);
      progressValue = Math.min(100, progressValue + 8);
      setMessageIndex(messageValue);
      setProgress(progressValue);

      if (progressValue >= 100) {
        window.clearInterval(interval);

        window.setTimeout(() => {
          fadeMusicVolume(0.024, 900);
          playSfx(SFX.interference, 0.22);
          setGlobalGlitch(true);

          window.setTimeout(() => {
            setGlobalGlitch(false);
            setPhase("priority");
          }, 130);
        }, 700);
      }
    }, 320);

    return () => {
      window.clearInterval(interval);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "priority") return;

    setWaitingVisible(false);
    const reveal = window.setTimeout(() => setWaitingVisible(true), 80);
    const toWaiting = window.setTimeout(() => setPhase("waiting"), 980);

    return () => {
      window.clearTimeout(reveal);
      window.clearTimeout(toWaiting);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "waiting") return;

    tickHudClock();
    setCallCountdown(20);
    setPreCallSignalLoss(false);

    const initialSilenceTimer = window.setTimeout(() => {
      setPreCallSignalLoss(true);

      window.setTimeout(() => {
        playSfx(SFX.interference, 0.16);
        triggerIncomingPulse();
        setPreCallSignalLoss(false);
      }, 100);
    }, 400);

    const ringStartTimer = window.setTimeout(() => {
      ringIntervalRef.current = window.setInterval(() => {
        triggerIncomingPulse();
      }, 3600);
    }, 1200);

    const countInterval = window.setInterval(() => {
      setCallCountdown((prev) => {
        if (prev <= 1) {
          triggerIncomingPulse();
          return 20;
        }
        return prev - 1;
      });
    }, 1000);

    const clockId = window.setInterval(() => {
      tickHudClock();
    }, 1000);

    let flickerTimer: number | null = null;
    let flickerClear: number | null = null;

    const scheduleFlicker = () => {
      const delay = 12000 + Math.floor(Math.random() * 8000);
      flickerTimer = window.setTimeout(() => {
        setWaitingFlicker(true);
        flickerClear = window.setTimeout(() => {
          setWaitingFlicker(false);
          scheduleFlicker();
        }, 85);
      }, delay);
    };

    scheduleFlicker();

    return () => {
      if (ringIntervalRef.current) {
        window.clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
      window.clearTimeout(initialSilenceTimer);
      window.clearTimeout(ringStartTimer);
      window.clearInterval(countInterval);
      window.clearInterval(clockId);
      if (flickerTimer) window.clearTimeout(flickerTimer);
      if (flickerClear) window.clearTimeout(flickerClear);
      stopControlledAudio("debrief-call");
      clearCallPulse();
      setWaitingFlicker(false);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "auth") return;

    setAuthStep(-1);
    playSfx(SFX.authenticate, 0.22);

    let idx = -1;
    const intro = window.setTimeout(() => {
      const interval = window.setInterval(() => {
        idx += 1;
        setAuthStep(idx);
        setAuthFlashIndex(idx);

        window.setTimeout(() => {
          setAuthFlashIndex((prev) => (prev === idx ? null : prev));
        }, 100);

        if (idx >= AUTH_LINES.length - 1) {
          window.clearInterval(interval);
          window.setTimeout(() => {
            setPhase("link");
          }, 340);
        }
      }, 290);
    }, 60);

    return () => {
      window.clearTimeout(intro);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "link") return;

    setLinkProgress(0);
    setLinkStable(false);
    playSfx(SFX.secureLink, 0.24);

    let value = 0;
    const interval = window.setInterval(() => {
      value = Math.min(100, value + 6);
      setLinkProgress(value);

      if (value >= 100) {
        window.clearInterval(interval);
        setLinkStable(true);
        setStableFlash(true);

        window.setTimeout(() => {
          setStableFlash(false);
        }, 100);

        window.setTimeout(() => {
          setPhase("video");
        }, 560);
      }
    }, 85);

    return () => {
      window.clearInterval(interval);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "video") return;

    setShowVideoLayer(true);
    setVideoFade(false);
    setVideoBootNoise(true);
    tickHudClock();
    playControlledAudio("debrief-ambience", SFX.ambience, 0.08, true);
  }, [phase]);

  useEffect(() => {
    if (phase !== "video" || !showVideoLayer) return;

    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    video.muted = false;
    video.volume = 1;
    video.controls = false;

    const bootNoiseTimer = window.setTimeout(() => {
      setVideoBootNoise(false);
    }, 500);

    const startPlayback = window.setTimeout(() => {
      video.play().catch(() => {});
    }, 140);

    return () => {
      window.clearTimeout(bootNoiseTimer);
      window.clearTimeout(startPlayback);
    };
  }, [phase, showVideoLayer]);

  useEffect(() => {
    if (phase !== "video") return;

    const clockId = window.setInterval(() => {
      const shouldLagHud = Math.random() < 0.34;
      if (!shouldLagHud) {
        tickHudClock();
        return;
      }

      window.setTimeout(() => {
        tickHudClock();
      }, 50);
    }, 1000);

    let flickerTimer: number | null = null;
    let flickerClear: number | null = null;

    const scheduleFlicker = () => {
      const delay = 12000 + Math.floor(Math.random() * 8000);
      flickerTimer = window.setTimeout(() => {
        setVideoFlicker(true);
        flickerClear = window.setTimeout(() => {
          setVideoFlicker(false);
          scheduleFlicker();
        }, 80);
      }, delay);
    };

    scheduleFlicker();

    let glitchTimer: number | null = null;
    let glitchClear: number | null = null;

    const scheduleGlitch = () => {
      const delay = 20000 + Math.floor(Math.random() * 10000);
      glitchTimer = window.setTimeout(() => {
        playSfx(SFX.glitch, 0.16);
        setVideoMicroGlitch(true);
        glitchClear = window.setTimeout(() => {
          setVideoMicroGlitch(false);
          scheduleGlitch();
        }, 80);
      }, delay);
    };

    scheduleGlitch();

    let exposureTimer: number | null = null;
    let exposureClear: number | null = null;

    const scheduleExposureKick = () => {
      const delay = 14000 + Math.floor(Math.random() * 12000);
      exposureTimer = window.setTimeout(() => {
        const delta = Math.random() > 0.5 ? 0.02 : -0.02;
        setVideoExposureKick(delta);
        exposureClear = window.setTimeout(() => {
          setVideoExposureKick(0);
          scheduleExposureKick();
        }, 120);
      }, delay);
    };

    scheduleExposureKick();

    return () => {
      window.clearInterval(clockId);
      if (flickerTimer) window.clearTimeout(flickerTimer);
      if (flickerClear) window.clearTimeout(flickerClear);
      if (glitchTimer) window.clearTimeout(glitchTimer);
      if (glitchClear) window.clearTimeout(glitchClear);
      if (exposureTimer) window.clearTimeout(exposureTimer);
      if (exposureClear) window.clearTimeout(exposureClear);
      setVideoMicroGlitch(false);
      setVideoFlicker(false);
      setVideoExposureKick(0);
    };
  }, [phase]);

  useEffect(() => {
    return () => {
      stopControlledAudio("debrief-call");
      stopControlledAudio("debrief-ambience");
      clearCallPulse();

      if (videoTeardownRef.current) {
        window.clearTimeout(videoTeardownRef.current);
      }
    };
  }, []);

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
      setVideoEndingCut(false);
      setVideoSignalLoss(false);
      setShowTransmissionDone(false);
      setTypedClosingLines(Array(CLOSING_LINES.length).fill(""));
      setShowPermanentRecord(false);
      setShowCommissionMark(false);
      setShowThanks(false);
      setShowCloseButton(false);
      setShowCreditsFade(false);
      setShowCredits(false);
      setShowFinalSlate(false);

      await wait(500);
      if (cancelled) return;

      setVideoFade(true);
      playSfx(FINAL_BEEP, 0.24);

      await wait(600);
      if (cancelled) return;

      setShowTransmissionDone(true);

      await wait(420);
      if (cancelled) return;

      for (let lineIndex = 0; lineIndex < CLOSING_LINES.length; lineIndex += 1) {
        await typeLine(lineIndex, CLOSING_LINES[lineIndex]);
        if (cancelled) return;

        if (lineIndex === 1 || lineIndex === 3) {
          playSfx(FINAL_BEEP, 0.2);
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
      playSfx(FINAL_BEEP, 0.2);

      await wait(1000);
      if (cancelled) return;

      setShowCommissionMark(true);
      playSfx(SFX.commission, 0.12);

      await wait(2000);
      if (cancelled) return;

      setShowThanks(true);

      await wait(1300);
      if (cancelled) return;

      await wait(1000);
      if (cancelled) return;

      setShowCreditsFade(true);

      await wait(1500);
      if (cancelled) return;

      setShowCredits(true);
    };

    runClosingSequence();

    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [phase]);

  useEffect(() => {
    if (!showCredits) return;

    playMusic("/sounds/john.mp3", 0.04, true, 0);

    const hideCredits = window.setTimeout(() => {
      setShowCredits(false);
    }, CREDITS_DURATION_MS);

    const showSlate = window.setTimeout(() => {
      setShowFinalSlate(true);
    }, CREDITS_DURATION_MS + 2000);

    const showButton = window.setTimeout(() => {
      setShowCloseButton(true);
      stopMusic();
    }, CREDITS_DURATION_MS + 5200);

    return () => {
      window.clearTimeout(hideCredits);
      window.clearTimeout(showSlate);
      window.clearTimeout(showButton);
      stopMusic();
    };
  }, [showCredits]);

  return (
    <AppShell title="Transmision Final" latin="Alta Mesa · Informe">
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[1240px]">
          <Panel className="relative overflow-hidden border border-gold-dim/60 bg-black/95">
            <div className={`pointer-events-none absolute inset-0 transition-opacity duration-200 ${globalGlitch ? "opacity-100 bg-white/10" : "opacity-0"}`} />
            <div className={`pointer-events-none absolute inset-0 bg-black/30 transition-opacity duration-100 ${preCallSignalLoss ? "opacity-100" : "opacity-0"}`} />
            <div className={`pointer-events-none absolute inset-0 bg-white/20 transition-opacity duration-100 ${stableFlash ? "opacity-100" : "opacity-0"}`} />

            <div className={`relative flex min-h-[70vh] flex-col justify-center overflow-hidden transition-[transform,opacity,filter] duration-150 ${globalGlitch ? "-translate-y-[1px] opacity-95" : "translate-y-0 opacity-100"} ${acceptFreeze ? "pointer-events-none brightness-[0.97] saturate-[0.95]" : ""}`}>
              {(phase === "starting" || phase === "priority" || phase === "waiting" || phase === "auth" || phase === "link") && (
                <div className={`relative mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-8 px-4 md:px-8 py-12 text-center ${waitingFlicker ? "brightness-[1.03]" : "brightness-100"}`}>
                  <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:repeating-linear-gradient(0deg,transparent_0,transparent_3px,rgba(255,255,255,0.88)_3px,rgba(255,255,255,0.88)_5px)] mix-blend-overlay" />
                  <div className="pointer-events-none absolute left-0 right-0 h-px bg-white/20 [animation:debrief-video-scan_13s_linear_infinite]" />

                  {phase === "starting" && (
                    <div className="w-full space-y-6">
                      <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-gold-dim">DESBLOQUEO DE CONSOLA SEGURA</p>
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

                  {phase === "priority" && (
                    <div className={`space-y-4 transition-all duration-700 ${waitingVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
                      <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-gold-dim">COMUNICACION PRIORITARIA</p>
                      <p className="font-mono text-4xl md:text-5xl tracking-[0.35em] uppercase text-gold [text-shadow:0_0_8px_rgba(214,173,74,0.24)]">ROMA</p>
                      <p className="font-mono text-sm tracking-[0.35em] uppercase text-gold-dim [text-shadow:0_0_6px_rgba(214,173,74,0.2)]">ALTA MESA</p>
                    </div>
                  )}

                  {phase === "waiting" && (
                    <div className="relative z-10 w-full max-w-2xl space-y-8 text-center">
                      <div className="space-y-3">
                        <p className="font-mono text-[10px] tracking-[0.38em] uppercase text-gold-dim [text-shadow:0_0_6px_rgba(214,173,74,0.2)]">COMUNICACION PRIORITARIA</p>
                        <p className="font-display text-3xl md:text-4xl uppercase text-gold [text-shadow:0_0_10px_rgba(214,173,74,0.28)]">ORIGEN · ROMA · ALTA MESA</p>
                      </div>

                      <div className="grid grid-cols-1 gap-2 font-mono text-[11px] tracking-[0.28em] uppercase text-gold-dim [text-shadow:0_0_6px_rgba(214,173,74,0.2)]">
                        <p>CANAL VII</p>
                        <p>PRIORIDAD OMEGA</p>
                        <p>COMUNICACION ENTRANTE</p>
                      </div>

                      <div className="space-y-2">
                        <p className="font-mono text-[10px] tracking-[0.24em] uppercase text-gold-dim">La comunicacion permanecera disponible durante:</p>
                        <p className="font-mono text-3xl text-gold tracking-[0.28em] [text-shadow:0_0_8px_rgba(214,173,74,0.3)]">{callCountdown}s</p>
                      </div>

                      <button
                        onClick={() => {
                          stopControlledAudio("debrief-call");
                          clearCallPulse();
                          setAcceptFreeze(true);

                          window.setTimeout(() => {
                            setAcceptFreeze(false);
                          }, 200);

                          playSfx(SFX.accept, 0.24);

                          window.setTimeout(() => {
                            setPhase("auth");
                          }, 250);
                        }}
                        className={`inline-flex items-center justify-center border border-gold bg-gold/10 px-8 py-3 font-mono text-[11px] uppercase tracking-[0.34em] text-gold transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold ${callPulse ? "shadow-[0_0_26px_rgba(212,175,55,0.38)] bg-gold/18" : "shadow-[0_0_12px_rgba(212,175,55,0.18)]"}`}
                      >
                        ACEPTAR COMUNICACION
                      </button>

                      <div className="mx-auto flex w-full max-w-lg items-center justify-between font-mono text-[9px] tracking-[0.2em] uppercase text-gold-dim [text-shadow:0_0_6px_rgba(214,173,74,0.2)]">
                        <div className="inline-flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full bg-red-500 [animation:debrief-live-led_1.9s_ease-in-out_infinite] transition-all duration-150 ${callPulse ? "scale-[1.22] brightness-110" : "scale-100"}`} />
                          <span>EN DIRECTO</span>
                        </div>
                        <div className="inline-flex items-end gap-[2px] h-4">
                          {Array.from({ length: 7 }).map((_, i) => (
                            <span
                              key={`waiting-signal-${i}`}
                              className={`w-[3px] bg-gold/70 origin-bottom [animation:debrief-signal-bar_1.9s_ease-in-out_infinite] transition-[filter,opacity] duration-150 ${callSignalBoost ? "brightness-[1.18] opacity-100" : "brightness-100 opacity-85"}`}
                              style={{
                                animationDelay: `${i * 0.1}s`,
                                animationDuration: `${1.6 + (i % 3) * 0.25}s`,
                                height: `${7 + (i % 3)}px`,
                              }}
                            />
                          ))}
                        </div>
                        <div className="text-right">
                          <p>{hudDate}</p>
                          <p>{hudTime}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {phase === "auth" && (
                    <div className="space-y-6">
                      <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-gold-dim [text-shadow:0_0_6px_rgba(214,173,74,0.2)]">AUTENTICANDO OPERATIVO</p>
                      <div className="space-y-2 font-mono text-[13px] tracking-[0.26em] uppercase text-gold-dim [text-shadow:0_0_6px_rgba(214,173,74,0.2)]">
                        {AUTH_LINES.map((line, idx) => (
                          <p
                            key={line}
                            className={`transition-[opacity,filter,color] duration-200 ${authStep >= idx ? "opacity-100 text-gold" : "opacity-30"} ${authFlashIndex === idx ? "brightness-[1.18] [text-shadow:0_0_10px_rgba(214,173,74,0.35)]" : ""}`}
                          >
                            {line} {authStep >= idx ? "✔" : ""}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {phase === "link" && (
                    <div className="w-full max-w-xl space-y-5">
                      <p className="font-mono text-[10px] tracking-[0.35em] uppercase text-gold-dim [text-shadow:0_0_6px_rgba(214,173,74,0.2)]">ESTABLECIENDO ENLACE...</p>
                      <div className="h-3 w-full border border-gold-dim/60 bg-black/35">
                        <div
                          className="h-full bg-[linear-gradient(90deg,oklch(0.55_0.08_80),oklch(0.88_0.16_88),oklch(0.55_0.08_80))] bg-[length:200%_100%] animate-progress-flow transition-all duration-150"
                          style={{ width: `${linkProgress}%` }}
                        />
                      </div>
                      <p className="font-mono text-sm tracking-[0.28em] uppercase text-gold [text-shadow:0_0_8px_rgba(214,173,74,0.28)]">
                        {linkStable ? "SENAL ESTABLE" : `${linkProgress}%`}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {showVideoLayer && (
                <div className="fixed inset-0 z-50 bg-black overflow-hidden">
                  <video
                    ref={videoRef}
                    src="/videos/oldwoman.mp4"
                    onEnded={handleVideoEnded}
                    playsInline
                    preload="auto"
                    controls={false}
                    disablePictureInPicture
                    className={`h-full w-full object-cover transition-[transform,filter] duration-100 ${videoMicroGlitch ? "translate-x-[1px] -translate-y-[1px]" : ""} ${videoFlicker ? "brightness-[0.985]" : "brightness-100"} ${videoBootNoise ? "contrast-[1.04] saturate-[0.92]" : "contrast-100 saturate-100"} ${videoSignalLoss ? "brightness-[0.94] contrast-[1.08]" : ""}`}
                    style={{ filter: `brightness(${1 + videoExposureKick})` }}
                  />

                  {phase === "video" && (
                    <>
                      <div className={`pointer-events-none absolute inset-0 opacity-[0.048] [background-image:repeating-linear-gradient(0deg,transparent_0,transparent_3px,rgba(255,255,255,0.86)_3px,rgba(255,255,255,0.86)_5px)] mix-blend-overlay`} />
                      <div
                        className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle,rgba(255,255,255,0.45)_0.8px,transparent_1.2px)] [background-size:3px_3px] [animation:debrief-noise-drift_1.8s_steps(2,end)_infinite]"
                        style={{ opacity: videoBootNoise ? 0.032 : 0.016 }}
                      />
                      <div className="pointer-events-none absolute left-0 right-0 h-px bg-white/25 [animation:debrief-video-scan_10s_linear_infinite]" />
                      <div className={`pointer-events-none absolute inset-0 bg-black/35 transition-opacity duration-120 ${videoSignalLoss ? "opacity-100" : "opacity-0"}`} />
                      <div className={`pointer-events-none absolute inset-0 transition-opacity duration-120 ${videoSignalLoss ? "opacity-[0.075]" : "opacity-0"} [background-image:repeating-linear-gradient(0deg,transparent_0,transparent_2px,rgba(255,255,255,0.9)_2px,rgba(255,255,255,0.9)_4px)] mix-blend-overlay`} />
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_58%,rgba(0,0,0,0.35)_100%)]" />

                      <div className="pointer-events-none absolute top-2 left-2 right-2 md:top-4 md:left-4 md:right-4 flex items-start justify-between font-mono text-[9px] md:text-[10px] leading-tight tracking-[0.16em] md:tracking-[0.22em] uppercase text-gold-bright [text-shadow:0_0_8px_rgba(214,173,74,0.3)]">
                        <div className="inline-flex flex-col gap-1">
                          <span>ROMA</span>
                          <span>MAGISTRADA</span>
                          <span>ALTA MESA</span>
                        </div>

                        <div className="inline-flex flex-col items-end gap-1 text-right">
                          <div className="inline-flex items-center gap-2 text-gold-bright">
                            <span className="h-2 w-2 rounded-full bg-red-500 [animation:debrief-live-led_2s_ease-in-out_infinite]" />
                            <span>EN DIRECTO</span>
                          </div>
                          <span>CANAL VII</span>
                          <span>{hudDate}</span>
                          <span>{hudTime}</span>
                          <div className="inline-flex items-end gap-[2px] h-3 mt-0.5">
                            {Array.from({ length: 7 }).map((_, i) => (
                              <span
                                key={`signal-${i}`}
                                className="w-[2px] md:w-[2px] bg-gold/75 origin-bottom [animation:debrief-signal-bar_1.85s_ease-in-out_infinite]"
                                style={{
                                  animationDelay: `${i * 0.11}s`,
                                  animationDuration: `${1.6 + (i % 4) * 0.24}s`,
                                  height: `${6 + (i % 2)}px`,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div
                    className={`pointer-events-none absolute inset-0 bg-black transition-opacity ${videoEndingCut ? "duration-[220ms]" : "duration-[600ms]"} ${videoFade ? "opacity-100" : "opacity-0"}`}
                  />

                  <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/65 to-transparent" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/65 to-transparent" />
                </div>
              )}

              {phase === "finished" && (
                <div className="relative z-[60] mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-8 px-4 md:px-8 py-16 text-center">
                  {!showCredits && !showFinalSlate && (
                    <>
                      <div className={`space-y-3 transition-opacity duration-700 ${showTransmissionDone ? "opacity-100" : "opacity-0"}`}>
                        <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-gold-dim">TRANSMISION FINALIZADA</p>
                      </div>

                      <div className="w-full max-w-[700px] space-y-3">
                        {typedClosingLines.map((line, idx) => (
                          <p
                            key={`closing-line-${idx}`}
                            className="font-mono text-[11px] md:text-[12px] tracking-[0.2em] md:tracking-[0.3em] uppercase text-gold-dim text-center"
                          >
                            {line}
                            {activeClosingLine === idx && <span className="animate-blink">█</span>}
                          </p>
                        ))}
                      </div>

                      <div
                        className={`w-full max-w-[560px] border border-gold-dim/45 bg-black/70 px-4 md:px-6 py-5 text-center md:text-left scanlines transition-all duration-700 ${
                          showPermanentRecord ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                        }`}
                      >
                        <p className="font-mono text-[10px] tracking-[0.35em] uppercase text-gold mb-4">REGISTRO PERMANENTE</p>
                        <div className="grid grid-cols-1 md:grid-cols-[170px_1fr] gap-y-2 font-mono text-[11px] tracking-[0.14em] md:tracking-[0.18em] uppercase text-gold-dim">
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

                      {showCreditsFade && (
                        <div className="pointer-events-none fixed inset-0 z-[75] bg-black animate-[debrief-credits-fade_1.5s_ease_forwards]" />
                      )}
                    </>
                  )}

                  {showCredits && (
                    <div className="fixed inset-0 z-[80] bg-black overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.44)_100%)]" />
                      <div className="absolute left-1/2 bottom-[-86%] w-[92%] max-w-3xl -translate-x-1/2 text-center [animation:debrief-credits-roll_56s_linear_forwards]">
                        {CREDIT_SEQUENCE.map((item, idx) => (
                          <div
                            key={`credit-${idx}`}
                            className="mb-28 md:mb-36 opacity-0 [animation:debrief-credit-block_9s_ease-in-out_forwards]"
                            style={{ animationDelay: `${idx * 6.6}s` }}
                          >
                            {item.type === "text" ? (
                              <div className="space-y-4">
                                <p className="font-mono text-[10px] tracking-[0.32em] uppercase text-gold-dim">{item.title}</p>
                                <p className="font-display text-2xl md:text-3xl text-gold leading-relaxed">{item.body}</p>
                              </div>
                            ) : (
                              <div className="mx-auto max-w-xl px-6">
                                <img
                                  src={item.src}
                                  alt="Credito"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = "none";
                                  }}
                                  className="mx-auto w-full rounded-sm border border-gold-dim/50 object-cover opacity-85"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {showFinalSlate && (
                    <div className="fixed inset-0 z-[85] bg-black flex flex-col items-center justify-center px-4 text-center">
                      <p className="font-display text-3xl md:text-4xl text-gold uppercase">EX COMMISSIONE</p>
                      <p className="mt-2 font-display text-xl md:text-2xl text-gold-dim uppercase tracking-[0.22em]">ALTA MESA</p>
                    </div>
                  )}

                  {showCloseButton && (
                    <Link
                      to="/"
                      className="fixed z-[90] bottom-8 left-1/2 -translate-x-1/2 inline-flex border border-gold bg-gold/10 px-8 py-3 font-mono text-[11px] uppercase tracking-[0.35em] text-gold transition hover:bg-gold/20"
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
