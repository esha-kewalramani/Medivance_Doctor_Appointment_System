import { Metadata } from "next";
import LiveLocationDashboard from "@/components/location/LiveLocationDashboard";

export const metadata: Metadata = {
  title: "Live Location - MEDIVANCE Healthcare Facilities & Doctors",
  description: "Locate nearby hospitals, doctors, clinics and pharmacies in real-time with MEDIVANCE interactive medical navigation.",
};

export default function LiveLocationPage() {
  return <LiveLocationDashboard />;
}
