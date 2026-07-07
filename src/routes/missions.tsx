import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Panel } from "../components/AppShell";
import { playSfx } from "../audio/audiomanager";
import mercado from "../assets/graphics/mercado.jpg";

export const Route = createFileRoute("/missions")({
  head: () => ({
    meta: [
      { title: "Operativo" },
      {
        name: "description",
        content: "Operación activa de la Comisión.",
      },
    ],
  }),
  component: Missions,
});

const OPERATION = {
  objective: "Recuperar el activo",
  location: "Consultar Coordenadas",
  address: "Enviada ubicación encriptada",
  status: "EN CURSO",
  window: "22:30 - 23:59",
  risk: "ALTO",
  maps:
    "https://www.google.com/maps/dir/?api=1&destination=39.469900,-0.376300",
};

function Missions() {
  return (
  <AppShell title="Operativo" latin="Missio Activa">

    <div className="grid md:grid-cols-2 gap-5">

      <Panel title="Objetivo" latin="Finis Missionis">
        <p className="font-display text-3xl text-gold">
          {OPERATION.objective}
        </p>
      </Panel>

      <Panel title="Estado" latin="Status">
        <div className="flex items-center gap-3">

          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>

          <p className="font-display text-3xl text-gold">
            {OPERATION.status}
          </p>

        </div>
      </Panel>

      <Panel title="Destino" latin="Locus">
        <p className="font-display text-2xl text-gold">
          {OPERATION.location}
        </p>

        <p className="text-gold-dim mt-2">
          {OPERATION.address}
        </p>
      </Panel>

      <Panel title="Ventana Operativa" latin="Tempus">
        <p className="font-display text-2xl text-gold">
          {OPERATION.window}
        </p>
      </Panel>

      <Panel title="Nivel de Riesgo" latin="Periculum">
        <p className="font-display text-2xl text-red-400">
          {OPERATION.risk}
        </p>
      </Panel>

      <Panel title="Estado del Objetivo" latin="Objectivum">

        <div className="flex items-center gap-3">

          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>

          <span className="font-display text-xl text-gold">
            ACTIVO LOCALIZADO
          </span>

        </div>

        <p className="mt-4 text-gold-dim text-sm">
          Última posición confirmada hace menos de 2 minutos.
        </p>

      </Panel>

    </div>

    <Panel title="Protocolo Operativo" latin="Mandatum" className="mt-8">

      <div className="space-y-4 text-gold">

        <p>• Analice las coordenadas proporcionadas por la Comisión.</p>

        <p>• Inicie el desplazamiento hacia el punto de recuperación del activo.</p>

        <p>• Desplácese junto a la Agente Minerva y mantenga vigilancia permanente durante el trayecto.</p>
        
        <p>•  En caso de detectar seguimiento o actividad sospechosa, interrumpa temporalmente la operación. Adopte una cobertura civil y permanezca integrado en el entorno tomando un Cocktail.</p>

        <p>• Recupere el activo sin comprometer la misión.</p>

        <p>• Abandone la zona utilizando el vehículo asignado y espere nuevas instrucciones a través del canal cifrado.</p>

      </div>

    </Panel>

    <Panel title="Coordenadas" latin="Geolocatio" className="mt-8">

      <div className="grid md:grid-cols-[1fr_280px] gap-8 items-center">

        <div>

          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-gold-dim">
            POSICIÓN VERIFICADA
          </p>

          <p className="font-mono text-gold-dim uppercase tracking-[0.25em]">
  LAT 39.45896
</p>

<p className="font-mono text-gold-dim uppercase tracking-[0.25em]">
  LON -0.38198
</p>

          <p className="mt-6 text-gold-dim font-mono uppercase tracking-[0.2em]">
            Última actualización · Hace 2 minutos
          </p>

        </div>

        <div className="flex flex-col gap-4">

        <div className="flex flex-col gap-4">

  <a
    href="https://maps.app.goo.gl/huh44bQw9ePxUGBx9"
    target="_blank"
    rel="noopener noreferrer"
    className="border border-gold p-4 text-center uppercase font-mono tracking-[0.25em] text-gold hover:bg-gold hover:text-primary-foreground transition"
  >
    📍 Ver ubicación
  </a>

  <a
    href="https://www.google.com/maps/dir/?api=1&destination=C%2F+de+Ciril+Amor%C3%B3s%2C+62%2C+46004+Val%C3%A8ncia&travelmode=walking"
    target="_blank"
    rel="noopener noreferrer"
    className="border border-gold p-4 text-center uppercase font-mono tracking-[0.25em] text-gold hover:bg-gold hover:text-primary-foreground transition"
  >
    🧭 Iniciar navegación
  </a>

</div>

        </div>

      </div>

      <figure className="mt-8 relative overflow-hidden scanlines">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gold/95 shadow-[0_0_20px_rgba(214,173,74,1)] animate-scan pointer-events-none" />
        <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,transparent_45%,rgba(0,0,0,0.55)_100%)]" />
        <img
          src={mercado}
          alt="Punto de recuperación · Mercado de Colón"
          className="relative z-0 w-full h-56 md:h-80 object-cover object-center grayscale contrast-125 brightness-80 opacity-90 animate-flicker animate-surveillance-pan"
        />
        <figcaption className="mt-2 font-mono text-[10px] tracking-[0.3em] uppercase text-gold-dim text-center">
          · Punto de recuperación · Vigilancia activa ·
        </figcaption>
      </figure>

    </Panel>

    <SealedCode />

    <Panel title="Observaciones de la Comisión" latin="Nota Interna" className="mt-8">

      <p className="text-gold leading-8">

        La operación continúa desarrollándose conforme a lo previsto.
        No se han detectado interferencias significativas durante las últimas horas.
        Mantenga un perfil bajo y permanezca atento a futuras comunicaciones cifradas.

      </p>

    </Panel>

  </AppShell>
  );
  }

const RULE = "══════════════════════════════";
const DECRYPT_TEXT = "DESCIFRANDO...";

function SealedCode() {
  const [phase, setPhase] = useState<"idle" | "decrypting" | "done">("idle");
  const [typed, setTyped] = useState("");
  const [progress, setProgress] = useState(0);
  const [flash, setFlash] = useState(false);
  const [isAgentPromptOpen, setIsAgentPromptOpen] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [agentError, setAgentError] = useState("");

  const start = () => {
    if (phase === "decrypting") return;
    playSfx("/sounds/luxbeep.mp3", 0.3);
    setTyped("");
    setProgress(0);
    setPhase("decrypting");
    setFlash(true);
  };

  const openAgentPrompt = () => {
    if (phase === "decrypting") return;
    setAgentError("");
    setAgentName("");
    setIsAgentPromptOpen(true);
  };

  const confirmAgent = () => {
    if (agentName.trim().toLowerCase() === "mandarin") {
      setAgentError("");
      setIsAgentPromptOpen(false);
      setAgentName("");
      start();
      return;
    }

    setAgentError("Acceso denegado. Introduce el nombre de agente correcto.");
  };

  // Parpadeo de pantalla al iniciar
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(false), 180);
    return () => clearTimeout(t);
  }, [flash]);

  // Efecto de escritura + barra de progreso durante el descifrado
  useEffect(() => {
    if (phase !== "decrypting") return;

    let i = 0;
    const typer = setInterval(() => {
      i++;
      setTyped(DECRYPT_TEXT.slice(0, i));
      if (i >= DECRYPT_TEXT.length) clearInterval(typer);
    }, 90);

    const bar = setInterval(() => {
      setProgress((p) => (p >= 10 ? 10 : p + 1));
    }, 220);

    return () => {
      clearInterval(typer);
      clearInterval(bar);
    };
  }, [phase]);

  // Al completar la barra, revelar credenciales
  useEffect(() => {
    if (phase === "decrypting" && progress >= 10) {
      const t = setTimeout(() => setPhase("done"), 500);
      return () => clearTimeout(t);
    }
  }, [phase, progress]);

  return (
    <Panel title="Código Sellado" latin="Codex Signatus" className="mt-8">

      {flash && (
        <div
          aria-hidden
          className="fixed inset-0 z-50 bg-gold/40 pointer-events-none animate-flicker"
        />
      )}

      <div className="text-center font-mono">

        <p className="text-gold-dim tracking-[0.15em] select-none overflow-hidden">{RULE}</p>

        {isAgentPromptOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 px-4">
            <div className="w-full max-w-md border border-gold bg-[#0b0b0b]/95 p-6 text-left shadow-[0_0_30px_rgba(214,173,74,0.25)]">
              <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-gold-dim">
                Autenticación de acceso
              </p>
              <p className="mt-3 text-gold tracking-[0.2em] uppercase">
                Introduce el identificador de acceso
              </p>
              <input
                autoFocus
                value={agentName}
                onChange={(event) => {
                  setAgentName(event.target.value);
                  if (agentError) setAgentError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    confirmAgent();
                  }
                }}
                placeholder=""
                className="mt-4 w-full border border-gold/70 bg-background/70 px-3 py-2 font-mono text-sm uppercase tracking-[0.2em] text-gold outline-none"
              />
              {agentError && (
                <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-red-400">
                  {agentError}
                </p>
              )}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  onClick={() => {
                    setIsAgentPromptOpen(false);
                    setAgentError("");
                    setAgentName("");
                  }}
                  className="border border-gold/70 px-4 py-2 text-[10px] tracking-[0.3em] uppercase text-gold transition hover:bg-gold hover:text-primary-foreground"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmAgent}
                  className="border border-gold px-4 py-2 text-[10px] tracking-[0.3em] uppercase text-gold transition hover:bg-gold hover:text-primary-foreground"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        {phase === "idle" && (
          <div className="py-6 animate-fade-up">
            <p className="text-gold tracking-[0.3em] uppercase">
              Acceso a Depósito Continental
            </p>
            <button
              onClick={openAgentPrompt}
              className="mt-6 border border-gold px-8 py-3 text-gold tracking-[0.3em] uppercase hover:bg-gold hover:text-primary-foreground transition animate-pulse-gold"
            >
              [ Desclasificar Credenciales ]
            </button>
          </div>
        )}

        {phase === "decrypting" && (
          <div className="py-6 scanlines">
            <p className="text-gold-bright tracking-[0.3em] uppercase">
              {typed}
              <span className="animate-blink">█</span>
            </p>
            <p className="mt-4 text-gold text-2xl tracking-[0.35em]">
              {"■".repeat(progress)}
              {"□".repeat(10 - progress)}
            </p>
          </div>
        )}

        {phase === "done" && (
          <div className="py-6 animate-fade-up">
            <p className="text-green-400 tracking-[0.3em] uppercase">
              Credenciales Válidas
            </p>

            <div className="grid grid-cols-3 gap-4 mt-6 max-w-md mx-auto">
              <SealField label="Cajón" value="409" />
              <SealField label="Tipo" value="L" />
              <SealField label="Código" value="840731" />
            </div>

            <p className="mt-6 text-gold tracking-[0.3em] uppercase animate-flicker">
              ✦ Autorización Concedida ✦
            </p>
          </div>
        )}

        <p className="text-gold-dim tracking-[0.15em] select-none overflow-hidden">{RULE}</p>

      </div>
    </Panel>
  );
}

function SealField({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gold-dim p-3">
      <p className="font-mono text-[9px] tracking-[0.3em] text-gold-dim uppercase">{label}</p>
      <p className="font-display text-2xl text-gold mt-1">{value}</p>
    </div>
  );
}
