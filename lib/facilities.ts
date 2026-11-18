import { BedDouble, Building2, ConciergeBell, FlaskConical, HeartPulse, Leaf, Pill, ScanLine, Scissors, Siren, Stethoscope, Users, Baby, Activity, LucideIcon } from "lucide-react";

export interface Facility { id: string; title: string; short: string; desc: string; img: string; icon: LucideIcon }

const f = (n: number, id: string, title: string, short: string, icon: LucideIcon, desc: string): Facility => ({ id, title, short, desc, icon, img: `/facilities/${String(n).padStart(2, "0")}.jpg` });

export const FACILITIES: Facility[] = [
  f(1, "exterior", "Hospital Exterior", "Hospital Exterior", Building2, "Wide establishing view, modern glass façade, clear entrance, landscaped approach and welcoming arrival experience."),
  f(2, "reception", "Main Reception", "Main Reception", ConciergeBell, "Bright reception desk, clean architectural finishes, clear circulation and a professional welcome point."),
  f(3, "lounge", "Patient Waiting Lounge", "Waiting Lounge", Users, "Comfortable seating, daylight, calm colours, accessible circulation and a relaxed patient atmosphere."),
  f(4, "consultation", "Doctor Consultation Room", "Consultation Room", Stethoscope, "Private consultation setting with desk, examination area, medical equipment and a reassuring clinical feel."),
  f(5, "patient-room", "Private Patient Room", "Patient Room", BedDouble, "Clean patient bed, bedside equipment, natural light, storage and comfortable visitor space."),
  f(6, "emergency", "Emergency Department", "Emergency Department", Siren, "Clearly identifiable urgent-care entrance and organised clinical environment."),
  f(7, "icu", "Intensive Care Unit", "Intensive Care Unit", HeartPulse, "Monitored patient beds, clinical equipment, clean layout and calm lighting."),
  f(8, "theatre", "Operating Theatre", "Operating Theatre", Scissors, "Sterile operating room, surgical lighting, equipment and uncluttered clinical workflow."),
  f(9, "imaging", "Diagnostic Imaging / MRI", "Diagnostic Imaging", ScanLine, "Imaging suite with scanner, patient access and a clean diagnostic environment."),
  f(10, "laboratory", "Medical Laboratory", "Medical Laboratory", FlaskConical, "Bright laboratory benches, sample-processing equipment and organised workstations."),
  f(11, "pharmacy", "Hospital Pharmacy", "Hospital Pharmacy", Pill, "Organised medicine shelving, dispensing counter and clear, well-lit service area."),
  f(12, "pediatric", "Pediatric Department", "Pediatric Department", Baby, "Child-friendly colours, welcoming seating and a gentle, reassuring environment."),
  f(13, "maternity", "Maternity Department", "Maternity Department", BedDouble, "Warm, private room design with patient bed, seating and family-friendly comfort."),
  f(14, "physio", "Physiotherapy & Rehabilitation", "Physiotherapy & Rehab", Activity, "Open treatment space, rehabilitation equipment and accessible movement areas."),
  f(15, "garden", "Healing Garden", "Healing Garden", Leaf, "Landscaped outdoor courtyard, greenery, walking paths and quiet restorative seating."),
];
