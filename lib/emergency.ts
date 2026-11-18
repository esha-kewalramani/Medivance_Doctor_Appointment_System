// Emergency data. Hospitals mirror the ones on the Live Location page (same names, phones and coordinates).
export interface EmergencyHospital { id: string; name: string; address: string; phone: string; lat: number; lng: number; note: string }

export const AMBULANCES = [
  { id: "edhi", name: "Edhi Ambulance", number: "115" },
  { id: "rescue", name: "Rescue 1122", number: "1122" },
  { id: "chhipa", name: "Chhipa Ambulance", number: "1020" },
  { id: "aman", name: "Aman Ambulance", number: "1219" },
  { id: "police", name: "Police Emergency", number: "15" },
];

export const EMERGENCY_HOSPITALS: EmergencyHospital[] = [
  { id: "hosp-1", name: "City Care Hospital", address: "14 Health Avenue, Saddar, Karachi", phone: "+92 21 3568 1100", lat: 24.869, lng: 67.015, note: "Open 24/7 - Emergency Care" },
  { id: "hosp-2", name: "Medivance Hospital", address: "Medivance Health Campus, Block 4, Clifton, Karachi", phone: "+92 21 3589 1200", lat: 24.878, lng: 67.028, note: "Open Now - 24/7 Trauma Center" },
  { id: "hosp-3", name: "Elite Medical Center", address: "88 Shahrah-e-Faisal, Karachi", phone: "+92 21 3432 4400", lat: 24.851, lng: 67.042, note: "Open Now - Multi-Speciality" },
];

export const DEFAULT_CENTER = { lat: 24.8607, lng: 67.0011 }; // Karachi, same default as the Live Location page

export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371, rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(bLat - aLat), dLng = rad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)) * 10) / 10;
}

export const telHref = (n: string) => `tel:${n.replace(/[^\d+]/g, "")}`;
export const directionsHref = (h: { lat: number; lng: number }) => `https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}`;
