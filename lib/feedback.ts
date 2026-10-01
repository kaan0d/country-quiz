// Short synthesized tones and vibration, no audio files. The AudioContext is created on the first
// answer, which is always a user gesture, so browsers allow it to play.
let ctx: AudioContext | null = null;

function tone(freq: number, start: number, duration: number, type: OscillatorType) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t = ctx.currentTime + start;
  gain.gain.setValueAtTime(0.15, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration);
}

export function answerFeedback(correct: boolean) {
  try {
    ctx ??= new AudioContext();
    if (correct) {
      tone(660, 0, 0.12, "sine");
      tone(880, 0.1, 0.18, "sine");
    } else {
      tone(180, 0, 0.25, "square");
    }
  } catch {}
  navigator.vibrate?.(correct ? 30 : [60, 40, 60]);
}
