/**
 * The incoming-call ringtone, played with Web Audio: a soft rising three-note
 * chime, twice, then a pause, repeated until stopped. Synthesised, so there's
 * no audio file to ship, and it sounds nothing like the message « ding ».
 */

/** E5, G#5, B5: a bright major arpeggio. */
const NOTES = [659.25, 830.61, 987.77];
const NOTE_S = 0.16;
const GAP_S = 0.04;
/** One cycle: the arpeggio twice, then silence. */
const CYCLE_MS = 2600;

let ctx: AudioContext | null = null;

/**
 * Browsers only let audio start after a user gesture. The first click or key
 * press anywhere in the admin unlocks the context, so a ring that arrives
 * later (from the socket, not a gesture) can sound.
 */
function audio(): AudioContext | null {
  if (typeof window === "undefined" || !("AudioContext" in window)) return null;
  ctx ??= new AudioContext();
  return ctx;
}

let unlockArmed = false;
export function armRingtoneUnlock() {
  if (unlockArmed || typeof window === "undefined") return;
  unlockArmed = true;
  const unlock = () => {
    void audio()?.resume().catch(() => undefined);
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);
}

/** One note: a sine with a soft bell-like attack and decay. */
function note(c: AudioContext, freq: number, at: number) {
  const osc = c.createOscillator();
  const overtone = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  // A quiet octave above gives it a chime's shimmer.
  overtone.type = "sine";
  overtone.frequency.value = freq * 2;
  const overtoneGain = c.createGain();
  overtoneGain.gain.value = 0.15;
  overtone.connect(overtoneGain).connect(gain);
  osc.connect(gain).connect(c.destination);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.25, at + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + NOTE_S + 0.25);
  osc.start(at);
  overtone.start(at);
  osc.stop(at + NOTE_S + 0.3);
  overtone.stop(at + NOTE_S + 0.3);
}

function cycle(c: AudioContext) {
  const t0 = c.currentTime + 0.02;
  const step = NOTE_S + GAP_S;
  for (let rep = 0; rep < 2; rep++) {
    NOTES.forEach((f, i) =>
      note(c, f, t0 + rep * (NOTES.length * step + 0.2) + i * step),
    );
  }
}

/**
 * Starts ringing; returns the function that stops it. Without an unlocked
 * audio context (no click yet on this page) it stays silent, the card still shows.
 */
export function startRingtone(): () => void {
  const c = audio();
  if (!c) return () => undefined;
  void c.resume().catch(() => undefined);
  cycle(c);
  const timer = window.setInterval(() => cycle(c), CYCLE_MS);
  return () => window.clearInterval(timer);
}
