"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Ambulance, Crosshair, MapPin, Navigation, Phone, Siren } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { AMBULANCES, DEFAULT_CENTER, EMERGENCY_HOSPITALS, directionsHref, distanceKm, telHref } from "@/lib/emergency";

/** Fixed on every page. Opens a panel with ambulance numbers + the nearest hospital (same hospitals as the Live Location page). */
export default function EmergencyButton() {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { const o = () => setOpen(true); window.addEventListener("mdv:emergency", o); return () => window.removeEventListener("mdv:emergency", o); }, []);

  const origin = coords ?? DEFAULT_CENTER;
  const hospitals = useMemo(
    () => EMERGENCY_HOSPITALS.map((h) => ({ ...h, km: distanceKm(origin.lat, origin.lng, h.lat, h.lng) })).sort((a, b) => a.km - b.km),
    [origin.lat, origin.lng],
  );
  const [nearest, ...others] = hospitals;

  const locate = () => {
    if (!navigator.geolocation) { setMsg("Your browser does not support location."); return; }
    setBusy(true); setMsg(null);
    navigator.geolocation.getCurrentPosition(
      (p) => { setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }); setBusy(false); },
      () => { setBusy(false); setMsg("Location was not allowed. Showing distance from the city centre."); },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 end-4 z-[60] inline-flex items-center gap-2 rounded-full border border-red-300/40 bg-red-600 px-3.5 py-3 text-sm font-bold sm:px-4 text-white shadow-[0_8px_28px_-6px_rgba(220,38,38,0.7)] transition hover:bg-red-500 focus-visible:outline-offset-4 print:hidden sm:bottom-6 sm:end-6"
        aria-label="Open emergency help"
        aria-haspopup="dialog"
      >
        <span className="relative grid h-5 w-5 place-items-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-white/50" />
          <Siren className="relative h-5 w-5" />
        </span>
        <span className="max-sm:sr-only">Emergency</span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Emergency help">
        <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm font-medium">
          In a life-threatening emergency, call 115 or 1122 immediately.
        </p>

        <h4 className="label flex items-center gap-1.5"><Ambulance className="h-4 w-4" /> {"Ambulance & emergency numbers"}</h4>
        <ul className="mb-5 grid gap-2 sm:grid-cols-2">
          {AMBULANCES.map((a) => (
            <li key={a.id}>
              <a href={telHref(a.number)} className="flex items-center justify-between gap-2 rounded-xl border border-line/50 bg-primary/5 px-3 py-2.5 text-sm transition hover:border-red-500/50 hover:bg-red-500/10">
                <span className="font-semibold">{a.name}</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-red-600 dark:text-red-400"><Phone className="h-4 w-4" /> {a.number}</span>
              </a>
            </li>
          ))}
        </ul>

        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h4 className="label !mb-0 flex items-center gap-1.5"><MapPin className="h-4 w-4" /> Nearest hospital</h4>
          <button onClick={locate} disabled={busy} className="btn-ghost btn-sm"><Crosshair className="h-4 w-4" /> {busy ? "Locating..." : "Use my location"}</button>
        </div>
        {msg && <p className="mb-2 text-xs text-warn" role="status">{msg}</p>}

        <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-display text-lg font-bold">{nearest.name}</p>
              <p className="text-xs text-muted">{nearest.address}</p>
              <p className="mt-1 text-xs font-semibold text-ok">{nearest.note}</p>
            </div>
            <span className="shrink-0 rounded-full bg-primary/20 px-2.5 py-1 text-xs font-bold text-primary">{nearest.km} km</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <a href={telHref(nearest.phone)} className="btn-primary btn-sm"><Phone className="h-4 w-4" /> Call</a>
            <a href={directionsHref(nearest)} target="_blank" rel="noreferrer" className="btn-ghost btn-sm"><Navigation className="h-4 w-4" /> Directions</a>
          </div>
        </div>

        <ul className="mt-3 space-y-1.5 text-sm">
          {others.map((h) => (
            <li key={h.id} className="flex items-center justify-between gap-2 rounded-lg border border-line/40 px-3 py-2">
              <span className="min-w-0 truncate"><span className="font-semibold">{h.name}</span> <span className="text-xs text-muted">- {h.km} km</span></span>
              <a href={telHref(h.phone)} className="shrink-0 text-xs font-bold text-primary hover:underline">{h.phone}</a>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center justify-between gap-2 text-xs text-muted">
          <span>{coords ? "Distances from your location" : "Distances from Karachi city centre"}</span>
          <Link href="/location" onClick={() => setOpen(false)} className="font-semibold text-primary hover:underline">Open Live Location</Link>
        </div>
      </Modal>
    </>
  );
}
