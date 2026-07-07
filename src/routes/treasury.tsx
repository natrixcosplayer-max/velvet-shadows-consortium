import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Panel } from "../components/AppShell";
import { playSfx } from "../audio/audiomanager";

export const Route = createFileRoute("/treasury")({
  head: () => ({ meta: [{ title: "Tesorería — Continental" }, { name: "description", content: "Economía de monedas y marcadores." }] }),
  component: Treasury,
});

function Treasury() {
  const [balance, setBalance] = useState(6);
  const [log, setLog] = useState<{ kind: "+" | "−"; amt: number; reason: string; at: string }[]>([
        { kind: "+", amt: 1, reason: "Ayuda para la misión · Valencia", at: "Hace 3 días" },
    { kind: "−", amt: 1, reason: "Vehículo blindado · Gijón", at: "Hace 7 días, 022:13" },
    { kind: "+", amt: 10, reason: "Misión Cumplida · Roma", at: "Hace 13 días" },
    { kind: "−", amt: 2, reason: "Entrenamiento físico de élite · Valencia", at: "Hace 23 días" },
    { kind: "−", amt: 4, reason: "Compra de Pitas de KEVLAR · Osaka", at: "Hace 7 semanas" },
  ]);

  const spend = (n: number, reason: string) => {
    playSfx("/sounds/coin.mp3");
    if (balance < n) return;
    setBalance((b) => b - n);
    setLog((l) => [{ kind: "−", amt: n, reason, at: "Ahora mismo" }, ...l]);
  };

  return (
    <AppShell title="Tesorería" latin="Aerarium · Monedas y Marcadores">
      <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
        <Panel className="relative overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
          <div className="relative flex flex-col items-center text-center py-8">
            <Coin />
            <p className="font-mono text-[10px] tracking-[0.4em] text-gold-dim uppercase mt-6">Saldo en Monedas</p>
            <p className="font-display text-7xl text-gold mt-2 inline-flex items-center gap-2">
              <span>{balance}</span>
              <span className="text-3xl leading-none">⊙</span>
            </p>
            <p className="font-mono text-xs text-foreground/70 mt-3 max-w-md italic">
              "Una moneda. Un servicio. Sin excepciones. El valor no está en el metal sino en el juramento."
            </p>
            <div className="mt-6 flex gap-3 flex-wrap justify-center">
              <ActionBtn onClick={() => spend(1, "Habitación · una noche")}>Alojamiento · 1 ⊙</ActionBtn>
              <ActionBtn onClick={() => spend(2, "Sommelier")}>Sommelier · 2 ⊙</ActionBtn>
              <ActionBtn onClick={() => spend(3, "Médico")}>Médico · 3 ⊙</ActionBtn>
            </div>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title="Tabla de Conversión" latin="Tabula Mutationis">
            <ul className="font-mono text-sm divide-y divide-gold-dim/40">
              {[
                ["1 ⊙", "= Continental · una noche"],
                ["5 ⊙", "= Armas y blindaje"],
                ["1 ⊙", "= Cuidado de mascotas"],
                ["3 ⊙", "= Médico · sin preguntas"],
                ["5 ⊙", "= Delegar contrato u operativo"],
                ["1 Marcador", "= Deuda sin límite"],
              ].map(([k, v], i) => (
                <li key={i} className="flex justify-between py-2.5">
                  <span className="text-gold">{k}</span>
                  <span className="text-foreground/80">{v}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Libro Mayor" latin="Codex Rationum">
            <ul className="font-mono text-xs">
              {log.map((e, i) => (
                <li key={i} className="flex justify-between items-center py-2.5 border-b border-gold-dim/30 last:border-0">
                  <span className="flex items-center gap-3">
                    <span className={`w-6 h-6 grid place-items-center border ${e.kind === "+" ? "border-gold text-gold" : "border-destructive text-destructive"}`}>{e.kind}</span>
                    <span>
                      <span className="text-gold block">{e.reason}</span>
                      <span className="text-gold-dim text-[10px] tracking-[0.2em]">{e.at}</span>
                    </span>
                  </span>
                  <span className={`font-display text-lg ${e.kind === "+" ? "text-gold" : "text-destructive"}`}>
                    {e.kind}{e.amt} ⊙
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}

function ActionBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="font-mono text-[11px] tracking-[0.3em] uppercase px-4 py-2 border border-gold-dim text-gold-dim hover:border-gold hover:text-gold transition">
      {children}
    </button>
  );
}

function Coin() {
  return (
    <div className="relative w-40 h-40 rounded-full" style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-gold), 0 0 80px -10px var(--gold)" }}>
      <div className="absolute inset-2 rounded-full border-2 border-background/40 flex items-center justify-center">
        <div className="text-center text-background">
          <p className="font-display text-2xl leading-none">EX</p>
          <p className="font-mono text-[8px] tracking-[0.3em] my-1">CONTINENTALIS</p>
          <p className="font-display text-2xl leading-none">UMBRA</p>
        </div>
      </div>
      <div className="absolute inset-0 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle at 30% 30%, oklch(1 0 0 / 25%), transparent 50%)" }} />
    </div>
  );
}
