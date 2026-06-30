import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Panel } from "../components/AppShell";

export const Route = createFileRoute("/comms")({
  head: () => ({ meta: [{ title: "Comms — Continental" }, { name: "description", content: "Encrypted communications." }] }),
  component: Comms,
});

type Msg = { id: string; from: string; subject: string; body: string; at: string; cipher: string; unread?: boolean };

const THREADS: Msg[] = [
  { id: "1", from: "Manager · NYC", subject: "Your usual room", body: "The Presidential is prepared. Linen as you prefer. The window faces east. Cassian will collect you from the lobby at 23:00. Discretion: absolute.", at: "03:14", cipher: "RSA-4096 / Curve25519", unread: true },
  { id: "2", from: "Adjudicator Vex", subject: "Re: The matter", body: "The Table has reviewed your filing. The judgment stands. Markers MK-001 and MK-014 remain on the public ledger. Do not attempt private resolution.", at: "Yesterday", cipher: "AES-512-GCM", unread: true },
  { id: "3", from: "Sommelier · Rome", subject: "Latour '47", body: "A bottle is set aside in your name. Tasting room six. Bring no companions. The cellar door closes at four.", at: "2 days", cipher: "Continental Wave" },
  { id: "4", from: "Concierge · Osaka", subject: "Physician", body: "Doctor available between midnight and dawn. Tetanus, gunshot, lacerations. No questions, no records.", at: "3 days", cipher: "RSA-4096" },
  { id: "5", from: "High Table · Concilium", subject: "Convocation", body: "Your presence is required. Rome chapter house. Midnight, the third of the month. Black tie. No exceptions.", at: "1 week", cipher: "Imperium-Seal" },
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
    <AppShell title="Encrypted Comms" latin="Nuntii Cifrati">
      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        <Panel className="!p-0">
          <div className="p-3 border-b border-gold-dim font-mono text-[10px] tracking-[0.3em] text-gold-dim uppercase flex justify-between">
            <span>Inbox</span><span>{THREADS.filter((t) => t.unread).length} new</span>
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
                <p className="font-mono text-[10px] tracking-[0.3em] text-gold-dim uppercase">From</p>
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
              <span>· DECRYPTED IN MEMORY ·</span>
              <span>· DESTROYED ON CLOSE ·</span>
            </div>
          </Panel>

          <Panel title="Compose · Sealed Transmission" latin="Compone Nuntium">
            <textarea
              value={draft}
              onChange={(e) => { setDraft(e.target.value); setEncrypted(""); }}
              rows={4}
              placeholder="Type your transmission. It will be encrypted before sending."
              className="w-full bg-background border border-gold-dim p-3 font-mono text-sm text-gold placeholder:text-gold-dim focus:outline-none focus:border-gold resize-none"
            />
            <div className="mt-3 flex flex-wrap gap-3">
              <button onClick={encrypt} className="font-mono text-[11px] tracking-[0.3em] uppercase px-4 py-2 border border-gold text-gold hover:bg-gold hover:text-primary-foreground transition">
                Encrypt
              </button>
              <button className="font-mono text-[11px] tracking-[0.3em] uppercase px-4 py-2 border border-gold-dim text-gold-dim hover:border-gold hover:text-gold transition">
                Seal & Dispatch
              </button>
              <button onClick={() => { setDraft(""); setEncrypted(""); }} className="font-mono text-[11px] tracking-[0.3em] uppercase px-4 py-2 border border-destructive/60 text-destructive hover:bg-destructive hover:text-destructive-foreground transition">
                Burn
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
