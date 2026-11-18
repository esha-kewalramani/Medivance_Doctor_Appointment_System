import LogoIcon from "./LogoIcon";
import Wordmark from "./Wordmark";

/** Compact logo: emblem + orbit + stethoscope + wordmark, no tagline. */
export default function CompactLogo({ size = 32, stacked = false }: { size?: number; stacked?: boolean }) {
  return (
    <span className={`inline-flex ${stacked ? "flex-col items-center gap-0.5" : "items-center gap-2.5"}`}>
      <LogoIcon size={size} />
      <Wordmark stacked={stacked} />
    </span>
  );
}
