"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Avatar from "@/components/ui/Avatar";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { useApp } from "@/hooks/useApp";
import { fmtDate, fmtTime } from "@/lib/utilities";

const age = (dob: string) => Math.max(0, Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000));

export default function DoctorPatientsPage() {
  const { data, session } = useApp();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  // only patients who have an appointment relationship with this doctor
  const records = useMemo(() => {
    const mine = data.appointments.filter((a) => a.doctorId === session?.userId);
    const ids = Array.from(new Set(mine.map((a) => a.patientId)));
    return ids.map((id) => ({ patient: data.patients.find((p) => p.id === id), visits: mine.filter((a) => a.patientId === id).sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1)) })).filter((r) => r.patient);
  }, [data, session]);
  const list = records.filter((r) => r.patient!.name.toLowerCase().includes(q.toLowerCase()));
  const sel = records.find((r) => r.patient!.id === open);

  return (
    <>
      <PageHeader title="Patient records" subtitle="Only patients with an appointment relationship with you are listed." />
      <div className="relative mb-4 max-w-sm"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input className="input pl-9" placeholder="Search patient" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search patients" /></div>
      {list.length === 0 ? <div className="card"><EmptyState title="No patient records" text="Records appear once patients book with you." /></div> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{list.map(({ patient: p, visits }) => (
          <button key={p!.id} onClick={() => setOpen(p!.id)} className="card card-hover flex items-center gap-3 p-4 text-left">
            <Avatar name={p!.name} size={48} /><span className="min-w-0 flex-1"><span className="block truncate font-semibold">{p!.name}</span><span className="text-xs text-muted">{age(p!.dob)} yrs - {p!.gender} - {visits.length} visit{visits.length === 1 ? "" : "s"}</span></span>
          </button>))}</div>)}
      <Modal open={!!sel} onClose={() => setOpen(null)} title={sel?.patient?.name ?? "Patient"} wide>
        {sel?.patient && <div className="space-y-4">
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4"><div><dt className="label">Age</dt><dd className="font-semibold">{age(sel.patient.dob)}</dd></div><div><dt className="label">Gender</dt><dd className="font-semibold">{sel.patient.gender}</dd></div><div><dt className="label">Blood group</dt><dd className="font-semibold">{sel.patient.bloodGroup || "-"}</dd></div><div><dt className="label">Phone</dt><dd className="font-semibold">{sel.patient.phone}</dd></div></dl>
          <h4 className="font-display font-semibold">Visit history with you</h4>
          <div className="table-wrap"><table className="table"><thead><tr><th>Date</th><th>Time</th><th>Reason</th><th>Status</th></tr></thead><tbody>{sel.visits.map((a) => <tr key={a.id}><td>{fmtDate(a.date)}</td><td>{fmtTime(a.time)}</td><td>{a.reason}</td><td><StatusBadge status={a.status} /></td></tr>)}</tbody></table></div>
        </div>}
      </Modal>
    </>
  );
}
