import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function playBeep() {
  try {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(2400, context.currentTime); // High pitch retail chirp
    gain.gain.setValueAtTime(0.8, context.currentTime); // High volume
    gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.08);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + 0.08);
  } catch (e) {
    console.error("Audio beep failed:", e);
  }
}
