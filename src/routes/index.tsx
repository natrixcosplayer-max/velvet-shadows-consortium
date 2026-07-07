import { EntryGate } from "../components/EntryGate";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Panel, StatBlock } from "../components/AppShell";
import { ClearanceGate } from "../components/ClearanceGate";
import { playSfx, playUnlockSound } from "../audio/audiomanager";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EX COMMISSIO ALTA MESA" },
      { name: "description", content: "Red Interna de la Comisión. Acceso restringido a operativos autorizados." },
    ],
  }),
  component: Index,
});

const SKIP_COMMISSION_GATES_KEY = "skip-commission-gates-once";
const UNLOCK_SOUND_PLAYED_KEY = "unlock-sound-played";

function Index() {
  const [entered, setEntered] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.sessionStorage.getItem(SKIP_COMMISSION_GATES_KEY) === "1") {
      setEntered(true);
      setUnlocked(true);
      window.sessionStorage.removeItem(SKIP_COMMISSION_GATES_KEY);
    }

    setBootstrapped(true);
  }, []);

  const handle = () => {
    setUnlocked(true);
  };

  if (!bootstrapped) {
    return null;
  }

  if (!entered) {
    return (
      <EntryGate
        onEnter={() => setEntered(true)}
      />
    );
  }

  if (!unlocked) {
    return <ClearanceGate onComplete={handle} />;
  }

  return <Atrium />;
}

function Atrium() {
  const syncLines = [
    "SINCRONIZANDO COMISION...",
    "Verificando identidad...",
    "Descifrando canal seguro...",
    "Recuperando expediente...",
    "Descargando comunicado...",
  ];
  const paragraphs = [
    "Su identidad ha sido verificada satisfactoriamente por la Comision.",
    "Mediante la presente queda requerido para ejecutar una mision de alta prioridad.",
    "El activo asignado debera ser recuperado sin comprometer la seguridad, el anonimato ni los intereses de la Comision.",
    "Las instrucciones operativas, la inteligencia disponible y los parametros de la mision han sido depositados en el expediente OPERATIVO. Proceda a su consulta inmediata.",
    "Toda comunicacion ajena a este canal queda expresamente prohibida hasta la finalizacion de la operacion.",
  ];
  const [introComplete, setIntroComplete] = useState(false);
  const [syncVisibleCount, setSyncVisibleCount] = useState(0);
  const [titleVisible, setTitleVisible] = useState(false);
  const [nameText, setNameText] = useState("");
  const [identityVerified, setIdentityVerified] = useState(false);
  const [typedParagraphs, setTypedParagraphs] = useState<string[]>(Array(paragraphs.length).fill(""));
  const [activeParagraph, setActiveParagraph] = useState(0);
  const [messageDone, setMessageDone] = useState(false);
  const [showAuthenticated, setShowAuthenticated] = useState(false);
  const [operativoPulse, setOperativoPulse] = useState(false);
  const [borderSweepVisible, setBorderSweepVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const unlockPlayed = window.sessionStorage.getItem(UNLOCK_SOUND_PLAYED_KEY) === "1";
    if (unlockPlayed) return;

    playUnlockSound(0.62);
    window.sessionStorage.setItem(UNLOCK_SOUND_PLAYED_KEY, "1");
  }, []);

  useEffect(() => {
    const seenBefore = typeof window !== "undefined" && window.sessionStorage.getItem("comunicado-seen") === "1";
    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const intervals: ReturnType<typeof setInterval>[] = [];

    const addTimeout = (fn: () => void, ms: number) => {
      const id = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
      timeouts.push(id);
    };

    const addInterval = (fn: () => void, ms: number) => {
      const id = setInterval(() => {
        if (!cancelled) fn();
      }, ms);
      intervals.push(id);
      return id;
    };

    const revealName = (fast = false) => {
      const target = "AGENTE MANDARIN";
      if (fast) {
        setNameText(target);
        setIdentityVerified(true);
        return;
      }

      let i = 0;
      const interval = addInterval(() => {
        i += 1;
        setNameText(target.slice(0, i));
        if (i >= target.length) {
          clearInterval(interval);
          setIdentityVerified(true);
        }
      }, 52);
    };

    const revealParagraphs = (fast = false) => {
      if (fast) {
        setTypedParagraphs(paragraphs);
        setActiveParagraph(paragraphs.length);
        setMessageDone(true);
        setShowAuthenticated(true);
        return;
      }

      let paragraphIndex = 0;
      let charIndex = 0;

      const interval = addInterval(() => {
        setTypedParagraphs((prev) => {
          if (paragraphIndex >= paragraphs.length) return prev;

          const next = [...prev];
          const full = paragraphs[paragraphIndex];
          charIndex += 1;
          next[paragraphIndex] = full.slice(0, charIndex);

          if (!operativoPulse && paragraphIndex === 3 && next[paragraphIndex].includes("OPERATIVO")) {
            setOperativoPulse(true);
            addTimeout(() => setOperativoPulse(false), 1450);
          }

          if (charIndex >= full.length) {
            paragraphIndex += 1;
            charIndex = 0;
            setActiveParagraph(paragraphIndex);

            if (paragraphIndex >= paragraphs.length) {
              clearInterval(interval);
              setMessageDone(true);

              addTimeout(() => {
                setShowAuthenticated(true);
                playSfx("/sounds/luxbeep2.mp3", 0.2);
                window.dispatchEvent(new CustomEvent("operativo-attention"));
                navigator.vibrate?.(20);
              }, 500);
            }
          }

          return next;
        });
      }, 18);
    };

    const startSweepCycle = () => {
      const schedule = () => {
        const delay = 15000 + Math.floor(Math.random() * 5000);
        addTimeout(() => {
          setBorderSweepVisible(true);
          addTimeout(() => setBorderSweepVisible(false), 1150);
          schedule();
        }, delay);
      };
      schedule();
    };

    if (seenBefore) {
      setSyncVisibleCount(syncLines.length);
      setIntroComplete(true);
      setTitleVisible(true);
      revealName(true);
      revealParagraphs(true);
      startSweepCycle();
    } else {
      syncLines.forEach((_, idx) => {
        addTimeout(() => {
          setSyncVisibleCount(idx + 1);
        }, idx * 360);
      });

      addTimeout(() => {
        setIntroComplete(true);
        setTitleVisible(true);
      }, 2000);

      addTimeout(() => revealName(false), 2320);
      addTimeout(() => revealParagraphs(false), 2980);
      addTimeout(() => {
        window.sessionStorage.setItem("comunicado-seen", "1");
      }, 4200);

      startSweepCycle();
    }

    return () => {
      cancelled = true;
      timeouts.forEach((id) => clearTimeout(id));
      intervals.forEach((id) => clearInterval(id));
    };
  }, []);

  const renderParagraph = (text: string, index: number) => {
    if (index !== 3) {
      return text;
    }

    const marker = "OPERATIVO";
    const markerIndex = text.indexOf(marker);
    if (markerIndex === -1) {
      return text;
    }

    const before = text.slice(0, markerIndex);
    const marked = text.slice(markerIndex, markerIndex + marker.length);
    const after = text.slice(markerIndex + marker.length);

    return (
      <>
        {before}
        <strong className={`text-gold transition-shadow duration-700 ${operativoPulse ? "shadow-[0_0_8px_oklch(0.88_0.16_88_/_0.55)]" : ""}`}>{marked}</strong>
        {after}
      </>
    );
  };

  return (
    <AppShell title="MANDARIN" latin="Bienvenido, Agente">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatBlock label="Autorización" value="AURUM VII" sub="Autorizado por la Alta Mesa" />
        <div className="border border-gold-dim p-4 bg-background/40">
          <p className="font-mono text-[10px] tracking-[0.3em] text-gold-dim uppercase">Saldo en Monedas</p>
          <div className="mt-1 inline-flex items-center gap-2">
            <p className="font-display text-2xl text-gold">6</p>
            <span className="inline-grid h-5 w-5 place-items-center rounded-full border border-gold/70 bg-gold/20 text-gold text-[11px] leading-none">
              ⊙
            </span>
          </div>
          <p className="font-mono text-[10px] text-muted-foreground mt-1">Marcadores en circulación: 1</p>
        </div>
        <div className="border border-gold-dim p-4 bg-background/40">
          <p className="font-mono text-[10px] tracking-[0.3em] text-gold-dim uppercase">Operación</p>
          <p className="font-display text-2xl text-gold mt-1">EN CURSO</p>
          <div className="mt-3 h-1 bg-secondary border border-gold-dim">
            <div className="h-full w-[65%] animate-progress-alert bg-[linear-gradient(90deg,oklch(0.55_0.08_80)_0%,oklch(0.78_0.13_85)_24%,oklch(0.9_0.1_88_/_0.65)_40%,oklch(0.88_0.16_88)_50%,oklch(0.9_0.1_88_/_0.65)_60%,oklch(0.78_0.13_85)_76%,oklch(0.55_0.08_80)_100%)] bg-[length:220%_100%] shadow-[0_0_10px_oklch(0.88_0.16_88_/_0.58)]" />
          </div>
        </div>
        <StatBlock label="Estatus" value="In Bonis" sub="Sin deudas pendientes" />
      </div>

     <Panel
      className="mb-8 !border-gold/80 bg-[linear-gradient(180deg,oklch(0.22_0.03_78_/_0.82),oklch(0.12_0.01_60_/_0.88))] shadow-[0_0_0_1px_oklch(0.88_0.16_88_/_0.22),0_0_40px_-14px_oklch(0.88_0.16_88_/_0.36)]"
>

      <div className="absolute inset-0 pointer-events-none opacity-100 animate-comm-grid-drift [background-image:linear-gradient(oklch(0.78_0.13_85_/_7.2%)_1px,transparent_1px),linear-gradient(90deg,oklch(0.78_0.13_85_/_7.2%)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay [background-image:radial-gradient(circle,oklch(0.9_0.08_88_/_0.22)_0.7px,transparent_0.9px)] [background-size:3px_3px]" />
      <div className={`absolute left-0 right-0 top-0 h-px pointer-events-none bg-gradient-to-r from-transparent via-gold to-transparent opacity-0 ${borderSweepVisible ? "animate-comm-top-sweep" : ""}`} />

      <div className="relative z-10 space-y-6 scanlines">
      <div className="mb-5 flex items-baseline justify-between gap-3 border-b border-gold-dim pb-3">
        <h2 className={`font-display text-xl text-gold transition-opacity duration-500 ${titleVisible ? "opacity-100" : "opacity-0"}`}>COMUNICADO OFICIAL</h2>
        <span className="font-mono text-[10px] tracking-[0.3em] text-gold-dim uppercase">Ex Commissione Alta Mesa</span>
      </div>
      <div className={`-mt-2 h-px w-44 bg-gradient-to-r from-gold/80 to-transparent transition-opacity duration-500 ${titleVisible ? "opacity-100" : "opacity-0"}`} />

      {!introComplete ? (
        <div className="space-y-3 pt-2 font-mono text-sm text-muted-foreground leading-7">
          {syncLines.map((line, idx) => (
            <p key={line} className={`transition-opacity duration-300 ${idx < syncVisibleCount ? "opacity-100" : "opacity-0"}`}>
              {line}
            </p>
          ))}
        </div>
      ) : (
        <>
      <p className="font-display text-3xl text-gold">
        {nameText}
      </p>
      {identityVerified && (
        <p className="font-mono text-[11px] tracking-[0.22em] text-gold-dim uppercase">✔ IDENTIDAD VERIFICADA</p>
      )}

      <div className="space-y-4 text-muted-foreground leading-8 text-lg">

        {typedParagraphs.map((paragraph, index) => (
          <p key={`comm-${index}`}>
            {renderParagraph(paragraph, index)}
            {!messageDone && activeParagraph === index && <span className="animate-blink">█</span>}
          </p>
        ))}

      </div>

      {showAuthenticated && (
        <p className="font-mono text-[11px] tracking-[0.22em] text-gold-dim uppercase">✔ MENSAJE AUTENTICADO</p>
      )}

      </>
      )}

    <div className="border-t border-gold-dim pt-5">

      <p className="font-display text-gold text-xl">
        Ex Commissione Alta Mesa
      </p>

    </div>

  </div>

</Panel>

<div className="grid md:grid-cols-4 gap-4 mb-8">

  <StatBlock
    label="Nivel"
    value="VII"
    sub="Autorización concedida"
  />

  <StatBlock
    label="Estado"
    value="ACTIVO"
  />

  <StatBlock
    label="Canal"
    value="CIFRADO"
  />

  <StatBlock
    label="Objetivo"
    value="ASIGNADO"
  />

</div>

<div className="grid md:grid-cols-2 gap-6">

  <Link
    to="/missions"
    className="border border-gold-dim p-8 hover:border-gold transition block animate-pulse-gold"
  >

    <p className="font-display text-2xl text-gold">
      LOCALIZAR ACTIVO
    </p>

    <p className="mt-3 text-sm text-muted-foreground">
      Consultar la localización del activo y abrir las coordenadas.
    </p>

  </Link>

  <Link
    to="/dossiers"
    className="border border-gold-dim p-8 hover:border-gold transition block animate-pulse-gold"
  >

    <p className="font-display text-2xl text-gold">
      AGENTES DESIGNADOS
    </p>

    <p className="mt-3 text-sm text-muted-foreground">
      Acceder a los expedientes de los agentes asignados a la operación.
    </p>

  </Link>

</div>
    </AppShell>
  );
}

