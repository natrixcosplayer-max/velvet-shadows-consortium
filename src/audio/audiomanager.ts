let music: HTMLAudioElement | null = null;
let voice: HTMLAudioElement | null = null;

let musicFade: ReturnType<typeof setInterval> | null = null;
let voiceFade: ReturnType<typeof setInterval> | null = null;
let hasUserGesture = false;
let listenersAttached = false;
let pendingMusicPlay = false;
let pendingUnlockVolume: number | null = null;
let emailVoiceRequestId = 0;

const MUSIC_VOLUME = 0.08;
const MUSIC_DUCK_VOLUME = 0.005;
const EMAIL_VOICES: Record<string, string> = {
  "1": "/sounds/mailhotel.wav",
  "2": "/sounds/email.mp3",
  "3": "/sounds/mailroma.wav",
  "4": "/sounds/pitas.wav",
  "5": "/sounds/russian.wav",
};

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
}

export function seekMusic(seconds: number) {
  if (!music) return;

  music.currentTime = seconds;
}

export function fadeMusicVolume(
  target: number,
  ms = 500
) {
  if (!music) return;

  const start = music.volume;
  const step = (target - start) / (ms / 40);

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
  fadeMusicVolume(MUSIC_VOLUME, 1200);
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

  if (unlockSound) return;

  unlockSound = new Audio("/sounds/unlock.mp3");
  unlockSound.preload = "auto";
  unlockSound.volume = 0;
  unlockSound.muted = true;

  // Reproducir en silencio dentro del gesto desbloquea el elemento en iOS.
  unlockSound
    .play()
    .then(() => {
      if (!unlockSound) return;
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
  const sound = unlockSound || new Audio("/sounds/unlock.mp3");

  if (!sound) return;

  // iPhone can make short cues feel unducked if we only fade; force immediate duck.
  duckMusicImmediate();

  sound.currentTime = 0;
  sound.volume = volume;
  sound.muted = false;

  sound.onended = () => {
    restoreMusic();
  };

  const result = sound.play();
  if (result) {
    result.catch(() => {
      restoreMusic();
      pendingUnlockVolume = volume;
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

  const sfx = new Audio(src);
  sfx.volume = volume;
  sfx.play().catch(() => {});
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

    fadeMusicVolume(MUSIC_VOLUME, 1200);

  }

  

};

    voice.play().catch(() => {});
  };

  playNext(0);
}
export async function playEmailVoice(id: string) {
  const voiceSrc = EMAIL_VOICES[id];

  if (!voiceSrc) return;

  const requestId = ++emailVoiceRequestId;

  await fadeOutVoice(260);

  // If a newer email was requested while fading, cancel this older request.
  if (requestId !== emailVoiceRequestId) return;

  await playVoice(voiceSrc);
}

export function stopEmailVoice(ms = 300) {
  emailVoiceRequestId += 1;
  return fadeOutVoice(ms);
}
