import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Panel, StatBlock } from "../components/AppShell";
import { ClearanceGate } from "../components/ClearanceGate";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Atrium — Continental Intranet" },
      { name: "description", content: "Sub Rosa. Authorized personnel only." },
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
    <AppShell title="Atrium" latin="Welcome, Adjudicator">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatBlock label="Clearance" value="AURUM III" sub="High Table sanctioned" />
        <StatBlock label="Coin Balance" value="14" sub="Markers in circulation: 3" />
        <StatBlock label="Active Contracts" value="02" sub="1 open · 1 sealed" />
        <StatBlock label="Standing" value="In Bonis" sub="No outstanding debts" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Panel title="Daily Brief" latin="Tabula Diurna" className="lg:col-span-2">
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

        <Panel title="Quick Action" latin="Actio Rapida">
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
        <Panel title="Recent Comms" latin="Nuntii Recentes">
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
        <Panel title="House Rules" latin="Lex Continentalis">
          <ol className="space-y-3 font-mono text-sm text-gold">
            <li className="flex gap-3"><span className="text-gold-dim">I.</span><span>No business shall be conducted on Continental grounds.</span></li>
            <li className="flex gap-3"><span className="text-gold-dim">II.</span><span>Every service rendered is paid in coin.</span></li>
            <li className="flex gap-3"><span className="text-gold-dim">III.</span><span>Markers are debts of blood. They are kept.</span></li>
            <li className="flex gap-3"><span className="text-gold-dim">IV.</span><span>The High Table is sovereign. Its decisions, final.</span></li>
            <li className="flex gap-3"><span className="text-gold-dim">V.</span><span>Excommunicado is irrevocable.</span></li>
          </ol>
        </Panel>
      </div>
    </AppShell>
  );
}

const BRIEFS = [
  { time: "04:12 UTC", title: "Movement detected · Osaka Continental", body: "Three high-value guests checked in under sealed identities. Adjudicator advised." },
  { time: "06:38 UTC", title: "Marker called · NYC", body: "Marker #M-7741 has been redeemed. Holder en route." },
  { time: "09:01 UTC", title: "Council session scheduled", body: "Concilium Altum convenes at midnight, Rome chapter house." },
  { time: "11:24 UTC", title: "Concierge bulletin", body: "Charon's sommelier presents the '47 Latour. Inquire below." },
];
const QUICK = [
  { to: "/missions", label: "Open Contracts", sub: "Mandata · 2 active" },
  { to: "/treasury", label: "Coin Vault", sub: "Aerarium" },
  { to: "/concierge", label: "Summon Concierge", sub: "Cura nocturna" },
  { to: "/atlas", label: "Continental Atlas", sub: "Orbis" },
] as const;
const RECENT_COMMS = [
  { from: "Manager · NYC", at: "03:14", preview: "The room is prepared. Your usual." },
  { from: "Adjudicator Vex", at: "Yesterday", preview: "The matter is closed. The Table acknowledges." },
  { from: "Sommelier · Rome", at: "2 days", preview: "A bottle has been set aside in your name." },
  { from: "Concierge · Osaka", at: "3 days", preview: "Doctor available between midnight and dawn." },
];
