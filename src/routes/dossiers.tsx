import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Panel } from "../components/AppShell";

export const Route = createFileRoute("/dossiers")({
  head: () => ({ meta: [{ title: "Expedientes — Continental" }, { name: "description", content: "Expedientes de personal sellados." }] }),
  component: Dossiers,
});

type Dossier = {
  codename: string; latin: string; status: "ACTIVO" | "FALLECIDO" | "EXCOMM" | "RETIRADO";
  clearance: string; chapter: string; specialty: string; markers: number; notes: string;
};

const DOSSIERS: Dossier[] = [
  { codename: "Baba Yaga", latin: "Lupus Solitarius", status: "ACTIVO", clearance: "Aurum I", chapter: "Nueva York", specialty: "Trabajo con lápiz", markers: 2, notes: "Retirado. Luego no. Luego sí otra vez. No provocar." },
  { codename: "El Adjudicador", latin: "Vox Mensae", status: "ACTIVO", clearance: "Imperium", chapter: "Roma", specialty: "Arbitraje", markers: 0, notes: "Habla con la autoridad de la Mesa. Excomunión con su firma." },
  { codename: "Cassian", latin: "Custos Portae", status: "ACTIVO", clearance: "Aurum II", chapter: "Nueva York", specialty: "Sommelier · protección cercana", markers: 1, notes: "Conoce la bodega. Conoce la sala. Le conoce a usted." },
  { codename: "Sofia al-Azwar", latin: "Regina Casablancae", status: "ACTIVO", clearance: "Aurum I", chapter: "Casablanca", specialty: "Hospitalidad · canes", markers: 4, notes: "Gerente del capítulo marroquí. Debe un marcador." },
  { codename: "Winston", latin: "Princeps Hospitii", status: "RETIRADO", clearance: "Imperium", chapter: "Nueva York", specialty: "Gerencia", markers: 0, notes: "Mandato concluido. Estatus de la casa, incierto." },
  { codename: "Caronte", latin: "Portitor", status: "FALLECIDO", clearance: "Aurum II", chapter: "Nueva York", specialty: "Conserjería", markers: 0, notes: "In memoriam. El vestíbulo recuerda." },
  { codename: "Srta. Perkins", latin: "Praedatrix", status: "EXCOMM", clearance: "—", chapter: "Antes NYC", specialty: "Trabajo sucio", markers: 0, notes: "Membresía revocada. Todos los servicios denegados." },
  { codename: "Zero", latin: "Umbra Silens", status: "ACTIVO", clearance: "Aurum III", chapter: "Osaka", specialty: "Armas blancas · meditación", markers: 1, notes: "Devoto. Devoto. Letal." },
];

const STATUS_COLOR: Record<Dossier["status"], string> = {
  ACTIVO: "text-gold border-gold",
  FALLECIDO: "text-muted-foreground border-muted-foreground",
  EXCOMM: "text-destructive border-destructive",
  RETIRADO: "text-gold-dim border-gold-dim",
};

function Dossiers() {
  const [active, setActive] = useState<Dossier>(DOSSIERS[0]);
  const [query, setQuery] = useState("");
  const filtered = DOSSIERS.filter((d) =>
    (d.codename + d.chapter + d.specialty).toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AppShell title="Expedientes" latin="Tabulae · Archivos sellados de personal">
      <div className="grid lg:grid-cols-[360px_1fr] gap-6">
        <Panel className="!p-0">
          <div className="p-4 border-b border-gold-dim">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="QUAERE · buscar archivos"
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
            · Confidencial · Solo Lectura ·
          </div>
          <p className="font-mono text-[10px] tracking-[0.3em] text-gold-dim uppercase">Nombre en clave</p>
          <h2 className="font-display text-5xl text-gold mt-2">{active.codename}</h2>
          <p className="font-display text-gold-dim italic mt-1">{active.latin}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <Field label="Estatus" value={active.status} />
            <Field label="Autorización" value={active.clearance} />
            <Field label="Capítulo" value={active.chapter} />
            <Field label="Marcadores" value={String(active.markers)} />
          </div>

          <div className="mt-8">
            <p className="font-mono text-[10px] tracking-[0.3em] text-gold-dim uppercase">Especialidad</p>
            <p className="text-gold mt-1">{active.specialty}</p>
          </div>

          <div className="mt-6 border-l-2 border-gold pl-4">
            <p className="font-mono text-[10px] tracking-[0.3em] text-gold-dim uppercase mb-2">Notas de Campo</p>
            <p className="text-foreground/90 italic">"{active.notes}"</p>
          </div>

          <div className="mt-8 border-t border-gold-dim pt-4 font-mono text-[10px] text-gold-dim tracking-[0.25em] flex justify-between uppercase">
            <span>EXP · {active.codename.replace(/\s+/g, "-").toUpperCase()}-{Math.abs(active.codename.length * 37) % 9999}</span>
            <span>SELLO · ✦ MESA ALTA ✦</span>
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
