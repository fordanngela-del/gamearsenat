// Synthesized sound effects using Web Audio API and Speech Synthesis for NOVA

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const playSound = (type: 'move' | 'capture' | 'dice' | 'check' | 'win' | 'hack' | 'click') => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    switch (type) {
      case 'click':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
        break;

      case 'move':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.09);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.09);
        break;

      case 'capture':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.18);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
        break;

      case 'dice': {
        // rapid rattling burst
        for (let i = 0; i < 4; i++) {
          const subOsc = ctx.createOscillator();
          const subGain = ctx.createGain();
          subOsc.type = 'sine';
          subOsc.frequency.setValueAtTime(600 + Math.random() * 300, now + i * 0.05);
          subGain.gain.setValueAtTime(0.15, now + i * 0.05);
          subGain.gain.exponentialRampToValueAtTime(0.01, now + (i + 1) * 0.05);
          subOsc.connect(subGain);
          subGain.connect(ctx.destination);
          subOsc.start(now + i * 0.05);
          subOsc.stop(now + (i + 1) * 0.05);
        }
        break;
      }

      case 'check':
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(660, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
        break;

      case 'hack':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.25);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
        break;

      case 'win': {
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const subOsc = ctx.createOscillator();
          const subGain = ctx.createGain();
          subOsc.type = 'triangle';
          subOsc.frequency.setValueAtTime(freq, now + idx * 0.12);
          subGain.gain.setValueAtTime(0.25, now + idx * 0.12);
          subGain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.25);
          subOsc.connect(subGain);
          subGain.connect(ctx.destination);
          subOsc.start(now + idx * 0.12);
          subOsc.stop(now + idx * 0.12 + 0.25);
        });
        break;
      }
    }
  } catch (err) {
    console.debug('Audio play skipped:', err);
  }
};

let currentUtterance: SpeechSynthesisUtterance | null = null;

export const speakNova = (text: string, isMuted: boolean) => {
  if (isMuted || typeof window === 'undefined' || !window.speechSynthesis) return;

  try {
    window.speechSynthesis.cancel();
    // Clean markdown or raw quotes
    const cleanText = text.replace(/[*_#«»]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'fr-FR';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Pick a French voice if available
    const voices = window.speechSynthesis.getVoices();
    const frVoice = voices.find(v => v.lang.startsWith('fr') || v.name.includes('French') || v.name.includes('Thomas') || v.name.includes('Amelie'));
    if (frVoice) {
      utterance.voice = frVoice;
    }

    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.debug('Speech skipped:', e);
  }
};

export const cancelSpeech = () => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};
