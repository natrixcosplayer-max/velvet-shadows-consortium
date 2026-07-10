let music: HTMLAudioElement | null = null;
let controlledAudio: HTMLAudioElement | null = null;
let controlledAudioKey: string | null = null;
let unlockSound: HTMLAudioElement | null = null;
let emailVoice: HTMLAudioElement | null = null;

let hasUserGesture = false;
let listenersAttached = false;
let gestureHandler: (() => void) | null = null;
let pendingMusicPlay = false;
let pendingUnlockVolume: number | null = null;

let temporaryMusicTarget: number | null = null;
let temporaryMusicTargetTimer: ReturnType<typeof setTimeout> | null = null;
let musicPausedForComms = false;
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

const EMAIL_CONTROLLED_KEY = "atrium-email";

let audioContext: AudioContext | null = null;
let musicSourceNode: MediaElementAudioSourceNode | null = null;
let musicGainNode: GainNode | null = null;
let gainAutomationVersion = 0;

function ensureAudioContext() {
  if (typeof window === "undefined") return null;

  if (!audioContext) {
    const Ctx =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;

    audioContext = new Ctx();
    musicGainNode = audioContext.createGain();
    musicGainNode.gain.value = MUSIC_VOLUME;
    musicGainNode.connect(audioContext.destination);
    console.log("[AUDIO CONTEXT READY]");
    console.log("[GAIN VALUE]", musicGainNode.gain.value);
  }

  return audioContext;
}

function getMusicGainNode() {
  return musicGainNode;
}

function ensureMusicGraph() {
  if (!music) return;
  const ctx = ensureAudioContext();
  const gain = getMusicGainNode();
  if (!ctx || !gain) return;

  if (!musicSourceNode) {
    musicSourceNode = ctx.createMediaElementSource(music);
    musicSourceNode.connect(gain);
  }
}

function resumeAudioContext() {
  const ctx = ensureAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    void ctx.resume();
  }
}

function waitForAudioTime(targetTime: number): Promise<void> {
  return new Promise((resolve) => {
    const ctx = ensureAudioContext();
    if (!ctx || typeof window === "undefined") {
      resolve();
      return;
    }

    const tick = () => {
      if (ctx.currentTime >= targetTime) {
        resolve();
        return;
      }
      window.requestAnimationFrame(tick);
    };

    window.requestAnimationFrame(tick);
  });
}

function scheduleMusicGain(target: number, ms: number) {
  const gain = getMusicGainNode();
  const ctx = ensureAudioContext();
  if (!gain || !ctx) return Promise.resolve();

  resumeAudioContext();

  const clamped = Math.max(0, Math.min(1, target));
  const now = ctx.currentTime;
  const endTime = now + Math.max(0, ms) / 1000;
  const version = ++gainAutomationVersion;

  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);

  if (ms <= 0) {
    gain.gain.setValueAtTime(clamped, now);
    console.log("[GAIN VALUE]", clamped);
    return Promise.resolve();
  }

  gain.gain.linearRampToValueAtTime(clamped, endTime);

  return waitForAudioTime(endTime).then(() => {
    if (version !== gainAutomationVersion) return;
    console.log("[GAIN VALUE]", gain.gain.value);
  });
}

function cancelMusicGainAutomation() {
  const gain = getMusicGainNode();
  const ctx = ensureAudioContext();
  if (!gain || !ctx) return;

  const now = ctx.currentTime;
  gainAutomationVersion += 1;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
}

function getPreferredMusicTarget() {
  if (temporaryMusicTarget !== null) return temporaryMusicTarget;
  return musicBaseVolume;
}

function ensureUnlockSound() {
  if (unlockSound) return unlockSound;

  unlockSound = new Audio("/sounds/unlock.mp3");
  unlockSound.preload = "auto";
  unlockSound.volume = 0;
  unlockSound.muted = true;
  return unlockSound;
}

function attachGestureUnlockListeners() {
  if (listenersAttached || typeof window === "undefined") return;
  listenersAttached = true;

  gestureHandler = () => {
    hasUserGesture = true;
    resumeAudioContext();

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
      void playUnlockSound(volume);
    }
  };

  window.addEventListener("pointerdown", gestureHandler, { passive: true });
  window.addEventListener("touchstart", gestureHandler, { passive: true });
  window.addEventListener("click", gestureHandler, { passive: true });
  window.addEventListener("keydown", gestureHandler, { passive: true });
}

function removeGestureUnlockListeners() {
  if (!listenersAttached || typeof window === "undefined" || !gestureHandler) return;

  window.removeEventListener("pointerdown", gestureHandler);
  window.removeEventListener("touchstart", gestureHandler);
  window.removeEventListener("click", gestureHandler);
  window.removeEventListener("keydown", gestureHandler);

  gestureHandler = null;
  listenersAttached = false;
}

attachGestureUnlockListeners();

export function playMusic(src: string, volume = MUSIC_VOLUME, loop = true, startTime = 0) {
  if (music) return;

  ensureAudioContext();
  music = new Audio(src);
  music.preload = "auto";
  music.loop = loop;
  music.volume = 1;

  musicBaseVolume = Math.max(0, Math.min(1, volume));
  ensureMusicGraph();
  void scheduleMusicGain(musicBaseVolume, 0);

  const startPlayback = () => {
    if (!music) return;

    resumeAudioContext();
    music.currentTime = startTime;
    const result = music.play();

    if (result) {
      result
        .then(() => {
          pendingMusicPlay = false;
        })
        .catch(() => {
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

  if (musicSourceNode) {
    musicSourceNode.disconnect();
    musicSourceNode = null;
  }

  music = null;
  pendingMusicPlay = false;

  if (temporaryMusicTargetTimer) {
    clearTimeout(temporaryMusicTargetTimer);
    temporaryMusicTargetTimer = null;
  }

  temporaryMusicTarget = null;
  musicPausedForComms = false;
}

export function fadeMusicVolume(target: number, ms = 500, onComplete?: () => void) {
  if (!music || !getMusicGainNode()) return;

  void scheduleMusicGain(target, ms).then(() => {
    onComplete?.();
  });
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
  cancelMusicGainAutomation();
  void scheduleMusicGain(0, 0);

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

  fadeMusicVolume(getPreferredMusicTarget(), 300);

  temporaryMusicTargetTimer = setTimeout(() => {
    temporaryMusicTarget = null;
    temporaryMusicTargetTimer = null;
    fadeMusicVolume(getPreferredMusicTarget(), 1200);
  }, Math.max(0, durationMs));
}

export function primeUnlockSound() {
  hasUserGesture = true;
  const sound = ensureUnlockSound();

  sound
    .play()
    .then(() => {
      if (!unlockSound) return;
      if (!unlockSound.muted) return;
      unlockSound.pause();
      unlockSound.currentTime = 0;
      unlockSound.muted = true;
    })
    .catch(() => {});
}

export async function playUnlockSound(volume = 0.45) {
  const sound = ensureUnlockSound();

  cancelMusicGainAutomation();

  if (music && !music.paused) {
    console.log("[GAIN DUCK]");
    await scheduleMusicGain(UNLOCK_DUCK_VOLUME, 250);
    console.log("[GAIN VALUE]", getMusicGainNode()?.gain.value ?? null);
  }

  const safeVolume = Math.max(0, Math.min(1, volume));
  sound.currentTime = 0;
  sound.volume = safeVolume;
  sound.muted = false;

  sound.onended = () => {
    console.log("[GAIN RESTORE]");
    void scheduleMusicGain(getPreferredMusicTarget(), 700);
  };

  const result = sound.play();
  if (result) {
    result.catch(() => {
      console.log("[GAIN RESTORE]");
      void scheduleMusicGain(getPreferredMusicTarget(), 700);
      pendingUnlockVolume = safeVolume;
      attachGestureUnlockListeners();
    });
  }
}

export function playSfx(src: string, volume = 1) {
  if (!hasUserGesture) {
    attachGestureUnlockListeners();
  }

  if (/(^|\/)unlock\.mp3(?:\?.*)?$/i.test(src)) {
    void playUnlockSound(volume);
    return;
  }

  const sfx = new Audio(src);
  sfx.volume = volume;
  sfx.play().catch(() => {});
}

export function playControlledAudio(key: string, src: string, volume = 0.22, loop = false) {
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
    console.log("[GAIN DUCK]");
    fadeMusicVolume(duckTarget, 380);
  }

  const restoreAfterEmail = () => {
    if (!emailMusicDucked) return;
    emailMusicDucked = false;
    console.log("[GAIN RESTORE]");
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
    console.log("[GAIN RESTORE]");
    fadeMusicVolume(getPreferredMusicTarget(), 380);
  }
}

export async function destroy() {
  cancelMusicGainAutomation();

  if (temporaryMusicTargetTimer) {
    clearTimeout(temporaryMusicTargetTimer);
    temporaryMusicTargetTimer = null;
  }

  stopEmailVoice();
  stopControlledAudio();

  if (unlockSound) {
    unlockSound.onended = null;
    unlockSound.pause();
    unlockSound.currentTime = 0;
  }

  if (music) {
    music.pause();
    music.currentTime = 0;
  }

  if (musicSourceNode) {
    musicSourceNode.disconnect();
  }

  if (musicGainNode) {
    musicGainNode.disconnect();
  }

  const contextToClose = audioContext;
  if (contextToClose && contextToClose.state !== "closed") {
    try {
      await contextToClose.close();
    } catch {
      // Ignore close failures during teardown.
    }
  }

  removeGestureUnlockListeners();

  music = null;
  controlledAudio = null;
  controlledAudioKey = null;
  unlockSound = null;
  emailVoice = null;

  musicSourceNode = null;
  musicGainNode = null;
  audioContext = null;

  hasUserGesture = false;
  pendingMusicPlay = false;
  pendingUnlockVolume = null;

  temporaryMusicTarget = null;
  musicPausedForComms = false;
  emailMusicDucked = false;
  gainAutomationVersion = 0;
  musicBaseVolume = MUSIC_VOLUME;
}
