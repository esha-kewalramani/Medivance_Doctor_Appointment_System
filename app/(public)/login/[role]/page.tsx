"use client";
import { notFound, useParams } from "next/navigation";
import LoginForm from "@/components/forms/LoginForm";
import { Role } from "@/types";

export default function RoleLoginPage() {
  const { role } = useParams<{ role: string }>();
  if (!["patient", "doctor", "admin"].includes(role)) notFound();
  return <LoginForm role={role as Role} />;
}
