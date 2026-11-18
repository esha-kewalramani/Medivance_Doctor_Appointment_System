/** The MEDIVANCE emblem artwork (M, orbit, cross, heartbeat). Fixed box so it never causes layout shift. */
export default function LogoIcon({ size = 40, className = "" }: { size?: number; intro?: boolean; loop?: boolean; className?: string }) {
  return (
    <span className={`mdv-icon ${className}`} style={{ width: Math.round(size * 2.5), height: size }} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/logo-emblem.png" alt="" width={1000} height={398} className="mdv-emblem" draggable={false} />
    </span>
  );
}
