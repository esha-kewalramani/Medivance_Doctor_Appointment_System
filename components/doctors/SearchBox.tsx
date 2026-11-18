"use client";
import { useId, useMemo, useState } from "react";
import { Search, Stethoscope, User } from "lucide-react";
import { Doctor, Specialization } from "@/types";

// everyday words -> a specialization-name stem (matched against the specializations that exist in the data)
const KEYWORDS: Record<string, string> = {
  heart: "cardio", cardiac: "cardio", chest: "cardio", bp: "cardio", pressure: "cardio",
  skin: "dermat", acne: "dermat", hair: "dermat", rash: "dermat", nail: "dermat",
  child: "pediat", children: "pediat", kid: "pediat", baby: "pediat", infant: "pediat",
  bone: "orthop", joint: "orthop", knee: "orthop", back: "orthop", fracture: "orthop",
  brain: "neuro", headache: "neuro", migraine: "neuro", nerve: "neuro", stroke: "neuro",
  eye: "ophthal", vision: "ophthal", tooth: "dent", teeth: "dent", dental: "dent",
  mind: "psych", stress: "psych", anxiety: "psych", depression: "psych",
  pregnancy: "gyn", women: "gyn", fever: "general", flu: "general", cold: "general",
};

type Item = { kind: "spec"; label: string; hint?: string } | { kind: "doctor"; label: string; hint: string };

export default function SearchBox({ value, onChange, onPickSpec, doctors, specializations }: {
  value: string; onChange: (v: string) => void; onPickSpec: (name: string) => void; doctors: Doctor[]; specializations: Specialization[];
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const id = useId();
  const q = value.trim().toLowerCase();

  const items = useMemo<Item[]>(() => {
    if (q.length < 1) return [];
    const out: Item[] = [];
    const stems = new Set<string>();
    Object.entries(KEYWORDS).forEach(([w, stem]) => { if (w.startsWith(q) || (q.length > 2 && q.startsWith(w))) stems.add(stem); });
    specializations.forEach((s) => {
      const n = s.name.toLowerCase();
      const viaWord = [...stems].some((st) => n.includes(st));
      if (n.includes(q) || viaWord) out.push({ kind: "spec", label: s.name, hint: viaWord && !n.includes(q) ? `matches "${value.trim()}"` : "Specialty" });
    });
    doctors.filter((d) => d.name.toLowerCase().includes(q)).slice(0, 4).forEach((d) => out.push({ kind: "doctor", label: d.name, hint: d.specialization }));
    return out.slice(0, 7);
  }, [q, value, doctors, specializations]);

  const show = open && items.length > 0;
  const pick = (it: Item) => {
    if (it.kind === "spec") { onPickSpec(it.label); onChange(""); } else onChange(it.label);
    setOpen(false); setActive(-1);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (!show) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % items.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a <= 0 ? items.length - 1 : a - 1)); }
    else if (e.key === "Enter" && active >= 0) { e.preventDefault(); pick(items[active]); }
    else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div className="relative lg:col-span-2" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false); }}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        className="input pl-9" placeholder="Search by doctor name or specialty (try “heart”)" value={value} autoComplete="off"
        onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(-1); }} onFocus={() => setOpen(true)} onKeyDown={onKey}
        aria-label="Search doctors" role="combobox" aria-expanded={show} aria-controls={`${id}-list`} aria-autocomplete="list" aria-activedescendant={active >= 0 ? `${id}-${active}` : undefined}
      />
      {show && (
        <ul id={`${id}-list`} role="listbox" className="card absolute left-0 right-0 top-full z-30 mt-1.5 max-h-72 overflow-auto !bg-surface p-1.5 shadow-soft">
          {items.map((it, i) => (
            <li key={`${it.kind}-${it.label}`} id={`${id}-${i}`} role="option" aria-selected={i === active}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(it)} className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm ${i === active ? "bg-primary/15" : "hover:bg-primary/10"}`}>
                {it.kind === "spec" ? <Stethoscope className="h-4 w-4 shrink-0 text-primary" /> : <User className="h-4 w-4 shrink-0 text-muted" />}
                <span className="min-w-0 flex-1 truncate font-semibold">{it.label}</span>
                <span className="shrink-0 text-xs text-muted">{it.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
