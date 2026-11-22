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

// Active announcement session tracking
let activeAnnouncementId = 0;
let repeatTimer: ReturnType<typeof setTimeout> | null = null;

// Stop any active announcement immediately across tab / speech synthesis
export function stopAnnouncement(broadcast = true) {
  activeAnnouncementId++;
  if (repeatTimer) {
    clearTimeout(repeatTimer);
    repeatTimer = null;
  }

  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }

  if (broadcast && typeof window !== "undefined" && "BroadcastChannel" in window) {
    try {
      const bc = new BroadcastChannel("medivance_live_queue");
      bc.postMessage({ type: "STOP_ANNOUNCEMENT" });
      bc.close();
    } catch {
      // ignore
    }
  }
}

// Crisp Hospital Voice Announcement with maximum 3 repeats and instant cancellation
export function announcePatientCall(
  tokenNumber: number,
  patientName: string,
  room: string,
  maxRepeats = 3
) {
  if (typeof window === "undefined") return;

  // Stop any ongoing announcement before starting a new one
  stopAnnouncement(false);

  const sessionId = ++activeAnnouncementId;
  let currentCount = 0;

  const playIteration = () => {
    if (sessionId !== activeAnnouncementId) return;

    // 1. Play hospital chime
    playHospitalChime();

    if (!("speechSynthesis" in window)) return;

    try {
      window.speechSynthesis.cancel();
      const message = `Token number ${tokenNumber}. Patient ${patientName}. Please proceed to ${room}.`;
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      utterance.volume = 1;

      utterance.onend = () => {
        currentCount++;
        if (sessionId !== activeAnnouncementId) return;

        // Repeat only up to 3 times maximum
        if (currentCount < maxRepeats) {
          repeatTimer = setTimeout(() => {
            if (sessionId === activeAnnouncementId) {
              playIteration();
            }
          }, 2500); // 2.5 second pause between repeats
        } else {
          stopAnnouncement(false);
        }
      };

      utterance.onerror = () => {
        stopAnnouncement(false);
      };

      // Delay speech slightly to let hospital chime ring clearly first
      repeatTimer = setTimeout(() => {
        if (sessionId === activeAnnouncementId) {
          window.speechSynthesis.speak(utterance);
        }
      }, 700);
    } catch {
      // graceful fallback
    }
  };

  playIteration();
}
