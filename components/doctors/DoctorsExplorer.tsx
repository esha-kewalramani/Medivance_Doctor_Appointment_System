"use client";
import { useEffect, useMemo, useState } from "react";
import { Heart, SlidersHorizontal, Star, X } from "lucide-react";
import DoctorCard from "./DoctorCard";
import SearchBox from "./SearchBox";
import { useFavorites } from "@/hooks/useFavorites";
import AiDoctorMatch from "@/components/ai-assistant/AiDoctorMatch";
import EmptyState from "@/components/ui/EmptyState";
import { useApp } from "@/hooks/useApp";
import { useQueryParam } from "@/hooks/useQueryParam";
import { weekdayOf, todayISO } from "@/lib/utilities";

const SYMPTOM_KEYWORDS: Record<string, string[]> = {
  cardiology: ["heart", "cardio", "chest", "chest pain", "bp", "blood pressure", "hypertension", "palpitation", "cholesterol", "attack", "ecg", "cardiac"],
  neurology: ["brain", "headache", "migraine", "nerve", "stroke", "neuro", "seizure", "paralysis", "vertigo", "memory", "spine", "numbness", "tremor"],
  ophthalmology: ["eye", "vision", "sight", "glasses", "lens", "cataract", "retina", "ophthalmic", "blur", "cornea", "dry eye", "laser", "specs"],
  dermatology: ["skin", "acne", "rash", "hair", "nail", "allergy", "eczema", "derma", "pigmentation", "mole", "itch"],
  orthopedics: ["bone", "joint", "knee", "spine", "back pain", "fracture", "ortho", "arthritis", "shoulder", "muscle", "ligament", "hip"],
  pediatrics: ["child", "baby", "kid", "infant", "pediatric", "vaccine", "growth", "toddler", "newborn"],
  "general medicine": ["fever", "cough", "flu", "cold", "infection", "stomach", "weakness", "general", "physician", "routine", "diabetes"],
  gynecology: ["women", "pregnancy", "period", "maternity", "fertility", "gynae", "female", "menstrual", "pcos"],
  dentistry: ["tooth", "teeth", "dental", "gum", "cavity", "oral", "dentist", "braces", "root canal"],
};

export default function DoctorsExplorer({ profileBase = "/doctors" }: { profileBase?: string }) {
  const { data } = useApp();
  const qpSpec = useQueryParam("spec");
  const qpQ = useQueryParam("q");
  const [q, setQ] = useState("");
  const [spec, setSpec] = useState("all");
  const [exp, setExp] = useState("0");
  const [avail, setAvail] = useState("any");
  const [sort, setSort] = useState("rating");
  const [top, setTop] = useState(false); // "Top rated" filter: 4.5+
  const [savedOnly, setSavedOnly] = useState(false);
  const { ids: favIds } = useFavorites();
  useEffect(() => { if (qpSpec) setSpec(qpSpec); }, [qpSpec]);
  useEffect(() => { if (qpQ) setQ(qpQ); }, [qpQ]);

  const list = useMemo(() => {
    const today = weekdayOf(todayISO());
    const query = q.trim().toLowerCase();

    const r = data.doctors.filter((d) => {
      const matchSpec = spec === "all" || d.specialization === spec;
      if (!matchSpec) return false;

      let matchQ = true;
      if (query) {
        const direct = `${d.name} ${d.specialization} ${d.qualification} ${d.bio || ""}`.toLowerCase().includes(query);
        let keyword = false;
        const sLower = d.specialization.toLowerCase();
        for (const [k, words] of Object.entries(SYMPTOM_KEYWORDS)) {
          if (sLower.includes(k) || k.includes(sLower)) {
            if (words.some((w) => w.includes(query) || query.includes(w))) {
              keyword = true;
              break;
            }
          }
        }
        matchQ = direct || keyword;
      }

      return (
        matchQ &&
        d.experience >= Number(exp) &&
        (!top || d.rating >= 4.5) &&
        (!savedOnly || favIds.includes(d.id)) &&
        (avail === "any" || (avail === "today" && d.availability.some((w) => w.day === today)) || (avail === "weekend" && d.availability.some((w) => w.day === "Sat" || w.day === "Sun")) || (avail === "none" && d.availability.length > 0))
      );
    });
    const s = [...r];
    if (sort === "rating") s.sort((a, b) => b.rating - a.rating);
    if (sort === "experience") s.sort((a, b) => b.experience - a.experience);
    if (sort === "fee-low") s.sort((a, b) => a.fee - b.fee);
    if (sort === "fee-high") s.sort((a, b) => b.fee - a.fee);
    if (sort === "name") s.sort((a, b) => a.name.localeCompare(b.name));
    return s;
  }, [data.doctors, q, spec, exp, avail, sort, top, savedOnly, favIds]);

  const dirty = q || spec !== "all" || exp !== "0" || avail !== "any" || top || savedOnly;
  const reset = () => { setQ(""); setSpec("all"); setExp("0"); setAvail("any"); setTop(false); setSavedOnly(false); };

  return (
    <div className="space-y-5">
      <AiDoctorMatch onPick={(s) => setSpec(s)} />
      <div className="card p-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <SearchBox value={q} onChange={setQ} onPickSpec={setSpec} doctors={data.doctors} specializations={data.specializations} />
          <select className="input" value={spec} onChange={(e) => setSpec(e.target.value)} aria-label="Specialization">
            <option value="all">All specializations</option>
            {data.specializations.map((s) => <option key={s.id}>{s.name}</option>)}
          </select>
          <select className="input" value={exp} onChange={(e) => setExp(e.target.value)} aria-label="Experience">
            <option value="0">Any experience</option><option value="5">5+ years</option><option value="10">10+ years</option><option value="15">15+ years</option>
          </select>
          <select className="input" value={avail} onChange={(e) => setAvail(e.target.value)} aria-label="Availability">
            <option value="any">Any availability</option><option value="today">Available today</option><option value="weekend">Weekend clinic</option><option value="none">Accepting appointments</option>
          </select>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted">{list.length} doctor{list.length === 1 ? "" : "s"} found</span>
            <button onClick={() => setTop((v) => !v)} aria-pressed={top} className={`btn-sm inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${top ? "border-warn/50 bg-warn/15 text-warn" : "border-line/60 text-muted hover:border-primary"}`}><Star className={`h-3.5 w-3.5 ${top ? "fill-current" : ""}`} /> Top rated 4.5+</button>
            <button onClick={() => setSavedOnly((v) => !v)} aria-pressed={savedOnly} className={`btn-sm inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${savedOnly ? "border-bad/50 bg-bad/15 text-bad" : "border-line/60 text-muted hover:border-primary"}`}><Heart className={`h-3.5 w-3.5 ${savedOnly ? "fill-current" : ""}`} /> Saved</button>
          </div>
          <div className="flex items-center gap-2">
            {dirty && <button onClick={reset} className="btn-ghost btn-sm"><X className="h-4 w-4" /> Clear filters</button>}
            <label className="flex items-center gap-2 text-muted"><SlidersHorizontal className="h-4 w-4" />
              <select className="input !w-auto !py-1.5" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
                <option value="rating">Top rated</option><option value="experience">Most experienced</option><option value="fee-low">Fee: low to high</option><option value="fee-high">Fee: high to low</option><option value="name">Name A-Z</option>
              </select>
            </label>
          </div>
        </div>
      </div>
      {list.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{list.map((d) => <DoctorCard key={d.id} doctor={d} profileBase={profileBase} />)}</div>
      ) : <div className="card"><EmptyState title="No doctors match your filters" text="Try removing a filter or searching a different name." action={<button className="btn-primary btn-sm" onClick={reset}>Clear filters</button>} /></div>}
    </div>
  );
}
