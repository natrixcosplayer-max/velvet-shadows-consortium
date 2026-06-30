import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Panel } from "../components/AppShell";

export const Route = createFileRoute("/comms")({
  head: () => ({ meta: [{ title: "Comunicaciones — Continental" }, { name: "description", content: "Comunicaciones cifradas." }] }),
  component: Comms,
});

type Msg = { id: string; from: string; subject: string; body: string; at: string; cipher: string; unread?: boolean };

const THREADS: Msg[] = [
  { id: "1", from: "Gerente · NYC", subject: "Su habitación de siempre", body: "La Presidencial está lista. Lino como lo prefiere. La ventana da al este. Cassian le recogerá en el vestíbulo a las 23:00. Discreción: absoluta.", at: "03:14", cipher: "RSA-4096 / Curve25519", unread: true },
  { id: "2", from: "Adjudicador Vex", subject: "Re: El asunto", body: "La Mesa ha revisado su escrito. La sentencia se mantiene. Los marcadores MK-001 y MK-014 permanecen en el registro público. No intente resolución privada.", at: "Ayer", cipher: "AES-512-GCM", unread: true },
  { id: "3", from: "Sommelier · Roma", subject: "Latour '47", body: "Una botella está reservada a su nombre. Sala de cata seis. No traiga acompañantes. La puerta de la bodega cierra a las cuatro.", at: "Hace 2 días", cipher: "Onda Continental" },
  { id: "4", from: "Conserje · Osaka", subject: "Médico", body: "Médico disponible entre la medianoche y el alba. Tétanos, heridas de bala, laceraciones. Sin preguntas, sin registros.", at: "Hace 3 días", cipher: "RSA-4096" },
  { id: "5", from: "Mesa Alta · Concilium", subject: "Convocatoria", body: "Se requiere su presencia. Casa capitular de Roma. Medianoche, el día tres del mes. Etiqueta. Sin excepciones.", at: "Hace 1 semana", cipher: "Sello Imperium" },
];

function Comms() {
  const [open, setOpen] = useState(THREADS[0]);
  const [draft, setDraft] = useState("");
  const [encrypted, setEncrypted] = useState("");

  const encrypt = () => {
    if (!draft) return;
    const chars = "▓▒░█◆◇◈⊙⊕◯●○◐◑✦✧⟁";
    setEncrypted(
      draft.split("").map(() => chars[Math.floor(Math.random() * chars.length)]).join("")
    );
  };

  return (
    <AppShell title="Comunicaciones Cifradas" latin="Nuntii Cifrati">
      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        <Panel className="!p-0">
          <div className="p-3 border-b border-gold-dim font-mono text-[10px] tracking-[0.3em] text-gold-dim uppercase flex justify-between">
            <span>Bandeja</span><span>{THREADS.filter((t) => t.unread).length} nuevos</span>
          </div>
          <ul>
            {THREADS.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => setOpen(t)}
                  className={`w-full text-left p-4 border-b border-gold-dim/40 hover:bg-secondary/40 transition ${open.id === t.id ? "bg-secondary/60 border-l-2 border-l-gold" : ""}`}
                >
                  <div className="flex justify-between items-baseline">
                    <span className={`font-display ${t.unread ? "text-gold-bright" : "text-gold"}`}>{t.from}</span>
                    <span className="font-mono text-[10px] text-gold-dim">{t.at}</span>
                  </div>
                  <p className="text-xs text-foreground/80 mt-1 truncate">{t.subject}</p>
                  {t.unread && <span className="inline-block mt-1.5 w-1.5 h-1.5 bg-gold rounded-full" />}
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-6">
          <Panel>
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-gold-dim">
              <div>
                <p className="font-mono text-[10px] tracking-[0.3em] text-gold-dim uppercase">De</p>
                <p className="font-display text-2xl text-gold mt-1">{open.from}</p>
                <p className="font-mono text-xs text-foreground/80 mt-2">RE: {open.subject}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[10px] text-gold-dim tracking-[0.25em]">{open.at}</p>
                <p className="font-mono text-[10px] text-gold mt-2 border border-gold-dim px-2 py-0.5">⊙ {open.cipher}</p>
              </div>
            </div>
            <div className="font-mono text-sm leading-relaxed text-foreground/90 border-l-2 border-gold pl-4 py-2">
              {open.body}
            </div>
            <div className="mt-6 font-mono text-[10px] text-gold-dim tracking-[0.3em] uppercase border-t border-gold-dim pt-3 flex justify-between">
              <span>· DESCIFRADO EN MEMORIA ·</span>
              <span>· DESTRUIDO AL CERRAR ·</span>
            </div>
          </Panel>

          <Panel title="Componer · Transmisión Sellada" latin="Compone Nuntium">
            <textarea
              value={draft}
              onChange={(e) => { setDraft(e.target.value); setEncrypted(""); }}
              rows={4}
              placeholder="Escriba su transmisión. Será cifrada antes de enviarse."
              className="w-full bg-background border border-gold-dim p-3 font-mono text-sm text-gold placeholder:text-gold-dim focus:outline-none focus:border-gold resize-none"
            />
            <div className="mt-3 flex flex-wrap gap-3">
              <button onClick={encrypt} className="font-mono text-[11px] tracking-[0.3em] uppercase px-4 py-2 border border-gold text-gold hover:bg-gold hover:text-primary-foreground transition">
                Cifrar
              </button>
              <button className="font-mono text-[11px] tracking-[0.3em] uppercase px-4 py-2 border border-gold-dim text-gold-dim hover:border-gold hover:text-gold transition">
                Sellar y Despachar
              </button>
              <button onClick={() => { setDraft(""); setEncrypted(""); }} className="font-mono text-[11px] tracking-[0.3em] uppercase px-4 py-2 border border-destructive/60 text-destructive hover:bg-destructive hover:text-destructive-foreground transition">
                Quemar
              </button>
            </div>
            {encrypted && (
              <div className="mt-4 border border-gold-dim p-3 font-mono text-sm text-gold-bright break-all scanlines">
                {encrypted}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
