import { EntryGate } from "../components/EntryGate";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Panel, StatBlock } from "../components/AppShell";
import { ClearanceGate } from "../components/ClearanceGate";
import { playUnlockSound } from "../audio/audiomanager";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EX COMMISSIO ALTA MESA" },
      { name: "description", content: "Red Interna de la Comisión. Acceso restringido a operativos autorizados." },
    ],
  }),
  component: Index,
});

function Index() {
  const [entered, setEntered] = useState(false);
const [unlocked, setUnlocked] = useState(false);
    const handle = () => {
  setUnlocked(true);

};
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
  useEffect(() => {

  const t = setTimeout(() => {
    playUnlockSound();
  }, 500);

  return () => clearTimeout(t);

}, []);
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
  title="Comunicado Oficial"
  latin="Ex Commissione Alta Mesa"
      className="mb-8 animate-flicker !border-gold/80 bg-[linear-gradient(180deg,oklch(0.22_0.03_78_/_0.82),oklch(0.12_0.01_60_/_0.88))] shadow-[0_0_0_1px_oklch(0.88_0.16_88_/_0.22),0_0_40px_-14px_oklch(0.88_0.16_88_/_0.36)]"
>

      <div className="absolute inset-0 pointer-events-none opacity-100 [background-image:linear-gradient(oklch(0.78_0.13_85_/_7.2%)_1px,transparent_1px),linear-gradient(90deg,oklch(0.78_0.13_85_/_7.2%)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay [background-image:radial-gradient(circle,oklch(0.9_0.08_88_/_0.22)_0.7px,transparent_0.9px)] [background-size:3px_3px]" />

      <div className="relative z-10 space-y-6 scanlines">
      <p className="font-display text-3xl text-gold">
        Agente MANDARIN,
      </p>

      <div className="space-y-4 text-muted-foreground leading-8 text-lg">

        <p>
          Su identidad ha sido verificada correctamente por la Comisión.
        </p>

        <p>
          Mediante la presente queda requerido para ejecutar una misión
          extraordinaria.
        </p>

        <p>
          El activo asignado deberá recuperarse sin comprometer la seguridad de
          la Comisión.
        </p>

        <p>
          Toda comunicación ajena a este canal queda expresamente prohibida.
        </p>

      </div>

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
      OPERATIVOS DESIGNADOS
    </p>

    <p className="mt-3 text-sm text-muted-foreground">
      Acceder a los expedientes de los agentes asignados a la operación.
    </p>

  </Link>

</div>
    </AppShell>
  );
}

