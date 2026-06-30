import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Panel } from "../components/AppShell";

export const Route = createFileRoute("/missions")({
  head: () => ({ meta: [{ title: "Contracts — Continental" }, { name: "description", content: "Open and sealed contracts." }] }),
  component: Missions,
});

type Mission = {
  id: string; title: string; latin: string; city: string; bounty: number;
  tier: "I" | "II" | "III" | "IV"; status: "OPEN" | "CLAIMED" | "SEALED" | "FULFILLED";
  brief: string; deadline: string;
};

const MISSIONS: Mission[] = [
  { id: "M-7741", title: "The Sommelier's Request", latin: "Petitio Sommelarii", city: "New York", bounty: 6, tier: "II", status: "OPEN",
    brief: "A guest of the house has requested a tasting. The selection must be Germanic. Discretion absolute.", deadline: "72h" },
  { id: "M-8120", title: "Crimson Gala", latin: "Conventus Cruentus", city: "Rome", bounty: 14, tier: "IV", status: "OPEN",
    brief: "An invitation requires a plus-one. The host expects punctuality. Black tie. No firearms above the .380.", deadline: "5 days" },
  { id: "M-8201", title: "Quiet Audit", latin: "Census Tacitus", city: "Casablanca", bounty: 4, tier: "I", status: "CLAIMED",
    brief: "A ledger requires verification. The bookkeeper is cooperative. The numbers, less so.", deadline: "10 days" },
  { id: "M-8244", title: "Garden Party", latin: "Hortus Silens", city: "Osaka", bounty: 9, tier: "III", status: "SEALED",
    brief: "By invitation of the High Table. Brief on arrival.", deadline: "—" },
  { id: "M-7689", title: "Return of Property", latin: "Restitutio", city: "Berlin", bounty: 5, tier: "II", status: "FULFILLED",
    brief: "An heirloom is recovered. The party is grateful.", deadline: "Closed" },
];

const TIER_COLOR: Record<Mission["tier"], string> = {
  I: "text-gold-dim", II: "text-gold", III: "text-gold-bright", IV: "text-destructive",
};
const STATUS_BADGE: Record<Mission["status"], string> = {
  OPEN: "text-gold border-gold animate-pulse-gold",
  CLAIMED: "text-gold-dim border-gold-dim",
  SEALED: "text-destructive border-destructive",
  FULFILLED: "text-muted-foreground border-muted-foreground line-through",
};

function Missions() {
  const [filter, setFilter] = useState<Mission["status"] | "ALL">("ALL");
  const visible = MISSIONS.filter((m) => filter === "ALL" || m.status === filter);

  return (
    <AppShell title="Contracts" latin="Mandata · Open ledger">
      <div className="flex flex-wrap gap-2 mb-6 font-mono text-[11px] tracking-[0.25em] uppercase">
        {(["ALL", "OPEN", "CLAIMED", "SEALED", "FULFILLED"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 border transition ${filter === f ? "border-gold bg-gold text-primary-foreground" : "border-gold-dim text-gold-dim hover:border-gold hover:text-gold"}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {visible.map((m) => (
          <article key={m.id} className="noir-panel gold-corners p-6 hover:scale-[1.01] transition group">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-mono text-[10px] tracking-[0.3em] text-gold-dim uppercase">{m.id} · {m.city}</p>
                <h3 className="font-display text-2xl text-gold mt-1">{m.title}</h3>
                <p className="font-display text-gold-dim italic text-sm">{m.latin}</p>
              </div>
              <span className={`font-mono text-[9px] tracking-[0.3em] px-2 py-1 border uppercase ${STATUS_BADGE[m.status]}`}>
                {m.status}
              </span>
            </div>

            <p className="text-sm text-foreground/85 leading-relaxed border-l-2 border-gold-dim pl-3 my-4">
              {m.brief}
            </p>

            <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-gold-dim">
              <Stat label="Bounty" value={`${m.bounty} ⊙`} />
              <Stat label="Tier" value={m.tier} className={TIER_COLOR[m.tier]} />
              <Stat label="Window" value={m.deadline} />
            </div>

            {m.status === "OPEN" && (
              <button className="mt-5 w-full font-mono text-[11px] tracking-[0.3em] uppercase py-2 border border-gold text-gold hover:bg-gold hover:text-primary-foreground transition">
                Accept Contract
              </button>
            )}
          </article>
        ))}
      </div>

      <Panel title="Marker Ledger" latin="Numerarium Mortis" className="mt-10">
        <table className="w-full font-mono text-xs">
          <thead className="text-gold-dim text-[10px] tracking-[0.3em] uppercase border-b border-gold-dim">
            <tr><th className="text-left py-2">Marker</th><th className="text-left">Holder</th><th className="text-left">Owed By</th><th className="text-right">Status</th></tr>
          </thead>
          <tbody className="text-gold">
            {[
              ["MK-001", "House of Tarasov", "You", "Active"],
              ["MK-014", "Sofia al-Azwar", "You", "Pending"],
              ["MK-027", "You", "Adjudicator V.", "Held"],
            ].map((r, i) => (
              <tr key={i} className="border-b border-gold-dim/30">
                <td className="py-3">{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td>
                <td className="text-right text-gold-dim">{r[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </AppShell>
  );
}

function Stat({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div>
      <p className="font-mono text-[9px] tracking-[0.3em] text-gold-dim uppercase">{label}</p>
      <p className={`font-display text-lg mt-1 ${className || "text-gold"}`}>{value}</p>
    </div>
  );
}
