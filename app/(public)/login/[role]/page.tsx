"use client";
import { notFound, useParams } from "next/navigation";
import UnifiedAuthCard from "@/components/forms/UnifiedAuthCard";
import { Role } from "@/types";

export default function RoleLoginPage() {
  const { role } = useParams<{ role: string }>();
  if (!["patient", "doctor", "admin"].includes(role)) notFound();
  return <UnifiedAuthCard initialRole={role as Role} />;
}
