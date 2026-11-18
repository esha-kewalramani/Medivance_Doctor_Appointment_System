import AnimatedLogo from "@/components/branding/AnimatedLogo";

/** Backwards-compatible wrapper: every existing <Logo/> now renders the shared animated logo. */
export default function Logo({ href = "/", size = 40, tagline = false, stacked = false }: { href?: string; size?: number; tagline?: boolean; stacked?: boolean }) {
  return <AnimatedLogo href={href} size={size} stacked={stacked} variant={tagline ? "full" : "compact"} />;
}
