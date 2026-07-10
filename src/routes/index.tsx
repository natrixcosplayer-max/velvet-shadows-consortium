import { EntryGate } from "../components/EntryGate";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Panel, StatBlock } from "../components/AppShell";
import { ClearanceGate } from "../components/ClearanceGate";
import { playSfx } from "../audio/atrium-audio-engine";

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
  const orderBlocks = [
    "Identidad verificada.",
    "La Comisión le asigna un operativo de prioridad máxima.",
    "Recupere el activo.",
    "No comprometa la seguridad, el anonimato ni los intereses de la Alta Mesa.",
    "Consulte el expediente OPERATIVO.",
  ];
  const [showComunicado, setShowComunicado] = useState(false);
  const [showAgent, setShowAgent] = useState(false);
  const [showIdentity, setShowIdentity] = useState(false);
  const [visibleOrderCount, setVisibleOrderCount] = useState(0);
  const [showFinalOrder, setShowFinalOrder] = useState(false);
  const [sequenceComplete, setSequenceComplete] = useState(false);
  const [operativoPulse, setOperativoPulse] = useState(false);

  useEffect(() => {
    const seenBefore = typeof window !== "undefined" && window.sessionStorage.getItem("comunicado-seen") === "1";
    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const addTimeout = (fn: () => void, ms: number) => {
      const id = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
      timeouts.push(id);
    };

    if (seenBefore) {
      setShowComunicado(true);
      setShowAgent(true);
      setShowIdentity(true);
      setVisibleOrderCount(orderBlocks.length);
      setShowFinalOrder(true);
      setSequenceComplete(true);
    } else {
      let timeline = 0;

      addTimeout(() => setShowComunicado(true), timeline);
      timeline += 500;

      addTimeout(() => setShowAgent(true), timeline);
      timeline += 500;

      addTimeout(() => setShowIdentity(true), timeline);
      timeline += 550;

      orderBlocks.forEach((line, index) => {
        addTimeout(() => {
          setVisibleOrderCount(index + 1);
          if (line.includes("OPERATIVO")) {
            setOperativoPulse(true);
            addTimeout(() => setOperativoPulse(false), 1300);
          }
        }, timeline + index * 820);
      });

      timeline += orderBlocks.length * 820;

      addTimeout(() => setShowFinalOrder(true), timeline + 180);
      addTimeout(() => {
        setSequenceComplete(true);
        playSfx("/sounds/luxbeep2.mp3", 0.2);
        window.dispatchEvent(new CustomEvent("operativo-attention"));
        navigator.vibrate?.(20);
      }, timeline + 880);

      addTimeout(() => {
        window.sessionStorage.setItem("comunicado-seen", "1");
      }, timeline + 1000);
    }

    return () => {
      cancelled = true;
      timeouts.forEach((id) => clearTimeout(id));
    };
  }, [orderBlocks]);

  const renderParagraph = (text: string) => {
    const marker = "OPERATIVO";
    const finalMarker = "La misión comienza ahora.";

    if (text === finalMarker) {
      return (
        <strong className="text-gold-bright uppercase tracking-[0.18em] [text-shadow:0_0_12px_oklch(0.88_0.16_88_/_0.35)]">
          LA MISIÓN COMIENZA AHORA
        </strong>
      );
    }

    const markerIndex = text.indexOf(marker);
    if (markerIndex === -1) return text;

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

      <section className="mb-16">
        <div className={`mx-auto max-w-[700px] space-y-12 px-1 md:px-4 ${sequenceComplete ? "animate-alta-mesa-breathe" : ""}`}>
          <div className="space-y-4">
            <p className={`font-mono text-[10px] uppercase tracking-[0.34em] text-gold-dim/80 transition-opacity duration-[420ms] ${showComunicado ? "opacity-100" : "opacity-0"}`}>
              CANAL CLASIFICADO
            </p>
            <p className={`font-display text-[20px] uppercase tracking-[0.24em] text-gold/68 transition-opacity duration-[420ms] ${showComunicado ? "opacity-100" : "opacity-0"}`}>
              COMUNICADO OFICIAL
            </p>
          </div>

          <div className="space-y-5">
            <h2 className={`font-display text-[40px] tracking-[0.12em] text-gold transition-opacity duration-[420ms] md:text-[52px] ${showAgent ? "opacity-100" : "opacity-0"}`}>
              AGENTE MANDARIN
            </h2>
            <p className={`font-mono text-[10px] uppercase tracking-[0.3em] text-gold-dim/82 transition-opacity duration-[420ms] ${showIdentity ? "opacity-100" : "opacity-0"}`}>
              ✓ IDENTIDAD VERIFICADA
            </p>
          </div>

          <div className="space-y-10 md:space-y-12">
            {orderBlocks.map((paragraph, index) => {
              const isVisible = visibleOrderCount > index;
              return (
                <p
                  key={`comm-order-${index}`}
                  className={`font-display text-[17px] leading-[1.95] tracking-[0.03em] text-gold/79 transition-opacity duration-[440ms] md:text-[20px] ${isVisible ? "opacity-100" : "opacity-0"}`}
                >
                  {renderParagraph(paragraph)}
                </p>
              );
            })}

            <p
              className={`font-display text-[22px] uppercase tracking-[0.17em] text-gold-bright [text-shadow:0_0_12px_oklch(0.88_0.16_88_/_0.35)] transition-opacity duration-[520ms] md:text-[28px] ${showFinalOrder ? "opacity-100" : "opacity-0"}`}
            >
              LA MISIÓN COMIENZA AHORA.
            </p>
          </div>

          <p className={`pt-4 font-mono text-[10px] uppercase tracking-[0.32em] text-gold-dim/74 transition-opacity duration-[420ms] ${showFinalOrder ? "opacity-100" : "opacity-0"}`}>
            EX COMMISSIONE ALTA MESA
          </p>
        </div>
      </section>

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

