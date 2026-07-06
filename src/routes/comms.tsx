import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Panel } from "../components/AppShell";
import ximoPortrait from "../assets/agents/ximo.jpg";
import kestrelPortrait from "../assets/agents/kestrel.jpg";
import signoraPortrait from "../assets/agents/signora.jpg";
import osakaPortrait from "../assets/agents/osaka.jpg";
import altaPortrait from "../assets/alta.png";

import {
  playEmailVoice,
  fadeOutVoice,
} from "../audio/audiomanager";

export const Route = createFileRoute("/comms")({
  head: () => ({ meta: [{ title: "Comunicaciones — Continental" }, { name: "description", content: "Comunicaciones cifradas." }] }),
  component: Comms,
});

type Msg = { id: string; from: string; subject: string; body: string; at: string; cipher: string; portrait?: string; unread?: boolean };

const THREADS: Msg[] = [
  
  { id: "1", from: "Gerente Ximo · Valencia", subject: "Su habitación de siempre", portrait: ximoPortrait, body: "La Suite Presidencial ha sido preparada conforme a las especificaciones del huésped. Sábanas excepcionalmente suaves. Dos onzas de chocolate negro esperan en la nevera. Se ha dispuesto un juego nuevo de ropa interior Calvin Klein. El sistema de climatización ha sido revisado y funciona dentro de los parámetros óptimos. Cena de caracoles disponible bajo petición. El Continental le desea una estancia tan discreta como memorable.", at: "03:14", cipher: "RSA-4096 / Curve25519", unread: true },
  { id: "2", from: "Agente Kestrel", subject: "Re: Asunto con la Michi", portrait: kestrelPortrait, body: "Mandarin, tío... ¿Es cierto que te han asignado con la Michi? No me lo puedo creer. Media Comisión va detrás de ella; ya sabes que la llaman 'La Princesa de la Comisión'. Pero entre nosotros... dicen que es de las buenas. Inteligente, leal, y siempre cuida las espaldas de su compañero. Cuídala, ¿vale? En una organización como esta, donde todo el mundo lleva una máscara, merece la pena encontrarse con alguien así. Mucha suerte, hermano... y disfruta de la misión. - Kestrel", at: "Ayer", cipher: "AES-512-GCM", unread: true },
  { id: "3", from: "LUCIA FERRI · Oficina de Roma", subject: "Interferencias operativas en Roma", portrait: signoraPortrait, body: "Agente. Nuestros informadores confirman la presencia de operativos del Consorcio Obsidiana en Roma. Su objetivo es dificultar tu desplazamiento y retrasar la misión. Han saboteado parte de la red ferroviaria, provocando interrupciones deliberadas en los servicios, y han desplegado agitadores en las principales estaciones para generar confusión. La inteligencia recibida indica además que planean obstaculizar tu vuelo de regreso. Asume que cualquier contratiempo puede formar parte de una operación coordinada. Mantén un perfil bajo, evita rutinas predecibles y extrema las precauciones. Buena suerte, Agente. La Comisión permanece a la escucha.", at: "Hace 15 días", cipher: "Onda Continental" },
  { id: "4", from: "Adjudicador Vex · Osaka", subject: "Entrega autorizada", portrait: osakaPortrait, body: "Las Pitas de Kevlar procedentes de Osaka ya están listas para su recogida. Último modelo homologado por la Comisión. Desconozco para quién son, pero te aconsejo mantenerlas ocultas hasta el momento oportuno. Algunos regalos solo deben descubrirse una vez. Buena suerte.", at: "Hace 23 días", cipher: "RSA-4096" },
  { id: "5", from: "Mesa Alta · Concilium", subject: "Convocatoria", portrait: altaPortrait, body: "Se requiere su presencia. Casa capitular de Roma. Medianoche, el día tres del mes. Etiqueta. Sin excepciones.", at: "Hace 4 semanas", cipher: "Sello Imperium" },
];


// Persiste durante la sesión: Ximo solo se autorreproduce la primera vez
// que se entra a la pestaña de comunicaciones.
let ximoAutoplayed = false;

function Comms() {
  const [open, setOpen] = useState(THREADS[0]);
  const [draft, setDraft] = useState("");
  const [encrypted, setEncrypted] = useState("");
useEffect(() => {

  let t: ReturnType<typeof setTimeout> | undefined;

  if (!ximoAutoplayed) {
    // Retraso para no solaparse con el sonido previo al entrar.
    // La bandera se marca dentro del callback: si el efecto se limpia
    // antes de 1s (p. ej. doble montaje de React), se reprograma y suena.
    t = setTimeout(() => {
      ximoAutoplayed = true;
      playEmailVoice("1");
    }, 1000);
  }

  return () => {
    if (t) clearTimeout(t);
    fadeOutVoice();
  };

}, []);

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
                  onClick={() => {

  if (open.id === t.id) return;

playEmailVoice(t.id);

setOpen(t);

}}
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
            <div className="flex flex-row gap-4 md:gap-6 items-start">
              <img
                src={open.portrait}
                alt={open.from}
                className="w-20 md:w-44 shrink-0 border border-gold-dim grayscale object-cover"
              />

              <div className="flex-1 font-mono text-sm leading-relaxed text-foreground/90 border-l-2 border-gold pl-4 py-2">
                {open.body}
              </div>
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
