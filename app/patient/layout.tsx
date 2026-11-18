import PortalShell from "@/components/navigation/PortalShell";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell role="patient">{children}</PortalShell>;
}
