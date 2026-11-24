export type Role = "patient" | "doctor" | "admin";
export type Weekday = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
export const WEEKDAYS: Weekday[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export type AppointmentStatus = "pending" | "approved" | "rejected" | "cancelled" | "completed";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface Review { id: string; author: string; rating: number; text: string; date: string }

/** A consultation window. It is split into slots of `slotMinutes` minutes. */
export interface AvailabilityWindow { id: string; day: Weekday; start: string; end: string }

export interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string; // DEMO ONLY (frontend simulation). Supabase Auth replaces this later.
  specialization: string;
  qualification: string;
  experience: number;
  rating: number;
  fee: number;
  languages: string[];
  bio: string;
  photo?: string;
  slotMinutes: number;
  availability: AvailabilityWindow[];
  reviews: Review[];
  /** Supabase mode only. Missing = approved (existing doctors and demo mode). */
  approval?: ApprovalStatus;
  registeredAt?: string;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string; // DEMO ONLY
  dob: string;
  gender: "Male" | "Female" | "Other";
  address?: string;
  bloodGroup?: string;
  registeredAt: string;
  isGuest?: boolean;
  auraConsent?: boolean;
}

export interface Appointment {
  id: string;
  ref: string;
  patientId: string;
  doctorId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  reason: string;
  status: AppointmentStatus;
  createdAt: string;
  notes?: string;
  triageBrief?: TriageBrief;
  soapNote?: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  isGuest?: boolean;
  guestDetails?: {
    name: string;
    email: string;
    phone: string;
    gender?: string;
    age?: string;
  };
}

/** A SIMULATED consultation-fee payment. No real money is ever involved. */
export interface Payment {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  amount: number;
  currency: string;
  status: "paid" | "failed" | "cancelled";
  method: string;
  transactionId: string;
  paidAt: string;
}

/** One doctor-initiated reschedule of an appointment (history is never overwritten). */
export interface Reschedule {
  id: string;
  appointmentId: string;
  doctorId: string;
  oldDate: string;
  oldTime: string;
  newDate: string;
  newTime: string;
  reason: string;
  createdAt: string;
}

export interface PrescriptionItem {
  id?: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Prescription {
  id: string;
  rxNumber?: string;
  appointmentId?: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  diagnosis?: string;
  date: string;
  medications: PrescriptionItem[];
  instructions?: string;
  createdAt: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  appointmentId?: string;
  date: string;
  diagnosis: string;
  symptoms: string;
  clinicalNotes: string;
  vitals?: {
    bloodPressure?: string;
    heartRate?: string;
    temperature?: string;
    weight?: string;
  };
  followUpDate?: string;
  createdAt: string;
}

export type QueueItemStatus = "waiting" | "calling" | "in_consultation" | "completed" | "skipped" | "passed";

export interface TriageBrief {
  appointmentId: string;
  patientId: string;
  symptoms: string[];
  chiefComplaint: string;
  duration: string;
  painScale: number; // 1-10
  allergies: string;
  currentMedications: string;
  urgency: "routine" | "moderate" | "urgent";
  soapNote: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  submittedAt: string;
}

export interface QueueToken {
  id: string;
  tokenNumber: number;
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  specialization: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  room: string;
  status: QueueItemStatus;
  arrivedStatus?: "en_route" | "in_lobby";
  arrivedAt?: string;
  calledAt?: string;
  startedAt?: string;
  completedAt?: string;
  estimatedWaitMinutes: number;
  triageBrief?: TriageBrief;
}

export type DispatchChannel = "SMS" | "EMAIL";
export type DispatchType = "CONFIRMATION" | "REMINDER_24H" | "REMINDER_1H" | "REMINDER_30M" | "QUEUE_SUMMON";

export interface AppointmentDispatchLog {
  id: string;
  appointmentId: string;
  patientName: string;
  phone: string;
  email: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  channel: DispatchChannel;
  type: DispatchType;
  title: string;
  message: string;
  scheduledFor: string;
  sentAt?: string;
  status: "scheduled" | "delivered";
}

export interface Specialization { id: string; name: string; description: string; icon: string }

export interface Notification {
  id: string;
  role: Role;
  userId?: string; // undefined => every user of that role
  title: string;
  body: string;
  time: string;
  read: boolean;
}

export interface Settings {
  siteName: string;
  supportEmail: string;
  supportPhone: string;
  slotMinutes: number;
  allowRegistration: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  appointmentReminders: boolean;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  adminPassword: string; // DEMO ONLY
}

export interface Session { role: Role; userId: string; /** doctors only (Supabase mode) */ approval?: ApprovalStatus }

export interface Slot { day: number; time: string; state?: "free" | "busy" }

export interface DataState {
  doctors: Doctor[];
  patients: Patient[];
  appointments: Appointment[];
  specializations: Specialization[];
  notifications: Notification[];
  settings: Settings;
  payments: Payment[];
  reschedules: Reschedule[];
  prescriptions: Prescription[];
  medicalRecords: MedicalRecord[];
  /** doctors still pending / rejected (visible to the admin and to the applicant only) */
  applications: Doctor[];
}

export type DB = DataState;
