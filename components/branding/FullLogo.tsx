import LogoIcon from "./LogoIcon";
import Wordmark from "./Wordmark";

/** Full logo: emblem + orbit + stethoscope + wordmark + tagline. */
export default function FullLogo({ size = 40, stacked = false }: { size?: number; stacked?: boolean }) {
  return (
    <span className={`inline-flex ${stacked ? "flex-col items-center gap-0.5" : "items-center gap-2.5"}`}>
      <LogoIcon size={size} />
      <Wordmark stacked={stacked} tagline />
    </span>
  );
}
