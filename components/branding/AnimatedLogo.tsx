import Link from "next/link";
import CompactLogo from "./CompactLogo";
import FullLogo from "./FullLogo";
import LogoIcon from "./LogoIcon";

export type LogoVariant = "full" | "compact" | "icon";

/** The one logo used everywhere (navbar, footer, sidebars, hero, 404). Pick a variant by available space. */
export default function AnimatedLogo({ variant = "compact", href = "/", size = 36, stacked = false }: { variant?: LogoVariant; href?: string | null; size?: number; stacked?: boolean }) {
  const body = variant === "full" ? <FullLogo size={size} stacked={stacked} /> : variant === "icon" ? <LogoIcon size={size} /> : <CompactLogo size={size} stacked={stacked} />;
  if (href === null) return body;
  return <Link href={href} aria-label="MEDIVANCE home" className="inline-flex">{body}</Link>;
}
