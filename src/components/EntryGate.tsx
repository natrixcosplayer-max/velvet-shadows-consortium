import altaLogo from "../assets/alta.png";
import {
  playMusic,
  playVoice,
  primeUnlockSound,
} from "../audio/audiomanager";

type Props = {
  onEnter: () => void;
};

export function EntryGate({ onEnter }: Props) {
  return (
    <main className="fixed inset-0 bg-background flex items-center justify-center">
      <div className="text-center max-w-xl w-full px-8">

        <img
          src={altaLogo}
          alt="Alta Mesa"
          className="w-32 h-32 mx-auto mb-8 object-contain"
        />

        <h1 className="font-display text-5xl text-gold">
          EX COMMISSIO
        </h1>

        <h2 className="font-display text-3xl text-gold mb-10">
          ALTA MESA
        </h2>

        <button
          onClick={() => {

  primeUnlockSound();

  playMusic(
    "/sounds/john.mp3",
    0.08,
    true,
    42
  );

  onEnter();

}}
          className="border border-gold px-10 py-4 text-gold font-mono tracking-[0.3em] uppercase hover:bg-gold hover:text-black transition"
        >
          ACCEDER
        </button>

      </div>
    </main>
  );
}