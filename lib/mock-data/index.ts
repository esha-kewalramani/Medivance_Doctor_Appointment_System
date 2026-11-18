import { Appointment, AppointmentStatus, DataState, Doctor, MedicalRecord, Patient, Prescription, Specialization, Weekday } from "@/types";
import { addDays, todayISO } from "@/lib/utilities";

export const SPECIALIZATION_ICONS = ["HeartPulse", "Sparkles", "Brain", "Baby", "Bone", "Smile", "Stethoscope", "Flower2"] as const;

export const SPECIALIZATIONS: Specialization[] = [
  { id: "sp1", name: "Cardiology", icon: "HeartPulse", description: "Heart health, blood pressure and cardiac care." },
  { id: "sp2", name: "Dermatology", icon: "Sparkles", description: "Skin, hair and nail conditions and treatments." },
  { id: "sp3", name: "Neurology", icon: "Brain", description: "Brain, spine and nervous system disorders." },
  { id: "sp4", name: "Pediatrics", icon: "Baby", description: "Healthcare for infants, children and teenagers." },
  { id: "sp5", name: "Orthopedics", icon: "Bone", description: "Bones, joints, muscles and sports injuries." },
  { id: "sp6", name: "Dentistry", icon: "Smile", description: "Dental checkups, braces, implants and oral care." },
  { id: "sp7", name: "General Medicine", icon: "Stethoscope", description: "Primary care for everyday health concerns." },
  { id: "sp8", name: "Gynecology", icon: "Flower2", description: "Women's health, pregnancy and reproductive care." },
];

const win = (id: string, days: Weekday[], start: string, end: string) =>
  days.map((d, i) => ({ id: `${id}_${i}`, day: d, start, end }));
const wk: Weekday[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const D = (
  n: number, name: string, spec: string, qual: string, exp: number, rating: number, fee: number,
  langs: string[], bio: string, availability: Doctor["availability"],
): Doctor => ({
  id: `d${n}`, name, email: n === 1 ? "doctor@medivance.pk" : `doctor${n}@medivance.pk`, phone: `+92 300 55${String(n).padStart(2, "0")}${100 + n * 7}`,
  password: "Doctor@123", photo: `/doctors/d${n}.jpg`, specialization: spec, qualification: qual, experience: exp, rating, fee, languages: langs, bio,
  slotMinutes: 30, availability,
  reviews: [
    { id: `r${n}a`, author: "Ayesha K.", rating: 5, text: "Very attentive and explained everything clearly. Short waiting time.", date: "2026-09-12" },
    { id: `r${n}b`, author: "Bilal R.", rating: Math.max(4, Math.round(rating) - 1), text: "Professional and kind. The follow-up advice was practical.", date: "2026-08-03" },
  ],
});

export const DOCTORS: Doctor[] = [
  D(1, "Dr. Ayesha Khan", "Cardiology", "MBBS, FCPS (Cardiology)", 14, 4.9, 3000, ["English", "Urdu", "Sindhi"], "Consultant cardiologist focused on preventive cardiology, hypertension and heart failure management. Believes in clear explanations and long-term lifestyle plans.", win("w1", wk, "09:00", "13:00")),
  D(2, "Dr. Hassan Raza", "General Medicine", "MBBS, MRCP", 15, 4.8, 2000, ["English", "Urdu", "Punjabi"], "Experienced general physician providing primary care, chronic condition checkups, and routine wellness screenings.", [...win("w2a", ["Mon", "Wed", "Fri"], "10:00", "14:00"), ...win("w2b", ["Sat"], "10:00", "12:00")]),
  D(3, "Dr. Sara Ahmed", "Dermatology", "MBBS, MCPS (Dermatology)", 12, 4.7, 2800, ["English", "Urdu"], "Skin specialist for acne, eczema, pigmentation, hair loss and cosmetic dermatology.", win("w3", ["Tue", "Wed", "Thu", "Sat"], "14:00", "18:00")),
  D(4, "Dr. Kamran Siddiqui", "Orthopedics", "MBBS, FRCS (Orthopedics)", 18, 4.9, 4000, ["English", "Urdu"], "Joint replacement and sports injury surgeon with nearly two decades of experience.", win("w4", wk, "11:00", "15:00")),
  D(5, "Dr. Maria Fatima", "Pediatrics", "MBBS, FCPS (Pediatrics)", 10, 4.8, 2000, ["English", "Urdu", "Sindhi"], "Child health, vaccination schedules, growth monitoring and common childhood illnesses.", win("w5", ["Mon", "Tue", "Wed", "Thu", "Sat"], "09:30", "13:30")),
  D(6, "Dr. Zeeshan Ali", "Dentistry", "BDS, MDS (Orthodontics)", 8, 4.6, 2200, ["English", "Urdu"], "Orthodontics, smile design, root canal treatment and routine dental care.", win("w6", wk, "15:00", "19:00")),
  D(7, "Dr. Nadir Hussain", "General Medicine", "MBBS, MRCP", 11, 4.7, 1800, ["English", "Urdu", "Sindhi"], "Family physician for fevers, infections, diabetes and general health checkups.", win("w7", ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], "09:00", "12:00")),
  D(8, "Dr. Rabia Shah", "Gynecology", "MBBS, FCPS (Gynecology)", 13, 4.9, 3200, ["English", "Urdu"], "Obstetrics and women's health, antenatal care and minimally invasive gynecological procedures.", win("w8", ["Tue", "Thu", "Sat"], "10:00", "14:00")),
  D(9, "Dr. Faisal Mehmood", "Cardiology", "MBBS, MRCP (Cardiology)", 7, 4.5, 2800, ["English", "Urdu"], "Echocardiography, ECG interpretation and cardiac rehabilitation programs.", win("w9", ["Mon", "Wed", "Fri"], "14:00", "18:00")),
  D(10, "Dr. Sana Iqbal", "Dermatology", "MBBS, FCPS (Dermatology)", 6, 4.6, 2300, ["English", "Urdu"], "Medical dermatology, laser treatments and allergy-related skin problems.", win("w10", ["Mon", "Thu", "Fri"], "12:00", "16:00")),
  D(11, "Dr. Owais Rehman", "Pediatrics", "MBBS, DCH", 5, 4.4, 1700, ["English", "Urdu", "Pashto"], "Newborn care, nutrition guidance and paediatric allergies.", win("w11", wk, "16:00", "19:00")),
  D(12, "Dr. Adnan Javed", "General Medicine", "MBBS, FCPS (Medicine)", 15, 4.8, 2000, ["English", "Urdu"], "Internal medicine with a focus on chronic disease management and preventive screening.", win("w12", ["Tue", "Wed", "Thu", "Fri"], "09:00", "13:00")),
];

const P = (n: number, name: string, g: Patient["gender"], dob: string, city: string, back: number): Patient => ({
  id: `p${n}`, name, email: n === 1 ? "patient@medivance.pk" : `patient${n}@mail.com`, phone: `+92 321 77${String(n).padStart(2, "0")}${200 + n * 11}`,
  password: "Patient@123", dob, gender: g, address: `${city}, Sindh`, bloodGroup: ["A+", "B+", "O+", "AB+", "O-", "A-"][n % 6],
  registeredAt: addDays(todayISO(), -back) + "T09:00:00.000Z",
  isGuest: false,
  auraConsent: n === 1 ? true : false,
});

export const PATIENTS: Patient[] = [
  P(1, "Esha Kewalramani", "Female", "2003-04-18", "Hyderabad", 120),
  P(2, "Ali Raza", "Male", "1990-02-11", "Karachi", 100),
  P(3, "Fatima Noor", "Female", "1985-07-23", "Karachi", 90),
  P(4, "Hamza Sheikh", "Male", "1998-12-02", "Sukkur", 75),
  P(5, "Zainab Malik", "Female", "1976-09-30", "Hyderabad", 60),
  P(6, "Usman Tariq", "Male", "2001-05-14", "Larkana", 48),
  P(7, "Mehwish Arain", "Female", "1993-01-08", "Karachi", 33),
  P(8, "Danish Lakhani", "Male", "1969-11-19", "Hyderabad", 21),
  P(9, "Sobia Memon", "Female", "2010-03-27", "Nawabshah", 12),
  P(10, "Rizwan Bhatti", "Male", "1982-06-05", "Karachi", 5),
];

const REASONS = ["Routine checkup", "Follow-up consultation", "Persistent headache", "Skin allergy review", "Joint pain", "Blood pressure monitoring", "Child vaccination", "Dental cleaning", "Fever and cough", "Second opinion on reports"];

/** Deterministic sample appointments around today (frontend simulation data). */
function seedAppointments(doctors: Doctor[]): Appointment[] {
  const out: Appointment[] = [];
  const today = todayISO();
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const statusFor = (offset: number): AppointmentStatus => {
    const r = rnd();
    if (offset < 0) return r < 0.72 ? "completed" : r < 0.88 ? "cancelled" : "rejected";
    return r < 0.45 ? "approved" : r < 0.85 ? "pending" : "cancelled";
  };
  let n = 0;
  for (let off = -28; off <= 10; off++) {
    const date = addDays(today, off);
    const count = off === 0 ? 3 : 1 + Math.floor(rnd() * 2);
    for (let k = 0; k < count; k++) {
      const doc = doctors[Math.floor(rnd() * doctors.length)];
      const day = new Date(date + "T00:00:00").getDay();
      const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
      const w = doc.availability.find((a) => a.day === names[day]);
      if (!w) continue;
      const startMin = Number(w.start.slice(0, 2)) * 60 + Number(w.start.slice(3));
      const slotIdx = Math.floor(rnd() * 4);
      const m = startMin + slotIdx * 30;
      const time = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
      if (out.some((a) => a.doctorId === doc.id && a.date === date && a.time === time && a.status !== "cancelled" && a.status !== "rejected")) continue;
      n++;
      const pid = off >= 0 && k === 0 && off % 3 === 0 ? "p1" : `p${1 + Math.floor(rnd() * 10)}`;
      out.push({
        id: `a${n}`, ref: `MDV-${String(1000 + n)}`, patientId: pid, doctorId: doc.id, date, time,
        reason: REASONS[Math.floor(rnd() * REASONS.length)], status: statusFor(off),
        createdAt: addDays(date, -2) + "T10:00:00.000Z",
      });
    }
  }
  // make sure the demo patient and demo doctor always have a few records
  const d1 = doctors[0];
  const extra: [number, AppointmentStatus, string, string][] = [
    [-9, "completed", "09:00", "p1"], [-3, "cancelled", "09:30", "p1"], [2, "approved", "10:00", "p1"], [4, "pending", "11:00", "p1"], [5, "pending", "09:30", "p3"], [1, "pending", "12:00", "p4"],
  ];
  extra.forEach(([off, status, time, pid], i) => {
    let date = addDays(today, off);
    // keep the demo doctor's records on working days (Mon-Fri)
    while ([0, 6].includes(new Date(date + "T00:00:00").getDay())) date = addDays(date, off < 0 ? -1 : 1);
    const t = time;
    if (out.some((a) => a.doctorId === d1.id && a.date === date && a.time === t && a.status !== "cancelled" && a.status !== "rejected")) return;
    out.push({ id: `ax${i}`, ref: `MDV-${2000 + i}`, patientId: pid, doctorId: d1.id, date, time: t, reason: REASONS[i], status, createdAt: addDays(date, -3) + "T08:00:00.000Z" });
  });
  return out;
}

export const PRESCRIPTIONS: Prescription[] = [
  {
    id: "pr1",
    patientId: "p1",
    doctorId: "d1",
    doctorName: "Dr. Ayesha Khan",
    appointmentId: "ax0",
    date: addDays(todayISO(), -9),
    medications: [
      { name: "Atorvastatin", dosage: "20mg", frequency: "Once daily at bedtime", duration: "30 days", instructions: "For cholesterol management" },
      { name: "Metoprolol Tartrate", dosage: "25mg", frequency: "Twice daily with meals", duration: "30 days", instructions: "For blood pressure control" },
      { name: "Low-Dose Aspirin", dosage: "75mg", frequency: "Once daily after breakfast", duration: "30 days", instructions: "Cardioprotective" },
    ],
    instructions: "Maintain a low-sodium diet, drink 2-3 liters of water daily, and monitor resting blood pressure every morning. Return for follow-up in 4 weeks.",
    createdAt: addDays(todayISO(), -9) + "T10:30:00.000Z",
  },
  {
    id: "pr2",
    patientId: "p1",
    doctorId: "d2",
    doctorName: "Dr. Hassan Raza",
    date: addDays(todayISO(), -35),
    medications: [
      { name: "Vitamin D3 (Cholecalciferol)", dosage: "200,000 IU", frequency: "Once every 2 weeks", duration: "2 months", instructions: "Take with milk or meal" },
      { name: "Multivitamin Complex", dosage: "1 tablet", frequency: "Once daily after lunch", duration: "60 days" },
    ],
    instructions: "Get 20 minutes of morning sunlight daily. Hydrate well.",
    createdAt: addDays(todayISO(), -35) + "T11:15:00.000Z",
  },
  {
    id: "pr3",
    patientId: "p2",
    doctorId: "d3",
    doctorName: "Dr. Sara Ahmed",
    date: addDays(todayISO(), -14),
    medications: [
      { name: "Cetirizine", dosage: "10mg", frequency: "Once daily at bedtime", duration: "10 days", instructions: "For seasonal allergic rhinitis" },
    ],
    instructions: "Avoid dust and known allergens. Use lukewarm water for face washing.",
    createdAt: addDays(todayISO(), -14) + "T15:00:00.000Z",
  },
];

export const MEDICAL_RECORDS: MedicalRecord[] = [
  {
    id: "mr1",
    patientId: "p1",
    doctorId: "d1",
    doctorName: "Dr. Ayesha Khan",
    appointmentId: "ax0",
    date: addDays(todayISO(), -9),
    diagnosis: "Primary Hypertension (Mild) & Hyperlipidemia",
    symptoms: "Occasional morning headaches, mild fatigue, elevated routine BP readings.",
    clinicalNotes: "Patient evaluated for borderline high blood pressure readings over past 3 weeks. Resting BP confirmed at 134/86 mmHg, heart rate 74 bpm regular. Heart sounds S1/S2 normal without murmurs. ECG showed normal sinus rhythm. Advised lifestyle modifications including DASH diet and mild aerobic exercise. Initiated low-dose Atorvastatin and Metoprolol.",
    vitals: {
      bloodPressure: "134/86 mmHg",
      heartRate: "74 bpm",
      temperature: "98.4 °F",
      weight: "58 kg",
    },
    followUpDate: addDays(todayISO(), 21),
    createdAt: addDays(todayISO(), -9) + "T10:30:00.000Z",
  },
  {
    id: "mr2",
    patientId: "p1",
    doctorId: "d2",
    doctorName: "Dr. Hassan Raza",
    date: addDays(todayISO(), -35),
    diagnosis: "Vitamin D Deficiency & General Fatigue",
    symptoms: "Lethargy, diffuse muscle soreness, low energy in afternoon.",
    clinicalNotes: "Routine serum 25(OH)D returned at 18 ng/mL (insufficient). Systemic exam unremarkable. Prescribed high-dose oral Vitamin D3 supplementation followed by maintenance dose.",
    vitals: {
      bloodPressure: "122/78 mmHg",
      heartRate: "70 bpm",
      temperature: "98.6 °F",
      weight: "57.5 kg",
    },
    createdAt: addDays(todayISO(), -35) + "T11:15:00.000Z",
  },
  {
    id: "mr3",
    patientId: "p2",
    doctorId: "d3",
    doctorName: "Dr. Sara Ahmed",
    date: addDays(todayISO(), -14),
    diagnosis: "Contact Dermatitis",
    symptoms: "Pruritic erythematous rash over forearms.",
    clinicalNotes: "Mild allergic reaction to detergent. Responded well to topicals and antihistamines.",
    vitals: {
      bloodPressure: "120/80 mmHg",
      heartRate: "72 bpm",
    },
    createdAt: addDays(todayISO(), -14) + "T15:00:00.000Z",
  },
];

export function createSeed(): DataState {
  const now = new Date().toISOString();
  return {
    doctors: DOCTORS,
    patients: PATIENTS,
    appointments: seedAppointments(DOCTORS),
    specializations: SPECIALIZATIONS,
    notifications: [
      { id: "n1", role: "patient", userId: "p1", title: "Welcome to MEDIVANCE", body: "Your demo account is ready. Book your first appointment.", time: now, read: false },
      { id: "n2", role: "doctor", userId: "d1", title: "New appointment requests", body: "You have pending requests waiting for review.", time: now, read: false },
      { id: "n3", role: "admin", title: "System ready", body: "Frontend simulation data loaded successfully.", time: now, read: false },
    ],
    settings: {
      siteName: "MEDIVANCE", supportEmail: "info@medivance.pk", supportPhone: "+92 300 123 4567", slotMinutes: 30,
      allowRegistration: true, emailNotifications: true, smsNotifications: false, appointmentReminders: true,
      adminName: ADMIN.name, adminEmail: ADMIN.email, adminPhone: ADMIN.phone, adminPassword: ADMIN.password,
    },
    payments: [],
    reschedules: [],
    prescriptions: PRESCRIPTIONS,
    medicalRecords: MEDICAL_RECORDS,
    applications: [],
  };
}

export const DEMO_ACCOUNTS = {
  patient: { email: "patient@medivance.pk", password: "Patient@123" },
  doctor: { email: "doctor@medivance.pk", password: "Doctor@123" },
  admin: { email: "admin@medivance.pk", password: "Admin@123" },
};
export const ADMIN = { id: "admin1", name: "System Administrator", email: "admin@medivance.pk", password: "Admin@123", phone: "+92 300 123 4567" };
