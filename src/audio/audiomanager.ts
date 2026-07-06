let music: HTMLAudioElement | null = null;
let voice: HTMLAudioElement | null = null;

let musicFade: ReturnType<typeof setInterval> | null = null;
const MUSIC_VOLUME = 0.08;
const MUSIC_DUCK_VOLUME = 0.01;
const EMAIL_VOICES: Record<string, string> = {
  "1": "/sounds/mailhotel.wav",
  "2": "/sounds/email.mp3",
  "3": "/sounds/mailroma.wav",
  "4": "/sounds/pitas.wav",
  "5": "/sounds/russian.wav",
};

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

  music.addEventListener(
    "loadedmetadata",
    () => {
      if (!music) return;

      music.currentTime = startTime;
      music.play().catch(() => {});
    },
    { once: true }
  );
}

export function stopMusic() {
  if (!music) return;

  music.pause();
  music.currentTime = 0;
  music = null;
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

export function restoreMusic() {
  fadeMusicVolume(MUSIC_VOLUME, 1200);
}

export function playVoice(
  src: string,
  volume = 0.45
) {
  if (voice) {
    voice.pause();
    voice.currentTime = 0;
    voice = null;
  }

  duckMusic();

  voice = new Audio(src);
  voice.preload = "auto";
  voice.volume = volume;

  voice.onended = () => {
    restoreMusic();
  };

  voice.play().catch(console.error);
}

export function stopVoice() {
  if (!voice) return;

  voice.pause();
  voice.currentTime = 0;
  voice = null;
}

export function fadeOutVoice(ms = 300): Promise<void> {

  return new Promise((resolve) => {

    if (!voice) {
      resolve();
      return;
    }

    const step = voice.volume / (ms / 40);

    const fade = setInterval(() => {

      if (!voice) {

        clearInterval(fade);
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

        resolve();

      }
      

    }, 40);

  });

}

// --- Desbloqueo específico para unlock.mp3 en iOS ---
let unlockSound: HTMLAudioElement | null = null;

// Debe llamarse SÍNCRONAMENTE desde un gesto real del usuario (botón ACCEDER).
export function primeUnlockSound() {
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
      unlockSound.muted = false;
    })
    .catch(() => {
      if (unlockSound) {
        unlockSound.muted = false;
      }
    });
}

export function playUnlockSound(volume = 0.45) {
  if (!unlockSound) return;

  fadeMusicVolume(MUSIC_DUCK_VOLUME, 300);

  unlockSound.currentTime = 0;
  unlockSound.volume = volume;

  unlockSound.onended = () => {
    fadeMusicVolume(MUSIC_VOLUME, 1200);
  };

  unlockSound.play().catch(() => {});
}

export function playSfx(src: string, volume = 1) {
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

duckMusic();

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

  const voice = EMAIL_VOICES[id];

  if (!voice) return;
console.log("Reproduciendo:", voice);
  await playVoice(voice);

}
