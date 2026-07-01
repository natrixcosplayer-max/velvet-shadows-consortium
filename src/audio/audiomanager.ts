let music: HTMLAudioElement | null = null;
let voice: HTMLAudioElement | null = null;

export function playMusic(
  src: string,
  volume = 0.1,
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

export function playVoice(
  src: string,
  volume = 0.45
) {
  stopVoice();

  voice = new Audio(src);

voice.preload = "auto";
voice.volume = volume;

  voice.play().catch(() => {});
}

export function stopVoice() {
  if (!voice) return;

  voice.pause();
  voice.currentTime = 0;
  voice = null;
}

export function fadeOutVoice(ms = 400) {
  if (!voice) return;

  const step = voice.volume / (ms / 40);

  const fade = setInterval(() => {

    if (!voice) {
      clearInterval(fade);
      return;
    }

    voice.volume -= step;

    if (voice.volume <= 0) {
      voice.pause();
      voice.currentTime = 0;
      voice = null;
      clearInterval(fade);
    }

  }, 40);
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

  const playNext = (index: number) => {
    if (index >= files.length) return;

    stopVoice();

    voice = new Audio(files[index]);

voice.preload = "auto";
voice.volume = volume;
    voice.onended = () => {
      playNext(index + 1);
    };

    voice.play().catch(() => {});
  };

  playNext(0);
}