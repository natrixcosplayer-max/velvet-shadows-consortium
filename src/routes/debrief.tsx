import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { AppShell, Panel } from "../components/AppShell";
import {
  fadeMusicVolume,
  playControlledAudio,
  playSfx,
  stopControlledAudio,
  stopMusic,
} from "../audio/audiomanager";
import { Authentication } from "../components/debrief/Authentication";
import { ClosingSequence } from "../components/debrief/ClosingSequence";
import { ConnectionSequence } from "../components/debrief/ConnectionSequence";
import { IncomingCall } from "../components/debrief/IncomingCall";
import { VideoCall } from "../components/debrief/VideoCall";
import { AUTH_LINES, CLOSING_LINES, DebriefPhase } from "../components/debrief/types";

export const Route = createFileRoute("/debrief")({
  head: () => ({
    meta: [
      { title: "Informe Final — Continental" },
      { name: "description", content: "Pantalla final cinematografica de la Alta Mesa." },
    ],
  }),
  component: Debrief,
});

const FINAL_BEEP = "/sounds/shortbeep.mp3";

const SFX = {
  incomingCall: "/sounds/debrief/incoming_call.mp3",
  interference: "/sounds/debrief/interference.mp3",
  accept: "/sounds/debrief/accept_communication.mp3",
  authenticate: "/sounds/debrief/authenticate.mp3",
  secureLink: "/sounds/debrief/secure_link.mp3",
  glitch: "/sounds/debrief/glitch.mp3",
  ambience: "/sounds/debrief/ambience.mp3",
  magistrada: "/sounds/debrief/magistrada.mp3",
  archive: "/sounds/debrief/archive.mp3",
  commission: "/sounds/debrief/comission.mp3",
} as const;

type StartupState = {
  progress: number;
  messageIndex: number;
  globalGlitch: boolean;
  waitingVisible: boolean;
  priorityRevealStep: number;
};

type CallState = {
  pulse: boolean;
  signalBoost: boolean;
  preSignalLoss: boolean;
  acceptFreeze: boolean;
  showAcceptButton: boolean;
  countdown: number;
  waitingFlicker: boolean;
  hudDate: string;
  hudTime: string;
};

type AuthState = {
  step: number;
  flashIndex: number | null;
};

type LinkState = {
  progress: number;
  stable: boolean;
  flash: boolean;
};

type VideoState = {
  showLayer: boolean;
  fade: boolean;
  microGlitch: boolean;
  bootNoise: boolean;
  signalLoss: boolean;
  endingCut: boolean;
};

type ClosingState = {
  showTransmissionDone: boolean;
  typedLines: string[];
  activeLine: number | null;
  showPermanentRecord: boolean;
  closingTime: string;
  showCommissionMark: boolean;
  showThanks: boolean;
  showCloseButton: boolean;
};

function Debrief() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoLayerRef = useRef<HTMLDivElement | null>(null);
  const callPulseClearRef = useRef<number | null>(null);
  const videoTeardownRef = useRef<number | null>(null);
  const videoStartedRef = useRef(false);
  const videoStartCleanupRef = useRef<(() => void) | null>(null);
  const priorityAcceptedRef = useRef(false);
  const audioQueueRef = useRef<Promise<void>>(Promise.resolve());

  const [phase, setPhase] = useState<DebriefPhase>("starting");
  const [startup, setStartup] = useState<StartupState>({
    progress: 0,
    messageIndex: 0,
    globalGlitch: false,
    waitingVisible: false,
    priorityRevealStep: 0,
  });
  const [call, setCall] = useState<CallState>({
    pulse: false,
    signalBoost: false,
    preSignalLoss: false,
    acceptFreeze: false,
    showAcceptButton: false,
    countdown: 20,
    waitingFlicker: false,
    hudDate: "",
    hudTime: "",
  });
  const [auth, setAuth] = useState<AuthState>({ step: -1, flashIndex: null });
  const [link, setLink] = useState<LinkState>({ progress: 0, stable: false, flash: false });
  const [video, setVideo] = useState<VideoState>({
    showLayer: false,
    fade: false,
    microGlitch: false,
    bootNoise: true,
    signalLoss: false,
    endingCut: false,
  });
  const [closing, setClosing] = useState<ClosingState>({
    showTransmissionDone: false,
    typedLines: Array(CLOSING_LINES.length).fill(""),
    activeLine: null,
    showPermanentRecord: false,
    closingTime: "",
    showCommissionMark: false,
    showThanks: false,
    showCloseButton: false,
  });

  const queueAudio = useCallback((fn: () => void | Promise<void>) => {
    audioQueueRef.current = audioQueueRef.current.then(() => Promise.resolve(fn())).catch(() => {});
    return audioQueueRef.current;
  }, []);

  const tickHudClock = useCallback(() => {
    const now = new Date();
    const dateText = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" })
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

    setCall((prev) => ({ ...prev, hudDate: dateText, hudTime: timeText }));
  }, []);

  const clearCallPulse = useCallback(() => {
    if (callPulseClearRef.current) {
      window.clearTimeout(callPulseClearRef.current);
      callPulseClearRef.current = null;
    }
    setCall((prev) => ({ ...prev, pulse: false }));
  }, []);

  const triggerIncomingPulse = useCallback(() => {
    playControlledAudio("debrief-call", SFX.incomingCall, 0.24, false);
    setCall((prev) => ({ ...prev, pulse: true, signalBoost: true }));

    if (callPulseClearRef.current) {
      window.clearTimeout(callPulseClearRef.current);
    }

    callPulseClearRef.current = window.setTimeout(() => {
      setCall((prev) => ({ ...prev, pulse: false, signalBoost: false }));
    }, 360);
  }, []);

  const isIPhone = () => (typeof navigator !== "undefined" ? /iPhone/i.test(navigator.userAgent || "") : false);

  const requestVideoFullscreen = useCallback(() => {
    if (typeof document === "undefined") return;

    const iOSVideo = videoRef.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (isIPhone()) {
      if (iOSVideo?.webkitEnterFullscreen) {
        try {
          iOSVideo.webkitEnterFullscreen();
        } catch {
          // Ignore denied native fullscreen.
        }
      }
      return;
    }

    const target = videoLayerRef.current || iOSVideo;
    if (!target) return;

    const node = target as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };

    if (!document.fullscreenElement) {
      if (target.requestFullscreen) {
        target.requestFullscreen().catch(() => {});
      } else if (node.webkitRequestFullscreen) {
        node.webkitRequestFullscreen();
      }
    }
  }, []);

  const handleAcceptCommunication = useCallback(() => {
    stopControlledAudio("debrief-call");
    clearCallPulse();
    setCall((prev) => ({ ...prev, acceptFreeze: true }));
    videoStartedRef.current = false;

    if (videoStartCleanupRef.current) {
      videoStartCleanupRef.current();
      videoStartCleanupRef.current = null;
    }

    flushSync(() => {
      setVideo((prev) => ({ ...prev, showLayer: true, fade: false, bootNoise: true }));
    });

    const media = videoRef.current;
    if (media) {
      media.pause();
      media.currentTime = 0;
      media.muted = false;
      media.controls = false;
      media.load();
    }

    requestVideoFullscreen();

    window.setTimeout(() => {
      setCall((prev) => ({ ...prev, acceptFreeze: false }));
      queueAudio(() => playSfx(SFX.accept, 0.24));
    }, 200);

    window.setTimeout(() => setPhase("auth"), 260);
  }, [clearCallPulse, queueAudio, requestVideoFullscreen]);

  const handlePriorityAccept = useCallback(() => {
    if (priorityAcceptedRef.current) return;
    priorityAcceptedRef.current = true;
    queueAudio(() => playSfx(SFX.magistrada, 0.24));
    triggerIncomingPulse();
    window.setTimeout(() => setPhase("waiting"), 260);
  }, [queueAudio, triggerIncomingPulse]);

  const handleVideoEnded = useCallback(() => {
    const media = videoRef.current;
    if (media) {
      media.pause();
      media.controls = false;
      media.currentTime = 0;
    }

    stopControlledAudio("debrief-ambience");
    setVideo((prev) => ({ ...prev, endingCut: true }));

    if (videoTeardownRef.current) {
      window.clearTimeout(videoTeardownRef.current);
    }

    videoTeardownRef.current = window.setTimeout(() => {
      queueAudio(() => playSfx(SFX.glitch, 0.16));
      setVideo((prev) => ({ ...prev, signalLoss: true, microGlitch: true, bootNoise: true }));

      window.setTimeout(() => setVideo((prev) => ({ ...prev, microGlitch: false })), 90);
      window.setTimeout(() => setVideo((prev) => ({ ...prev, fade: true })), 140);

      window.setTimeout(() => {
        queueAudio(() => playSfx(SFX.archive, 0.2));
        setVideo((prev) => ({ ...prev, showLayer: false, signalLoss: false, endingCut: false }));

        if (videoRef.current) {
          videoRef.current.removeAttribute("src");
          videoRef.current.load();
        }

        setPhase("finished");
      }, 280);
    }, 400);
  }, [queueAudio]);

  useEffect(() => {
    const timers: number[] = [];
    const intervals: number[] = [];
    let cancelled = false;

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const id = window.setTimeout(() => resolve(), ms);
        timers.push(id);
      });

    const run = async () => {
      if (phase === "starting") {
        let progressValue = 0;
        let messageValue = 0;
        queueAudio(() => playSfx("/sounds/beep.mp3", 0.22));
        playControlledAudio("debrief-progress", SFX.incomingCall, 0.08, true);

        const id = window.setInterval(() => {
          messageValue = Math.min(messageValue + 1, 4);
          progressValue = Math.min(100, progressValue + 8);
          setStartup((prev) => ({ ...prev, messageIndex: messageValue, progress: progressValue }));

          if (progressValue >= 100) {
            window.clearInterval(id);
            stopControlledAudio("debrief-progress");
            fadeMusicVolume(0.024, 900);
            const t1 = window.setTimeout(() => {
              queueAudio(() => playSfx(SFX.interference, 0.22));
              setStartup((prev) => ({ ...prev, globalGlitch: true }));

              const t2 = window.setTimeout(() => {
                setStartup((prev) => ({ ...prev, globalGlitch: false }));
                setPhase("priority");
              }, 130);
              timers.push(t2);
            }, 1100);
            timers.push(t1);
          }
        }, 320);
        intervals.push(id);
      }

      if (phase === "priority") {
        setStartup((prev) => ({ ...prev, waitingVisible: false, priorityRevealStep: 0 }));

        await wait(80);
        if (cancelled) return;
        setStartup((prev) => ({ ...prev, waitingVisible: true }));

        await wait(300);
        if (cancelled) return;
        setStartup((prev) => ({ ...prev, priorityRevealStep: 1 }));

        await wait(300);
        if (cancelled) return;
        setStartup((prev) => ({ ...prev, priorityRevealStep: 2 }));

        await wait(300);
        if (cancelled) return;
        setStartup((prev) => ({ ...prev, priorityRevealStep: 3 }));
      }

      if (phase === "waiting") {
        tickHudClock();
        setCall((prev) => ({ ...prev, countdown: 20, showAcceptButton: false, preSignalLoss: false }));

        const ringStart = window.setTimeout(() => {
          setCall((prev) => ({ ...prev, showAcceptButton: true }));

          const ringLoop = window.setInterval(() => {
            triggerIncomingPulse();
          }, 2000);
          intervals.push(ringLoop);
        }, 1200);
        timers.push(ringStart);

        const countLoop = window.setInterval(() => {
          setCall((prev) => {
            if (prev.countdown <= 1) {
              triggerIncomingPulse();
              return { ...prev, countdown: 20 };
            }
            return { ...prev, countdown: prev.countdown - 1 };
          });
        }, 1000);
        intervals.push(countLoop);

        const clockLoop = window.setInterval(() => tickHudClock(), 1000);
        intervals.push(clockLoop);

        const flickerLoop = window.setInterval(() => {
          setCall((prev) => ({ ...prev, waitingFlicker: true }));
          const flickerOff = window.setTimeout(() => {
            setCall((prev) => ({ ...prev, waitingFlicker: false }));
          }, 85);
          timers.push(flickerOff);
        }, 17000);
        intervals.push(flickerLoop);
      }

      if (phase === "auth") {
        setAuth({ step: -1, flashIndex: null });
        queueAudio(() => playSfx(SFX.authenticate, 0.22));

        let idx = -1;
        const intro = window.setTimeout(() => {
          const lineLoop = window.setInterval(() => {
            idx += 1;
            setAuth({ step: idx, flashIndex: idx });

            const clear = window.setTimeout(() => {
              setAuth((prev) => ({ ...prev, flashIndex: prev.flashIndex === idx ? null : prev.flashIndex }));
            }, 100);
            timers.push(clear);

            if (idx >= AUTH_LINES.length - 1) {
              window.clearInterval(lineLoop);
              const next = window.setTimeout(() => setPhase("link"), 340);
              timers.push(next);
            }
          }, 290);
          intervals.push(lineLoop);
        }, 60);

        timers.push(intro);
      }

      if (phase === "link") {
        setLink({ progress: 0, stable: false, flash: false });
        queueAudio(() => playSfx(SFX.secureLink, 0.24));

        let value = 0;
        const id = window.setInterval(() => {
          value = Math.min(100, value + 6);
          setLink((prev) => ({ ...prev, progress: value }));

          if (value >= 100) {
            window.clearInterval(id);
            setLink({ progress: 100, stable: true, flash: true });

            const flashOff = window.setTimeout(() => setLink((prev) => ({ ...prev, flash: false })), 100);
            const startVideo = window.setTimeout(() => setPhase("video"), 560);
            timers.push(flashOff, startVideo);
          }
        }, 85);
        intervals.push(id);
      }

      if (phase === "video") {
        setVideo((prev) => ({ ...prev, showLayer: true, fade: false, bootNoise: true }));
        tickHudClock();
        playControlledAudio("debrief-ambience", SFX.ambience, 0.08, true);
      }

      if (phase === "finished") {
        stopMusic();
        setVideo((prev) => ({ ...prev, fade: false, endingCut: false, signalLoss: false }));
        setClosing({
          showTransmissionDone: false,
          typedLines: Array(CLOSING_LINES.length).fill(""),
          activeLine: null,
          showPermanentRecord: false,
          closingTime: "",
          showCommissionMark: false,
          showThanks: false,
          showCloseButton: false,
        });

        const typeLine = async (lineIndex: number, text: string) => {
          setClosing((prev) => ({ ...prev, activeLine: lineIndex }));
          for (let i = 1; i <= text.length; i += 1) {
            if (cancelled) return;
            setClosing((prev) => {
              const next = [...prev.typedLines];
              next[lineIndex] = text.slice(0, i);
              return { ...prev, typedLines: next };
            });
            await wait(34);
          }
          setClosing((prev) => ({ ...prev, activeLine: null }));
        };

        await wait(500);
        if (cancelled) return;

        setVideo((prev) => ({ ...prev, fade: true }));
        queueAudio(() => playSfx(FINAL_BEEP, 0.24));

        await wait(600);
        if (cancelled) return;
        setClosing((prev) => ({ ...prev, showTransmissionDone: true }));

        await wait(420);
        if (cancelled) return;

        for (let lineIndex = 0; lineIndex < CLOSING_LINES.length; lineIndex += 1) {
          await typeLine(lineIndex, CLOSING_LINES[lineIndex]);
          if (cancelled) return;

          if (lineIndex === 1 || lineIndex === 3) {
            queueAudio(() => playSfx(FINAL_BEEP, 0.2));
          }

          await wait(220);
          if (cancelled) return;
        }

        await wait(1000);
        if (cancelled) return;

        const closeTime = new Intl.DateTimeFormat("es-ES", {
          timeZone: "Europe/Madrid",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(new Date());

        setClosing((prev) => ({ ...prev, closingTime: closeTime, showPermanentRecord: true }));
        queueAudio(() => playSfx(FINAL_BEEP, 0.2));

        await wait(1000);
        if (cancelled) return;

        setClosing((prev) => ({ ...prev, showCommissionMark: true }));
        queueAudio(() => playSfx(SFX.commission, 0.12));

        await wait(2000);
        if (cancelled) return;

        setClosing((prev) => ({ ...prev, showThanks: true }));

        await wait(2300);
        if (cancelled) return;

        setClosing((prev) => ({ ...prev, showCloseButton: true }));
      }
    };

    run();

    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
      intervals.forEach((id) => window.clearInterval(id));
      if (phase === "starting") stopControlledAudio("debrief-progress");
      if (phase === "waiting") {
        stopControlledAudio("debrief-call");
        clearCallPulse();
        setCall((prev) => ({ ...prev, waitingFlicker: false }));
      }
    };
  }, [phase, clearCallPulse, queueAudio, tickHudClock, triggerIncomingPulse]);

  useEffect(() => {
    if (phase !== "video" || !video.showLayer) return;

    const media = videoRef.current;
    if (!media) return;

    media.muted = false;
    media.volume = 1;
    media.controls = false;

    const startPlayback = () => {
      if (videoStartedRef.current) return;
      videoStartedRef.current = true;
      media.play().catch(() => {
        videoStartedRef.current = false;
      });
    };

    if (media.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
      startPlayback();
    } else {
      const onCanPlayThrough = () => {
        cleanupStartListeners();
        startPlayback();
      };

      const onError = () => {
        cleanupStartListeners();
      };

      const cleanupStartListeners = () => {
        media.removeEventListener("canplaythrough", onCanPlayThrough);
        media.removeEventListener("error", onError);
        if (videoStartCleanupRef.current) {
          videoStartCleanupRef.current = null;
        }
      };

      media.addEventListener("canplaythrough", onCanPlayThrough);
      media.addEventListener("error", onError);
      videoStartCleanupRef.current = cleanupStartListeners;
    }

    const timers: number[] = [];

    const bootOff = window.setTimeout(() => {
      setVideo((prev) => ({ ...prev, bootNoise: false }));
    }, 500);
    timers.push(bootOff);

    const occasionalGlitch = window.setTimeout(() => {
      queueAudio(() => playSfx(SFX.glitch, 0.14));
      setVideo((prev) => ({ ...prev, signalLoss: true, microGlitch: true }));
      const recover = window.setTimeout(() => {
        setVideo((prev) => ({ ...prev, signalLoss: false, microGlitch: false }));
      }, 90);
      timers.push(recover);
    }, 22000);
    timers.push(occasionalGlitch);

    const clock = window.setInterval(() => tickHudClock(), 1000);

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      window.clearInterval(clock);
      if (videoStartCleanupRef.current) {
        videoStartCleanupRef.current();
        videoStartCleanupRef.current = null;
      }
      setVideo((prev) => ({ ...prev, signalLoss: false, microGlitch: false }));
    };
  }, [phase, video.showLayer, queueAudio, tickHudClock]);

  useEffect(() => {
    return () => {
      stopControlledAudio("debrief-call");
      stopControlledAudio("debrief-ambience");
      clearCallPulse();
      if (videoTeardownRef.current) {
        window.clearTimeout(videoTeardownRef.current);
      }
    };
  }, [clearCallPulse]);

  return (
    <>
      <AppShell title="Transmision Final" latin="Alta Mesa · Informe">
        <div className="flex min-h-[75vh] items-center justify-center px-4 py-8">
          <div className="w-full max-w-[1240px]">
            <Panel className="relative overflow-hidden border border-gold-dim/60 bg-black/95">
            <div className={`pointer-events-none absolute inset-0 transition-opacity duration-200 ${startup.globalGlitch ? "bg-white/10 opacity-100" : "opacity-0"}`} />
            <div className={`pointer-events-none absolute inset-0 bg-black/30 transition-opacity duration-100 ${call.preSignalLoss ? "opacity-100" : "opacity-0"}`} />
            <div className={`pointer-events-none absolute inset-0 bg-white/20 transition-opacity duration-100 ${link.flash ? "opacity-100" : "opacity-0"}`} />

            <div className={`relative flex min-h-[70vh] flex-col justify-center overflow-hidden transition-[transform,opacity,filter] duration-150 ${startup.globalGlitch ? "-translate-y-[1px] opacity-95" : "translate-y-0 opacity-100"} ${call.acceptFreeze ? "pointer-events-none brightness-[0.97] saturate-[0.95]" : ""}`}>
              {(phase === "starting" || phase === "priority" || phase === "link") && (
                <ConnectionSequence
                  phase={phase}
                  progress={startup.progress}
                  messageIndex={startup.messageIndex}
                  waitingVisible={startup.waitingVisible}
                  priorityRevealStep={startup.priorityRevealStep}
                  linkProgress={link.progress}
                  linkStable={link.stable}
                  onPriorityAccept={handlePriorityAccept}
                />
              )}

              {phase === "waiting" && (
                <div className={`relative mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-8 px-4 py-12 text-center md:px-8 ${call.waitingFlicker ? "brightness-[1.03]" : "brightness-100"}`}>
                  <IncomingCall
                    callCountdown={call.countdown}
                    showAcceptButton={call.showAcceptButton}
                    callPulse={call.pulse}
                    callSignalBoost={call.signalBoost}
                    hudDate={call.hudDate}
                    hudTime={call.hudTime}
                    onAccept={handleAcceptCommunication}
                  />
                </div>
              )}

              {phase === "auth" && (
                <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-8 px-4 py-12 text-center md:px-8">
                  <Authentication authStep={auth.step} authFlashIndex={auth.flashIndex} />
                </div>
              )}

              {phase === "finished" && (
                <ClosingSequence
                  showTransmissionDone={closing.showTransmissionDone}
                  typedClosingLines={closing.typedLines}
                  activeClosingLine={closing.activeLine}
                  showPermanentRecord={closing.showPermanentRecord}
                  closingTime={closing.closingTime}
                  showCommissionMark={closing.showCommissionMark}
                  showThanks={closing.showThanks}
                />
              )}

              {phase === "finished" && closing.showCloseButton && (
                <Link
                  to="/"
                  className="relative z-[90] mx-auto mt-2 inline-flex border border-gold bg-gold/10 px-8 py-3 font-mono text-[11px] uppercase tracking-[0.35em] text-gold transition hover:bg-gold/20"
                >
                  CERRAR EXPEDIENTE
                </Link>
              )}
            </div>
            </Panel>
          </div>
        </div>
      </AppShell>

      {video.showLayer &&
        typeof document !== "undefined" &&
        createPortal(
          <VideoCall
            videoRef={videoRef}
            layerRef={videoLayerRef}
            phase={phase === "video" ? "video" : "finished"}
            fx={{
              microGlitch: video.microGlitch,
              bootNoise: video.bootNoise,
              signalLoss: video.signalLoss,
              endingCut: video.endingCut,
              fade: video.fade,
            }}
            hudDate={call.hudDate}
            hudTime={call.hudTime}
            onEnded={handleVideoEnded}
          />,
          document.body
        )}
    </>
  );
}

export default Debrief;
