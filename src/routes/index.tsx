import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Panel, StatBlock } from "../components/AppShell";
import { ClearanceGate } from "../components/ClearanceGate";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Atrio — Intranet Continental" },
      { name: "description", content: "Sub Rosa. Solo personal autorizado." },
    ],
  }),
  component: Index,
});

function Index() {
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("continental-cleared") === "1") setUnlocked(true);
  }, []);
  const handle = () => { sessionStorage.setItem("continental-cleared", "1"); setUnlocked(true); };
  if (!unlocked) return <ClearanceGate onComplete={handle} />;
  return <Atrium />;
}

function Atrium() {
  return (
    <AppShell title="Atrio" latin="Bienvenido, Adjudicador">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatBlock label="Autorización" value="AURUM III" sub="Sancionado por la Mesa Alta" />
        <StatBlock label="Saldo en Monedas" value="14" sub="Marcadores en circulación: 3" />
        <StatBlock label="Contratos Activos" value="02" sub="1 abierto · 1 sellado" />
        <StatBlock label="Estatus" value="In Bonis" sub="Sin deudas pendientes" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Panel title="Parte Diario" latin="Tabula Diurna" className="lg:col-span-2">
          <ul className="space-y-4 font-mono text-sm">
            {BRIEFS.map((b, i) => (
              <li key={i} className="flex gap-4 border-l-2 border-gold pl-4 py-1">
                <span className="text-gold-dim text-[10px] tracking-[0.25em] w-20 shrink-0 pt-1">{b.time}</span>
                <div>
                  <p className="text-gold">{b.title}</p>
                  <p className="text-muted-foreground text-xs mt-1">{b.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Acción Rápida" latin="Actio Rapida">
          <div className="space-y-3">
            {QUICK.map((q) => (
              <Link key={q.to} to={q.to} className="block border border-gold-dim p-4 hover:border-gold hover:bg-secondary/40 transition group">
                <p className="font-display text-gold group-hover:text-gold-bright">{q.label}</p>
                <p className="text-[10px] font-mono text-gold-dim tracking-[0.25em] mt-1 uppercase">{q.sub}</p>
              </Link>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid md:grid-cols-2 gap-6">
        <Panel title="Comunicaciones Recientes" latin="Nuntii Recentes">
          <ul className="space-y-3 font-mono text-xs">
            {RECENT_COMMS.map((c, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-gold w-3 h-3 mt-1 border border-gold inline-block" />
                <div className="flex-1">
                  <div className="flex justify-between text-gold">
                    <span>{c.from}</span>
                    <span className="text-gold-dim">{c.at}</span>
                  </div>
                  <p className="text-muted-foreground mt-1 truncate">{c.preview}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Reglas de la Casa" latin="Lex Continentalis">
          <ol className="space-y-3 font-mono text-sm text-gold">
            <li className="flex gap-3"><span className="text-gold-dim">I.</span><span>No se realizarán negocios en suelo del Continental.</span></li>
            <li className="flex gap-3"><span className="text-gold-dim">II.</span><span>Todo servicio prestado se paga en moneda.</span></li>
            <li className="flex gap-3"><span className="text-gold-dim">III.</span><span>Los marcadores son deudas de sangre. Se cumplen.</span></li>
            <li className="flex gap-3"><span className="text-gold-dim">IV.</span><span>La Mesa Alta es soberana. Sus decisiones, definitivas.</span></li>
            <li className="flex gap-3"><span className="text-gold-dim">V.</span><span>La excomunión es irrevocable.</span></li>
          </ol>
        </Panel>
      </div>
    </AppShell>
  );
}

const BRIEFS = [
  { time: "04:12 UTC", title: "Movimiento detectado · Continental Osaka", body: "Tres huéspedes de alto valor registrados bajo identidades selladas. Adjudicador advertido." },
  { time: "06:38 UTC", title: "Marcador reclamado · NYC", body: "El marcador #M-7741 ha sido redimido. Portador en tránsito." },
  { time: "09:01 UTC", title: "Sesión del Consejo programada", body: "El Concilium Altum se reúne a medianoche en la casa capitular de Roma." },
  { time: "11:24 UTC", title: "Boletín de conserjería", body: "El sommelier de Caronte presenta el Latour del '47. Consulte abajo." },
];
const QUICK = [
  { to: "/missions", label: "Contratos Abiertos", sub: "Mandata · 2 activos" },
  { to: "/treasury", label: "Bóveda de Monedas", sub: "Aerarium" },
  { to: "/concierge", label: "Llamar al Conserje", sub: "Cura nocturna" },
  { to: "/atlas", label: "Atlas Continental", sub: "Orbis" },
] as const;
const RECENT_COMMS = [
  { from: "Gerente · NYC", at: "03:14", preview: "La habitación está lista. Como de costumbre." },
  { from: "Adjudicador Vex", at: "Ayer", preview: "El asunto está cerrado. La Mesa lo reconoce." },
  { from: "Sommelier · Roma", at: "Hace 2 días", preview: "Una botella ha sido reservada a su nombre." },
  { from: "Conserje · Osaka", at: "Hace 3 días", preview: "Médico disponible entre la medianoche y el alba." },
];
