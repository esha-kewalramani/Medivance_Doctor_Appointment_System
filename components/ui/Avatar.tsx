import { hue, initials } from "@/lib/utilities";

export default function Avatar({ name, photo, size = 44, className = "" }: { name: string; photo?: string; size?: number; className?: string }) {
  const h = hue(name);
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt={name} style={{ width: size, height: size }} className={`shrink-0 rounded-full object-cover ring-2 ring-primary/30 ${className}`} />;
  }
  return (
    <span
      aria-label={name}
      style={{ width: size, height: size, fontSize: size * 0.38, background: `linear-gradient(135deg, hsl(${h} 75% 55%), hsl(${(h + 50) % 360} 80% 42%))` }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold text-white ring-2 ring-primary/30 ${className}`}
    >
      {initials(name)}
    </span>
  );
}
