import DoctorsExplorer from "@/components/doctors/DoctorsExplorer";
import PageHeader from "@/components/ui/PageHeader";

export default function DoctorsPage() {
  return (
    <div className="container-x pt-8">
      <PageHeader title="Find Doctors" subtitle="Search, filter and compare our specialists, then book a free slot." />
      <DoctorsExplorer profileBase="/doctors" />
    </div>
  );
}
