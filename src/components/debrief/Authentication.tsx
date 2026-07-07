import { AUTH_LINES } from "./types";

type AuthenticationProps = {
  authStep: number;
  authFlashIndex: number | null;
};

export function Authentication({ authStep, authFlashIndex }: AuthenticationProps) {
  return (
    <div className="space-y-6">
      <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-gold-dim [text-shadow:0_0_6px_rgba(214,173,74,0.2)]">AUTENTICANDO OPERATIVO</p>
      <div className="space-y-2 font-mono text-[13px] tracking-[0.26em] uppercase text-gold-dim [text-shadow:0_0_6px_rgba(214,173,74,0.2)]">
        {AUTH_LINES.map((line, idx) => (
          <p
            key={line}
            className={`transition-[opacity,filter,color] duration-200 ${authStep >= idx ? "opacity-100 text-gold" : "opacity-30"} ${authFlashIndex === idx ? "brightness-[1.12] [text-shadow:0_0_8px_rgba(214,173,74,0.28)]" : ""}`}
          >
            {line} {authStep >= idx ? "✔" : ""}
          </p>
        ))}
      </div>
    </div>
  );
}
