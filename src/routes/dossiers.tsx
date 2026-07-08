import mandarinPhoto from "../assets/agents/mandarin.jpg";
import minervaPhoto from "../assets/agents/minerva.jpg";
import mandarinPortraitVideo from "../assets/agents/mandarin-1.mp4";
import minervaPortraitVideo from "../assets/agents/minerva-1.mp4";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell, Panel } from "../components/AppShell";
import { playControlledAudio, playSfx, stopControlledAudio } from "../audio/audiomanager";

const MANDARIN_VIDEO_VERSION = "20260709-1";
const MINERVA_VIDEO_VERSION = "20260709-1";

export const Route = createFileRoute("/dossiers")({
  head: () => ({ meta: [{ title: "Expedientes" }, { name: "description", content: "Expedientes de personal sellados." }] }),
  component: Dossiers,
});

type Dossier = {
  codename: string; latin: string; status: "ACTIVO" | "FALLECIDO" | "EXCOMM" | "RETIRADO";
  clearance: string; chapter: string; specialty: string; markers: number; notes: string; bio: string;
  video: string;
};

const DOSSIERS: Dossier[] = [
  { codename: "Mandarin", latin: "Agente vociferador", status: "ACTIVO", clearance: "Aurum VII", chapter: "Valencia", specialty: "Liderazgo & Organización", markers: 1, notes: "Impulsivo, pero efectivo. Sólo es discreto cuando duerme", bio: "Operativo veterano especializado en camuflaje y combate táctico. Su capacidad para ser un motor incansable y resolver situaciones críticas le ha convertido en uno de los agentes más fiables de la Comisión. Destaca por su liderazgo, capacidad organizativa y una inagotable predisposición para asumir cualquier misión. La discreción no figura entre las fortalezas del sujeto. Se aprueba la asignación conjunta con la Agente MINERVA para compensar dichas vulnerabilidades y maximizar las probabilidades de éxito de la misión.", video: `/videos/mandarin.mp4?v=${MANDARIN_VIDEO_VERSION}`,},
  { codename: "Minerva", latin: "Diplomacia y discreción", status: "ACTIVO", clearance: "Imperium", chapter: "Valencia", specialty: "Encanto & Diplomacia", markers: 0, notes: "La mayoría de las operaciones concluyen sin un solo disparo. Las pocas excepciones suelen ser responsabilidad del Agente A.", bio: "Especialista en inteligencia, negociación y obtención de información sensible. Experta en aproximarse a objetivos de alto valor sin despertar sospechas y en desenvolverse con absoluta naturalidad en cualquier país o entorno. La Comisión la considera una de sus mejores agentes de campo para operaciones de máxima discreción. Domina una técnica de inmovilización con sus extremidades inferiores clasificada. Ha sido asignada a la supervisión táctica del Agente Mandarin, aportando equilibrio, criterio y cordura para garantizar el éxito de la operación.", video: `/videos/minerva.mp4?v=${MINERVA_VIDEO_VERSION}`,},
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
const MINERVA_PORTRAIT_VIDEO = minervaPortraitVideo;
const MANDARIN_PORTRAIT_VIDEO = `${mandarinPortraitVideo}?v=${MANDARIN_VIDEO_VERSION}`;
const DOSSIER_VOICE: Partial<Record<string, string>> = {
  Mandarin: "/sounds/mandarin.mp3",
  Minerva: "/sounds/minerva.mp3",
};

function Dossiers() {
  const [active, setActive] = useState<Dossier>(DOSSIERS[0]);
  const [queued, setQueued] = useState<Dossier | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptProgress, setDecryptProgress] = useState(0);
  const [panelFlash, setPanelFlash] = useState(false);

  const [typedName, setTypedName] = useState("");
  const [nameVerified, setNameVerified] = useState(false);
  const [fieldStep, setFieldStep] = useState(0);
  const [clearancePhase, setClearancePhase] = useState<"validating" | "check" | "done">("validating");
  const [typedBio, setTypedBio] = useState("");
  const [isTypingBio, setIsTypingBio] = useState(false);

  const [portraitVerified, setPortraitVerified] = useState(false);
  const [tagIndex, setTagIndex] = useState(0);
  const [hudCipherIndex, setHudCipherIndex] = useState(0);
  const [hudChannelIndex, setHudChannelIndex] = useState(0);
  const [microGlitch, setMicroGlitch] = useState(false);

  const [query, setQuery] = useState("");
  const glitchTimeoutRef = useRef<number | null>(null);

  const filtered = DOSSIERS.filter((d) =>
    (d.codename + d.chapter + d.specialty).toLowerCase().includes(query.toLowerCase())
  );

  const CONF_LABELS = ["CONFIDENCIAL", "SOLO LECTURA", "RESTRINGIDO", "CLASIFICADO"] as const;
  const HUD_CIPHER = ["AES-512", "AES-1024", "AES-512"] as const;
  const HUD_CHANNEL = ["CANAL SEGURO", "CANAL ESTABLE", "CANAL SEGURO"] as const;

  const clearanceValue =
    clearancePhase === "validating"
      ? "VALIDANDO..."
      : clearancePhase === "check"
        ? "✔"
        : active.clearance;

  const handleSelect = (d: Dossier) => {
    if (isDecrypting || d.codename === active.codename) return;

    const voiceSrc = DOSSIER_VOICE[d.codename];
    if (voiceSrc) {
      // Trigger within user gesture for maximum iPhone playback reliability.
      playControlledAudio("dossier-voice", voiceSrc, 0.56, false);
    } else {
      stopControlledAudio("dossier-voice");
    }

    playSfx("/sounds/beep.mp3", 0.2);
    setQueued(d);
    setDecryptProgress(0);
    setIsDecrypting(true);
    setPanelFlash(true);

    window.setTimeout(() => setPanelFlash(false), 520);
  };

  useEffect(() => {
    if (!isDecrypting || !queued) return;

    const id = window.setInterval(() => {
      setDecryptProgress((prev) => {
        const next = Math.min(100, prev + 12);
        if (next >= 100) {
          window.clearInterval(id);
          window.setTimeout(() => {
            setActive(queued);
            setIsDecrypting(false);
            setQueued(null);
            playSfx("/sounds/luxbeep.mp3", 0.22);
          }, 80);
        }
        return next;
      });
    }, 90);

    return () => window.clearInterval(id);
  }, [isDecrypting, queued]);

  useEffect(() => {
    return () => {
      stopControlledAudio("dossier-voice");
    };
  }, []);

  useEffect(() => {
    if (isDecrypting) return;

    let nameIndex = 0;
    let fields = 0;
    let bioIndex = 0;

    setTypedName("");
    setNameVerified(false);
    setFieldStep(0);
    setClearancePhase("validating");
    setTypedBio("");
    setIsTypingBio(false);
    setPortraitVerified(true);

    const nameTimer = window.setInterval(() => {
      nameIndex += 1;
      setTypedName(active.codename.slice(0, nameIndex));

      if (nameIndex >= active.codename.length) {
        window.clearInterval(nameTimer);
        setNameVerified(true);

        const fieldsTimer = window.setInterval(() => {
          fields += 1;
          setFieldStep(fields);

          if (fields === 2) {
            setClearancePhase("validating");
            const c1 = window.setTimeout(() => {
              setClearancePhase("check");
              playSfx("/sounds/beep.mp3", 0.18);

              const c2 = window.setTimeout(() => {
                setClearancePhase("done");
              }, 260);

              return () => window.clearTimeout(c2);
            }, 620);

            return () => window.clearTimeout(c1);
          }

          if (fields >= 5) {
            window.clearInterval(fieldsTimer);
            setIsTypingBio(true);

            const bioTimer = window.setInterval(() => {
              bioIndex += 3;
              setTypedBio(active.bio.slice(0, bioIndex));

              if (bioIndex >= active.bio.length) {
                window.clearInterval(bioTimer);
                setIsTypingBio(false);
              }
            }, 24);

            return () => window.clearInterval(bioTimer);
          }
        }, 220);

        return () => window.clearInterval(fieldsTimer);
      }
    }, 66);

    return () => {
      window.clearInterval(nameTimer);
    };
  }, [active, isDecrypting]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTagIndex((prev) => (prev + 1) % CONF_LABELS.length);
    }, 7600);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setHudCipherIndex((prev) => (prev + 1) % HUD_CIPHER.length);
      setHudChannelIndex((prev) => (prev + 1) % HUD_CHANNEL.length);
    }, 11000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const scheduleGlitch = () => {
      const delay = 30000 + Math.floor(Math.random() * 30000);

      glitchTimeoutRef.current = window.setTimeout(() => {
        setMicroGlitch(true);

        const clear = window.setTimeout(() => {
          setMicroGlitch(false);
          scheduleGlitch();
        }, 90);

        return () => window.clearTimeout(clear);
      }, delay);
    };

    scheduleGlitch();

    return () => {
      if (glitchTimeoutRef.current) {
        window.clearTimeout(glitchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <AppShell title="Expedientes" latin="OPERACIÓN PRIORITARIA · CLASIFICACIÓN VII">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none grid-bg opacity-20 [animation:dossier-grid-drift_14s_ease-in-out_infinite]" />
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
                  onClick={() => handleSelect(d)}
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

        <Panel className={`relative overflow-hidden transition-shadow duration-500 ${panelFlash ? "shadow-[0_0_30px_rgba(212,175,55,0.28)]" : ""}`}>
          {(active.codename === "Mandarin" || active.codename === "Minerva") && (
            <div className="absolute inset-0 pointer-events-none grid-bg opacity-35" />
          )}

          <div className="relative z-10">
          {isDecrypting && (
            <div className="py-20 text-center animate-fade-up">
              <p className="font-mono text-[11px] tracking-[0.35em] uppercase text-gold-dim">
                DESCIFRANDO DOSSIER...
              </p>
              <div className="mx-auto mt-6 h-2 w-full max-w-md border border-gold-dim bg-secondary/30 overflow-hidden">
                <div
                  className="h-full bg-[linear-gradient(90deg,oklch(0.55_0.08_80)_0%,oklch(0.88_0.16_88)_50%,oklch(0.55_0.08_80)_100%)] bg-[length:200%_100%] animate-progress-flow"
                  style={{ width: `${decryptProgress}%` }}
                />
              </div>
            </div>
          )}

          {!isDecrypting && (
            <>
          <p className="font-mono text-[10px] tracking-[0.3em] text-gold-dim uppercase">Nombre en clave</p>
          <h2 className="font-display text-5xl text-gold mt-2">{typedName}</h2>
          {nameVerified && (
            <p className="mt-2 font-mono text-[10px] tracking-[0.28em] uppercase text-gold animate-fade-up">✔ IDENTIDAD VERIFICADA</p>
          )}
          <p className="font-display text-gold-dim italic mt-1">{active.latin}</p>
          <div className={`mx-auto w-fit md:absolute md:top-6 md:right-6 mt-6 md:mt-0 font-mono text-[8px] md:text-[10px] tracking-[0.3em] text-destructive border border-destructive px-2 py-1 uppercase transition-opacity duration-200 ${microGlitch ? "opacity-60 animate-glitch" : ""}`}>
            · {CONF_LABELS[tagIndex]} ·
          </div>
          <div className="mx-auto w-fit md:absolute md:top-16 md:right-6 mt-2 md:mt-0 font-mono text-[8px] tracking-[0.22em] uppercase text-gold-dim">
            {HUD_CHANNEL[hudChannelIndex]} · {HUD_CIPHER[hudCipherIndex]}
          </div>
          <div className="mt-4 md:mt-8 flex justify-center">
            {active.codename === "Minerva" || active.codename === "Mandarin" ? (
              <div className="relative h-80 w-64">
                <div className="pointer-events-none absolute -inset-[2px] rounded-sm bg-gold/20 blur-md opacity-35" />

                <div className="relative h-full w-full overflow-hidden rounded-sm border-2 border-gold/65 bg-black shadow-[inset_0_0_0_2px_rgba(212,175,55,0.12),0_0_14px_rgba(212,175,55,0.18)]">
                  <div className="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.05),transparent_58%)]" />
                  <div className="pointer-events-none absolute inset-0 z-20 opacity-[0.05] [background-image:repeating-linear-gradient(0deg,transparent_0,transparent_2px,rgba(255,255,255,0.75)_2px,rgba(255,255,255,0.75)_3px)]" />
                  <div className="pointer-events-none absolute left-0 right-0 z-20 h-px bg-white/20 [animation:debrief-video-scan_12s_linear_infinite]" />
                  <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[2px] bg-gradient-to-r from-transparent via-gold/80 to-transparent" />

                  <video
                    key={active.codename}
                    src={active.codename === "Minerva" ? MINERVA_PORTRAIT_VIDEO : MANDARIN_PORTRAIT_VIDEO}
                    autoPlay
                    muted
                    playsInline
                    loop
                    preload="auto"
                    controls={false}
                    disablePictureInPicture
                    disableRemotePlayback
                    className="relative z-10 h-full w-full object-cover opacity-100 brightness-[0.95] contrast-[1.08]"
                    aria-label={`Retrato en video de ${active.codename}`}
                  />
                </div>

                {portraitVerified && (
                  <p className="absolute bottom-2 left-2 z-40 font-mono text-[9px] tracking-[0.24em] uppercase text-gold bg-black/45 px-2 py-1">IDENTIDAD VERIFICADA</p>
                )}
              </div>
            ) : (
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 -z-10 scale-110 rounded-sm bg-gold/20 blur-xl" />
                <div className="absolute -inset-x-16 -top-20 h-24 rotate-12 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 [animation:dossier-photo-shine_18s_ease-in-out_infinite]" />
                <img
                  src={AGENT_PHOTOS[active.codename]}
                  alt={active.codename}
                  className="w-64 h-80 object-cover border border-gold shadow-lg [animation:dossier-photo-breath_9s_ease-in-out_infinite] transition-all duration-700 blur-0"
                />
                {portraitVerified && (
                  <p className="absolute bottom-2 left-2 font-mono text-[9px] tracking-[0.24em] uppercase text-gold bg-black/45 px-2 py-1">IDENTIDAD VERIFICADA</p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <Field label="Estatus" value={active.status} visible={fieldStep >= 1} />
            <Field label="Autorización" value={clearanceValue} visible={fieldStep >= 2} />
            <Field label="Capítulo" value={active.chapter} visible={fieldStep >= 3} />
            <Field label="Marcadores" value={String(active.markers)} visible={fieldStep >= 4} />
          </div>

          <div className="mt-8">
            <p className="font-mono text-[10px] tracking-[0.3em] text-gold-dim uppercase">Especialidad</p>
            <p className={`text-gold mt-1 transition-opacity duration-500 ${fieldStep >= 5 ? "opacity-100" : "opacity-0"}`}>{active.specialty}</p>
          </div>
          <div className="mt-8">
    <p className="font-mono text-[10px] tracking-[0.3em] text-gold-dim uppercase">
        Biografía
    </p>

    <p className="text-foreground/90 leading-7 mt-3">
        {typedBio}
        {isTypingBio && <span className="animate-blink text-gold ml-1">█</span>}
    </p>
</div>

          <div className="mt-6 border-l-2 border-gold pl-4">
            <p className="font-mono text-[10px] tracking-[0.3em] text-gold-dim uppercase mb-2">Notas de Campo</p>
            <p className="text-foreground/90 italic whitespace-pre-line break-words">"{active.notes}"</p>
          </div>

          <DossierVideo key={active.codename} codename={active.codename} src={active.video} />

          <div className="mt-8 border-t border-gold-dim pt-4 font-mono text-[10px] text-gold-dim tracking-[0.25em] flex justify-between uppercase">
            <span>EXP · {active.codename.replace(/\s+/g, "-").toUpperCase()}-{Math.abs(active.codename.length * 37) % 9999}</span>
            <span>SELLO · ✦ ALTA MESA ✦</span>
          </div>
          </>
          )}
          </div>
        </Panel>
      </div>
    </div>
    </AppShell>
  );
}

function Field({ label, value, visible }: { label: string; value: string; visible: boolean }) {
  return (
    <div className={`border border-gold-dim p-3 transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0"}`}>
      <p className="font-mono text-[9px] tracking-[0.3em] text-gold-dim uppercase">{label}</p>
      <p className="font-display text-gold mt-1">{value}</p>
    </div>
  );
}

function DossierVideo({ codename, src }: { codename: string; src: string }) {
  return (
    <div className="mt-8">
      <p className="font-mono text-[10px] tracking-[0.3em] text-gold-dim uppercase">VIDEO</p>

      <div className="mt-3 relative w-full overflow-hidden rounded-sm border-2 border-gold/65 bg-black shadow-[inset_0_0_0_2px_rgba(212,175,55,0.12),0_0_14px_rgba(212,175,55,0.18)]">
        <div className="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.05),transparent_58%)]" />
        <div className="pointer-events-none absolute inset-0 z-20 opacity-[0.05] [background-image:repeating-linear-gradient(0deg,transparent_0,transparent_2px,rgba(255,255,255,0.75)_2px,rgba(255,255,255,0.75)_3px)]" />
        <div className="pointer-events-none absolute left-0 right-0 z-20 h-px bg-white/20 [animation:debrief-video-scan_12s_linear_infinite]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[2px] bg-gradient-to-r from-transparent via-gold/80 to-transparent" />

        <video
          src={src}
          autoPlay
          preload="auto"
          controls={false}
          playsInline
          muted
          loop
          disablePictureInPicture
          disableRemotePlayback
          className="relative z-10 h-auto w-full object-contain opacity-100 brightness-[0.95] contrast-[1.08]"
          aria-label={`Archivo de vigilancia del agente ${codename}`}
        />

        <div className="pointer-events-none absolute left-3 top-3 z-20 border border-gold/45 bg-black/58 px-2 py-1 font-mono text-[9px] tracking-[0.24em] text-gold uppercase">
          CANAL DE VIGILANCIA · {codename}
        </div>
      </div>
    </div>
  );
}
