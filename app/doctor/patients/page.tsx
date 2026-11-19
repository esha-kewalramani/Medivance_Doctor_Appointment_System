"use client";
import { useMemo, useState } from "react";
import { Search, FileText, Pill, Plus, HeartPulse, Activity, User, ShieldCheck } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Avatar from "@/components/ui/Avatar";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { useApp } from "@/hooks/useApp";
import { fmtDate, fmtTime, todayISO } from "@/lib/utilities";
import { toast } from "@/components/notifications/alerts";

const age = (dob: string) => Math.max(0, Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000));

export default function DoctorPatientsPage() {
  const { data, session, user, addPrescription, addMedicalRecord } = useApp();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"visits" | "records" | "prescriptions">("visits");

  // Form states for adding consultation notes / prescriptions
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [recDiagnosis, setRecDiagnosis] = useState("");
  const [recSymptoms, setRecSymptoms] = useState("");
  const [recNotes, setRecNotes] = useState("");
  const [recBp, setRecBp] = useState("");
  const [recHr, setRecHr] = useState("");

  const [showAddRx, setShowAddRx] = useState(false);
  const [rxName, setRxName] = useState("");
  const [rxDose, setRxDose] = useState("");
  const [rxFreq, setRxFreq] = useState("");
  const [rxDuration, setRxDuration] = useState("");
  const [rxInstructions, setRxInstructions] = useState("");

  // only patients who have an appointment relationship with this doctor
  const records = useMemo(() => {
    const mine = data.appointments.filter((a) => a.doctorId === session?.userId);
    const ids = Array.from(new Set(mine.map((a) => a.patientId)));
    return ids.map((id) => ({
      patient: data.patients.find((p) => p.id === id),
      visits: mine.filter((a) => a.patientId === id).sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1)),
    })).filter((r) => r.patient);
  }, [data, session]);

  const list = records.filter((r) => r.patient!.name.toLowerCase().includes(q.toLowerCase()));
  const sel = records.find((r) => r.patient!.id === open);

  const patientMedicalRecords = useMemo(() => {
    if (!sel?.patient) return [];
    return (data.medicalRecords || []).filter((m) => m.patientId === sel.patient?.id);
  }, [data.medicalRecords, sel]);

  const patientPrescriptions = useMemo(() => {
    if (!sel?.patient) return [];
    return (data.prescriptions || []).filter((p) => p.patientId === sel.patient?.id);
  }, [data.prescriptions, sel]);

  const handleSaveMedicalRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sel?.patient || !recDiagnosis.trim() || !recNotes.trim()) {
      toast("error", "Please provide a diagnosis and clinical notes.");
      return;
    }
    addMedicalRecord({
      patientId: sel.patient.id,
      doctorId: session?.userId || "d1",
      doctorName: user?.name || "Dr. Medivance",
      date: todayISO(),
      diagnosis: recDiagnosis.trim(),
      symptoms: recSymptoms.trim(),
      clinicalNotes: recNotes.trim(),
      vitals: {
        bloodPressure: recBp.trim() || undefined,
        heartRate: recHr.trim() ? `${recHr.trim()} bpm` : undefined,
      },
    });
    setRecDiagnosis("");
    setRecSymptoms("");
    setRecNotes("");
    setRecBp("");
    setRecHr("");
    setShowAddRecord(false);
  };

  const handleSavePrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sel?.patient || !rxName.trim() || !rxDose.trim()) {
      toast("error", "Please provide medication name and dosage.");
      return;
    }
    addPrescription({
      patientId: sel.patient.id,
      doctorId: session?.userId || "d1",
      doctorName: user?.name || "Dr. Medivance",
      date: todayISO(),
      medications: [
        {
          name: rxName.trim(),
          dosage: rxDose.trim(),
          frequency: rxFreq.trim() || "Once daily",
          duration: rxDuration.trim() || "14 days",
        },
      ],
      instructions: rxInstructions.trim() || undefined,
    });
    setRxName("");
    setRxDose("");
    setRxFreq("");
    setRxDuration("");
    setRxInstructions("");
    setShowAddRx(false);
  };

  return (
    <>
      <PageHeader title="Patient records" subtitle="Access patient histories, past consultation records, and prescriptions." />
      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input className="input pl-9" placeholder="Search patient" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search patients" />
      </div>

      {list.length === 0 ? (
        <div className="card"><EmptyState title="No patient records" text="Records appear once patients book with you." /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map(({ patient: p, visits }) => (
            <button key={p!.id} onClick={() => { setOpen(p!.id); setActiveTab("visits"); }} className="card card-hover flex items-center gap-3 p-4 text-left">
              <Avatar name={p!.name} size={48} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 truncate font-semibold">
                  {p!.name}
                  {p!.isGuest && <span className="badge border-primary/30 bg-primary/10 text-primary text-[10px] py-0 px-1.5">Guest</span>}
                </span>
                <span className="text-xs text-muted">{age(p!.dob)} yrs • {p!.gender} • {visits.length} visit{visits.length === 1 ? "" : "s"}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      <Modal open={!!sel} onClose={() => { setOpen(null); setShowAddRecord(false); setShowAddRx(false); }} title={sel?.patient?.name ?? "Patient"} wide>
        {sel?.patient && (
          <div className="space-y-5">
            {/* Patient Header Card */}
            <div className="rounded-xl border border-line/50 bg-surface-2/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-line/40">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-base">{sel.patient.name}</h3>
                  {sel.patient.isGuest ? (
                    <span className="badge border-primary/30 bg-primary/10 text-primary text-xs">Guest Patient</span>
                  ) : (
                    <span className="badge badge-approved text-xs">Registered Patient</span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  <span>Aura Consent: <b>{sel.patient.auraConsent ? "Granted" : "Not Granted"}</b></span>
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div><dt className="label">Age</dt><dd className="font-semibold">{age(sel.patient.dob)} yrs</dd></div>
                <div><dt className="label">Gender</dt><dd className="font-semibold">{sel.patient.gender}</dd></div>
                <div><dt className="label">Blood group</dt><dd className="font-semibold">{sel.patient.bloodGroup || "Not specified"}</dd></div>
                <div><dt className="label">Phone</dt><dd className="font-semibold">{sel.patient.phone}</dd></div>
              </dl>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 border-b border-line/50 pb-2">
              <button
                onClick={() => setActiveTab("visits")}
                className={`btn btn-sm ${activeTab === "visits" ? "bg-primary text-primary-fg shadow-glow" : "btn-ghost"}`}
              >
                Visit History ({sel.visits.length})
              </button>
              <button
                onClick={() => setActiveTab("records")}
                className={`btn btn-sm ${activeTab === "records" ? "bg-primary text-primary-fg shadow-glow" : "btn-ghost"}`}
              >
                <FileText className="h-3.5 w-3.5" /> Medical Records ({patientMedicalRecords.length})
              </button>
              <button
                onClick={() => setActiveTab("prescriptions")}
                className={`btn btn-sm ${activeTab === "prescriptions" ? "bg-primary text-primary-fg shadow-glow" : "btn-ghost"}`}
              >
                <Pill className="h-3.5 w-3.5" /> Prescriptions ({patientPrescriptions.length})
              </button>
            </div>

            {/* Tab 1: Visits */}
            {activeTab === "visits" && (
              <div className="space-y-3">
                <h4 className="font-display font-semibold text-sm">Appointments with You</h4>
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>Reference</th><th>Date</th><th>Time</th><th>Reason</th><th>Status</th></tr></thead>
                    <tbody>
                      {sel.visits.map((a) => (
                        <tr key={a.id}>
                          <td className="font-medium text-primary">{a.ref}</td>
                          <td>{fmtDate(a.date)}</td>
                          <td>{fmtTime(a.time)}</td>
                          <td>{a.reason}</td>
                          <td><StatusBadge status={a.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 2: Medical Records */}
            {activeTab === "records" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-semibold text-sm">Clinical & Medical History</h4>
                  <button onClick={() => setShowAddRecord(!showAddRecord)} className="btn-primary btn-sm !rounded-lg inline-flex items-center gap-1">
                    <Plus className="h-3.5 w-3.5" /> {showAddRecord ? "Close Form" : "Add Consultation Note"}
                  </button>
                </div>

                {showAddRecord && (
                  <form onSubmit={handleSaveMedicalRecord} className="rounded-xl border border-primary/30 bg-surface-2/60 p-4 space-y-3">
                    <h5 className="font-display font-semibold text-sm text-primary">New Consultation Record</h5>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="label">Diagnosis *</label>
                        <input className="input" placeholder="e.g. Mild Hypertension" value={recDiagnosis} onChange={(e) => setRecDiagnosis(e.target.value)} required />
                      </div>
                      <div>
                        <label className="label">Symptoms</label>
                        <input className="input" placeholder="e.g. Headaches, dizziness" value={recSymptoms} onChange={(e) => setRecSymptoms(e.target.value)} />
                      </div>
                      <div>
                        <label className="label">Blood Pressure (optional)</label>
                        <input className="input" placeholder="e.g. 130/85 mmHg" value={recBp} onChange={(e) => setRecBp(e.target.value)} />
                      </div>
                      <div>
                        <label className="label">Heart Rate (optional)</label>
                        <input className="input" placeholder="e.g. 74" value={recHr} onChange={(e) => setRecHr(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="label">Clinical Notes *</label>
                      <textarea className="input" rows={3} placeholder="Observations, test recommendations, diagnosis details..." value={recNotes} onChange={(e) => setRecNotes(e.target.value)} required />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button type="button" className="btn-ghost btn-sm" onClick={() => setShowAddRecord(false)}>Cancel</button>
                      <button type="submit" className="btn-primary btn-sm">Save Clinical Note</button>
                    </div>
                  </form>
                )}

                {patientMedicalRecords.length === 0 ? (
                  <p className="text-center py-6 text-sm text-muted">No medical records on file for this patient.</p>
                ) : (
                  <div className="space-y-3">
                    {patientMedicalRecords.map((mr) => (
                      <div key={mr.id} className="rounded-xl border border-line/50 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-fg">{mr.diagnosis}</span>
                          <span className="text-xs text-muted">{fmtDate(mr.date)} • {mr.doctorName}</span>
                        </div>
                        {mr.symptoms && <p className="text-xs text-muted"><b className="text-fg">Symptoms:</b> {mr.symptoms}</p>}
                        <p className="text-xs text-muted leading-relaxed"><b className="text-fg">Notes:</b> {mr.clinicalNotes}</p>
                        {mr.vitals && (
                          <div className="flex flex-wrap gap-3 pt-1 text-xs">
                            {mr.vitals.bloodPressure && <span className="badge border-line/60">BP: {mr.vitals.bloodPressure}</span>}
                            {mr.vitals.heartRate && <span className="badge border-line/60">HR: {mr.vitals.heartRate}</span>}
                            {mr.vitals.temperature && <span className="badge border-line/60">Temp: {mr.vitals.temperature}</span>}
                            {mr.vitals.weight && <span className="badge border-line/60">Weight: {mr.vitals.weight}</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Prescriptions */}
            {activeTab === "prescriptions" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-semibold text-sm">Prescriptions & Medications</h4>
                  <button onClick={() => setShowAddRx(!showAddRx)} className="btn-primary btn-sm !rounded-lg inline-flex items-center gap-1">
                    <Plus className="h-3.5 w-3.5" /> {showAddRx ? "Close Form" : "Write Prescription"}
                  </button>
                </div>

                {showAddRx && (
                  <form onSubmit={handleSavePrescription} className="rounded-xl border border-primary/30 bg-surface-2/60 p-4 space-y-3">
                    <h5 className="font-display font-semibold text-sm text-primary">New Prescription</h5>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="label">Medicine Name *</label>
                        <input className="input" placeholder="e.g. Atorvastatin" value={rxName} onChange={(e) => setRxName(e.target.value)} required />
                      </div>
                      <div>
                        <label className="label">Dosage *</label>
                        <input className="input" placeholder="e.g. 20mg" value={rxDose} onChange={(e) => setRxDose(e.target.value)} required />
                      </div>
                      <div>
                        <label className="label">Frequency</label>
                        <input className="input" placeholder="e.g. Once daily at bedtime" value={rxFreq} onChange={(e) => setRxFreq(e.target.value)} />
                      </div>
                      <div>
                        <label className="label">Duration</label>
                        <input className="input" placeholder="e.g. 30 days" value={rxDuration} onChange={(e) => setRxDuration(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="label">Dietary / Clinical Instructions</label>
                      <input className="input" placeholder="e.g. Take with a glass of water after dinner" value={rxInstructions} onChange={(e) => setRxInstructions(e.target.value)} />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button type="button" className="btn-ghost btn-sm" onClick={() => setShowAddRx(false)}>Cancel</button>
                      <button type="submit" className="btn-primary btn-sm">Issue Prescription</button>
                    </div>
                  </form>
                )}

                {patientPrescriptions.length === 0 ? (
                  <p className="text-center py-6 text-sm text-muted">No prescriptions issued for this patient.</p>
                ) : (
                  <div className="space-y-3">
                    {patientPrescriptions.map((rx) => (
                      <div key={rx.id} className="rounded-xl border border-line/50 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-primary">{rx.doctorName}</span>
                          <span className="text-xs text-muted">{fmtDate(rx.date)}</span>
                        </div>
                        <ul className="space-y-1">
                          {rx.medications.map((m, idx) => (
                            <li key={idx} className="text-xs flex items-center justify-between border-b border-line/30 py-1 last:border-0">
                              <span className="font-medium text-fg">{m.name} ({m.dosage})</span>
                              <span className="text-muted">{m.frequency} • {m.duration}</span>
                            </li>
                          ))}
                        </ul>
                        {rx.instructions && <p className="text-xs text-muted pt-1"><b className="text-fg">Advice:</b> {rx.instructions}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
