export type DebriefPhase = "starting" | "priority" | "waiting" | "auth" | "link" | "video" | "finished";

export const MESSAGES = [
  "Verificando identidad...",
  "Comprobando autorizacion...",
  "Escaneando canal...",
  "Negociando cifrado...",
  "Activando enlace Continental...",
] as const;

export const AUTH_LINES = ["IDENTIDAD", "OPERATIVO", "CIFRADO", "CANAL"] as const;

export const CLOSING_LINES = [
  "CANAL SEGURO CERRADO ✔",
  "EXPEDIENTE ARCHIVADO ✔",
  "ACTIVO RECUPERADO ✔",
  "MISION COMPLETADA ✔",
] as const;
