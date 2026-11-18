/** MEDIVANCE lettering (real text, always sharp) plus optional tagline. */
export default function Wordmark({ stacked = false, tagline = false }: { stacked?: boolean; tagline?: boolean }) {
  return (
    <span className="leading-none">
      <span className={`mdv-word block font-display font-extrabold tracking-wide ${stacked ? "text-[13px]" : "text-xl"}`}>
        MEDI<span className="text-primary">VANCE</span>
      </span>
      {tagline && <span className="mdv-tag mt-1 block text-[11px] font-medium tracking-wide text-muted">Where Care Meets Tomorrow.</span>}
    </span>
  );
}
