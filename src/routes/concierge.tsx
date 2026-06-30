import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Panel } from "../components/AppShell";

export const Route = createFileRoute("/concierge")({
  head: () => ({ meta: [{ title: "Conserjería — Continental" }, { name: "description", content: "Servicios discretos para miembros." }] }),
  component: Concierge,
});

const SERVICES = [
  { latin: "Cubiculum", title: "Alojamiento", desc: "Una habitación. Una puerta. Una vista, si lo desea. El Continental recuerda.", cost: "1 ⊙" },
  { latin: "Vinum", title: "Sommelier", desc: "Una botella de la bodega. La selección rara vez es suya.", cost: "2 ⊙" },
  { latin: "Medicus", title: "Médico", desc: "Tétanos, heridas de bala, laceraciones. Sin registros. Sin preguntas.", cost: "3 ⊙" },
  { latin: "Vestis", title: "Sastre", desc: "A medida · forros blindados · ajuste en el día.", cost: "4 ⊙" },
  { latin: "Mundator", title: "Limpiador", desc: "Cuando la habitación requiere atención, el limpiador acude.", cost: "5 ⊙" },
  { latin: "Cartographus", title: "Cartógrafo", desc: "Mapas que el registro no conserva. Rutas, salidas, ángulos ciegos.", cost: "2 ⊙" },
  { latin: "Sommelier Armorum", title: "Sommelier de Armas", desc: "Una cata. Alemana. Italiana. Rusa. Discreción como siempre.", cost: "3 ⊙" },
  { latin: "Equus", title: "Chófer", desc: "Coche negro. Silencioso. Conoce la ciudad antes de que la nombre.", cost: "1 ⊙" },
];

function Concierge() {
  const [requested, setRequested] = useState<string | null>(null);
  return (
    <AppShell title="Conserjería" latin="Cura · Solo por convocatoria">
      <Panel className="mb-6">
        <p className="font-display italic text-xl text-gold-dim leading-relaxed border-l-2 border-gold pl-5">
          "Cuanto necesite, la casa lo provee. Cuanto confiese, la casa lo olvida. Cuanto deba — la casa lo recuerda."
        </p>
        <p className="font-mono text-[10px] tracking-[0.3em] text-gold-dim uppercase mt-3 text-right">— El Gerente, NYC</p>
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
              <span className="text-gold-dim group-hover:text-gold">Convocar →</span>
            </div>
          </button>
        ))}
      </div>

      {requested && (
        <div className="fixed inset-0 z-50 bg-background/85 backdrop-blur-sm grid place-items-center p-6" onClick={() => setRequested(null)}>
          <div className="noir-panel gold-corners p-10 max-w-md text-center" onClick={(e) => e.stopPropagation()}>
            <p className="font-mono text-[10px] tracking-[0.4em] text-gold-dim uppercase">Petición Recibida</p>
            <h3 className="font-display text-3xl text-gold mt-3">{requested}</h3>
            <p className="text-foreground/80 mt-4 italic">
              Se ha notificado al conserje. Acuda al vestíbulo. El asunto está en buenas manos.
            </p>
            <button onClick={() => setRequested(null)} className="mt-6 font-mono text-[11px] tracking-[0.3em] uppercase px-5 py-2 border border-gold text-gold hover:bg-gold hover:text-primary-foreground transition">
              Entendido
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
