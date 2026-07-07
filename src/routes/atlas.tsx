import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Panel } from "../components/AppShell";
import mapaImage from "../assets/graphics/mapa.jpg";
import { playSfx } from "../audio/audiomanager";

export const Route = createFileRoute("/atlas")({
  head: () => ({ meta: [{ title: "Atlas — Continental" }, { name: "description", content: "Hoteles Continental en todo el mundo." }] }),
  component: Atlas,
});

type Hotel = { city: string; latin: string; lat: number; lng: number; manager: string; status: "ABIERTO" | "RESTRINGIDO" | "SELLADO"; rooms: number };

const HOTELS: Hotel[] = [
  { city: "Nueva York", latin: "Novum Eboracum", lat: 40.7, lng: -74.0, manager: "Winston", status: "ABIERTO", rooms: 142 },
  { city: "Roma", latin: "Roma", lat: 41.9, lng: 12.5, manager: "Julius", status: "ABIERTO", rooms: 88 },
  { city: "Osaka", latin: "Osaca", lat: 34.7, lng: 135.5, manager: "Akira", status: "ABIERTO", rooms: 64 },
  { city: "Valencia", latin: "Valentia", lat: 40.6, lng: -17.6, manager: "Ximo", status: "ABIERTO", rooms: 53 },
  { city: "Berlín", latin: "Berolinum", lat: 52.5, lng: 13.4, manager: "Klaus", status: "RESTRINGIDO", rooms: 71 },
  { city: "Marrakech", latin: "Marrakus", lat: 31.6, lng: -8.0, manager: "Berrada", status: "SELLADO", rooms: 44 },
  { city: "Hong Kong", latin: "Sinus Olidus", lat: 22.3, lng: 114.2, manager: "Xian", status: "RESTRINGIDO", rooms: 96 },
  { city: "São Paulo", latin: "Sancti Pauli", lat: -23.5, lng: -46.6, manager: "Salgado", status: "ABIERTO", rooms: 68 },
  { city: "Bombay", latin: "Mumbai", lat: 19.1, lng: 72.9, manager: "Khare", status: "ABIERTO", rooms: 79 },
  { city: "Reikiavik", latin: "Reykiavica", lat: 64.1, lng: -21.9, manager: "Stenberg", status: "SELLADO", rooms: 22 },
  { city: "El Cairo", latin: "Cairum", lat: 30.0, lng: 31.2, manager: "Hassan", status: "ABIERTO", rooms: 61 },
  { city: "Sídney", latin: "Sydneium", lat: -33.9, lng: 151.2, manager: "Voss", status: "ABIERTO", rooms: 47 },
];

const proj = (lat: number, lng: number) => ({ x: ((lng + 180) / 360) * 100, y: ((90 - lat) / 180) * 100 });
const STATUS_DOT: Record<Hotel["status"], string> = {
  ABIERTO: "fill-[var(--gold)]", RESTRINGIDO: "fill-[var(--gold-dim)]", SELLADO: "fill-[var(--destructive)]",
};
const HOTEL_DESCRIPTIONS: Record<string, string> = {
  "Nueva York": "Centro neurálgico de todas las casas. Punto de paso de decenas de asesinos al día.",
  "São Paulo": "Casas más flexibles. Muchos mezclan trabajo y ocio. Extrovertidos, maestros de las artes marciales.",
  "Reikiavik": "Cuna de los asesinos del norte. Fríos, serios, efectivos y autoritarios. Contratos bien pagados.",
  "Valencia": "Buenos agentes. Se dan a la celebración y a los placeres terrenales como el vino, pero a cambio efectúan su trabajo con precisión.",
  "Marrakech": "Actualmente cerrado. Redada de casas enemigas. Gerente desaparecida.",
  "Berlín": "Asesinos de élite entrenados por las mafias locales.",
  "Roma": "Cuna de la Alta Mesa. Hogar de las Magistradas. Sede de la Ruska Roma, casa madre de grandes agentes y asesios, especialmente mujeres.",
  "El Cairo": "Opera con normalidad aunque reciben amenazas constantes provenientes de Hamunaptra y tesoros desenterrados allí. Sus asesinos son conocidos como Medjay.",
  "Bombay": "Caótico, pero discreto. Precios más baratos, asesinos entrenados en artes milenarias.",
  "Hong Kong": "Sede de muchas casas enemigas. Muchedumbres, armas modernas. Tráfico, gente, neón. Contratos siempre activos.",
  "Osaka": "Maestros de la eficacia y precisión. Respetan sus costumbres y tradiciones. Diestros en armas blancas. Leales.",
  "Sídney": "Grandes asesinos efectivos en combate cuerpo a cuerpo. Además, tienen que lidiar con la fauna local.",
};

function Atlas() {
  const [active, setActive] = useState<Hotel>(HOTELS[0]);
  const [popupHotel, setPopupHotel] = useState<Hotel | null>(null);

  const handleSelectHotel = (hotel: Hotel) => {
    setActive(hotel);
    setPopupHotel(hotel);
    playSfx("/sounds/shortbeep.mp3", 0.35);
  };

  return (
    <AppShell title="Atlas Continental" latin="Orbis · Refugios en todo el mundo">
      <Panel className="!p-0 overflow-hidden">
        <div className="relative aspect-[2/1] bg-background grid-bg overflow-hidden">
          <img src={mapaImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.18),transparent_60%)]" />
          <svg viewBox="0 0 100 50" className="relative z-10 w-full h-full" preserveAspectRatio="none">
            <defs>
              <filter id="blur"><feGaussianBlur stdDeviation="0.4" /></filter>
            </defs>
            {HOTELS.slice(0, 6).map((h, i) => {
              const a = proj(h.lat, h.lng);
              const b = proj(HOTELS[(i + 1) % 6].lat, HOTELS[(i + 1) % 6].lng);
              return <line key={i} x1={a.x} y1={a.y / 2} x2={b.x} y2={b.y / 2} stroke="var(--gold)" strokeWidth="0.1" strokeDasharray="0.3 0.4" opacity="0.4" />;
            })}
            {HOTELS.map((h) => {
              const p = proj(h.lat, h.lng);
              const isActive = active.city === h.city;
              const xOffset = h.city === "Nueva York" ? -3.2 : h.city === "Hong Kong" ? -2.4 : h.city === "Sídney" ? -3.6 : 0;
              const yOffset = h.city === "Reikiavik" ? 0 : h.city === "Sídney" ? 6.2 : 3.6;
              const x = p.x + xOffset;
              const y = (p.y / 2) + yOffset;
              return (
                <g key={h.city} className="cursor-pointer" onClick={() => handleSelectHotel(h)}>
                  <circle cx={x} cy={y} r={isActive ? 1.68 : 1.008} className={STATUS_DOT[h.status]} opacity={isActive ? 1 : 0.85}>
                    {isActive && <animate attributeName="r" values="1.68;2.52;1.68" dur="2s" repeatCount="indefinite" />}
                  </circle>
                  <circle cx={x} cy={y} r="3.5" fill="none" stroke="var(--gold)" strokeWidth="0.08" opacity={isActive ? 0.6 : 0} />
                  {isActive && (
                    <text x={x + 2} y={y - 1} fill="var(--gold)" fontSize="1.44" fontWeight="700" fontFamily="Cinzel" style={{ textShadow: "0 0 6px rgba(214,173,74,0.7)" }} className="pointer-events-none">{h.city}</text>
                  )}
                </g>
              );
            })}
          </svg>
          <div className="absolute top-4 left-4 font-mono text-[10px] text-gold-dim tracking-[0.3em] uppercase">
            · ORBIS · CONTINENTALIS ·
          </div>
          <div className="absolute bottom-4 right-4 flex gap-4 font-mono text-[10px] text-gold-dim tracking-[0.25em] uppercase">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gold" /> Abierto</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gold-dim" /> Restringido</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-destructive" /> Sellado</span>
          </div>
        </div>
        {popupHotel && (
          <div className="border-t border-gold-dim/50 bg-background/85 px-5 py-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:gap-5">
              <p className="font-display text-sm uppercase tracking-[0.22em] font-bold text-gold shrink-0">
                {popupHotel.city}
              </p>
              <p className="font-mono text-[11px] leading-relaxed text-gold-dim">
                {HOTEL_DESCRIPTIONS[popupHotel.city] ?? "Descripción en preparación."}
              </p>
            </div>
          </div>
        )}
      </Panel>

      <div className="grid md:grid-cols-[1fr_2fr] gap-6 mt-6">
        <Panel title="Casa Seleccionada" latin="Domus Electa">
          <p className="font-display text-3xl text-gold">{active.city}</p>
          <p className="font-display italic text-gold-dim">{active.latin}</p>
          <dl className="mt-5 space-y-3 font-mono text-sm">
            <Row k="Gerente" v={active.manager} />
            <Row k="Estatus" v={active.status} />
            <Row k="Habitaciones" v={String(active.rooms)} />
            <Row k="Coordenadas" v={`${active.lat.toFixed(1)}° · ${active.lng.toFixed(1)}°`} />
          </dl>
        </Panel>

        <Panel title="Directorio" latin="Index Domorum">
          <ul className="grid sm:grid-cols-2 gap-2">
            {HOTELS.map((h) => (
              <li key={h.city}>
                <button
                  onClick={() => handleSelectHotel(h)}
                  className={`w-full text-left flex justify-between items-center p-3 border transition ${active.city === h.city ? "border-gold bg-secondary/60" : "border-gold-dim hover:border-gold"}`}
                >
                  <span>
                    <span className="font-display text-gold block">{h.city}</span>
                    <span className="font-mono text-[10px] text-gold-dim tracking-[0.2em]">{h.manager}</span>
                  </span>
                  <span className={`w-2 h-2 rounded-full ${h.status === "ABIERTO" ? "bg-gold" : h.status === "RESTRINGIDO" ? "bg-gold-dim" : "bg-destructive"}`} />
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </AppShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-gold-dim/40 pb-2">
      <dt className="text-gold-dim text-[10px] tracking-[0.25em] uppercase">{k}</dt>
      <dd className="text-gold">{v}</dd>
    </div>
  );
}
