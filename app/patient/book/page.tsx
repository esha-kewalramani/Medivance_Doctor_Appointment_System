"use client";
import BookingWizard from "@/components/appointments/BookingWizard";
import PageHeader from "@/components/ui/PageHeader";

export default function BookPage() {
  return (<><PageHeader title="Book an appointment" subtitle="Choose a doctor, pick a free slot and confirm in a few steps." /><BookingWizard /></>);
}
