let music: HTMLAudioElement | null = null;
let voice: HTMLAudioElement | null = null;
let controlledAudio: HTMLAudioElement | null = null;
let controlledAudioKey: string | null = null;

let musicFade: ReturnType<typeof setInterval> | null = null;
let voiceFade: ReturnType<typeof setInterval> | null = null;
let hasUserGesture = false;
let listenersAttached = false;
let pendingMusicPlay = false;
let pendingUnlockVolume: number | null = null;
let musicRestoreSuppressed = false;
let musicPinnedDuck = false;
let temporaryMusicTarget: number | null = null;
let temporaryMusicTargetTimer: ReturnType<typeof setTimeout> | null = null;
let musicPausedForComms = false;
let emailVoice: HTMLAudioElement | null = null;
let emailMusicDucked = false;

const MUSIC_VOLUME = 0.064;
const MUSIC_DUCK_VOLUME = 0.005;
const UNLOCK_DUCK_VOLUME = 0.001;
let musicBaseVolume = MUSIC_VOLUME;
const EMAIL_VOICES: Record<string, string> = {
  "1": "/sounds/mailhotel.wav",
  "2": "/sounds/email.mp3",
  "3": "/sounds/mailroma.wav",
  "4": "/sounds/pitas.wav",
  "5": "/sounds/russian.wav",
};
const EMAIL_CONTROLLED_KEY = "comms-email";

function isIPhoneSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /iPhone/i.test(ua) && /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua);
}

function logJohnVolumeAroundUnlock(stage: string) {
  if (!isIPhoneSafari()) return;

  console.log(`[audio][unlock] ${stage}`, {
    johnVolume: music?.volume ?? null,
    johnPaused: music?.paused ?? null,
    johnMuted: music?.muted ?? null,
    johnCurrentTime: music?.currentTime ?? null,
  });
}

function ensureUnlockSound() {
  if (unlockSound) return unlockSound;

  unlockSound = new Audio("/sounds/unlock.mp3");
  unlockSound.preload = "auto";
  unlockSound.volume = 0;
  unlockSound.muted = true;
  return unlockSound;
}

function getPreferredMusicTarget() {
  if (musicRestoreSuppressed) return 0;
  if (musicPinnedDuck) return MUSIC_DUCK_VOLUME;
  if (temporaryMusicTarget !== null) return temporaryMusicTarget;
  return musicBaseVolume;
}

function attachGestureUnlockListeners() {
  if (listenersAttached || typeof window === "undefined") return;
  listenersAttached = true;

  const onGesture = () => {
    hasUserGesture = true;

    if (music && pendingMusicPlay) {
      const retry = music.play();
      if (retry) {
        retry
          .then(() => {
            pendingMusicPlay = false;
          })
          .catch(() => {});
      }
    }

    if (pendingUnlockVolume !== null) {
      const volume = pendingUnlockVolume;
      pendingUnlockVolume = null;
      playUnlockSound(volume).catch(() => {});
    }
  };

  window.addEventListener("pointerdown", onGesture, { passive: true });
  window.addEventListener("touchstart", onGesture, { passive: true });
  window.addEventListener("click", onGesture, { passive: true });
  window.addEventListener("keydown", onGesture, { passive: true });
}

attachGestureUnlockListeners();

export function playMusic(
  src: string,
  volume = MUSIC_VOLUME,
  loop = true,
  startTime = 0
) {

  if (music) return;

  music = new Audio(src);

  music.preload = "auto";
  music.loop = loop;
  music.volume = volume;

  const startPlayback = () => {
    if (!music) return;

    music.currentTime = startTime;
    const result = music.play();

    if (result) {
      result
        .then(() => {
          pendingMusicPlay = false;
        })
        .catch(() => {
          // Safari iOS can block autoplay until a real user gesture.
          pendingMusicPlay = true;
          attachGestureUnlockListeners();
        });
    }
  };

  music.addEventListener("loadedmetadata", startPlayback, { once: true });

  if (music.readyState >= 1) {
    startPlayback();
  }
}

export function stopMusic() {
  if (!music) return;

  music.pause();
  music.currentTime = 0;
  music = null;
  pendingMusicPlay = false;

  if (temporaryMusicTargetTimer) {
    clearTimeout(temporaryMusicTargetTimer);
    temporaryMusicTargetTimer = null;
  }
  temporaryMusicTarget = null;
  musicPausedForComms = false;
}

export function seekMusic(seconds: number) {
  if (!music) return;

  music.currentTime = seconds;
}

export function fadeMusicVolume(
  target: number,
  ms = 500,
  onComplete?: () => void
) {
  if (!music) return;

  if (ms <= 0) {
    music.volume = target;
    onComplete?.();
    return;
  }

  const step = (target - music.volume) / (ms / 40);

if (musicFade) {
  clearInterval(musicFade);
}



musicFade = setInterval(() => {
if (!music) {
  if (musicFade) {
    clearInterval(musicFade);
    musicFade = null;
  }
  return;
}

    music.volume += step;

    if (
      (step > 0 && music.volume >= target) ||
      (step < 0 && music.volume <= target)
    ) {
   music.volume = target;

if (musicFade) {
  clearInterval(musicFade);
  musicFade = null;
}
      onComplete?.();
    }

  }, 40);
}
export function duckMusic() {
  fadeMusicVolume(MUSIC_DUCK_VOLUME, 300);
}

function duckMusicImmediate() {
  if (!music) return;

  if (musicFade) {
    clearInterval(musicFade);
    musicFade = null;
  }

  music.volume = MUSIC_DUCK_VOLUME;
}

export function restoreMusic() {
  fadeMusicVolume(getPreferredMusicTarget(), 1200);
}

export function setMusicBaseVolume(volume: number, ms = 300) {
  musicBaseVolume = Math.max(0, Math.min(1, volume));

  if (!music || musicPausedForComms || emailMusicDucked || musicRestoreSuppressed || musicPinnedDuck || temporaryMusicTarget !== null) return;

  fadeMusicVolume(musicBaseVolume, ms);
}

export function pauseMusicForComms(ms = 1800): Promise<void> {
  return new Promise((resolve) => {
    if (!music || music.paused) {
      musicPausedForComms = false;
      resolve();
      return;
    }

    musicPausedForComms = true;
    fadeMusicVolume(0, ms, () => {
      if (music) {
        music.pause();
      }
      resolve();
    });
  });
}

export function resumeMusicAfterComms(ms = 1500) {
  if (!music || !musicPausedForComms) return;

  musicPausedForComms = false;
  const target = getPreferredMusicTarget();

  if (musicFade) {
    clearInterval(musicFade);
    musicFade = null;
  }

  music.volume = 0;
  const resume = music.play();
  if (resume) {
    resume
      .then(() => {
        pendingMusicPlay = false;
        fadeMusicVolume(target, ms);
      })
      .catch(() => {
        pendingMusicPlay = true;
        attachGestureUnlockListeners();
      });
    return;
  }

  fadeMusicVolume(target, ms);
}

export function attenuateMusicTemporarily(reductionPercent = 0.7, durationMs = 7000) {
  const reduction = Math.max(0, Math.min(1, reductionPercent));
  const target = Math.max(0, Math.min(1, musicBaseVolume * (1 - reduction)));

  temporaryMusicTarget = target;

  if (temporaryMusicTargetTimer) {
    clearTimeout(temporaryMusicTargetTimer);
    temporaryMusicTargetTimer = null;
  }

  restoreMusic();

  temporaryMusicTargetTimer = setTimeout(() => {
    temporaryMusicTarget = null;
    temporaryMusicTargetTimer = null;
    restoreMusic();
  }, Math.max(0, durationMs));
}

export function setMusicPinnedDuck(pinned: boolean) {
  musicPinnedDuck = pinned;

  if (!music || musicRestoreSuppressed) return;

  if (musicFade) {
    clearInterval(musicFade);
    musicFade = null;
  }

  if (musicPinnedDuck) {
    music.volume = MUSIC_DUCK_VOLUME;
    return;
  }

  fadeMusicVolume(musicBaseVolume, 320);
}

export function setMusicRestoreSuppressed(suppressed: boolean) {
  musicRestoreSuppressed = suppressed;

  if (suppressed) {
    fadeMusicVolume(0, 180);
    return;
  }

  restoreMusic();
}

function clearVoiceFade() {
  if (!voiceFade) return;
  clearInterval(voiceFade);
  voiceFade = null;
}

function fadeInActiveVoice(targetVolume: number, ms = 140) {
  if (!voice) return;

  clearVoiceFade();

  if (ms <= 0) {
    voice.volume = targetVolume;
    return;
  }

  const start = voice.volume;
  const step = (targetVolume - start) / Math.max(1, ms / 20);

  voiceFade = setInterval(() => {
    if (!voice) {
      clearVoiceFade();
      return;
    }

    voice.volume = Math.max(0, Math.min(targetVolume, voice.volume + step));

    if ((step >= 0 && voice.volume >= targetVolume) || (step < 0 && voice.volume <= targetVolume)) {
      voice.volume = targetVolume;
      clearVoiceFade();
    }
  }, 20);
}

export async function playVoice(
  src: string,
  volume = 0.45
) {
  if (voice) {
    stopVoice();
  }

  voice = new Audio(src);
  voice.preload = "auto";
  voice.volume = 0;

  voice.onended = () => {
    clearVoiceFade();
    voice = null;
    restoreMusic();
  };

  // Force immediate duck before attempting playback; iOS can expose a loud transient otherwise.
  duckMusicImmediate();
  const playPromise = voice.play();

  if (playPromise) {
    duckMusicImmediate();

    playPromise
      .then(() => {
        duckMusicImmediate();
        fadeInActiveVoice(volume, 140);
      })
      .catch(() => {
        restoreMusic();
        clearVoiceFade();
        voice = null;
      });

    await playPromise.catch(() => undefined);
  }
}

export function stopVoice() {
  if (!voice) return;

  clearVoiceFade();
  voice.pause();
  voice.currentTime = 0;
  voice = null;
  restoreMusic();
}

export function fadeOutVoice(ms = 300): Promise<void> {

  return new Promise((resolve) => {
    clearVoiceFade();

    if (!voice) {
      restoreMusic();
      resolve();
      return;
    }

    const step = voice.volume / (ms / 40);

    const fade = setInterval(() => {

      if (!voice) {

        clearInterval(fade);
        restoreMusic();
        resolve();
        return;

      }

      const newVolume = Math.max(0, voice.volume - step);

voice.volume = newVolume;

      if (voice.volume <= 0) {

        voice.pause();
        voice.currentTime = 0;
        voice = null;

        clearInterval(fade);
        restoreMusic();
        resolve();

      }
      

    }, 40);

  });

}

// --- Desbloqueo específico para unlock.mp3 en iOS ---
let unlockSound: HTMLAudioElement | null = null;

// Debe llamarse SÍNCRONAMENTE desde un gesto real del usuario (botón ACCEDER).
export function primeUnlockSound() {
  hasUserGesture = true;
  const sound = ensureUnlockSound();

  // Reproducir en silencio dentro del gesto desbloquea el elemento en iOS.
  sound
    .play()
    .then(() => {
      if (!unlockSound) return;
      // If unlock playback was already requested, do not interrupt it.
      if (!unlockSound.muted) return;
      unlockSound.pause();
      unlockSound.currentTime = 0;
      // Mantener mute hasta la reproducción real para que no se oiga nada ahora.
      unlockSound.muted = true;
    })
    .catch(() => {
      // Si no se puede reproducir ahora, el audio quedará preparado para el siguiente gesto válido.
    });
}

export async function playUnlockSound(volume = 0.45) {
  const sound = ensureUnlockSound();

  if (!sound) return;

  logJohnVolumeAroundUnlock("before ducking");

  // 1) Cancelar cualquier fade activo.
  if (musicFade) {
    clearInterval(musicFade);
    musicFade = null;
  }

  // 2) Aplicar ducking inmediato reutilizando la ruta única.
  if (music) {
    duckMusicImmediate();
  }

  // 3) Esperar un frame para que Safari aplique el volumen antes de unlock.
  await new Promise<void>((resolve) => {
    if (typeof window === "undefined" || typeof window.requestAnimationFrame !== "function") {
      resolve();
      return;
    }
    window.requestAnimationFrame(() => resolve());
  });

  // 4) Verificar volumen ya aplicado.
  if (music) {
    const expected = UNLOCK_DUCK_VOLUME;
    console.log("[audio][unlock] john.volume check before unlock.play()", {
      current: music.volume,
      expected,
      matchesExpected: Math.abs(music.volume - expected) < 0.0001,
      paused: music.paused,
      muted: music.muted,
    });
    logJohnVolumeAroundUnlock("during unlock (after RAF, before play)");
  }

  // 5) Reproducir unlock sólo después de verificar el volumen.
  const safeVolume = Math.max(0, Math.min(1, volume));
  sound.currentTime = 0;
  sound.volume = safeVolume;
  sound.muted = false;

  sound.onended = () => {
    restoreMusic();
    logJohnVolumeAroundUnlock("after unlock (restore requested)");
  };

  const result = sound.play();
  if (result) {
    result.catch(() => {
      restoreMusic();
      logJohnVolumeAroundUnlock("after unlock (play failed, restore requested)");
      pendingUnlockVolume = safeVolume;
      attachGestureUnlockListeners();
    });
  }
}

export function duckMusicForVoice() {
  fadeMusicVolume(MUSIC_DUCK_VOLUME, 300);
}

export function restoreMusicAfterVoice() {
  restoreMusic();
}

export function playSfx(src: string, volume = 1) {
  if (!hasUserGesture) {
    attachGestureUnlockListeners();
  }

  // Global rule: unlock cue always uses the unlock pipeline so john.mp3 ducks first.
  if (/(^|\/)unlock\.mp3(?:\?.*)?$/i.test(src)) {
    void playUnlockSound(volume);
    return;
  }

  const sfx = new Audio(src);
  sfx.volume = volume;
  sfx.play().catch(() => {});
}

export function playControlledAudio(
  key: string,
  src: string,
  volume = 0.22,
  loop = false
) {
  if (!hasUserGesture) {
    attachGestureUnlockListeners();
  }

  if (controlledAudioKey === key && controlledAudio) {
    const sameSource = controlledAudio.src.endsWith(src);

    if (!sameSource) {
      controlledAudio.pause();
      controlledAudio.currentTime = 0;
      controlledAudio = null;
      controlledAudioKey = null;
    } else {
    controlledAudio.loop = loop;
    controlledAudio.volume = volume;
    controlledAudio.currentTime = 0;
    const resume = controlledAudio.play();
    if (resume) {
      resume.catch(() => {});
    }
    return;
    }
  }

  if (controlledAudio) {
    controlledAudio.pause();
    controlledAudio.currentTime = 0;
    controlledAudio = null;
    controlledAudioKey = null;
  }

  controlledAudio = new Audio(src);
  controlledAudioKey = key;
  controlledAudio.preload = "auto";
  controlledAudio.loop = loop;
  controlledAudio.volume = volume;

  const playPromise = controlledAudio.play();
  if (playPromise) {
    playPromise.catch(() => {
      if (controlledAudioKey === key) {
        controlledAudio = null;
        controlledAudioKey = null;
      }
    });
  }
}

export function stopControlledAudio(key?: string) {
  if (!controlledAudio) return;
  if (key && controlledAudioKey !== key) return;

  controlledAudio.pause();
  controlledAudio.currentTime = 0;
  controlledAudio = null;
  controlledAudioKey = null;
}

export function setControlledAudioVolume(key: string, volume: number) {
  if (!controlledAudio) return;
  if (controlledAudioKey !== key) return;

  controlledAudio.volume = Math.max(0, Math.min(1, volume));
}

export function playControlledAudioAndWait(
  key: string,
  src: string,
  volume = 0.22
): Promise<void> {
  return new Promise((resolve) => {
    if (!hasUserGesture) {
      attachGestureUnlockListeners();
    }

    if (controlledAudio) {
      controlledAudio.pause();
      controlledAudio.currentTime = 0;
      controlledAudio = null;
      controlledAudioKey = null;
    }

    const audio = new Audio(src);
    controlledAudio = audio;
    controlledAudioKey = key;
    audio.preload = "auto";
    audio.loop = false;
    audio.volume = volume;

    let finished = false;
    const cleanup = () => {
      if (finished) return;
      finished = true;
      audio.onended = null;
      audio.onerror = null;
      if (controlledAudio === audio) {
        controlledAudio = null;
        controlledAudioKey = null;
      }
      resolve();
    };

    audio.onended = cleanup;
    audio.onerror = cleanup;

    const playPromise = audio.play();
    if (playPromise) {
      playPromise.catch(() => {
        cleanup();
      });
    }
  });
}
export function playVoiceQueue(
  files: string[],
  volume = 0.45
) {
  if (files.length === 0) return;

 const playNext = async (index: number) => {
    if (index >= files.length) return;

   await fadeOutVoice();

duckMusicImmediate();

voice = new Audio(files[index]);

voice.preload = "auto";
voice.volume = volume;
    voice.onended = () => {

  if (index < files.length - 1) {

    playNext(index + 1);

  } else {

    fadeMusicVolume(musicBaseVolume, 1200);

  }

  

};

    voice.play().catch(() => {});
  };

  playNext(0);
}
export function playEmailVoice(id: string) {
  const voiceSrc = EMAIL_VOICES[id];

  if (!voiceSrc) {
    stopEmailVoice();
    return;
  }

  stopControlledAudio(EMAIL_CONTROLLED_KEY);

  if (emailVoice) {
    emailVoice.pause();
    emailVoice.currentTime = 0;
    emailVoice = null;
  }

  const audio = new Audio(voiceSrc);
  emailVoice = audio;
  audio.preload = "auto";
  audio.volume = 0.58;

  emailMusicDucked = Boolean(music && !music.paused);
  if (emailMusicDucked) {
    const duckTarget = Math.max(0, Math.min(1, getPreferredMusicTarget() * 0.2));
    fadeMusicVolume(duckTarget, 380);
  }

  const restoreAfterEmail = () => {
    if (!emailMusicDucked) return;
    emailMusicDucked = false;
    fadeMusicVolume(getPreferredMusicTarget(), 380);
  };

  audio.onended = () => {
    if (emailVoice === audio) {
      emailVoice = null;
    }
    restoreAfterEmail();
  };

  const playPromise = audio.play();
  if (playPromise) {
    playPromise.catch(() => {
      if (emailVoice === audio) {
        emailVoice = null;
      }
      restoreAfterEmail();
    });
  }
}

export function stopEmailVoice(_ms = 300) {
  stopControlledAudio(EMAIL_CONTROLLED_KEY);

  if (emailVoice) {
    emailVoice.pause();
    emailVoice.currentTime = 0;
    emailVoice = null;
  }

  if (emailMusicDucked) {
    emailMusicDucked = false;
    fadeMusicVolume(getPreferredMusicTarget(), 380);
  }
}
