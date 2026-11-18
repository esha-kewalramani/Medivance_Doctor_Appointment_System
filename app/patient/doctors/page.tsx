"use client";
import DoctorsExplorer from "@/components/doctors/DoctorsExplorer";
import PageHeader from "@/components/ui/PageHeader";

export default function PatientDoctorsPage() {
  return (<><PageHeader title="Find Doctors" subtitle="Search by name, filter by specialty, experience or availability." /><DoctorsExplorer profileBase="/patient/doctors" /></>);
}
