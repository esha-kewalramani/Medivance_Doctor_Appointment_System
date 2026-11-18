"use client";
import { FormEvent, useState } from "react";
import { Star } from "lucide-react";
import { useApp } from "@/hooks/useApp";
import { toast } from "@/components/notifications/alerts";
import { Review } from "@/types";

/** Average + 5..1 star distribution above the review list. */
export function RatingSummary({ reviews, rating }: { reviews: Review[]; rating: number }) {
  if (reviews.length === 0) return null;
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: reviews.filter((r) => r.rating === n).length }));
  return (
    <div className="mb-4 flex flex-col gap-4 rounded-xl border border-line/40 p-4 sm:flex-row sm:items-center">
      <div className="text-center sm:px-4">
        <p className="font-display text-4xl font-bold">{rating.toFixed(1)}</p>
        <p className="mt-1 inline-flex text-warn" aria-label={`${rating.toFixed(1)} out of 5 stars`}>{[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`h-4 w-4 ${i <= Math.round(rating) ? "fill-current" : "opacity-30"}`} />)}</p>
        <p className="text-xs text-muted">{reviews.length} review{reviews.length === 1 ? "" : "s"}</p>
      </div>
      <ul className="flex-1 space-y-1.5">
        {dist.map(({ n, c }) => (
          <li key={n} className="flex items-center gap-2 text-xs">
            <span className="w-8 shrink-0 font-semibold">{n} star</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-primary/10"><span className="block h-full rounded-full bg-warn" style={{ width: `${(c / reviews.length) * 100}%` }} /></span>
            <span className="w-5 shrink-0 text-right text-muted">{c}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Review form: only for signed-in patients who have an appointment (not cancelled/rejected) with this doctor. */
export function ReviewForm({ doctorId }: { doctorId: string }) {
  const { session, user, data, addReview } = useApp();
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");

  if (session?.role !== "patient") return <p className="mt-4 text-xs text-muted">Sign in as a patient who has visited this doctor to leave a review.</p>;
  const eligible = data.appointments.some((a) => a.patientId === session.userId && a.doctorId === doctorId && ["approved", "completed", "pending"].includes(a.status));
  if (!eligible) return <p className="mt-4 text-xs text-muted">Book an appointment with this doctor to leave a review.</p>;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const r = addReview(doctorId, { author: user?.name ?? "Patient", rating: stars, text });
    if (!r.ok) { setErr(r.error); toast("error", "Review not posted", r.error); return; }
    setStars(0); setText(""); setErr("");
    toast("success", "Review posted", "Thank you for your feedback!");
  };
  const shown = hover || stars;
  return (
    <form onSubmit={submit} className="mt-5 rounded-xl border border-line/40 p-4">
      <h3 className="font-display font-semibold">Write a review</h3>
      <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Your rating">
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button" role="radio" aria-checked={stars === i} aria-label={`${i} star${i > 1 ? "s" : ""}`} onClick={() => setStars(i)} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)} className="rounded p-0.5 text-warn">
            <Star className={`h-6 w-6 ${i <= shown ? "fill-current" : "opacity-40"}`} />
          </button>
        ))}
      </div>
      <textarea className="input mt-3 min-h-[84px]" placeholder="Share your experience (a few words is enough)" value={text} onChange={(e) => setText(e.target.value)} maxLength={300} aria-label="Review text" />
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn-primary btn-sm mt-3" type="submit">Post review</button>
    </form>
  );
}
