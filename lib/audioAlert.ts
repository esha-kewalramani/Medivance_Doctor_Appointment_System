// Synthetic Medical Hospital Chime using Web Audio API
export function playHospitalChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Dual-tone harmonic chime: First note G4 (392Hz), Second note C5 (523.25Hz)
    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      // Soft attack & exponential decay
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.25, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // Play chime sequence: Bing... Bong...
    playNote(440, now, 0.4);       // A4
    playNote(554.37, now + 0.18, 0.7); // C#5
    playNote(659.25, now + 0.36, 1.2); // E5

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 2000);
  } catch {
    // Audio context may be restricted by autoplay policy before user interaction
  }
}

// Request and dispatch desktop browser notifications
export async function sendBrowserNotification(title: string, options?: NotificationOptions) {
  if (typeof window === "undefined" || !("Notification" in window)) return false;

  try {
    if (Notification.permission === "granted") {
      new Notification(title, {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        ...options,
      });
      return true;
    } else if (Notification.permission !== "denied") {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        new Notification(title, {
          icon: "/favicon.ico",
          ...options,
        });
        return true;
      }
    }
  } catch {
    // Fallback if browser blocks
  }
  return false;
}

// Crisp Hospital Voice Announcement using Web Speech API
export function announcePatientCall(tokenNumber: number, patientName: string, room: string) {
  // First play the hospital dual-tone chime
  playHospitalChime();

  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  try {
    window.speechSynthesis.cancel(); // Clear any queued speech
    const message = `Token number ${tokenNumber}. Patient ${patientName}. Please proceed to ${room}.`;
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    utterance.volume = 1;

    // Small delay after chime for realistic hospital broadcast
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 600);
  } catch {
    // Graceful fallback
  }
}
