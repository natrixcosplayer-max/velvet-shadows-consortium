import altaLogo from "../assets/alta.png";
import {
  playMusic,
  playVoice,
  playSfx,
  primeUnlockSound,
} from "../audio/audiomanager";

type Props = {
  onEnter: () => void;
};

export function EntryGate({ onEnter }: Props) {
  return (
    <main className="fixed inset-0 bg-background flex items-center justify-center scanlines overflow-hidden">

      {/* Rejilla digital de fondo */}
      <div aria-hidden className="absolute inset-0 grid-bg opacity-80" />

      {/* Línea de escaneo que recorre la pantalla */}
      <div
        aria-hidden
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent animate-scan"
      />

      {/* Viñeta / resplandor de tubo de rayos */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none [background:radial-gradient(circle_at_center,transparent_55%,rgba(0,0,0,0.55)_100%)]"
      />

      <div className="relative text-center max-w-xl w-full px-8 animate-flicker">

        <div className="relative w-32 h-32 mx-auto mb-8">
          <div
            aria-hidden
            className="absolute inset-0 rounded-full bg-gold/25 blur-2xl scale-125"
          />
          <img
            src={altaLogo}
            alt="Alta Mesa"
            className="relative w-32 h-32 object-contain"
          />
        </div>

        <h1 className="font-display text-5xl text-gold">
          EX COMMISSIO
        </h1>

        <h2 className="font-display text-3xl text-gold mb-10">
          ALTA MESA
        </h2>

        <button
          onClick={() => {

  playSfx("/sounds/luxbeep.mp3");

  playMusic(
    "/sounds/john.mp3",
    0.08,
    true,
    42
  );

  primeUnlockSound();

  onEnter();

}}
          className="mx-auto flex flex-col items-center border border-gold px-10 py-4 text-gold font-mono tracking-[0.3em] uppercase text-center hover:bg-gold hover:text-black transition"
        >
          <span>acceder</span>
        </button>

      </div>
    </main>
  );
}