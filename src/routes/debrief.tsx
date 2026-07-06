'use client';

import { useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useRef, useCallback } from 'react';
import { playSfx } from '../audio/audiomanager';
import { AppShell } from '../components/AppShell';

type Phase = 'SECURE_LINK' | 'INCOMING_SIGNAL' | 'CALL_REQUEST' | 'VIDEO' | 'FINALE';

const ESTABLISHMENT_MESSAGES = [
  'Verificando identidad...',
  'Comprobando autorización...',
  'Escaneando canal seguro...',
  'Negociando cifrado...',
  'Canal Continental...',
  'Activando enlace...',
];

export function DebriefRoute() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('SECURE_LINK');
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [videoEnded, setVideoEnded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const beepIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // PHASE 1: Secure link establishment
  useEffect(() => {
    if (phase !== 'SECURE_LINK') return;

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.random() * 15;
        if (next >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return next;
      });
    }, 150);

    // Message cycling every 400ms
    const msgInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % ESTABLISHMENT_MESSAGES.length);
      playSfx('/sounds/luxbeep.mp3', 0.12);
    }, 400);

    messageIntervalRef.current = msgInterval;

    // After ~3.5 seconds, transition to PHASE 2
    const timer = setTimeout(() => {
      clearInterval(progressInterval);
      setProgress(100);
      setPhase('INCOMING_SIGNAL');
    }, 3500);

    timerRef.current = timer;

    return () => {
      clearInterval(progressInterval);
      if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase]);

  // PHASE 2: Incoming signal
  useEffect(() => {
    if (phase !== 'INCOMING_SIGNAL') return;

    const timer = setTimeout(() => {
      setPhase('CALL_REQUEST');
    }, 2500);

    timerRef.current = timer;

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase]);

  // PHASE 4: Video auto-play when entering
  useEffect(() => {
    if (phase !== 'VIDEO' || !videoRef.current) return;

    const playVideo = async () => {
      try {
        await videoRef.current?.play();
      } catch (err) {
        console.error('Video play failed:', err);
      }
    };

    playVideo();
  }, [phase]);

  // Video ended handler
  const handleVideoEnded = useCallback(() => {
    setVideoEnded(true);
    setPhase('FINALE');
  }, []);

  // Handle accept call button
  const handleAcceptCall = useCallback(() => {
    playSfx('/sounds/luxbeep.mp3', 0.15);
    setPhase('VIDEO');
  }, []);

  // Handle close expedient button
  const handleCloseExpedient = useCallback(() => {
    navigate({ to: '/' });
  }, [navigate]);

  return (
    <AppShell title="Debrief" latin="Recessus">
      <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden relative">
        {/* Vignette effect */}
        <div className="fixed inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.4) 100%)',
          zIndex: 10,
        }} />

        {/* Scanlines */}
        <div className="fixed inset-0 pointer-events-none scanlines" style={{
          zIndex: 11,
          opacity: 0.08,
        }} />

        {/* PHASE 1: Secure Link Establishment */}
        {phase === 'SECURE_LINK' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 animate-in fade-in">
            <div className="space-y-8 max-w-xl">
              {/* Title */}
              <div className="text-center space-y-2">
                <h1 className="font-display text-3xl md:text-4xl tracking-wider text-gold">
                  ESTABLECIENDO ENLACE SEGURO
                </h1>
                <p className="font-mono text-sm text-gold-dim tracking-[0.2em]">
                  ROMA
                </p>
                <p className="font-mono text-sm text-gold-dim tracking-[0.2em]">
                  CONSEJO MAGISTRAL
                </p>
              </div>

              {/* Progress bar */}
              <div className="space-y-4">
                <div className="relative h-1 bg-gold-dim/20 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-transparent via-gold to-transparent transition-all duration-300"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>

                {/* Status message */}
                <div className="h-6 flex items-center justify-center">
                  <p className="font-mono text-xs text-gold-dim text-center tracking-wide">
                    {ESTABLISHMENT_MESSAGES[messageIndex]}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PHASE 2: Incoming Signal */}
        {phase === 'INCOMING_SIGNAL' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 animate-in fade-in">
            <div className="space-y-8 max-w-xl text-center">
              {/* Top text */}
              <div className="space-y-4">
                <p className="font-mono text-xs text-gold-dim tracking-[0.3em]">
                  CANAL SEGURO ESTABLECIDO
                </p>

                {/* Slight glitch effect text */}
                <div className="relative h-16 flex items-center justify-center">
                  <p
                    className="font-display text-2xl tracking-wider text-gold"
                    style={{
                      animation: 'flicker 0.15s ease-in-out',
                    }}
                  >
                    TRANSMISIÓN ENTRANTE
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="font-mono text-xs text-gold-dim tracking-[0.2em]">
                    MAGISTRADA DE LA ALTA MESA
                  </p>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="flex justify-center gap-4">
                <div className="w-1 h-8 bg-gold/30" />
                <div className="w-1 h-12 bg-gold/50" />
                <div className="w-1 h-8 bg-gold/30" />
              </div>
            </div>
          </div>
        )}

        {/* PHASE 3: Call Request */}
        {phase === 'CALL_REQUEST' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 animate-in fade-in">
            <div className="space-y-12 max-w-lg text-center">
              <div>
                <p className="font-display text-lg tracking-widest text-gold-bright mb-2">
                  LA MAGISTRADA
                </p>
                <p className="font-mono text-sm text-gold-dim tracking-wider">
                  solicita una comunicación privada
                </p>
              </div>

              <button
                onClick={handleAcceptCall}
                className="px-8 py-4 border-2 border-gold text-gold font-display text-sm tracking-[0.2em] transition-all duration-300 hover:bg-gold/10 hover:shadow-lg active:scale-95"
                style={{
                  boxShadow: '0 0 20px rgba(178, 148, 69, 0.3)',
                }}
              >
                ACEPTAR LLAMADA
              </button>
            </div>
          </div>
        )}

        {/* PHASE 4: Video Call */}
        {phase === 'VIDEO' && (
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            <video
              ref={videoRef}
              src="/videos/oldwoman.mp4"
              className="w-full h-full object-cover"
              playsInline
              onEnded={handleVideoEnded}
            />

            {/* Top Left Info */}
            <div className="absolute top-4 left-4 font-mono text-[10px] text-gold-dim space-y-1 z-20 pointer-events-none">
              <p>ROMA</p>
              <p>MAGISTRADA</p>
              <p>ALTA MESA</p>
            </div>

            {/* Top Right - Live indicator */}
            <div className="absolute top-4 right-4 flex items-center gap-2 font-mono text-[10px] text-gold-dim z-20 pointer-events-none">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              <span>EN DIRECTO</span>
            </div>

            {/* Bottom Left - Security Info */}
            <div className="absolute bottom-4 left-4 font-mono text-[10px] text-gold-dim space-y-1 z-20 pointer-events-none">
              <p>CANAL SEGURO</p>
              <p>RSA-4096</p>
            </div>

            {/* Bottom Right - Latency Info */}
            <div className="absolute bottom-4 right-4 font-mono text-[10px] text-gold-dim space-y-1 text-right z-20 pointer-events-none">
              <p>LATENCIA 12 ms</p>
              <p>AURUM VII</p>
            </div>
          </div>
        )}

        {/* PHASE 5: Finale */}
        {phase === 'FINALE' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 animate-in fade-in">
            <div className="space-y-8 max-w-xl text-center">
              {/* Fade in text */}
              <div className="space-y-6">
                <p className="font-mono text-xs text-gold-dim tracking-[0.3em]">
                  TRANSMISIÓN FINALIZADA
                </p>

                <p className="font-display text-2xl tracking-wider text-gold">
                  OPERACIÓN MINERVA
                </p>

                <p className="font-mono text-sm text-gold-dim tracking-[0.15em]">
                  ACTIVO RECUPERADO
                </p>

                <p className="font-display text-lg tracking-widest text-gold-bright">
                  MISIÓN COMPLETADA
                </p>
              </div>

              {/* Close button */}
              <div className="pt-6">
                <button
                  onClick={handleCloseExpedient}
                  className="px-8 py-4 border-2 border-gold text-gold font-display text-sm tracking-[0.2em] transition-all duration-300 hover:bg-gold/10 hover:shadow-lg active:scale-95"
                  style={{
                    boxShadow: '0 0 20px rgba(178, 148, 69, 0.3)',
                  }}
                >
                  CERRAR EXPEDIENTE
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
