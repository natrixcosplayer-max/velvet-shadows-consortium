import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell, Panel } from "../components/AppShell";
import { playSfx } from "../audio/audiomanager";

export const Route = createFileRoute("/treasury")({
  head: () => ({ meta: [{ title: "Tesorería — Continental" }, { name: "description", content: "Economía de monedas y marcadores." }] }),
  component: Treasury,
});

const OPENCV_JS_URL = "https://docs.opencv.org/4.x/opencv.js";
const COIN_REGISTRY_KEY = "continental-coin-cont-val-001";
const COIN_ID = "CONT-VAL-001";

type CoinCheck = {
  shape: boolean;
  color: boolean;
  size: boolean;
  centered: boolean;
  authenticity: boolean;
};

type ScanState = "camera" | "detected" | "verifying" | "result";

type DebugTelemetry = {
  circlesDetected: number;
  maxDiameterPx: number;
  goldPercent: number;
  centered: boolean;
  shapePoints: number;
  colorPoints: number;
  sizePoints: number;
  centerPoints: number;
  totalPoints: number;
  centerX: number;
  centerY: number;
  radius: number;
};

declare global {
  interface Window {
    cv: any;
    __opencvInitPromise?: Promise<void>;
  }
}

function ensureOpenCvLoaded(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("OpenCV unavailable on server"));
  }

  if (window.cv?.Mat) {
    return Promise.resolve();
  }

  if (window.__opencvInitPromise) {
    return window.__opencvInitPromise;
  }

  window.__opencvInitPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[data-opencv="1"]`) as HTMLScriptElement | null;
    if (existing && window.cv?.Mat) {
      resolve();
      return;
    }

    const script = existing ?? document.createElement("script");
    script.async = true;
    script.setAttribute("data-opencv", "1");
    script.src = OPENCV_JS_URL;

    const onReady = () => {
      if (window.cv?.Mat) {
        resolve();
      } else {
        reject(new Error("OpenCV initialization failed"));
      }
    };

    script.addEventListener("load", onReady, { once: true });
    script.addEventListener("error", () => reject(new Error("OpenCV script load failed")), { once: true });

    if (!existing) {
      document.body.appendChild(script);
    }
  });

  return window.__opencvInitPromise;
}

function Treasury() {
  const [balance, setBalance] = useState(6);
  const [balanceDisplay, setBalanceDisplay] = useState<string | null>(null);
  const [coinGlow, setCoinGlow] = useState(false);
  const [log, setLog] = useState<{ kind: "+" | "−"; amt: number; reason: string; at: string }[]>([
        { kind: "+", amt: 1, reason: "Ayuda para la misión · Valencia", at: "Hace 3 días" },
    { kind: "−", amt: 1, reason: "Vehículo blindado · Gijón", at: "Hace 7 días, 022:13" },
    { kind: "+", amt: 10, reason: "Misión Cumplida · Roma", at: "Hace 13 días" },
    { kind: "−", amt: 2, reason: "Entrenamiento físico de élite · Valencia", at: "Hace 23 días" },
    { kind: "−", amt: 4, reason: "Compra de Pitas de KEVLAR · Osaka", at: "Hace 7 semanas" },
  ]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const processTimeoutRef = useRef<number | null>(null);
  const verifyTimeoutsRef = useRef<number[]>([]);
  const detectedRef = useRef(false);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [scanState, setScanState] = useState<ScanState>("camera");
  const [scanMessage, setScanMessage] = useState("Buscando Continental Coin...");
  const [scanConfidence, setScanConfidence] = useState(0);
  const [scanFlash, setScanFlash] = useState(false);
  const [frozenFrame, setFrozenFrame] = useState<string | null>(null);
  const [checks, setChecks] = useState<CoinCheck>({ shape: false, color: false, size: false, centered: false, authenticity: false });
  const [duplicateResult, setDuplicateResult] = useState(false);
  const [debugTelemetry, setDebugTelemetry] = useState<DebugTelemetry>({
    circlesDetected: 0,
    maxDiameterPx: 0,
    goldPercent: 0,
    centered: false,
    shapePoints: 0,
    colorPoints: 0,
    sizePoints: 0,
    centerPoints: 0,
    totalPoints: 0,
    centerX: 0,
    centerY: 0,
    radius: 0,
  });

  const spend = (n: number, reason: string) => {
    playSfx("/sounds/coin.mp3");
    if (balance < n) return;
    setBalance((b) => b - n);
    setLog((l) => [{ kind: "−", amt: n, reason, at: "Ahora mismo" }, ...l]);
  };

  const stopScannerResources = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (processTimeoutRef.current) {
      window.clearTimeout(processTimeoutRef.current);
      processTimeoutRef.current = null;
    }

    verifyTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    verifyTimeoutsRef.current = [];

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
  };

  const closeScanner = () => {
    stopScannerResources();
    setIsScannerOpen(false);
    setCameraReady(false);
    setScanState("camera");
    setScanMessage("Buscando Continental Coin...");
    setScanConfidence(0);
    setScanFlash(false);
    setFrozenFrame(null);
    setChecks({ shape: false, color: false, size: false, centered: false, authenticity: false });
    setDuplicateResult(false);
    setDebugTelemetry({
      circlesDetected: 0,
      maxDiameterPx: 0,
      goldPercent: 0,
      centered: false,
      shapePoints: 0,
      colorPoints: 0,
      sizePoints: 0,
      centerPoints: 0,
      totalPoints: 0,
      centerX: 0,
      centerY: 0,
      radius: 0,
    });
    setScannerError("");
    detectedRef.current = false;
  };

  const runAuthenticatedBalanceIncrement = () => {
    const previous = balance;
    setCoinGlow(true);
    setBalanceDisplay(String(previous));

    const t1 = window.setTimeout(() => {
      setBalanceDisplay(`${previous} + 1`);
      playSfx("/sounds/coin.mp3", 0.8);
    }, 260);

    const t2 = window.setTimeout(() => {
      setBalance(previous + 1);
      setBalanceDisplay(String(previous + 1));
      playSfx("/sounds/luxbeep.mp3", 0.3);
      setLog((l) => [{ kind: "+", amt: 1, reason: "Asset verificado · Continental Coin", at: "Ahora mismo" }, ...l]);
    }, 720);

    const t3 = window.setTimeout(() => {
      setBalanceDisplay(null);
      setCoinGlow(false);
    }, 1640);

    verifyTimeoutsRef.current.push(t1, t2, t3);
  };

  const finalizeVerification = () => {
    const alreadyRegistered = typeof window !== "undefined" && window.localStorage.getItem(COIN_REGISTRY_KEY) === "1";

    if (alreadyRegistered) {
      setDuplicateResult(true);
      setScanState("result");
      setScanMessage("ASSET YA REGISTRADO");
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(COIN_REGISTRY_KEY, "1");
    }

    setDuplicateResult(false);
    setScanState("result");
    setScanMessage("ASSET VERIFICADO");
    runAuthenticatedBalanceIncrement();
  };

  const startVerificationSequence = () => {
    setScanState("verifying");
    setScanMessage("VERIFICANDO AUTENTICIDAD...");
    setChecks({ shape: false, color: false, size: false, centered: false, authenticity: false });

    const c1 = window.setTimeout(() => setChecks((prev) => ({ ...prev, shape: true })), 320);
    const c2 = window.setTimeout(() => setChecks((prev) => ({ ...prev, color: true })), 760);
    const c3 = window.setTimeout(() => setChecks((prev) => ({ ...prev, size: true })), 1190);
    const c4 = window.setTimeout(() => setChecks((prev) => ({ ...prev, centered: true })), 1570);
    const c5 = window.setTimeout(() => setChecks((prev) => ({ ...prev, authenticity: true })), 1940);
    const c6 = window.setTimeout(() => finalizeVerification(), 2360);
    verifyTimeoutsRef.current.push(c1, c2, c3, c4, c5, c6);
  };

  const handleDetected = () => {
    if (detectedRef.current) return;
    detectedRef.current = true;

    const canvas = liveCanvasRef.current;
    if (canvas) {
      setFrozenFrame(canvas.toDataURL("image/jpeg", 0.85));
    }

    setScanState("detected");
    setScanFlash(true);
    setScanMessage("✔ CONTINENTAL COIN DETECTADA");
    playSfx("/sounds/beep.mp3", 0.35);

    const f1 = window.setTimeout(() => setScanFlash(false), 120);
    const f2 = window.setTimeout(() => startVerificationSequence(), 520);
    verifyTimeoutsRef.current.push(f1, f2);
  };

  const startDetectionLoop = () => {
    const drawOverlay = (
      width: number,
      height: number,
      detectedCircle?: { x: number; y: number; r: number }
    ) => {
      const overlay = overlayCanvasRef.current;
      if (!overlay) return;

      overlay.width = width;
      overlay.height = height;
      const octx = overlay.getContext("2d");
      if (!octx) return;

      octx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const guideRadius = Math.min(width, height) * 0.21;

      octx.strokeStyle = "rgba(214, 173, 74, 0.85)";
      octx.lineWidth = 2;
      octx.beginPath();
      octx.arc(centerX, centerY, guideRadius, 0, Math.PI * 2);
      octx.stroke();

      octx.fillStyle = "rgba(214, 173, 74, 0.95)";
      octx.beginPath();
      octx.arc(centerX, centerY, 3, 0, Math.PI * 2);
      octx.fill();

      if (detectedCircle) {
        octx.strokeStyle = "rgba(44, 212, 129, 0.95)";
        octx.lineWidth = 3;
        octx.beginPath();
        octx.arc(detectedCircle.x, detectedCircle.y, detectedCircle.r, 0, Math.PI * 2);
        octx.stroke();

        octx.strokeStyle = "rgba(44, 212, 129, 0.95)";
        octx.lineWidth = 2;
        octx.beginPath();
        octx.moveTo(detectedCircle.x - 12, detectedCircle.y);
        octx.lineTo(detectedCircle.x + 12, detectedCircle.y);
        octx.moveTo(detectedCircle.x, detectedCircle.y - 12);
        octx.lineTo(detectedCircle.x, detectedCircle.y + 12);
        octx.stroke();
      }
    };

    const step = () => {
      if (!isScannerOpen || !cameraReady || detectedRef.current) return;

      const video = videoRef.current;
      const canvas = liveCanvasRef.current;
      if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
        rafRef.current = requestAnimationFrame(step);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        rafRef.current = requestAnimationFrame(step);
        return;
      }

      drawOverlay(canvas.width, canvas.height);

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const cv = window.cv;
      if (!cv?.Mat) {
        rafRef.current = requestAnimationFrame(step);
        return;
      }

      let src: any;
      let gray: any;
      let circles: any;
      let hsv: any;
      let maskGold: any;
      let circleMask: any;
      let goldInCircleMask: any;

      try {
        src = cv.imread(canvas);
        gray = new cv.Mat();
        circles = new cv.Mat();
        hsv = new cv.Mat();
        maskGold = new cv.Mat();
        circleMask = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC1);
        goldInCircleMask = new cv.Mat();

        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        cv.medianBlur(gray, gray, 5);

        const minRadius = Math.floor(src.cols * 0.13);
        const maxRadius = Math.floor(src.cols * 0.43);

        cv.HoughCircles(gray, circles, cv.HOUGH_GRADIENT, 1, gray.rows / 8, 120, 30, minRadius, maxRadius);

        const count = circles.cols || 0;
        if (count < 1) {
          const breathing = 0.1 + Math.abs(Math.sin(Date.now() / 420)) * 0.16;
          setScanMessage("ESCANEANDO ASSET...");
          setScanConfidence(breathing);
          setDebugTelemetry({
            circlesDetected: 0,
            maxDiameterPx: 0,
            goldPercent: 0,
            centered: false,
            shapePoints: 0,
            colorPoints: 0,
            sizePoints: 0,
            centerPoints: 0,
            totalPoints: Math.round(breathing * 100),
            centerX: 0,
            centerY: 0,
            radius: 0,
          });
          processTimeoutRef.current = window.setTimeout(() => {
            rafRef.current = requestAnimationFrame(step);
          }, 130);
          return;
        }

        let maxIdx = 0;
        let maxRadiusFound = 0;
        for (let i = 0; i < count; i += 1) {
          const radius = circles.data32F[i * 3 + 2] || 0;
          if (radius > maxRadiusFound) {
            maxRadiusFound = radius;
            maxIdx = i;
          }
        }

        const x = circles.data32F[maxIdx * 3];
        const y = circles.data32F[maxIdx * 3 + 1];
        const r = circles.data32F[maxIdx * 3 + 2];

        drawOverlay(canvas.width, canvas.height, { x, y, r });

        cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB);
        cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);

        const lowGold = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [14, 70, 75, 0]);
        const highGold = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [40, 255, 255, 255]);
        cv.inRange(hsv, lowGold, highGold, maskGold);
        lowGold.delete();
        highGold.delete();

        cv.circle(circleMask, new cv.Point(x, y), Math.floor(r), new cv.Scalar(255, 255, 255, 255), -1);
        cv.bitwise_and(maskGold, circleMask, goldInCircleMask);

        const goldPixels = cv.countNonZero(goldInCircleMask);
        const circleArea = Math.max(Math.PI * r * r, 1);
        const goldRatio = goldPixels / circleArea;

        const diameterRatio = (2 * r) / src.cols;
        const dx = Math.abs(x - src.cols / 2);
        const dy = Math.abs(y - src.rows / 2);
        const normalizedCenterDistance = Math.sqrt(dx * dx + dy * dy) / (Math.min(src.cols, src.rows) / 2);

        const minDiameterRatio = 0.24;
        const minGoldRatio = 0.34;
        const centered = normalizedCenterDistance <= 0.18;

        const shapePoints = count === 1 ? 40 : count > 1 ? 14 : 0;
        const colorPoints = Math.max(0, Math.min(30, Math.round(((goldRatio - 0.2) / (minGoldRatio - 0.2)) * 30)));
        const sizePoints = Math.max(0, Math.min(20, Math.round(((diameterRatio - 0.12) / (minDiameterRatio - 0.12)) * 20)));
        const centerPoints = centered ? 10 : 0;
        const totalPoints = Math.max(0, Math.min(100, shapePoints + colorPoints + sizePoints + centerPoints));
        const confidence = totalPoints / 100;

        setDebugTelemetry({
          circlesDetected: count,
          maxDiameterPx: Math.round(2 * r),
          goldPercent: Math.max(0, Math.min(100, Math.round(goldRatio * 100))),
          centered,
          shapePoints,
          colorPoints,
          sizePoints,
          centerPoints,
          totalPoints,
          centerX: x,
          centerY: y,
          radius: r,
        });

        setScanConfidence(confidence);

        if (count !== 1) {
          setScanMessage("Buscando Continental Coin...");
        } else if (!centered) {
          setScanMessage("Centre el asset dentro del marco.");
        } else if (diameterRatio < minDiameterRatio) {
          setScanMessage("Mantenga una distancia de 15-20 cm.");
        } else if (goldRatio < minGoldRatio) {
          setScanMessage("Evite reflejos intensos.");
        } else {
          setScanMessage("No mueva la moneda.");
        }

        if (
          confidence > 0.9 &&
          count === 1 &&
          centered &&
          diameterRatio >= minDiameterRatio &&
          goldRatio >= minGoldRatio
        ) {
          handleDetected();
          return;
        }
      } catch {
        setScanMessage("ESCANEANDO ASSET...");
      } finally {
        src?.delete();
        gray?.delete();
        circles?.delete();
        hsv?.delete();
        maskGold?.delete();
        circleMask?.delete();
        goldInCircleMask?.delete();
      }

      processTimeoutRef.current = window.setTimeout(() => {
        rafRef.current = requestAnimationFrame(step);
      }, 130);
    };

    rafRef.current = requestAnimationFrame(step);
  };

  const openScanner = async () => {
    setIsScannerOpen(true);
    setScannerError("");
    setScanState("camera");
    setScanMessage("ESCANEANDO ASSET...");
    setScanConfidence(0);
    setChecks({ shape: false, color: false, size: false, centered: false, authenticity: false });
    setFrozenFrame(null);
    setDuplicateResult(false);
    detectedRef.current = false;

    try {
      await ensureOpenCvLoaded();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
        },
      });

      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        throw new Error("No camera surface");
      }

      video.srcObject = stream;
      await video.play();

      setCameraReady(true);
      startDetectionLoop();
    } catch {
      setScannerError("No fue posible iniciar la cámara o el módulo de análisis.");
      setCameraReady(false);
    }
  };

  useEffect(() => {
    return () => {
      stopScannerResources();
    };
  }, []);

  return (
    <AppShell title="Tesorería" latin="Aerarium · Monedas y Marcadores">
      <Panel className="mb-6 text-center">
        <p className="font-mono text-[10px] tracking-[0.34em] uppercase text-gold-dim">Autentificación de Asset Físico</p>
        <button
          onClick={openScanner}
          className="mt-5 inline-flex items-center justify-center border border-gold bg-gold/12 px-8 md:px-12 py-4 md:py-5 font-mono text-sm md:text-base tracking-[0.32em] uppercase text-gold shadow-[0_0_24px_rgba(212,175,55,0.26)] transition hover:bg-gold/22 hover:shadow-[0_0_34px_rgba(212,175,55,0.4)] animate-pulse-gold"
        >
          ESCANEAR MONEDA
        </button>
      </Panel>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
        <Panel className="relative overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
          <div className="relative flex flex-col items-center text-center py-8">
            <Coin glow={coinGlow} />
            <p className="font-mono text-[10px] tracking-[0.4em] text-gold-dim uppercase mt-6">Saldo en Monedas</p>
            <p className="font-display text-7xl text-gold mt-2 inline-flex items-center gap-2">
              <span>{balanceDisplay ?? balance}</span>
              <span className="text-3xl leading-none">⊙</span>
            </p>
            <p className="font-mono text-xs text-foreground/70 mt-3 max-w-md italic">
              "Una moneda. Un servicio. Sin excepciones. El valor no está en el metal sino en el juramento."
            </p>
            <div className="mt-6 flex gap-3 flex-wrap justify-center">
              <ActionBtn onClick={() => spend(1, "Habitación · una noche")}>Alojamiento · 1 ⊙</ActionBtn>
              <ActionBtn onClick={() => spend(2, "Sommelier")}>Sommelier · 2 ⊙</ActionBtn>
              <ActionBtn onClick={() => spend(3, "Médico")}>Médico · 3 ⊙</ActionBtn>
            </div>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title="Tabla de Conversión" latin="Tabula Mutationis">
            <ul className="font-mono text-sm divide-y divide-gold-dim/40">
              {[
                ["1 ⊙", "= Continental · una noche"],
                ["5 ⊙", "= Armas y blindaje"],
                ["1 ⊙", "= Cuidado de mascotas"],
                ["3 ⊙", "= Médico · sin preguntas"],
                ["5 ⊙", "= Delegar contrato u operativo"],
                ["1 Marcador", "= Deuda sin límite"],
              ].map(([k, v], i) => (
                <li key={i} className="flex justify-between py-2.5">
                  <span className="text-gold">{k}</span>
                  <span className="text-foreground/80">{v}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Libro Mayor" latin="Codex Rationum">
            <ul className="font-mono text-xs">
              {log.map((e, i) => (
                <li key={i} className="flex justify-between items-center py-2.5 border-b border-gold-dim/30 last:border-0">
                  <span className="flex items-center gap-3">
                    <span className={`w-6 h-6 grid place-items-center border ${e.kind === "+" ? "border-gold text-gold" : "border-destructive text-destructive"}`}>{e.kind}</span>
                    <span>
                      <span className="text-gold block">{e.reason}</span>
                      <span className="text-gold-dim text-[10px] tracking-[0.2em]">{e.at}</span>
                    </span>
                  </span>
                  <span className={`font-display text-lg ${e.kind === "+" ? "text-gold" : "text-destructive"}`}>
                    {e.kind}{e.amt} ⊙
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      {isScannerOpen && (
        <div className="fixed inset-0 z-[120] bg-black">
          <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full object-cover" />
          <canvas ref={liveCanvasRef} className="hidden" />
          <canvas ref={overlayCanvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />

          {frozenFrame && (
            <img src={frozenFrame} alt="frame congelado" className="absolute inset-0 h-full w-full object-cover" />
          )}

          <div className="pointer-events-none absolute inset-0 opacity-[0.055] [background-image:repeating-linear-gradient(0deg,transparent_0,transparent_3px,rgba(255,255,255,0.9)_3px,rgba(255,255,255,0.9)_5px)] mix-blend-overlay" />
          <div className="pointer-events-none absolute left-0 right-0 h-px bg-white/30 [animation:debrief-video-scan_8s_linear_infinite]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.02] [background-image:radial-gradient(circle,rgba(255,255,255,0.45)_0.8px,transparent_1.2px)] [background-size:3px_3px] [animation:debrief-noise-drift_1.8s_steps(2,end)_infinite]" />

          <div className="pointer-events-none absolute top-4 left-4 right-4 flex items-start justify-between font-mono text-xs md:text-[10px] tracking-[0.18em] uppercase text-gold-dim [text-shadow:0_0_6px_rgba(214,173,74,0.24)]">
            <div className="inline-flex flex-col gap-1 border border-gold-dim/60 bg-black/45 px-3 py-2">
              <span>ROMA</span>
              <span>ALTA MESA</span>
              <span>CANAL VII</span>
            </div>
            <div className="inline-flex flex-col gap-2 border border-gold-dim/60 bg-black/45 px-3 py-2">
              <div className="inline-flex items-center gap-2 text-gold">
                <span className="h-2 w-2 rounded-full bg-red-500 [animation:debrief-live-led_1.7s_ease-in-out_infinite]" />
                <span>REC</span>
              </div>
              <div className="inline-flex items-end gap-[2px] h-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <span
                    key={`coin-signal-${i}`}
                    className="w-[3px] bg-gold/75 origin-bottom [animation:debrief-signal-bar_1.8s_ease-in-out_infinite]"
                    style={{
                      animationDelay: `${i * 0.11}s`,
                      animationDuration: `${1.6 + (i % 4) * 0.24}s`,
                      height: `${7 + (i % 3)}px`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute left-1/2 top-[50%] z-20 w-[94%] max-w-lg -translate-x-1/2 -translate-y-1/2 border border-gold/70 bg-black/35 backdrop-blur-[2px] px-4 py-4">
            <p className="font-mono text-[11px] tracking-[0.26em] uppercase text-gold text-center">CONTINENTAL SCANNER</p>
            <p className="mt-2 font-mono text-[10px] tracking-[0.2em] uppercase text-gold-dim text-center">Estado</p>
            <p className="font-mono text-[11px] tracking-[0.24em] uppercase text-gold text-center">{scanState === "camera" ? "ESCANEANDO..." : scanMessage}</p>

            <div className="my-3 h-px bg-gold-dim/40" />

            <dl className="grid grid-cols-[1fr_auto] gap-y-1 font-mono text-[10px] tracking-[0.18em] uppercase text-gold-dim">
              <dt>Círculos detectados</dt><dd>{debugTelemetry.circlesDetected}</dd>
              <dt>Diámetro mayor</dt><dd>{debugTelemetry.maxDiameterPx > 0 ? `${debugTelemetry.maxDiameterPx}px` : "--"}</dd>
              <dt>Color dorado</dt><dd>{debugTelemetry.goldPercent}%</dd>
              <dt>Posición</dt><dd>{debugTelemetry.centered ? "Centrado" : "Fuera del centro"}</dd>
              <dt>Forma</dt><dd>{debugTelemetry.shapePoints}%</dd>
              <dt>Color</dt><dd>{debugTelemetry.colorPoints}%</dd>
              <dt>Tamaño</dt><dd>{debugTelemetry.sizePoints}%</dd>
              <dt>Centrado</dt><dd>{debugTelemetry.centerPoints}%</dd>
            </dl>

            <div className="mt-4">
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-gold-dim text-center">CONFIANZA TOTAL</p>
              <p className="font-mono text-base tracking-[0.2em] uppercase text-gold text-center">{Math.round(scanConfidence * 100)}%</p>
              <div className="mt-2 h-2 w-full border border-gold-dim/70 bg-black/30">
                <div
                  className="h-full bg-[linear-gradient(90deg,oklch(0.55_0.08_80),oklch(0.88_0.16_88),oklch(0.55_0.08_80))] bg-[length:200%_100%] animate-progress-flow"
                  style={{ width: `${Math.min(100, Math.max(2, Math.round(scanConfidence * 100)))}%` }}
                />
              </div>
            </div>

            {(scanState === "detected" || scanState === "verifying" || scanState === "result") && (
              <div className="mt-4 space-y-1 font-mono text-[10px] tracking-[0.2em] uppercase text-gold-dim text-center">
                <p>FORMA {checks.shape ? "✔" : ""}</p>
                <p>COLOR {checks.color ? "✔" : ""}</p>
                <p>TAMAÑO {checks.size ? "✔" : ""}</p>
                <p>CENTRADO {checks.centered ? "✔" : ""}</p>
                <p>AUTENTICIDAD {checks.authenticity ? "VERIFICADA" : ""}</p>
              </div>
            )}

            {scanState === "result" && !duplicateResult && (
              <div className="mt-3 space-y-1 font-mono text-[10px] tracking-[0.2em] uppercase text-gold-dim text-center">
                <p className="text-gold">ORIGEN · HOTEL WESTIN CONTINENTAL</p>
                <p>VALENCIA</p>
                <p className="text-gold">MISIÓN · RECUPERAR ASSET</p>
                <p>TRAZABILIDAD · ALTA MESA · ROMA</p>
              </div>
            )}

            {scanState === "result" && duplicateResult && (
              <div className="mt-3 space-y-1 font-mono text-[10px] tracking-[0.2em] uppercase text-gold-dim text-center">
                <p className="text-gold">ID · {COIN_ID}</p>
                <p>Esta moneda ya figura en los registros de la Alta Mesa.</p>
              </div>
            )}

            {scanState === "camera" && (
              <div className="mt-3 space-y-1 font-mono text-[10px] tracking-[0.2em] uppercase text-gold-dim text-center">
                <p>Centre el asset dentro del marco.</p>
                <p>Mantenga una distancia de 15-20 cm.</p>
                <p>Evite reflejos intensos.</p>
                <p>No mueva la moneda.</p>
              </div>
            )}
          </div>

          {scanFlash && <div className="pointer-events-none absolute inset-0 bg-gold/35" />}

          {scannerError && (
            <div className="absolute bottom-20 left-1/2 w-[92%] max-w-xl -translate-x-1/2 border border-destructive bg-black/70 px-4 py-3 text-center font-mono text-xs uppercase tracking-[0.2em] text-destructive">
              {scannerError}
            </div>
          )}

          <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-3 px-4">
            <button
              onClick={closeScanner}
              className="border border-gold px-5 py-2 font-mono text-[11px] uppercase tracking-[0.28em] text-gold bg-black/60 hover:bg-gold/20"
            >
              Cerrar Escáner
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function ActionBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="font-mono text-[11px] tracking-[0.3em] uppercase px-4 py-2 border border-gold-dim text-gold-dim hover:border-gold hover:text-gold transition">
      {children}
    </button>
  );
}

function Coin({ glow = false }: { glow?: boolean }) {
  return (
    <div
      className={`relative w-40 h-40 rounded-full transition-shadow duration-700 ${glow ? "shadow-[0_0_0_2px_oklch(0.88_0.16_88_/_0.4),0_0_65px_-6px_oklch(0.88_0.16_88_/_0.85)]" : ""}`}
      style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-gold), 0 0 80px -10px var(--gold)" }}
    >
      <div className="absolute inset-2 rounded-full border-2 border-background/40 flex items-center justify-center">
        <div className="text-center text-background">
          <p className="font-display text-2xl leading-none">EX</p>
          <p className="font-mono text-[8px] tracking-[0.3em] my-1">CONTINENTALIS</p>
          <p className="font-display text-2xl leading-none">UMBRA</p>
        </div>
      </div>
      <div className="absolute inset-0 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle at 30% 30%, oklch(1 0 0 / 25%), transparent 50%)" }} />
    </div>
  );
}
