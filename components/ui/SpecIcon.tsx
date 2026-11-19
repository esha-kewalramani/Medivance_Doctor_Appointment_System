import { Baby, Bone, Brain, Eye, Flower2, HeartPulse, Smile, Sparkles, Stethoscope, LucideProps } from "lucide-react";
import { ComponentType } from "react";

const MAP: Record<string, ComponentType<LucideProps>> = { HeartPulse, Sparkles, Brain, Baby, Bone, Smile, Stethoscope, Flower2, Eye };
export default function SpecIcon({ name, ...p }: { name: string } & LucideProps) {
  const I = MAP[name] || Stethoscope;
  return <I {...p} />;
}
