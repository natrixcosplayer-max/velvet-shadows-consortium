import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Panel } from "../components/AppShell";

export const Route = createFileRoute("/dossiers")({
  head: () => ({ meta: [{ title: "Dossiers — Continental" }, { name: "description", content: "Sealed personnel files." }] }),
  component: Dossiers,
});

type Dossier = {
  codename: string; latin: string; status: "ACTIVE" | "DECEASED" | "EXCOMM" | "RETIRED";
  clearance: string; chapter: string; specialty: string; markers: number; notes: string;
};

const DOSSIERS: Dossier[] = [
  { codename: "Baba Yaga", latin: "Lupus Solitarius", status: "ACTIVE", clearance: "Aurum I", chapter: "New York", specialty: "Pencil work", markers: 2, notes: "Retired. Then unretired. Then retired again. Do not provoke." },
  { codename: "The Adjudicator", latin: "Vox Mensae", status: "ACTIVE", clearance: "Imperium", chapter: "Rome", specialty: "Arbitration", markers: 0, notes: "Speaks with the authority of the Table. Excommunication on signature." },
  { codename: "Cassian", latin: "Custos Portae", status: "ACTIVE", clearance: "Aurum II", chapter: "New York", specialty: "Sommelier · close protection", markers: 1, notes: "Knows the cellar. Knows the room. Knows you." },
  { codename: "Sofia al-Azwar", latin: "Regina Casablancae", status: "ACTIVE", clearance: "Aurum I", chapter: "Casablanca", specialty: "Hospitality · canines", markers: 4, notes: "Manager of the Moroccan chapter. Owes one marker." },
  { codename: "Winston", latin: "Princeps Hospitii", status: "RETIRED", clearance: "Imperium", chapter: "New York", specialty: "Management", markers: 0, notes: "Tenure ended. Status of the house, uncertain." },
  { codename: "Charon", latin: "Portitor", status: "DECEASED", clearance: "Aurum II", chapter: "New York", specialty: "Concierge", markers: 0, notes: "In memoriam. The lobby remembers." },
  { codename: "Ms. Perkins", latin: "Praedatrix", status: "EXCOMM", clearance: "—", chapter: "Formerly NYC", specialty: "Wet work", markers: 0, notes: "Membership revoked. All services denied." },
  { codename: "Zero", latin: "Umbra Silens", status: "ACTIVE", clearance: "Aurum III", chapter: "Osaka", specialty: "Edged weapons · meditation", markers: 1, notes: "Devoted. Devout. Deadly." },
];

const STATUS_COLOR: Record<Dossier["status"], string> = {
  ACTIVE: "text-gold border-gold",
  DECEASED: "text-muted-foreground border-muted-foreground",
  EXCOMM: "text-destructive border-destructive",
  RETIRED: "text-gold-dim border-gold-dim",
};

function Dossiers() {
  const [active, setActive] = useState<Dossier>(DOSSIERS[0]);
  const [query, setQuery] = useState("");
  const filtered = DOSSIERS.filter((d) =>
    (d.codename + d.chapter + d.specialty).toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AppShell title="Dossiers" latin="Tabulae · Sealed personnel files">
      <div className="grid lg:grid-cols-[360px_1fr] gap-6">
        <Panel className="!p-0">
          <div className="p-4 border-b border-gold-dim">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="QUAERE · search files"
              className="w-full bg-background border border-gold-dim px-3 py-2 font-mono text-xs tracking-[0.2em] text-gold placeholder:text-gold-dim focus:outline-none focus:border-gold uppercase"
            />
          </div>
          <ul className="max-h-[600px] overflow-y-auto">
            {filtered.map((d) => (
              <li key={d.codename}>
                <button
                  onClick={() => setActive(d)}
                  className={`w-full text-left p-4 border-b border-gold-dim/40 hover:bg-secondary/40 transition ${active.codename === d.codename ? "bg-secondary/60 border-l-2 border-l-gold" : ""}`}
                >
                  <div className="flex justify-between items-baseline">
                    <span className="font-display text-gold">{d.codename}</span>
                    <span className={`font-mono text-[9px] tracking-[0.25em] px-1.5 py-0.5 border ${STATUS_COLOR[d.status]}`}>{d.status}</span>
                  </div>
                  <p className="font-mono text-[10px] text-gold-dim tracking-[0.2em] mt-1 uppercase">{d.chapter} · {d.specialty}</p>
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="relative">
          <div className="absolute top-6 right-6 font-mono text-[10px] tracking-[0.3em] text-destructive border border-destructive px-2 py-1 uppercase animate-flicker">
            · Confidential · Eyes Only ·
          </div>
          <p className="font-mono text-[10px] tracking-[0.3em] text-gold-dim uppercase">Codename</p>
          <h2 className="font-display text-5xl text-gold mt-2">{active.codename}</h2>
          <p className="font-display text-gold-dim italic mt-1">{active.latin}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <Field label="Status" value={active.status} />
            <Field label="Clearance" value={active.clearance} />
            <Field label="Chapter" value={active.chapter} />
            <Field label="Markers" value={String(active.markers)} />
          </div>

          <div className="mt-8">
            <p className="font-mono text-[10px] tracking-[0.3em] text-gold-dim uppercase">Specialty</p>
            <p className="text-gold mt-1">{active.specialty}</p>
          </div>

          <div className="mt-6 border-l-2 border-gold pl-4">
            <p className="font-mono text-[10px] tracking-[0.3em] text-gold-dim uppercase mb-2">Field Notes</p>
            <p className="text-foreground/90 italic">"{active.notes}"</p>
          </div>

          <div className="mt-8 border-t border-gold-dim pt-4 font-mono text-[10px] text-gold-dim tracking-[0.25em] flex justify-between uppercase">
            <span>FILE · {active.codename.replace(/\s+/g, "-").toUpperCase()}-{Math.abs(active.codename.length * 37) % 9999}</span>
            <span>SEAL · ✦ HIGH TABLE ✦</span>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gold-dim p-3">
      <p className="font-mono text-[9px] tracking-[0.3em] text-gold-dim uppercase">{label}</p>
      <p className="font-display text-gold mt-1">{value}</p>
    </div>
  );
}
