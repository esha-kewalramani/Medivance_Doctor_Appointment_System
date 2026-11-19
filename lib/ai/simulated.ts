// SIMULATED AI (frontend phase) with Personalized Patient Intelligence & Comprehensive FAQ integration.
import { Doctor, MedicalRecord, Patient, Prescription, Session, Specialization } from "@/types";

const RULES: [RegExp, string][] = [
  [/heart|chest|palpitat|blood pressure|\bbp\b|cardio|cholesterol|hypertension/i, "Cardiology"],
  [/skin|rash|acne|hair|itch|eczema|pimple|pigment|dermatolog/i, "Dermatology"],
  [/headache|migraine|seizure|numb|nerve|stroke|memory|dizz|neurolog/i, "Neurology"],
  [/child|baby|infant|vaccin|kid|newborn|pediatric|paediatric/i, "Pediatrics"],
  [/bone|joint|knee|back pain|fracture|spine|shoulder|sport|arthritis|orthopedic/i, "Orthopedics"],
  [/tooth|teeth|dental|gum|braces|cavity|root canal/i, "Dentistry"],
  [/pregnan|period|menstru|gyne|fertility|women|antenatal/i, "Gynecology"],
  [/fever|cold|cough|flu|fatigue|diabet|checkup|check-up|general|stomach|infection|weakness/i, "General Medicine"],
];
const EMERGENCY = /emergency|severe chest|can't breathe|cannot breathe|unconscious|heavy bleeding|suicid|overdose|cardiac arrest/i;

export interface AuraContext {
  session?: Session | null;
  patient?: Patient | null;
  prescriptions?: Prescription[];
  medicalRecords?: MedicalRecord[];
}

export function suggestSpecialization(text: string, known?: Specialization[]): string | null {
  for (const [re, name] of RULES) if (re.test(text) && (!known || known.some((k) => k.name === name))) return name;
  if (known) { const hit = known.find((k) => text.toLowerCase().includes(k.name.toLowerCase())); if (hit) return hit.name; }
  return null;
}

export interface BotReply { text: string; links?: { label: string; href: string }[] }

export function assistantReply(input: string, doctors: Doctor[], specs: Specialization[], ctx?: AuraContext): BotReply {
  const t = input.trim();
  const isPatientLoggedIn = ctx?.session?.role === "patient";
  const hasConsent = Boolean(ctx?.patient?.auraConsent);

  // 1. Emergency safety check
  if (EMERGENCY.test(t)) {
    return {
      text: "⚠️ This sounds like a potential medical emergency. Please call 115, 1122 or proceed immediately to the nearest MEDIVANCE 24/7 Emergency Department. Aura AI cannot provide emergency life-support or diagnosis.",
      links: [{ label: "Emergency Location", href: "/location" }, { label: "Call Emergency (115)", href: "tel:115" }],
    };
  }

  // 2. Personalized Prescriptions Queries (Subject to Patient Consent)
  if (/prescription|medicine|medication|dose|dosage|pills|tablets|drug|rx/i.test(t)) {
    if (!isPatientLoggedIn) {
      return {
        text: "Personal prescription records are securely linked to registered patient accounts. Please log in or create an account to view your prescriptions, or book an appointment with our specialists.",
        links: [{ label: "Patient Login", href: "/login/patient" }, { label: "Create Account", href: "/register" }],
      };
    }

    if (!hasConsent) {
      return {
        text: "🔒 **Patient Privacy Notice**: Your medical history and prescriptions are strictly protected by Medivance privacy controls. To allow Aura AI to review and explain your prescriptions, please enable 'Aura AI Access' in your Patient Dashboard.",
        links: [{ label: "Go to Dashboard (Enable Access)", href: "/patient" }],
      };
    }

    const myRx = (ctx?.prescriptions || []).filter((p) => p.patientId === ctx?.patient?.id);
    if (!myRx.length) {
      return {
        text: `Hello ${ctx?.patient?.name?.split(" ")[0] || "there"}, you currently have no active prescriptions recorded in your MEDIVANCE medical profile. You can consult your doctor if you require a new prescription.`,
        links: [{ label: "Book Consultation", href: "/patient/book" }],
      };
    }

    const latest = myRx[0];
    const medsList = latest.medications.map((m) => `• **${m.name}** (${m.dosage}) - ${m.frequency} for ${m.duration}`).join("\n");
    return {
      text: `Here is your current prescription on file from **${latest.doctorName}** (${latest.date}):\n\n${medsList}\n\n${latest.instructions ? `*Doctor's Instructions:* ${latest.instructions}` : ""}`,
      links: [{ label: "View Full History", href: "/patient" }],
    };
  }

  // 3. Personalized Medical History & Clinical Notes (Subject to Patient Consent)
  if (/medical record|consultation note|clinical note|diagnosis|my history|past visit|vitals|lab report|blood pressure record|bp reading/i.test(t)) {
    if (!isPatientLoggedIn) {
      return {
        text: "Your previous consultation history and diagnostic records are private to registered patient accounts. Sign in to your MEDIVANCE account to view them.",
        links: [{ label: "Patient Login", href: "/login/patient" }],
      };
    }

    if (!hasConsent) {
      return {
        text: "🔒 **Patient Privacy Notice**: Your past medical history is confidential. To allow Aura AI to summarize your consultation records and vitals, please grant consent under 'Aura AI Personalized Health Assistant' in your dashboard.",
        links: [{ label: "Patient Dashboard", href: "/patient" }],
      };
    }

    const myRecs = (ctx?.medicalRecords || []).filter((r) => r.patientId === ctx?.patient?.id);
    if (!myRecs.length) {
      return {
        text: `You have no completed consultation records on file yet, ${ctx?.patient?.name?.split(" ")[0] || ""}. Once you finish a consultation with a MEDIVANCE doctor, your clinical notes and vitals will be accessible here.`,
      };
    }

    const rec = myRecs[0];
    const vitalsStr = rec.vitals ? `\n• Vitals: BP ${rec.vitals.bloodPressure || "N/A"}, HR ${rec.vitals.heartRate || "N/A"}` : "";
    return {
      text: `Summary of your latest consultation with **${rec.doctorName}** (${rec.date}):\n\n• **Primary Diagnosis:** ${rec.diagnosis}\n• **Symptoms noted:** ${rec.symptoms || "None reported"}\n• **Clinical Notes:** ${rec.clinicalNotes}${vitalsStr}`,
      links: [{ label: "My Dashboard", href: "/patient" }, { label: "Book Follow-up", href: "/patient/book" }],
    };
  }

  // 4. MEDIVANCE FAQs: Guest Booking without login
  if (/guest|without login|without an account|no account|without signing in|do i have to register|need to login/i.test(t)) {
    return {
      text: "Yes! At MEDIVANCE you have **two flexible booking options**:\n\n1. **Book Without Login (Guest):** Directly browse doctors, choose a time slot, provide basic contact details, and book immediately. You'll get a confirmed appointment reference (MDV-XXXX) and downloadable receipt.\n2. **Patient Account:** Sign in to save appointments to your personal dashboard, track prescriptions, and access clinical notes.",
      links: [{ label: "Book as Guest", href: "/book" }, { label: "Create Account", href: "/register" }],
    };
  }

  // 5. MEDIVANCE FAQs: Account Benefits
  if (/why (create|register|open) (an )?account|account benefits|what is the patient portal|personal dashboard/i.test(t)) {
    return {
      text: "Creating a MEDIVANCE Patient Account unlocks your personal healthcare space:\n\n• Track upcoming and past appointments\n• Instant digital receipts and booking references\n• Access doctor prescriptions and dosage instructions\n• Review consultation notes, diagnoses, and vitals\n• Connect with Aura AI for personalized health assistance\n• Join telehealth video consultations",
      links: [{ label: "Create Free Account", href: "/register" }, { label: "Sign In", href: "/login/patient" }],
    };
  }

  // 6. MEDIVANCE FAQs: Cancellation & Rescheduling
  if (/cancel|reschedule|change time|postpone|refund/i.test(t)) {
    return {
      text: "To cancel or review an appointment, open **My Appointments** from your dashboard. Pending or approved bookings can be cancelled before the scheduled date. If a doctor needs to adjust your slot, they will reschedule it and notify you automatically without requiring repayment.",
      links: [{ label: "My Appointments", href: isPatientLoggedIn ? "/patient/appointments" : "/login/patient" }],
    };
  }

  // 7. MEDIVANCE FAQs: Fees & Payment
  if (/fee|price|cost|charge|payment|how to pay|rates/i.test(t)) {
    const f = doctors.map((d) => d.fee);
    const minF = f.length ? Math.min(...f).toLocaleString() : "1,700";
    const maxF = f.length ? Math.max(...f).toLocaleString() : "4,000";
    return {
      text: `Consultation fees at MEDIVANCE range from Rs ${minF} to Rs ${maxF} depending on the doctor's specialty and experience level. Payment is conveniently completed online during booking (simulated demonstration) or at the clinic counter.`,
      links: [{ label: "Browse Doctors & Fees", href: "/doctors" }],
    };
  }

  // 8. MEDIVANCE FAQs: Location, Address & Hours
  if (/location|where is the hospital|address|directions|map|timing|hours|open/i.test(t)) {
    return {
      text: "MEDIVANCE General Hospital is located centrally in Sindh (Karachi & Hyderabad campus) with 24/7 emergency response, modern OPD clinics, and high-tech diagnostic imaging suites. Explore our interactive campus map for live distance calculations.",
      links: [{ label: "Open Location Map", href: "/location" }],
    };
  }

  // 9. MEDIVANCE FAQs: Video Consultations / Telehealth
  if (/video|telehealth|online consult|virtual visit|call doctor/i.test(t)) {
    return {
      text: "MEDIVANCE offers secure HD video consultations with our certified physicians. Registered patients can easily launch scheduled video visits directly through the Patient Portal under 'Video Consult'.",
      links: [{ label: "Video Consultations", href: isPatientLoggedIn ? "/patient/video" : "/login/patient" }],
    };
  }

  // 10. Greetings
  if (/^(hi|hello|hey|salam|assalam|greetings)/i.test(t)) {
    const nameGreeting = ctx?.patient?.name ? ` ${ctx.patient.name.split(" ")[0]}` : "";
    return {
      text: `Hello${nameGreeting}! I am Aura AI, your MEDIVANCE intelligent healthcare assistant. I can guide you through finding doctors, guest and account booking, explaining prescriptions & consultation records, and hospital services. How may I assist you today?`,
    };
  }

  // 11. Booking assistance
  if (/(book|appointment|schedule|reserve)/i.test(t) && !suggestSpecialization(t, specs)) {
    return {
      text: "Booking with MEDIVANCE is fast and seamless:\n1. Choose your doctor\n2. Pick a convenient date & available time\n3. Provide your reason & details (book as a guest or with your account)\n4. Confirm your booking instantly!",
      links: [{ label: "Book Appointment", href: isPatientLoggedIn ? "/patient/book" : "/book" }, { label: "Browse Specialists", href: "/doctors" }],
    };
  }

  // 12. Appointment Status
  if (/status|approved|pending|rejected/i.test(t)) {
    return {
      text: "You can see real-time status updates (Pending, Approved, Completed, Cancelled) for every appointment under 'My Appointments' in your portal.",
      links: [{ label: "My Appointments", href: isPatientLoggedIn ? "/patient/appointments" : "/login/patient" }],
    };
  }

  // 13. Profile & Settings
  if (/profile|password|phone|email|update my/i.test(t)) {
    return {
      text: "You can update your personal contact info, health details, and change your account password from your Profile page.",
      links: [{ label: "Open Profile", href: isPatientLoggedIn ? "/patient/profile" : "/login/patient" }],
    };
  }

  // 14. Theme switch
  if (/theme|dark|light|mode/i.test(t)) {
    return { text: "Use the theme toggle switch in the top navigation bar to toggle between high-contrast Dark Mode and crisp Light Mode across all MEDIVANCE pages." };
  }

  // 15. Doctor search by symptom or specialty
  const spec = suggestSpecialization(t, specs);
  if (spec || /how many|available|who|recommend|find|doctor|best|specialist|need|pain|ache|problem|symptom/i.test(t)) {
    if (spec) {
      const list = doctors.filter((d) => d.specialization === spec).sort((a, b) => b.rating - a.rating).slice(0, 3);
      if (list.length) {
        return {
          text: `Based on your query, a **${spec}** specialist is recommended (guidance hint, not a diagnosis). Top-rated specialists:\n` +
            list.map((d) => `• **${d.name}** — ${d.experience} yrs exp, ${d.rating}★ (Fee: Rs ${d.fee.toLocaleString()})`).join("\n"),
          links: list.map((d) => ({ label: `View ${d.name}`, href: isPatientLoggedIn ? `/patient/doctors/${d.id}` : `/doctors/${d.id}` })),
        };
      }
      return { text: `We currently do not have a ${spec} doctor listed. Try exploring all available doctors.`, links: [{ label: "Browse All Doctors", href: "/doctors" }] };
    }
    return {
      text: "Please tell me your symptoms or preferred specialty (e.g. 'chest pain', 'skin allergy', 'knee pain', 'pediatrics'), and I will recommend the right doctor for you.",
      links: [{ label: "Browse All Doctors", href: "/doctors" }],
    };
  }

  return {
    text: "I can help with doctor searches, guest booking, account creation, prescriptions & medical history, consultation fees, and hospital navigation. What would you like to know?",
    links: [{ label: "Book Appointment", href: isPatientLoggedIn ? "/patient/book" : "/book" }, { label: "Browse Doctors", href: "/doctors" }],
  };
}

export const SUGGESTED_QUESTIONS = [
  "Can I book without login?",
  "Find me a skin specialist",
  "What are my active prescriptions?",
  "What was my last diagnosis?",
  "How much are consultation fees?",
  "How can I cancel or reschedule?",
];

// ---- Aura AI (public page) helpers ----
export function publicLinks(r: BotReply): BotReply {
  return { ...r, links: r.links?.map((l) => ({ ...l, href: l.href.replace("/patient/doctors", "/doctors") })) };
}

export function auraReply(input: string, doctors: Doctor[], specs: Specialization[], tile?: string, ctx?: AuraContext): BotReply {
  if (tile === "report") {
    if (ctx?.session?.role === "patient" && ctx?.patient?.auraConsent) {
      const myRecs = (ctx?.medicalRecords || []).filter((r) => r.patientId === ctx?.patient?.id);
      if (myRecs.length) {
        const r = myRecs[0];
        return {
          text: `Here is the clinical interpretation from your latest report with **${r.doctorName}**:\n\n• **Diagnosis:** ${r.diagnosis}\n• **Observations:** ${r.clinicalNotes}\n• **Vitals Recorded:** BP ${r.vitals?.bloodPressure || "N/A"}, Heart Rate ${r.vitals?.heartRate || "N/A"}\n\n*Note:* This summary is based on your consented medical file and does not replace doctor advice.`,
          links: [{ label: "Book Follow-up", href: "/patient/book" }],
        };
      }
    }
    return {
      text: "I can review previous medical records from your MEDIVANCE doctor if you are signed in and have granted consent. For external lab reports, please schedule a consultation with a specialist who can examine them thoroughly.",
      links: [{ label: "Book an Appointment", href: ctx?.session?.role === "patient" ? "/patient/book" : "/book" }, { label: "Find Doctors", href: "/doctors" }],
    };
  }

  if (tile === "tips") {
    return {
      text: "🌿 **Personal Health & Wellbeing Essentials**:\n\n• **Cardiovascular Care:** Aim for 30 minutes of moderate aerobic activity 5 days a week\n• **Hydration & Nutrition:** Drink 2-3 liters of water daily and prioritize whole foods and leafy greens\n• **Sleep Hygiene:** Maintain 7-8 hours of regular, uninterrupted sleep\n• **Preventive Screenings:** Check resting blood pressure and routine lipid panels annually\n• **Medication Adherence:** Always take prescribed medicines at the designated frequency and complete antibiotic courses.",
    };
  }

  if (tile === "symptom") {
    return {
      text: "Describe what symptoms you are experiencing in a few words (e.g. 'morning headaches', 'persistent skin rash', 'knee swelling', 'infant fever'). I will identify the appropriate department and guide you to top-rated doctors.",
    };
  }

  if (tile === "general") {
    return {
      text: "Ask me anything about MEDIVANCE:\n• Guest booking vs. Patient account\n• Doctor specialties & fees\n• Prescriptions & medical histories\n• Emergency hospital facilities & ambulance numbers\n• Rescheduling and cancellation policies",
    };
  }

  return publicLinks(assistantReply(input, doctors, specs, ctx));
}
