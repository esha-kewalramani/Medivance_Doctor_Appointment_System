"use client";
import PageHeader from "@/components/ui/PageHeader";
import DoctorForm from "@/components/forms/DoctorForm";
import ChangeEmailCard from "@/components/forms/ChangeEmailCard";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useApp } from "@/hooks/useApp";
import { toast } from "@/components/notifications/alerts";

export default function DoctorProfilePage() {
  const { data, session, saveDoctor } = useApp();
  const me = data.doctors.find((d) => d.id === session?.userId);
  if (!me) return null;
  return (
    <>
      <PageHeader title="My Profile" subtitle="Changes appear instantly in the public doctor directory." />
      <div className="card p-5 sm:p-6">
        <DoctorForm lockEmail={isSupabaseConfigured} initial={me} specializations={data.specializations} onSubmit={(d) => { const r = saveDoctor(d); if (r.ok) toast("success", "Profile updated", "Your public profile has been refreshed."); return r; }} />
      </div>
      <div className="mt-5 max-w-md"><ChangeEmailCard currentEmail={me.email} /></div>
    </>
  );
}
