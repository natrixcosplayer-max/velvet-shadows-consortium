import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Panel } from "../components/AppShell";

export const Route = createFileRoute("/missions")({
  head: () => ({ meta: [{ title: "Contratos — Continental" }, { name: "description", content: "Contratos abiertos y sellados." }] }),
  component: Missions,
});

type Mission = {
  id: string; title: string; latin: string; city: string; bounty: number;
  tier: "I" | "II" | "III" | "IV"; status: "ABIERTO" | "TOMADO" | "SELLADO" | "CUMPLIDO";
  brief: string; deadline: string;
};

const MISSIONS: Mission[] = [
  { id: "M-7741", title: "La Petición del Sommelier", latin: "Petitio Sommelarii", city: "Nueva York", bounty: 6, tier: "II", status: "ABIERTO",
    brief: "Un huésped de la casa ha solicitado una cata. La selección debe ser germánica. Discreción absoluta.", deadline: "72h" },
  { id: "M-8120", title: "Gala Carmesí", latin: "Conventus Cruentus", city: "Roma", bounty: 14, tier: "IV", status: "ABIERTO",
    brief: "Una invitación requiere acompañante. El anfitrión exige puntualidad. Etiqueta. Sin armas mayores al .380.", deadline: "5 días" },
  { id: "M-8201", title: "Auditoría Silenciosa", latin: "Census Tacitus", city: "Casablanca", bounty: 4, tier: "I", status: "TOMADO",
    brief: "Un libro mayor requiere verificación. El contable es cooperativo. Los números, menos.", deadline: "10 días" },
  { id: "M-8244", title: "Fiesta del Jardín", latin: "Hortus Silens", city: "Osaka", bounty: 9, tier: "III", status: "SELLADO",
    brief: "Por invitación de la Mesa Alta. Informe a la llegada.", deadline: "—" },
  { id: "M-7689", title: "Restitución de Bienes", latin: "Restitutio", city: "Berlín", bounty: 5, tier: "II", status: "CUMPLIDO",
    brief: "Una reliquia ha sido recuperada. La parte está agradecida.", deadline: "Cerrado" },
];

const TIER_COLOR: Record<Mission["tier"], string> = {
  I: "text-gold-dim", II: "text-gold", III: "text-gold-bright", IV: "text-destructive",
};
const STATUS_BADGE: Record<Mission["status"], string> = {
  ABIERTO: "text-gold border-gold animate-pulse-gold",
  TOMADO: "text-gold-dim border-gold-dim",
  SELLADO: "text-destructive border-destructive",
  CUMPLIDO: "text-muted-foreground border-muted-foreground line-through",
};

function Missions() {
  const [filter, setFilter] = useState<Mission["status"] | "TODOS">("TODOS");
  const visible = MISSIONS.filter((m) => filter === "TODOS" || m.status === filter);

  return (
    <AppShell title="Contratos" latin="Mandata · Registro abierto">
      <div className="flex flex-wrap gap-2 mb-6 font-mono text-[11px] tracking-[0.25em] uppercase">
        {(["TODOS", "ABIERTO", "TOMADO", "SELLADO", "CUMPLIDO"] as const).map((f) => (
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
              <Stat label="Recompensa" value={`${m.bounty} ⊙`} />
              <Stat label="Nivel" value={m.tier} className={TIER_COLOR[m.tier]} />
              <Stat label="Plazo" value={m.deadline} />
            </div>

            {m.status === "ABIERTO" && (
              <button className="mt-5 w-full font-mono text-[11px] tracking-[0.3em] uppercase py-2 border border-gold text-gold hover:bg-gold hover:text-primary-foreground transition">
                Aceptar Contrato
              </button>
            )}
          </article>
        ))}
      </div>

      <Panel title="Registro de Marcadores" latin="Numerarium Mortis" className="mt-10">
        <table className="w-full font-mono text-xs">
          <thead className="text-gold-dim text-[10px] tracking-[0.3em] uppercase border-b border-gold-dim">
            <tr><th className="text-left py-2">Marcador</th><th className="text-left">Portador</th><th className="text-left">Debido por</th><th className="text-right">Estatus</th></tr>
          </thead>
          <tbody className="text-gold">
            {[
              ["MK-001", "Casa Tarasov", "Usted", "Activo"],
              ["MK-014", "Sofia al-Azwar", "Usted", "Pendiente"],
              ["MK-027", "Usted", "Adjudicador V.", "Retenido"],
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
