import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Panel, StatBlock } from "../components/AppShell";
import { ClearanceGate } from "../components/ClearanceGate";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EX COMMISSIO ALTAE MENSAE" },
      { name: "description", content: "Red Interna de la Comisión. Acceso restringido a operativos autorizados." },
    ],
  }),
  component: Index,
});

function Index() {
  const [unlocked, setUnlocked] = useState(false);
    const handle = () => { setUnlocked(true); };
  if (!unlocked) return <ClearanceGate onComplete={handle} />;
  return <Atrium />;
}

function Atrium() {
  return (
    <AppShell title="Comisión" latin="Bienvenido, MANDARIN">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatBlock label="Autorización" value="AURUM III" sub="Autorizado por la Alta Mesa" />
        <StatBlock label="Saldo en Monedas" value="1" sub="Marcadores en circulación: 1" />
        <StatBlock label="Operación" value="EN CURSO" />
        <StatBlock label="Estatus" value="In Bonis" sub="Sin deudas pendientes" />
      </div>

     <Panel
  title="Comunicado Oficial"
  latin="Ex Commissione Altae Mensae"
  className="mb-8"
>

  <div className="space-y-6">

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
        Ex Commissione Altae Mensae
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
    className="border border-gold-dim p-8 hover:border-gold transition block"
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
    className="border border-gold-dim p-8 hover:border-gold transition block"
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

