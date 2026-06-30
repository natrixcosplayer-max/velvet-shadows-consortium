import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Panel } from "../components/AppShell";

export const Route = createFileRoute("/concierge")({
  head: () => ({ meta: [{ title: "Concierge — Continental" }, { name: "description", content: "Discreet services for members." }] }),
  component: Concierge,
});

const SERVICES = [
  { latin: "Cubiculum", title: "Lodging", desc: "A room. A door. A view, if you wish. The Continental remembers.", cost: "1 ⊙" },
  { latin: "Vinum", title: "Sommelier", desc: "A bottle from the cellar. The selection is rarely yours.", cost: "2 ⊙" },
  { latin: "Medicus", title: "Physician", desc: "Tetanus, gunshot, lacerations. No records. No questions.", cost: "3 ⊙" },
  { latin: "Vestis", title: "Tailor", desc: "Bespoke · armored linings · same-day fit.", cost: "4 ⊙" },
  { latin: "Mundator", title: "Cleaner", desc: "When the room requires attention, the cleaner attends.", cost: "5 ⊙" },
  { latin: "Cartographus", title: "Cartographer", desc: "Maps the ledger does not keep. Routes, exits, blind angles.", cost: "2 ⊙" },
  { latin: "Sommelier Armorum", title: "Sommelier of Arms", desc: "A tasting. German. Italian. Russian. Discretion as ever.", cost: "3 ⊙" },
  { latin: "Equus", title: "Driver", desc: "Black car. Silent. Knows the city before you name it.", cost: "1 ⊙" },
];

function Concierge() {
  const [requested, setRequested] = useState<string | null>(null);
  return (
    <AppShell title="Concierge" latin="Cura · By summons only">
      <Panel className="mb-6">
        <p className="font-display italic text-xl text-gold-dim leading-relaxed border-l-2 border-gold pl-5">
          "Anything you require, the house provides. Anything you confess, the house forgets. Anything you owe — the house remembers."
        </p>
        <p className="font-mono text-[10px] tracking-[0.3em] text-gold-dim uppercase mt-3 text-right">— The Manager, NYC</p>
      </Panel>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SERVICES.map((s) => (
          <button
            key={s.title}
            onClick={() => setRequested(s.title)}
            className="noir-panel gold-corners p-5 text-left hover:bg-secondary/40 transition group"
          >
            <p className="font-display italic text-gold-dim text-sm">{s.latin}</p>
            <h3 className="font-display text-xl text-gold mt-1 group-hover:text-gold-bright">{s.title}</h3>
            <p className="text-xs text-foreground/75 mt-3 leading-relaxed min-h-[60px]">{s.desc}</p>
            <div className="mt-4 pt-3 border-t border-gold-dim flex justify-between items-center font-mono text-[10px] tracking-[0.3em] uppercase">
              <span className="text-gold">{s.cost}</span>
              <span className="text-gold-dim group-hover:text-gold">Summon →</span>
            </div>
          </button>
        ))}
      </div>

      {requested && (
        <div className="fixed inset-0 z-50 bg-background/85 backdrop-blur-sm grid place-items-center p-6" onClick={() => setRequested(null)}>
          <div className="noir-panel gold-corners p-10 max-w-md text-center" onClick={(e) => e.stopPropagation()}>
            <p className="font-mono text-[10px] tracking-[0.4em] text-gold-dim uppercase">Request Acknowledged</p>
            <h3 className="font-display text-3xl text-gold mt-3">{requested}</h3>
            <p className="text-foreground/80 mt-4 italic">
              The concierge has been notified. Attend the lobby. The matter is in hand.
            </p>
            <button onClick={() => setRequested(null)} className="mt-6 font-mono text-[11px] tracking-[0.3em] uppercase px-5 py-2 border border-gold text-gold hover:bg-gold hover:text-primary-foreground transition">
              Understood
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
