let audioCtx: AudioContext | null = null;

export const playClickSound = () => {
  try {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return; // Browser doesn't support Web Audio API
      audioCtx = new AudioContext();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    
    // Quick pop sound
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.05);

    // Fade out very fast
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.05);
  } catch (e) {
    // Fail silently if audio is blocked or unsupported
    console.warn("Failed to play click sound", e);
  }
};
