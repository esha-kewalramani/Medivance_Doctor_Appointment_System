import { useEffect, useState } from "react";

/** Reads ?name=value after mount (avoids Suspense requirements of useSearchParams). */
export function useQueryParam(name: string) {
  const [v, setV] = useState("");
  useEffect(() => { setV(new URLSearchParams(window.location.search).get(name) || ""); }, [name]);
  return v;
}
