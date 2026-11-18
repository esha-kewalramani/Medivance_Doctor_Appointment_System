"use client";
import { ReactNode } from "react";
import { ResponsiveContainer } from "recharts";

export default function ChartCard({ title, subtitle, children, height = 260, className = "" }: { title: string; subtitle?: string; children: ReactNode; height?: number; className?: string }) {
  return (
    <div className={`card p-4 sm:p-5 ${className}`}>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {subtitle && <p className="mb-3 text-xs text-muted">{subtitle}</p>}
      <div style={{ height }} className="mt-2 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">{children as React.ReactElement}</ResponsiveContainer>
      </div>
    </div>
  );
}
