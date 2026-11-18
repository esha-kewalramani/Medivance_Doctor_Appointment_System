// SIMULATED AI (frontend phase). Keyword matching only - no model, no API call, no diagnosis.
// Swap these functions for real AI service calls in the backend phase.
import { Doctor, Specialization } from "@/types";

const RULES: [RegExp, string][] = [
  [/heart|chest|palpitat|blood pressure|\bbp\b|cardio|cholesterol/i, "Cardiology"],
  [/skin|rash|acne|hair|itch|eczema|pimple|pigment/i, "Dermatology"],
  [/headache|migraine|seizure|numb|nerve|stroke|memory|dizz/i, "Neurology"],
  [/child|baby|infant|vaccin|kid|newborn|pediatric|paediatric/i, "Pediatrics"],
  [/bone|joint|knee|back pain|fracture|spine|shoulder|sport|arthritis/i, "Orthopedics"],
  [/tooth|teeth|dental|gum|braces|cavity|root canal/i, "Dentistry"],
  [/pregnan|period|menstru|gyne|fertility|women|antenatal/i, "Gynecology"],
  [/fever|cold|cough|flu|fatigue|diabet|checkup|check-up|general|stomach|infection|weakness/i, "General Medicine"],
];
const EMERGENCY = /emergency|severe chest|can't breathe|cannot breathe|unconscious|heavy bleeding|suicid|overdose/i;

export function suggestSpecialization(text: string, known?: Specialization[]): string | null {
  for (const [re, name] of RULES) if (re.test(text) && (!known || known.some((k) => k.name === name))) return name;
  if (known) { const hit = known.find((k) => text.toLowerCase().includes(k.name.toLowerCase())); if (hit) return hit.name; }
  return null;
}

export interface BotReply { text: string; links?: { label: string; href: string }[] }

export function assistantReply(input: string, doctors: Doctor[], specs: Specialization[]): BotReply {
  const t = input.trim();
  if (EMERGENCY.test(t)) return { text: "This may be an emergency. Please call your local emergency number or go to the nearest emergency department immediately. I can only help with appointments and navigation." };
  if (/^(hi|hello|hey|salam|assalam)/i.test(t)) return { text: "Hello! I'm the MEDIVANCE assistant. I can help you find a doctor, book or cancel an appointment, and find your way around the website. I cannot diagnose conditions." };
  if (/cancel/i.test(t)) return { text: "Open My Appointments, find an upcoming pending or approved booking and press Cancel. The slot becomes available again right away.", links: [{ label: "Go to My Appointments", href: "/patient/appointments" }] };
  if (/(book|appointment|schedule|reserve)/i.test(t) && !suggestSpecialization(t, specs)) return { text: "Booking takes 4 steps: choose a doctor, pick a date, select a free time slot and describe your reason. The doctor then approves your request.", links: [{ label: "Start booking", href: "/patient/book" }, { label: "Find doctors", href: "/patient/doctors" }] };
  if (/status|approved|pending|rejected/i.test(t)) return { text: "You can see the live status (pending, approved, rejected, cancelled, completed) of every booking in My Appointments.", links: [{ label: "My Appointments", href: "/patient/appointments" }] };
  if (/fee|price|cost|charge/i.test(t)) {
    const f = doctors.map((d) => d.fee); 
    return { text: f.length ? `Consultation fees currently range from Rs ${Math.min(...f).toLocaleString()} to Rs ${Math.max(...f).toLocaleString()} depending on the doctor. Each profile shows the exact fee.` : "Fees are shown on each doctor's profile." };
  }
  if (/profile|password|phone|email|update my/i.test(t)) return { text: "You can edit your contact details and change your password from the Profile page.", links: [{ label: "Open Profile", href: "/patient/profile" }] };
  if (/theme|dark|light|mode/i.test(t)) return { text: "Use the sun/moon switch in the top bar to change the theme. It switches the entire website and is remembered." };
  if (/how many|available|who|recommend|find|doctor|best|specialist|need|pain|ache|problem|symptom/i.test(t) || suggestSpecialization(t, specs)) {
    const spec = suggestSpecialization(t, specs);
    if (spec) {
      const list = doctors.filter((d) => d.specialization === spec).sort((a, b) => b.rating - a.rating).slice(0, 3);
      if (list.length) return {
        text: `Based on the words you used, a ${spec} specialist may be a good starting point (this is a navigation hint, not a diagnosis). Top-rated options:\n` + list.map((d) => `• ${d.name} - ${d.experience} yrs, rating ${d.rating}`).join("\n"),
        links: list.map((d) => ({ label: `View ${d.name}`, href: `/patient/doctors/${d.id}` })),
      };
      return { text: `We don't have a ${spec} doctor listed right now. Try browsing all doctors.`, links: [{ label: "Browse doctors", href: "/patient/doctors" }] };
    }
    return { text: "Tell me what kind of care you need (for example \"skin rash\", \"child vaccination\" or \"knee pain\") and I'll point you to a matching specialization.", links: [{ label: "Browse all doctors", href: "/patient/doctors" }] };
  }
  return { text: "I can help with finding doctors, booking, cancelling, checking appointment status and website navigation. Try one of the suggested questions below.", links: [{ label: "Find doctors", href: "/patient/doctors" }] };
}

export const SUGGESTED_QUESTIONS = ["Find me a skin specialist", "How do I book an appointment?", "How can I cancel a booking?", "What are the consultation fees?", "I have knee pain, which doctor?", "Where can I see my appointment status?"];

// ---- Aura AI (public page) helpers ----
export function publicLinks(r: BotReply): BotReply {
  return { ...r, links: r.links?.map((l) => ({ ...l, href: l.href.replace("/patient/doctors", "/doctors") })) };
}
export function auraReply(input: string, doctors: Doctor[], specs: Specialization[], tile?: string): BotReply {
  if (tile === "report") return { text: "I can't read or interpret medical reports, and I never give diagnoses. Please share your report with your doctor. I can help you book a consultation to discuss it.", links: [{ label: "Book an appointment", href: "/patient/book" }, { label: "Find doctors", href: "/doctors" }] };
  if (tile === "tips") return { text: "General wellbeing tips (not personal medical advice):\n\u2022 Drink enough water through the day\n\u2022 Aim for 7-8 hours of sleep\n\u2022 Move for about 30 minutes most days\n\u2022 Eat plenty of vegetables, fruit and whole foods\n\u2022 Keep up regular check-ups and screenings" };
  if (tile === "symptom") return { text: "Tell me how you are feeling in a few words, for example \"skin rash\", \"knee pain\" or \"child fever\". I'll suggest which kind of specialist to see. This is guidance for choosing a doctor, not a diagnosis." };
  if (tile === "general") return { text: "Ask me anything about MEDIVANCE: doctors, consultation fees, booking, cancelling, appointment status or how to use the website." };
  return publicLinks(assistantReply(input, doctors, specs));
}
