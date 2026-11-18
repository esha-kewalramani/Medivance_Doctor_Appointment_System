"use client";
import { Heart } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";

export default function FavoriteButton({ doctorId, doctorName }: { doctorId: string; doctorName: string }) {
  const { isFav, toggle } = useFavorites();
  const on = isFav(doctorId);
  return (
    <button
      type="button"
      onClick={() => toggle(doctorId)}
      aria-pressed={on}
      aria-label={on ? `Remove ${doctorName} from saved doctors` : `Save ${doctorName}`}
      title={on ? "Saved" : "Save doctor"}
      className={`absolute end-3 top-3 grid h-8 w-8 place-items-center rounded-full border transition ${on ? "border-bad/50 bg-bad/15 text-bad" : "border-line/50 bg-surface/60 text-muted hover:border-bad/50 hover:text-bad"}`}
    >
      <Heart className={`h-4 w-4 ${on ? "fill-current" : ""}`} />
    </button>
  );
}
