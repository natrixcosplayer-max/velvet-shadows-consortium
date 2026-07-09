import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell, Panel } from "../components/AppShell";
import { playSfx } from "../audio/audiomanager";

export const Route = createFileRoute("/treasury")({
  head: () => ({ meta: [{ title: "Tesorería — Continental" }, { name: "description", content: "Economía de monedas y marcadores." }] }),
  component: Treasury,
});

type ScanState = "camera" | "scanning" | "result";

type ScanPhase = {
  message: string;
  duration: number;
  progress: number;
};

const SCAN_PHASES: ScanPhase[] = [
  { message: "INICIANDO CAPTURA...", duration: 1500, progress: 0.16 },
  { message: "CALIBRANDO SENSOR...", duration: 1500, progress: 0.34 },
  { message: "ANALIZANDO COMPOSICIÓN...", duration: 1600, progress: 0.53 },
  { message: "VERIFICANDO AUTENTICIDAD...", duration: 1700, progress: 0.74 },
  { message: "CONSULTANDO TESORERÍA CENTRAL...", duration: 1900, progress: 0.92 },
];

const SCAN_RESULTS = ["COIN VERIFIED", "MONEDA AUTENTICADA"] as const;

function Treasury() {
  const [balance, setBalance] = useState(6);
  const [balanceDisplay, setBalanceDisplay] = useState<string | null>(null);
  const [coinGlow, setCoinGlow] = useState(false);
  const [coinAddedFxVisible, setCoinAddedFxVisible] = useState(false);
  const [coinAddedFxTick, setCoinAddedFxTick] = useState(0);
  const [scanCoinTransferVisible, setScanCoinTransferVisible] = useState(false);
  const [scanCoinTransferTick, setScanCoinTransferTick] = useState(0);
  const [log, setLog] = useState<{ kind: "+" | "−"; amt: number; reason: string; at: string }[]>([
        { kind: "+", amt: 1, reason: "Ayuda para la misión · Valencia", at: "Hace 3 días" },
    { kind: "−", amt: 1, reason: "Vehículo blindado · Gijón", at: "Hace 7 días, 022:13" },
    { kind: "+", amt: 10, reason: "Misión Cumplida · Roma", at: "Hace 13 días" },
    { kind: "−", amt: 2, reason: "Entrenamiento físico de élite · Valencia", at: "Hace 23 días" },
    { kind: "−", amt: 4, reason: "Compra de Pitas de KEVLAR · Osaka", at: "Hace 7 semanas" },
  ]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimersRef = useRef<number[]>([]);
  const balanceTimersRef = useRef<number[]>([]);
  const scanAutoCloseRef = useRef<number | null>(null);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [scanState, setScanState] = useState<ScanState>("camera");
  const [scanMessage, setScanMessage] = useState("COLOQUE LA MONEDA FRENTE AL ESCÁNER");
  const [scanConfidence, setScanConfidence] = useState(0);
  const [scanFlash, setScanFlash] = useState(false);

  const spend = (n: number, reason: string) => {
    playSfx("/sounds/coin.mp3");
    if (balance < n) return;
    setBalance((b) => b - n);
    setLog((l) => [{ kind: "−", amt: n, reason, at: "Ahora mismo" }, ...l]);
  };

  const clearScanTimers = () => {
    scanTimersRef.current.forEach((id) => window.clearTimeout(id));
    scanTimersRef.current = [];

    if (scanAutoCloseRef.current !== null) {
      window.clearTimeout(scanAutoCloseRef.current);
      scanAutoCloseRef.current = null;
    }
  };

  const clearBalanceTimers = () => {
    balanceTimersRef.current.forEach((id) => window.clearTimeout(id));
    balanceTimersRef.current = [];
  };

  const stopScannerResources = () => {
    clearScanTimers();

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
    setScanMessage("COLOQUE LA MONEDA FRENTE AL ESCÁNER");
    setScanConfidence(0);
    setScanFlash(false);
    setScannerError("");
    setCoinGlow(false);
    setCoinAddedFxVisible(false);
    setScanCoinTransferVisible(false);
  };

  const runAuthenticatedBalanceIncrement = () => {
    clearBalanceTimers();

    const previous = balance;
    setCoinGlow(true);
    setBalanceDisplay(String(previous));

    const t1 = window.setTimeout(() => {
      setBalanceDisplay(`${previous} + 1`);
      setScanCoinTransferTick((v) => v + 1);
      setScanCoinTransferVisible(true);
      playSfx("/sounds/coin.mp3", 0.8);
    }, 260);

    const t2 = window.setTimeout(() => {
      setBalance(previous + 1);
      setBalanceDisplay(String(previous + 1));
      setCoinAddedFxTick((v) => v + 1);
      setCoinAddedFxVisible(true);
      playSfx("/sounds/coin.mp3", 1);
      const chimeTimer = window.setTimeout(() => playSfx("/sounds/luxbeep.mp3", 0.38), 110);
      balanceTimersRef.current.push(chimeTimer);
      navigator.vibrate?.([26, 36, 26]);
      setLog((l) => [{ kind: "+", amt: 1, reason: "Asset verificado · Continental Coin", at: "Ahora mismo" }, ...l]);
    }, 720);

    const t3 = window.setTimeout(() => {
      setBalanceDisplay(null);
      setCoinGlow(false);
    }, 1640);

    const t4 = window.setTimeout(() => {
      setCoinAddedFxVisible(false);
    }, 1760);

    const t5 = window.setTimeout(() => {
      setScanCoinTransferVisible(false);
    }, 1220);

    balanceTimersRef.current.push(t1, t2, t3, t4, t5);
  };

  const startScannerSequence = () => {
    clearScanTimers();
    setScanState("scanning");
    setScanMessage("COLOQUE LA MONEDA FRENTE AL ESCÁNER");
    setScanConfidence(0);
    setScanFlash(true);

    playSfx("/sounds/beep.mp3", 0.22);
    navigator.vibrate?.(18);

    let elapsed = 0;

    SCAN_PHASES.forEach((phase, index) => {
      const timerId = window.setTimeout(() => {
        setScanMessage(phase.message);
        setScanConfidence(phase.progress);
        setScanFlash(true);
        playSfx(index === 0 ? "/sounds/shortbeep.mp3" : "/sounds/beep.mp3", 0.16);
        navigator.vibrate?.(12);

        const flashOffTimer = window.setTimeout(() => setScanFlash(false), 130);
        scanTimersRef.current.push(flashOffTimer);
      }, elapsed);

      scanTimersRef.current.push(timerId);
      elapsed += phase.duration;
    });

    const finishTimer = window.setTimeout(() => {
      setScanState("result");
      setScanMessage(SCAN_RESULTS[0]);
      setScanConfidence(1);
      setScanFlash(true);
      playSfx("/sounds/luxbeep2.mp3", 0.2);
      navigator.vibrate?.([20, 40, 20]);
      runAuthenticatedBalanceIncrement();

      const accessTimer = window.setTimeout(() => {
        setScanMessage("ACCESS GRANTED");
        setScanFlash(false);
      }, 620);

      const closeTimer = window.setTimeout(() => {
        closeScanner();
      }, 1550);

      scanTimersRef.current.push(accessTimer, closeTimer);
    }, elapsed);

    scanTimersRef.current.push(finishTimer);
  };

  const openScanner = async () => {
    setIsScannerOpen(true);
    setScannerError("");
    setScanState("camera");
    setScanMessage("SOLICITANDO ACCESO A CÁMARA...");
    setScanConfidence(0);

    try {
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
      setScanMessage("COLOQUE LA MONEDA FRENTE AL ESCÁNER");
      setScanFlash(true);

      const readyFlash = window.setTimeout(() => setScanFlash(false), 250);
      scanTimersRef.current.push(readyFlash);

      startScannerSequence();
    } catch {
      setScannerError("No fue posible iniciar la cámara.");
      setCameraReady(false);
      setIsScannerOpen(false);
    }
  };

  useEffect(() => {
    return () => {
      stopScannerResources();
      clearBalanceTimers();
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
            <div className="relative mt-2 inline-flex items-center justify-center">
              <p className="font-display text-7xl text-gold inline-flex items-center gap-2">
                <span>{balanceDisplay ?? balance}</span>
                <span className="text-3xl leading-none">⊙</span>
              </p>

              {coinAddedFxVisible && (
                <>
                  <span
                    key={`coin-fx-ring-${coinAddedFxTick}`}
                    className="pointer-events-none absolute inset-[-22px] rounded-full border border-gold/80 animate-ping"
                  />
                  <span
                    key={`coin-fx-plus-${coinAddedFxTick}`}
                    className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-sm border border-gold/70 bg-black/75 px-3 py-1 font-mono text-[10px] tracking-[0.24em] text-gold-bright [animation:debrief-return-haze_650ms_ease-out_both]"
                  >
                    +1 MONEDA AÑADIDA
                  </span>
                </>
              )}
            </div>
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
        <div className="fixed inset-0 z-[120] bg-black scanlines">
          <video ref={videoRef} playsInline muted autoPlay className="absolute inset-0 h-full w-full object-cover opacity-90" />

          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.18)_42%,rgba(0,0,0,0.88)_100%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-screen [background-image:linear-gradient(rgba(214,173,74,0.25)_1px,transparent_1px),linear-gradient(90deg,rgba(214,173,74,0.12)_1px,transparent_1px)] [background-size:100%_7px,24px_100%]" />
          <div className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent animate-scan opacity-90" />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-gold to-transparent opacity-40" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-gold to-transparent opacity-40" />

          <div className="pointer-events-none absolute top-4 left-4 right-4 flex items-start justify-between font-mono text-xs md:text-[10px] tracking-[0.18em] uppercase text-gold-dim [text-shadow:0_0_6px_rgba(214,173,74,0.24)]">
            <div className="inline-flex flex-col gap-1 border border-gold-dim/60 bg-black/55 px-3 py-2">
              <span>ROMA</span>
              <span>ALTA MESA</span>
              <span>CANAL VII</span>
            </div>
            <div className="inline-flex flex-col gap-2 border border-gold-dim/60 bg-black/55 px-3 py-2">
              <div className="inline-flex items-center gap-2 text-gold">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-flicker" />
                <span>REC</span>
              </div>
              <div className="inline-flex items-end gap-[2px] h-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <span
                    key={`coin-signal-${i}`}
                    className="w-[3px] bg-gold/75 origin-bottom animate-pulse"
                    style={{
                      animationDelay: `${i * 0.11}s`,
                      animationDuration: `${1.2 + (i % 4) * 0.18}s`,
                      height: `${7 + (i % 3)}px`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 w-[94%] max-w-lg -translate-x-1/2 -translate-y-1/2 border border-gold/70 bg-black/55 backdrop-blur-[2px] px-4 py-4">
            <p className="font-mono text-[11px] tracking-[0.26em] uppercase text-gold text-center">CONTINENTAL SCANNER</p>
            <p className="mt-2 font-mono text-[10px] tracking-[0.2em] uppercase text-gold-dim text-center">
              {scanState === "camera" ? "SOLICITANDO CÁMARA..." : "COLOQUE LA MONEDA FRENTE AL ESCÁNER"}
            </p>
            <p className="font-mono text-[11px] tracking-[0.24em] uppercase text-gold text-center">{scanMessage}</p>

            <div className="my-3 h-px bg-gold-dim/40" />

            <div className="space-y-2">
              <div className="h-2 w-full border border-gold-dim/70 bg-black/30">
                <div
                  className="h-full bg-[linear-gradient(90deg,oklch(0.55_0.08_80),oklch(0.88_0.16_88),oklch(0.55_0.08_80))] bg-[length:200%_100%] animate-progress-flow"
                  style={{ width: `${Math.min(100, Math.max(2, Math.round(scanConfidence * 100)))}%` }}
                />
              </div>
              <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.18em] uppercase text-gold-dim">
                <span>SECUENCIA DE ANÁLISIS</span>
                <span>{Math.round(scanConfidence * 100)}%</span>
              </div>
            </div>

            <div className="mt-4 grid gap-2 text-center font-mono text-[10px] tracking-[0.2em] uppercase text-gold-dim">
              {SCAN_PHASES.map((phase) => (
                <div key={phase.message} className="flex items-center justify-between gap-4 border border-gold-dim/30 bg-black/30 px-3 py-2">
                  <span className="text-left text-gold">{phase.message}</span>
                  <span className={scanConfidence >= phase.progress ? "text-gold-bright" : "text-gold-dim"}>{scanConfidence >= phase.progress ? "✔" : "··"}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-1 font-mono text-[10px] tracking-[0.2em] uppercase text-gold-dim text-center">
              <p>MARCO DE ESCANEO</p>
              <p>RETÍCULA ACTIVA</p>
              <p>SEÑAL ESTABILIZADA</p>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-[18%] h-[2px] bg-gold/80 shadow-[0_0_16px_rgba(214,173,74,0.75)] animate-scan opacity-80" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.04] animate-flicker bg-[radial-gradient(circle,rgba(255,255,255,0.65)_0.8px,transparent_1.2px)] bg-[length:4px_4px]" />

          {scanFlash && <div className="pointer-events-none absolute inset-0 bg-gold/30 animate-flicker" />}

          {scanCoinTransferVisible && (
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
              <div
                key={`scan-coin-transfer-${scanCoinTransferTick}`}
                className="relative h-11 w-11 rounded-full border border-gold-bright/90 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.8),rgba(214,173,74,0.92)_48%,rgba(64,46,12,0.95)_100%)] shadow-[0_0_22px_rgba(214,173,74,0.7)] [animation:treasury-coin-transfer_920ms_cubic-bezier(0.2,0.85,0.25,1)_both]"
              >
                <span className="absolute inset-0 grid place-items-center font-display text-base text-black/80">⊙</span>
              </div>
            </div>
          )}

          {scannerError && (
            <div className="absolute bottom-20 left-1/2 w-[92%] max-w-xl -translate-x-1/2 border border-destructive bg-black/70 px-4 py-3 text-center font-mono text-xs uppercase tracking-[0.2em] text-destructive">
              {scannerError}
            </div>
          )}
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
