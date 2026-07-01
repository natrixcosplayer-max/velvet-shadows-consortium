import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Panel } from "../components/AppShell";

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
  risk: "BAJO",
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

    </Panel>

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
