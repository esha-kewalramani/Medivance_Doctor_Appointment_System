import PortalShell from "@/components/navigation/PortalShell";

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell role="doctor">{children}</PortalShell>;
}
