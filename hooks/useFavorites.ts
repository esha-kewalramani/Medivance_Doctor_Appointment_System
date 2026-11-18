"use client";
import { useCallback, useEffect, useState } from "react";
import { readJSON, writeJSON } from "@/lib/storage";
import { useApp } from "@/hooks/useApp";
import { getSupabase } from "@/lib/supabase/client";

const KEY = "mdv:favs:v1";
const EVT = "mdv:favs";
type FavMap = Record<string, string[]>;

/** Saved doctors, kept per signed-in user (or "guest") in LocalStorage. All hook instances stay in sync. */
export function useFavorites() {
  const { session } = useApp();
  const owner = session?.userId ?? "guest";
  const [map, setMap] = useState<FavMap>({});

  useEffect(() => {
    const sync = () => setMap(readJSON<FavMap>(KEY) || {});
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(EVT, sync); window.removeEventListener("storage", sync); };
  }, []);

  // with Supabase, a patient's saved doctors live in the database
  useEffect(() => {
    const sb = getSupabase();
    if (!sb || session?.role !== "patient") return;
    sb.from("favorites").select("doctor_id").eq("patient_id", session.userId).then(({ data }) => {
      if (!data) return;
      const all = readJSON<FavMap>(KEY) || {};
      all[owner] = data.map((r) => r.doctor_id as string);
      writeJSON(KEY, all);
      window.dispatchEvent(new Event(EVT));
    });
  }, [owner, session?.role, session?.userId]);

  const ids = map[owner] ?? [];
  const toggle = useCallback((id: string) => {
    const all = readJSON<FavMap>(KEY) || {};
    const cur = all[owner] ?? [];
    all[owner] = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    writeJSON(KEY, all);
    window.dispatchEvent(new Event(EVT));
    const sb = getSupabase();
    if (sb && session?.role === "patient") {
      if (cur.includes(id)) sb.from("favorites").delete().eq("patient_id", session.userId).eq("doctor_id", id).then(() => undefined);
      else sb.from("favorites").insert({ patient_id: session.userId, doctor_id: id }).then(() => undefined);
    }
  }, [owner, session?.role, session?.userId]);

  return { ids, isFav: (id: string) => ids.includes(id), toggle };
}
