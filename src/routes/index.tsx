import { EntryGate } from "../components/EntryGate";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Panel, StatBlock } from "../components/AppShell";
import { ClearanceGate } from "../components/ClearanceGate";
import { ensureMusicPlayback, playSfx } from "../audio/atrium-audio-engine";

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
const COMMUNIQUE_PLAYED_KEY = "index-communique-played";
const ORDER_BLOCKS = [
  "La Comisión le asigna un operativo de prioridad máxima.",
  "Recupere el activo.",
  "No comprometa la seguridad, el anonimato ni los intereses de la Alta Mesa.",
  "Consulte el expediente OPERATIVO.",
] as const;

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
  const [showComunicado, setShowComunicado] = useState(false);
  const [visibleCommuniqueStep, setVisibleCommuniqueStep] = useState(0);
  const [isIPhone, setIsIPhone] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    setIsIPhone(/iPhone/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    if (typeof window !== "undefined" && window.sessionStorage.getItem(COMMUNIQUE_PLAYED_KEY) === "1") {
      setShowComunicado(true);
      setVisibleCommuniqueStep(9);
      return () => {
        cancelled = true;
        timeouts.forEach((id) => clearTimeout(id));
      };
    }

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(COMMUNIQUE_PLAYED_KEY, "1");
    }

    const addTimeout = (fn: () => void, ms: number) => {
      const id = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
      timeouts.push(id);
    };

    addTimeout(() => setShowComunicado(true), 700);

    const commSteps = [
      1250, // CANAL CLASIFICADO
      1850, // COMUNICADO OFICIAL
      2550, // AGENTE MANDARIN
      3350, // 1
      4050, // 2
      4750, // 3
      5450, // 4
      6150, // EJECUTE SUS ÓRDENES.
      6850, // EX COMMISSIONE ALTA MESA
    ];

    commSteps.forEach((ms, index) => {
      addTimeout(() => {
        setVisibleCommuniqueStep(index + 1);
      }, ms);
    });

    addTimeout(() => {
      playSfx("/sounds/luxbeep2.mp3", 0.2);
      window.dispatchEvent(new CustomEvent("operativo-attention"));
    }, 7600);

    return () => {
      cancelled = true;
      timeouts.forEach((id) => clearTimeout(id));
    };
  }, []);

  const movingScanlineTopClass = isIPhone ? "top-[13%]" : "top-[18%]";
  const movingScanlineOpacityClass = isIPhone ? "opacity-[0.46]" : "opacity-[0.32]";

  const renderParagraph = (text: string, line: number) => {
    const marker = "OPERATIVO";

    const markerIndex = text.indexOf(marker);
    if (markerIndex !== -1) {
      const before = text.slice(0, markerIndex);
      const marked = text.slice(markerIndex, markerIndex + marker.length);
      const after = text.slice(markerIndex + marker.length);

      return (
        <>
          {before}
          <strong className="text-gold-bright">{marked}</strong>
          {after}
        </>
      );
    }

    const packetKeywords = ["Comisión", "activo", "seguridad", "anonimato", "Mesa", "expediente"] as const;
    for (const keyword of packetKeywords) {
      const keywordIndex = text.indexOf(keyword);
      if (keywordIndex !== -1) {
        const before = text.slice(0, keywordIndex);
        const after = text.slice(keywordIndex + keyword.length);
        return (
          <>
            {before}
            <span>{keyword}</span>
            {after}
          </>
        );
      }
    }

    return text;
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

      <section className="relative mb-10 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 z-0 grid-bg opacity-[0.72] mix-blend-screen animate-comm-terminal-drift" />
        <div
          className="relative z-10 mx-auto max-w-[680px] space-y-10 px-4 text-left md:px-4"
        >
          <div className={`communique-premium-panel relative overflow-hidden rounded-[24px] border border-gold/55 ${isIPhone ? "bg-[linear-gradient(180deg,oklch(0.055_0.002_60_/_0.95),oklch(0.038_0.002_60_/_0.985))]" : "bg-[linear-gradient(180deg,oklch(0.08_0.004_60_/_0.88),oklch(0.055_0.004_60_/_0.94))]"} px-5 py-5 shadow-[0_0_0_1px_rgba(214,173,74,0.2)_inset,0_0_34px_rgba(214,173,74,0.18),0_0_72px_rgba(214,173,74,0.08)] md:px-8 md:py-6 ${isIPhone ? "comm-iphone" : ""} scanlines animate-comm-terminal-pulse`}>
            <div aria-hidden className="comm-hud-siders pointer-events-none absolute inset-y-5 left-0 right-0 z-[8]" />
            <div aria-hidden className="comm-hud-corners pointer-events-none absolute inset-0 z-[9]" />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[24px] border border-gold/28 shadow-[inset_0_0_0_1px_rgba(214,173,74,0.14),inset_0_0_32px_rgba(214,173,74,0.1),0_0_46px_rgba(214,173,74,0.2)]"
            />
            <div
              aria-hidden
              className={`pointer-events-none absolute inset-[8px] rounded-[18px] border ${isIPhone ? "border-gold/8 bg-[radial-gradient(circle_at_top,rgba(214,173,74,0.045),transparent_62%)] opacity-65" : "border-gold/14 bg-[radial-gradient(circle_at_top,rgba(214,173,74,0.11),transparent_62%)] opacity-90"}`}
            />
            <div className={`pointer-events-none absolute inset-x-0 ${movingScanlineTopClass} z-[40] h-px bg-[linear-gradient(90deg,transparent,rgba(214,173,74,0.24),rgba(214,173,74,0.58),rgba(214,173,74,0.24),transparent)] ${movingScanlineOpacityClass} [animation:comm-line-scan_7.4s_linear_infinite]`} />
            <div className={`pointer-events-none absolute inset-0 border border-gold/10 transition-opacity duration-500 ${showComunicado ? "opacity-100" : "opacity-0"}`} />

            <div className="comm-content relative z-10 space-y-6 md:space-y-7">
              <div className="space-y-3">
                <p className={`font-mono text-[12px] uppercase tracking-[0.34em] text-gold-dim/76 transition-all duration-500 ${visibleCommuniqueStep >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}`}>
                  CANAL CLASIFICADO
                </p>
                <p className={`comm-official-title font-display text-[21px] uppercase tracking-[0.2em] text-gold-dim/84 transition-all duration-500 ${visibleCommuniqueStep >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}`}>
                  COMUNICADO OFICIAL
                </p>
              </div>

              <div className={`comm-orders ${isIPhone ? "space-y-6" : "space-y-4"}`}>
                <h2
                  className={`comm-agent-title font-display tracking-[0.12em] text-gold text-[41px] md:text-[55px] transition-all duration-500 ${visibleCommuniqueStep >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}`}
                >
                  AGENTE MANDARIN
                </h2>

                {ORDER_BLOCKS.map((paragraph, index) => {
                  const isVisible = visibleCommuniqueStep >= 4 + index;
                  return (
                    <p
                      key={`comm-order-${index}`}
                      className={`comm-order-block font-display ${isIPhone ? "leading-[2.4]" : "leading-[2.15]"} tracking-[0.035em] text-gold/78 text-[16px] md:text-[18px] transition-all duration-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}`}
                    >
                      {renderParagraph(paragraph, index + 1)}
                    </p>
                  );
                })}

                <p
                  className={`comm-final-order-frame font-display font-bold uppercase tracking-[0.17em] text-gold-bright text-[23px] md:text-[28px] transition-all duration-500 ${isIPhone ? "comm-final-order" : ""} ${visibleCommuniqueStep >= 8 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}`}
                >
                  EJECUTE SUS ÓRDENES.
                </p>
              </div>

              <p className={`comm-signoff pt-3 font-mono text-[10px] uppercase tracking-[0.32em] text-gold-dim/70 transition-all duration-500 ${isIPhone ? "comm-final-signoff" : ""} ${visibleCommuniqueStep >= 9 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}`}>
                EX COMMISSIONE ALTA MESA
              </p>
            </div>
          </div>
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
    onClick={() => {
      ensureMusicPlayback(180);
      playSfx("/sounds/operatives.mp3", 0.32);
    }}
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
    onClick={() => {
      ensureMusicPlayback(180);
      playSfx("/sounds/dossier.mp3", 0.3);
    }}
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

