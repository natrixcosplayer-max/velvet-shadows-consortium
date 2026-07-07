import mandarinPhoto from "../assets/agents/mandarin.jpg";
import minervaPhoto from "../assets/agents/minerva.jpg";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Panel } from "../components/AppShell";

export const Route = createFileRoute("/dossiers")({
  head: () => ({ meta: [{ title: "Expedientes" }, { name: "description", content: "Expedientes de personal sellados." }] }),
  component: Dossiers,
});

type Dossier = {
  codename: string; latin: string; status: "ACTIVO" | "FALLECIDO" | "EXCOMM" | "RETIRADO";
  clearance: string; chapter: string; specialty: string; markers: number; notes: string; bio: string;
  
};

const DOSSIERS: Dossier[] = [
  { codename: "Mandarin", latin: "Agente vociferador", status: "ACTIVO", clearance: "Aurum VII", chapter: "Valencia", specialty: "Liderazgo & Organización", markers: 1, notes: "Impulsivo, pero efectivo. Operador excepcional. Discreto únicamente cuando está dormido.", bio: "Operativo veterano especializado en camuflaje y combate táctico. Su capacidad para ser un motor incansable y resolver situaciones críticas le ha convertido en uno de los agentes más fiables de la Comisión. Alta capacidad de liderazgo y organizativa. La discreción no figura entre las fortalezas del sujeto. Presenta una marcada tendencia a elevar el volumen de voz incluso en entornos donde el anonimato resulta recomendable. Se aprueba la asignación conjunta con el Agente MINERVA para compensar dichas vulnerabilidades.", },
  { codename: "Minerva", latin: "Diplomacia y discreción", status: "ACTIVO", clearance: "Imperium", chapter: "Valencia", specialty: "Encanto", markers: 0, notes: "La mayoría de las operaciones concluyen sin un solo disparo. Las pocas excepciones suelen ser responsabilidad del Agente A.", bio: "Especialista en inteligencia, negociación y obtención de información sensible. Experta en aproximarse a objetivos de alto valor sin despertar sospechas. La Comisión la considera una de sus mejores agentes de campo para operaciones de máxima discreción. Domina una técnica de inmovilización clasificada, ejecutada con las extremidades inferiores, capaz de neutralizar incluso a oponentes físicamente superiores. Ha sido asignada a la supervisión táctica del Agente A, aportando equilibrio, criterio y contención para maximizar el éxito de la misión.",},
];

const STATUS_COLOR: Record<Dossier["status"], string> = {
  ACTIVO: "text-gold border-gold",
  FALLECIDO: "text-muted-foreground border-muted-foreground",
  EXCOMM: "text-destructive border-destructive",
  RETIRADO: "text-gold-dim border-gold-dim",
};
const AGENT_PHOTOS: Record<string, string> = {
  Mandarin: mandarinPhoto,
  Minerva: minervaPhoto,
};

function Dossiers() {
  const [active, setActive] = useState<Dossier>(DOSSIERS[0]);
  const [query, setQuery] = useState("");
  const filtered = DOSSIERS.filter((d) =>
    (d.codename + d.chapter + d.specialty).toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AppShell title="Expedientes" latin="OPERACIÓN PRIORITARIA · CLASIFICACIÓN VII">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
        <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent animate-scan pointer-events-none" />
        <div className="relative grid lg:grid-cols-[360px_1fr] gap-6">
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
                  onClick={() => {
  let sound = "/sounds/agent.mp3";

  if (d.codename === "Mandarin") {
    sound = "/sounds/mandarin.mp3";
  } else if (d.codename === "Minerva") {
    sound = "/sounds/minerva.mp3";
  }

  const audio = new Audio(sound);
  audio.volume = 0.4;
  audio.play().catch(() => {});

  setActive(d);
}}
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

        <Panel className="relative overflow-hidden">
          {(active.codename === "Mandarin" || active.codename === "Minerva") && (
            <div className="absolute inset-0 pointer-events-none grid-bg opacity-35" />
          )}

          <div className="relative z-10">
          <p className="font-mono text-[10px] tracking-[0.3em] text-gold-dim uppercase">Nombre en clave</p>
          <h2 className="font-display text-5xl text-gold mt-2">{active.codename}</h2>
          <p className="font-display text-gold-dim italic mt-1">{active.latin}</p>
          <div className="mx-auto w-fit md:absolute md:top-6 md:right-6 mt-6 md:mt-0 font-mono text-[8px] md:text-[10px] tracking-[0.3em] text-destructive border border-destructive px-2 py-1 uppercase animate-flicker">
            · Confidencial · Solo Lectura ·
          </div>
          <div className="mt-4 md:mt-8 flex justify-center">
            <div className={`relative ${active.codename === "Mandarin" || active.codename === "Minerva" ? "scanlines" : ""}`}>
              <div className="absolute inset-0 -z-10 scale-110 rounded-sm bg-gold/20 blur-xl" />
              <img
                src={AGENT_PHOTOS[active.codename]}
                alt={active.codename}
                className={`w-64 h-80 object-cover border border-gold shadow-lg ${active.codename === "Mandarin" || active.codename === "Minerva" ? "animate-flicker" : ""}`}
              />
            </div>
          </div>

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
          <div className="mt-8">
    <p className="font-mono text-[10px] tracking-[0.3em] text-gold-dim uppercase">
        Biografía
    </p>

    <p className="text-foreground/90 leading-7 mt-3">
        {active.bio}
    </p>
</div>

          <div className="mt-6 border-l-2 border-gold pl-4">
            <p className="font-mono text-[10px] tracking-[0.3em] text-gold-dim uppercase mb-2">Notas de Campo</p>
            <p className="text-foreground/90 italic">"{active.notes}"</p>
          </div>

          <div className="mt-8 border-t border-gold-dim pt-4 font-mono text-[10px] text-gold-dim tracking-[0.25em] flex justify-between uppercase">
            <span>EXP · {active.codename.replace(/\s+/g, "-").toUpperCase()}-{Math.abs(active.codename.length * 37) % 9999}</span>
            <span>SELLO · ✦ ALTA MESA ✦</span>
          </div>
          </div>
        </Panel>
      </div>
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
