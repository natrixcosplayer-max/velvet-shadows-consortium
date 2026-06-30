import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Panel } from "../components/AppShell";

export const Route = createFileRoute("/council")({
  head: () => ({ meta: [{ title: "Alto Consejo — Continental" }, { name: "description", content: "Concilium Altum · La Mesa Alta." }] }),
  component: Council,
});

const SEATS = [
  { seat: "I", name: "Il Direttore", latin: "Sedes Primaria", chapter: "Camorra · Nápoles", tenure: "MMXIX—" },
  { seat: "II", name: "Berrada", latin: "Sedes Secunda", chapter: "Magreb · Tánger", tenure: "MMXVII—" },
  { seat: "III", name: "El Marqués", latin: "Sedes Tertia", chapter: "Haute Table · París", tenure: "MMXX—MMXXII †" },
  { seat: "IV", name: "Khun Po", latin: "Sedes Quarta", chapter: "Sindicato de Bangkok", tenure: "MMXXI—" },
  { seat: "V", name: "Madre Ruska", latin: "Sedes Quinta", chapter: "Casa Tarasov · Moscú", tenure: "MMXVIII—" },
  { seat: "VI", name: "Anciano del Sendero", latin: "Sedes Sexta", chapter: "La Espesura", tenure: "Sin fin" },
  { seat: "VII", name: "[ CENSURADO ]", latin: "Sedes Septima", chapter: "—", tenure: "Vacante" },
  { seat: "VIII", name: "[ CENSURADO ]", latin: "Sedes Octava", chapter: "—", tenure: "Sellado" },
];

function Council() {
  return (
    <AppShell title="Alto Consejo" latin="Concilium Altum · La Mesa Alta">
      <Panel className="mb-8">
        <div className="grid md:grid-cols-[auto_1fr] gap-6 items-center">
          <Seal />
          <div>
            <p className="font-mono text-[10px] tracking-[0.4em] text-gold-dim uppercase">Declaración</p>
            <p className="font-display text-2xl text-gold mt-2 leading-relaxed">
              Sub mensa alta, omnia. Sobre la Mesa Alta, nada.
            </p>
            <p className="mt-4 text-foreground/80 leading-relaxed max-w-2xl">
              El Consejo se compone de doce asientos. Ocho son conocidos. Cuatro no. Sus juicios son definitivos, sus silencios más fuertes. Ser convocado es honor. Ser sentenciado es final.
            </p>
          </div>
        </div>
      </Panel>

      <Panel title="Los Doce Asientos" latin="Duodecim Sedes" className="mb-8">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
          {SEATS.map((s) => {
            const redacted = s.name.includes("CENSURADO");
            return (
              <div key={s.seat} className={`border p-4 ${redacted ? "border-destructive/40 bg-destructive/5" : "border-gold-dim"}`}>
                <p className="font-display text-3xl text-gold">{s.seat}</p>
                <p className={`font-display text-lg mt-1 ${redacted ? "text-destructive" : "text-gold"}`}>{s.name}</p>
                <p className="font-display italic text-xs text-gold-dim">{s.latin}</p>
                <p className="font-mono text-[10px] text-foreground/70 mt-3 tracking-[0.2em]">{s.chapter}</p>
                <p className="font-mono text-[10px] text-gold-dim mt-1 tracking-[0.2em]">{s.tenure}</p>
              </div>
            );
          })}
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border border-gold-dim/30 p-4 bg-background/40">
              <p className="font-display text-3xl text-gold-dim">{["IX", "X", "XI", "XII"][i]}</p>
              <p className="font-mono text-[10px] tracking-[0.3em] text-destructive mt-2 animate-flicker uppercase">· Oculto ·</p>
              <p className="font-mono text-[10px] text-gold-dim mt-3 tracking-[0.2em]">Identidad retenida bajo juramento.</p>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6">
        <Panel title="Convocatoria" latin="Convocatio">
          <ul className="font-mono text-sm space-y-4">
            <li className="flex gap-4">
              <span className="text-gold-dim w-24 shrink-0 text-[10px] tracking-[0.25em] pt-1">III · MMXXVI</span>
              <span><span className="text-gold block">Casa Capitular de Roma</span><span className="text-foreground/70 text-xs">Sesión plenaria. Etiqueta. Protocolo Sello Imperium.</span></span>
            </li>
            <li className="flex gap-4">
              <span className="text-gold-dim w-24 shrink-0 text-[10px] tracking-[0.25em] pt-1">XII · MMXXVI</span>
              <span><span className="text-gold block">Casablanca · Cerrada</span><span className="text-foreground/70 text-xs">Adjudicación, sellada. Solo por invitación.</span></span>
            </li>
            <li className="flex gap-4">
              <span className="text-gold-dim w-24 shrink-0 text-[10px] tracking-[0.25em] pt-1">— · —</span>
              <span><span className="text-gold block">[ Ubicación Reservada ]</span><span className="text-foreground/70 text-xs">Sentencia. Sin observadores.</span></span>
            </li>
          </ul>
        </Panel>

        <Panel title="Edictos Vigentes" latin="Edicta Vigentia">
          <ol className="font-mono text-sm space-y-3">
            <li><span className="text-gold-dim">I.</span> <span className="text-foreground/85">Ningún miembro alzará la mano contra otro en suelo del Continental. Excomunión al incumplir.</span></li>
            <li><span className="text-gold-dim">II.</span> <span className="text-foreground/85">Los marcadores trascienden la muerte. Los herederos heredan la deuda.</span></li>
            <li><span className="text-gold-dim">III.</span> <span className="text-foreground/85">Los contratos por encima del nivel IV requieren el consentimiento del Consejo.</span></li>
            <li><span className="text-gold-dim">IV.</span> <span className="text-foreground/85">La Espesura es soberana. Sus ancianos, intocables.</span></li>
            <li><span className="text-gold-dim">V.</span> <span className="text-foreground/85">La membresía es por sangre y juramento. No se da. No se vende.</span></li>
          </ol>
        </Panel>
      </div>
    </AppShell>
  );
}

function Seal() {
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" className="text-gold">
      <defs>
        <radialGradient id="g">
          <stop offset="0%" stopColor="oklch(0.88 0.16 88)" />
          <stop offset="100%" stopColor="oklch(0.55 0.08 80)" />
        </radialGradient>
      </defs>
      <circle cx="70" cy="70" r="66" fill="none" stroke="currentColor" strokeWidth="0.5" />
      <circle cx="70" cy="70" r="60" fill="none" stroke="currentColor" />
      <circle cx="70" cy="70" r="52" fill="none" stroke="currentColor" strokeWidth="0.5" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const x = 70 + Math.cos(a) * 56;
        const y = 70 + Math.sin(a) * 56;
        return <circle key={i} cx={x} cy={y} r="2.5" fill="url(#g)" />;
      })}
      <polygon points="70,28 84,70 70,112 56,70" fill="url(#g)" />
      <text x="70" y="76" textAnchor="middle" fontFamily="Cinzel" fontSize="14" fill="var(--background)" fontWeight="700">XII</text>
    </svg>
  );
}
