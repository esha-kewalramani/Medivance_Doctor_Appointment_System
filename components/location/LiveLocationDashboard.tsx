"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  MapPin,
  Navigation,
  Search,
  RotateCw,
  Building2,
  Stethoscope,
  Pill,
  Activity,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Compass,
  ArrowRight,
  ChevronRight,
  Star,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
  Car,
  Footprints,
  Crosshair,
} from "lucide-react";
import { useApp } from "@/hooks/useApp";

// Predefined medical facility data matching the supplied reference dashboard
export interface HealthcareFacility {
  id: string;
  name: string;
  category: "hospitals" | "doctors" | "pharmacies" | "clinics";
  speciality?: string;
  rating: number;
  reviewsCount?: string;
  distanceKm: number;
  lat: number;
  lng: number;
  address: string;
  status: string;
  image: string;
  phone?: string;
  doctorId?: string; // connects to booking system
}

const DEFAULT_FACILITIES: HealthcareFacility[] = [
  // Hospitals
  {
    id: "hosp-1",
    name: "City Care Hospital",
    category: "hospitals",
    rating: 4.8,
    reviewsCount: "2.5k reviews",
    distanceKm: 1.2,
    lat: 24.869,
    lng: 67.015,
    address: "14 Health Avenue, Saddar, Karachi",
    status: "Open 24/7 • Emergency Care",
    image: "/images/nearby/hosp-citycare.jpg",
    phone: "+92 21 3568 1100",
  },
  {
    id: "hosp-2",
    name: "Medivance Hospital",
    category: "hospitals",
    rating: 4.9,
    reviewsCount: "3.1k reviews",
    distanceKm: 2.1,
    lat: 24.878,
    lng: 67.028,
    address: "Medivance Health Campus, Block 4, Clifton, Karachi",
    status: "Open Now • 24/7 Trauma Center",
    image: "/images/nearby/hosp-medivance.jpg",
    phone: "+92 21 3589 1200",
  },
  {
    id: "hosp-3",
    name: "Elite Medical Center",
    category: "hospitals",
    rating: 4.7,
    reviewsCount: "1.8k reviews",
    distanceKm: 3.4,
    lat: 24.851,
    lng: 67.042,
    address: "88 Shahrah-e-Faisal, Karachi",
    status: "Open Now • Multi-Speciality",
    image: "/images/nearby/hosp-elite.jpg",
    phone: "+92 21 3432 4400",
  },

  // Doctors
  {
    id: "doc-1",
    name: "Dr. Ayesha Khan",
    category: "doctors",
    speciality: "Cardiologist",
    rating: 4.9,
    distanceKm: 1.5,
    lat: 24.872,
    lng: 67.021,
    address: "Cardiology Wing, Medivance Hospital",
    status: "Available Today • 10:00 AM - 1:00 PM",
    image: "/images/nearby/doc-ayesha.jpg",
    doctorId: "d1",
  },
  {
    id: "doc-2",
    name: "Dr. Hassan Raza",
    category: "doctors",
    speciality: "General Physician",
    rating: 4.8,
    distanceKm: 2.3,
    lat: 24.864,
    lng: 67.031,
    address: "City Care Outpatient Clinic",
    status: "Available Today • 2:00 PM - 6:00 PM",
    image: "/images/nearby/doc-hassan.jpg",
    doctorId: "d2",
  },
  {
    id: "doc-3",
    name: "Dr. Sara Ahmed",
    category: "doctors",
    speciality: "Dermatologist",
    rating: 4.7,
    distanceKm: 2.8,
    lat: 24.856,
    lng: 67.037,
    address: "Skin & Laser Center, Elite Medical",
    status: "Available Tomorrow • 11:00 AM - 3:00 PM",
    image: "/images/nearby/doc-sara.jpg",
    doctorId: "d3",
  },

  // Pharmacies
  {
    id: "pharm-1",
    name: "HealthPlus Pharmacy",
    category: "pharmacies",
    rating: 4.8,
    reviewsCount: "940 reviews",
    distanceKm: 1.1,
    lat: 24.867,
    lng: 67.018,
    address: "Main Commercial Area, Block 2, Karachi",
    status: "Open 24 Hours • Free Home Delivery",
    image: "/images/nearby/pharm-healthplus.jpg",
    phone: "+92 21 3537 9900",
  },
  {
    id: "pharm-2",
    name: "CarePlus Chemist",
    category: "pharmacies",
    rating: 4.7,
    reviewsCount: "620 reviews",
    distanceKm: 2.2,
    lat: 24.874,
    lng: 67.033,
    address: "Shop 4, Hospital Road, Karachi",
    status: "Open Now • Closes 12:00 AM",
    image: "/facilities/11.jpg",
    phone: "+92 21 3452 7711",
  },

  // Clinics
  {
    id: "clinic-1",
    name: "Al-Shifa Family Clinic",
    category: "clinics",
    rating: 4.8,
    reviewsCount: "430 reviews",
    distanceKm: 1.4,
    lat: 24.862,
    lng: 67.024,
    address: "Plot 12-C, Medical Lane, Karachi",
    status: "Open Now • General & Pediatric OPD",
    image: "/facilities/04.jpg",
    phone: "+92 21 3521 8899",
  },
  {
    id: "clinic-2",
    name: "Apex Diagnostic Clinic",
    category: "clinics",
    rating: 4.9,
    reviewsCount: "810 reviews",
    distanceKm: 2.9,
    lat: 24.882,
    lng: 67.039,
    address: "Apex Tower, Ground Floor, Karachi",
    status: "Open Now • Ultrasound & Lab Services",
    image: "/facilities/09.jpg",
    phone: "+92 21 3499 6600",
  },
];

// Helper to compute Haversine distance
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export default function LiveLocationDashboard() {
  const { session } = useApp();

  // Location state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [cityName, setCityName] = useState("Karachi, Pakistan");
  const [permissionStatus, setPermissionStatus] = useState<"idle" | "requesting" | "granted" | "denied">("idle");
  const [locationError, setLocationError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "hospitals" | "doctors" | "pharmacies" | "clinics">("all");

  // Map Controls State
  const [mapType, setMapType] = useState<"map" | "satellite">("map");
  const [zoomLevel, setZoomLevel] = useState(14);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<HealthcareFacility | null>(DEFAULT_FACILITIES[1]); // Medivance Hospital preselected
  const [directionsFacility, setDirectionsFacility] = useState<HealthcareFacility | null>(null);

  // Default Karachi Center Coordinates
  const defaultCoords = { lat: 24.8607, lng: 67.0011 };
  const currentCoords = userLocation || defaultCoords;

  // Request user geolocation
  const handleEnableLocation = () => {
    if (!navigator.geolocation) {
      setPermissionStatus("denied");
      setLocationError("Geolocation is not supported by your browser. Using manual location.");
      return;
    }

    setPermissionStatus("requesting");
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setPermissionStatus("granted");
        setCityName("Detected: Nearby Karachi Region");
      },
      (err) => {
        setPermissionStatus("denied");
        let msg = "Location permission was denied. Showing default location.";
        if (err.code === err.POSITION_UNAVAILABLE) msg = "Location information is unavailable.";
        else if (err.code === err.TIMEOUT) msg = "The request to get user location timed out.";
        setLocationError(msg);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  // Recalculate distances based on user location
  const facilities = useMemo(() => {
    if (!userLocation) return DEFAULT_FACILITIES;
    return DEFAULT_FACILITIES.map((fac) => {
      const dist = calculateDistance(userLocation.lat, userLocation.lng, fac.lat, fac.lng);
      return {
        ...fac,
        distanceKm: dist > 0.1 ? dist : fac.distanceKm,
      };
    });
  }, [userLocation]);

  // Filtered facilities
  const filteredFacilities = useMemo(() => {
    return facilities.filter((fac) => {
      const matchesCat = activeCategory === "all" || fac.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        fac.name.toLowerCase().includes(q) ||
        (fac.speciality && fac.speciality.toLowerCase().includes(q)) ||
        fac.address.toLowerCase().includes(q) ||
        fac.category.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [facilities, activeCategory, searchQuery]);

  // Quick subsets
  const nearbyHospitals = useMemo(() => facilities.filter((f) => f.category === "hospitals").slice(0, 3), [facilities]);
  const nearbyDoctors = useMemo(() => facilities.filter((f) => f.category === "doctors").slice(0, 3), [facilities]);
  const nearbyPharmacies = useMemo(() => facilities.filter((f) => f.category === "pharmacies").slice(0, 2), [facilities]);

  const handleRefresh = () => {
    if (userLocation) {
      handleEnableLocation();
    } else {
      setUserLocation(null);
      setPermissionStatus("idle");
      setLocationError(null);
      setSelectedFacility(DEFAULT_FACILITIES[1]);
      setZoomLevel(14);
    }
  };

  return (
    <div className="container-x space-y-6 pt-3 pb-16">
      {/* =========================================================================
          SECTION A: MAIN BANNER (Hospital-and-Phone Supplied Image)
          ========================================================================= */}
      <section className="card relative isolate overflow-hidden !rounded-3xl border border-line/40 bg-surface/40 shadow-lg">
        {/* Full-width banner artwork behind the hero (phone + hospital stay fully visible on the right) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/live-location-hero.jpg" alt="Healthcare Closer to You - Live Medical Location Tracking" className="loc-hero-img absolute inset-0 -z-20 h-full w-full object-cover object-right" />
        <div className="loc-hero-fade absolute inset-0 -z-10" />
        <div className="grid min-h-[300px] items-center gap-6 p-6 sm:p-8 lg:min-h-[340px] lg:grid-cols-12 lg:p-10">
          {/* Left Hero Content */}
          <div className="z-10 flex flex-col justify-center space-y-4 lg:col-span-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary backdrop-blur-md w-fit">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <span>Real-Time Medical GPS Navigation</span>
            </div>

            <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-fg">
              <span className="inline-flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/20 text-primary">
                  <MapPin className="h-7 w-7" />
                </span>
                Live Location
              </span>
            </h1>

            <p className="max-w-xl text-base text-fg/80 sm:text-lg">
              Find nearby hospitals, doctors and healthcare facilities with real-time location services.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={handleEnableLocation}
                disabled={permissionStatus === "requesting"}
                className="btn-primary !rounded-full !px-6 !py-3 shadow-md inline-flex items-center gap-2"
              >
                <Compass className={`h-4 w-4 ${permissionStatus === "requesting" ? "animate-spin" : ""}`} />
                <span>
                  {permissionStatus === "requesting"
                    ? "Locating You..."
                    : permissionStatus === "granted"
                    ? "Update Location"
                    : "Enable Location"}
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>

              {permissionStatus === "granted" && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ok bg-ok/10 px-3 py-1.5 rounded-full border border-ok/30">
                  <CheckCircle2 className="h-3.5 w-3.5" /> GPS Active
                </span>
              )}
            </div>

            {/* Permission feedback / notice */}
            {locationError && (
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-warn/30 bg-warn/10 px-3 py-2 text-xs text-warn">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{locationError}</span>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* =========================================================================
          CONTROL & FILTER BAR (Matching Reference Image)
          ========================================================================= */}
      <section className="card !rounded-2xl p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: Your Location Indicator */}
          <div className="flex items-center gap-2.5 rounded-xl border border-line/50 bg-surface/60 px-3.5 py-2.5 sm:min-w-[240px]">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-ok" />
            </span>
            <div className="flex-1 min-w-0">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted">Your Location</span>
              <p className="truncate text-xs font-bold text-fg sm:text-sm">{cityName}</p>
            </div>
            <button
              onClick={handleEnableLocation}
              title="Detect my current location"
              className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition"
            >
              <Navigation className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Center: Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hospitals, doctors or specialities..."
              className="input pl-10 pr-8 !py-2 text-xs sm:text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Right: Category Filters & Refresh */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {[
              { id: "all", label: "All", icon: Layers },
              { id: "hospitals", label: "Hospitals", icon: Building2 },
              { id: "doctors", label: "Doctors", icon: Stethoscope },
              { id: "pharmacies", label: "Pharmacies", icon: Pill },
              { id: "clinics", label: "Clinics", icon: Activity },
            ].map(({ id, label, icon: Icon }) => {
              const active = activeCategory === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveCategory(id as any)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    active
                      ? "bg-primary text-primary-fg shadow-sm"
                      : "border border-line/50 bg-surface/50 text-muted hover:bg-primary/10 hover:text-fg"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{label}</span>
                </button>
              );
            })}

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              title="Reset view and reload distances"
              className="inline-flex items-center gap-1 rounded-xl border border-line/50 bg-surface/50 px-3 py-2 text-xs font-semibold text-muted transition hover:bg-primary/10 hover:text-fg ml-auto sm:ml-0"
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          MAIN 3-COLUMN DASHBOARD GRID (Matching Reference Image)
          ========================================================================= */}
      <section className="grid gap-6 lg:grid-cols-12">
        {/* -----------------------------------------------------------------------
            LEFT COLUMN: Nearby Hospitals (Cards)
            ----------------------------------------------------------------------- */}
        <aside className="space-y-4 lg:col-span-3">
          <div className="flex items-center justify-between pb-1">
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Nearby Hospitals
            </h2>
            <span className="text-xs text-muted">{nearbyHospitals.length} Found</span>
          </div>

          <div className="space-y-3">
            {nearbyHospitals.map((hosp) => {
              const isSelected = selectedFacility?.id === hosp.id;
              return (
                <article
                  key={hosp.id}
                  onClick={() => setSelectedFacility(hosp)}
                  className={`card card-hover cursor-pointer overflow-hidden !rounded-2xl p-3 border transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-md ring-1 ring-primary/40"
                      : "border-line/40 hover:border-line"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Thumbnail */}
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-line/50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={hosp.image} alt={hosp.name} className="h-full w-full object-cover" />
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-sm text-fg">{hosp.name}</h3>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                        <span className="flex items-center gap-1 font-medium text-amber-500">
                          <Star className="h-3 w-3 fill-amber-500" />
                          {hosp.rating}
                        </span>
                        <span className="truncate">({hosp.reviewsCount})</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] font-semibold text-primary">
                        <MapPin className="h-3 w-3" />
                        <span>{hosp.distanceKm} km</span>
                      </div>
                    </div>

                    {/* Arrow Action */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFacility(hosp);
                        setDirectionsFacility(hosp);
                      }}
                      title="View on map and get directions"
                      className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-primary hover:bg-primary hover:text-primary-fg transition shrink-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="pt-1">
            <button
              onClick={() => setActiveCategory("hospitals")}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-line/50 bg-surface/40 py-2.5 text-xs font-semibold text-muted hover:bg-primary/10 hover:text-primary transition"
            >
              <span>View All Nearby Hospitals</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </aside>

        {/* -----------------------------------------------------------------------
            CENTER COLUMN: Interactive Map (With Satellite, Zoom, Location, Routes)
            ----------------------------------------------------------------------- */}
        <main className={`relative ${isFullscreen ? "fixed inset-0 z-50 p-4 bg-bg" : "lg:col-span-6"}`}>
          <div className="card relative h-[480px] sm:h-[540px] w-full overflow-hidden !rounded-3xl border border-line/50 shadow-md">
            {/* Map Canvas Background (Simulated street / satellite cartography) */}
            <div
              className={`absolute inset-0 transition-all duration-500 ${
                mapType === "satellite"
                  ? "bg-[#112233]"
                  : "bg-gradient-to-br from-[#e8f1f5] via-[#dce8ee] to-[#d0dfe8] dark:from-[#0a1832] dark:via-[#0c1f40] dark:to-[#08152c]"
              }`}
            >
              {/* Map grid lines & stylized road networks */}
              <svg className="h-full w-full opacity-60" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="roadPattern" width="120" height="120" patternUnits="userSpaceOnUse">
                    <path
                      d="M 0 60 L 120 60 M 60 0 L 60 120 M 0 0 L 120 120 M 0 120 L 120 0"
                      stroke={mapType === "satellite" ? "#1e3a5f" : "#a8c0d2"}
                      strokeWidth="1.5"
                      strokeDasharray="6 4"
                      className="dark:stroke-[#1b3460]"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="25"
                      fill="none"
                      stroke={mapType === "satellite" ? "#224269" : "#bcd2e0"}
                      strokeWidth="1"
                      className="dark:stroke-[#1c3969]"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#roadPattern)" />
              </svg>

              {/* Coastline / water body curve matching Karachi coastline in reference */}
              <div
                className="absolute inset-y-0 left-0 w-2/5 opacity-40 pointer-events-none"
                style={{
                  background:
                    mapType === "satellite"
                      ? "radial-gradient(ellipse at 0% 50%, #0d274c 0%, transparent 80%)"
                      : "radial-gradient(ellipse at 0% 50%, #89c0e2 0%, transparent 80%)",
                }}
              />
            </div>

            {/* Top Left: Map / Satellite Controls */}
            <div className="absolute top-4 left-4 z-20 flex items-center rounded-xl border border-line/60 bg-surface/85 p-1 shadow-md backdrop-blur-md">
              <button
                onClick={() => setMapType("map")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  mapType === "map"
                    ? "bg-primary text-primary-fg shadow-sm"
                    : "text-muted hover:text-fg"
                }`}
              >
                Map
              </button>
              <button
                onClick={() => setMapType("satellite")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  mapType === "satellite"
                    ? "bg-primary text-primary-fg shadow-sm"
                    : "text-muted hover:text-fg"
                }`}
              >
                Satellite
              </button>
            </div>

            {/* Top Right: Fullscreen Toggle */}
            <div className="absolute top-4 right-4 z-20">
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
                className="grid h-9 w-9 place-items-center rounded-xl border border-line/60 bg-surface/85 text-muted shadow-md backdrop-blur-md hover:text-fg transition"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
            </div>

            {/* Interactive Pins Placed on Map */}
            <div className="relative h-full w-full">
              {/* User Current Location Pin with Beacon Ripple */}
              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer"
                style={{ left: "48%", top: "50%" }}
                onClick={() => {
                  setCityName("Your Current Position");
                }}
              >
                <div className="relative flex items-center justify-center">
                  <span className="absolute h-14 w-14 animate-ping rounded-full bg-sky-400/30" />
                  <span className="absolute h-9 w-9 rounded-full bg-primary/20 ring-2 ring-primary/40" />
                  <span className="relative grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-fg shadow-lg">
                    <Crosshair className="h-4 w-4" />
                  </span>
                </div>
                <span className="mt-1 block rounded-md bg-black/75 px-1.5 py-0.5 text-[9px] font-bold text-white text-center shadow">
                  You
                </span>
              </div>

              {/* Route connecting user to selected facility */}
              {selectedFacility && (
                <svg className="absolute inset-0 h-full w-full pointer-events-none z-10" fill="none">
                  <line
                    x1="48%"
                    y1="50%"
                    x2={
                      selectedFacility.id === "hosp-2"
                        ? "68%"
                        : selectedFacility.id === "hosp-1"
                        ? "24%"
                        : selectedFacility.id === "doc-1"
                        ? "26%"
                        : "70%"
                    }
                    y2={
                      selectedFacility.id === "hosp-2"
                        ? "28%"
                        : selectedFacility.id === "hosp-1"
                        ? "34%"
                        : selectedFacility.id === "doc-1"
                        ? "68%"
                        : "64%"
                    }
                    stroke="#0284c7"
                    strokeWidth="3.5"
                    strokeDasharray="6 4"
                    className="animate-pulse"
                  />
                </svg>
              )}

              {/* Pin 1: Medivance Hospital (Top-Right) */}
              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
                style={{ left: "68%", top: "28%" }}
                onClick={() => setSelectedFacility(DEFAULT_FACILITIES[1])}
              >
                <div className="relative flex flex-col items-center">
                  <span className={`grid h-8 w-8 place-items-center rounded-full bg-blue-600 text-white shadow-lg ring-2 ring-white/60 transition group-hover:scale-110 ${selectedFacility?.id === "hosp-2" ? "ring-4 ring-primary scale-110 shadow-glow" : ""}`}>
                    <Building2 className="h-4 w-4" />
                  </span>
                  <span className={`mt-1 rounded-md px-2 py-0.5 text-[10px] font-bold shadow border transition ${selectedFacility?.id === "hosp-2" ? "bg-primary text-primary-fg border-primary shadow-glow" : "bg-surface/90 border-line/40"}`}>
                    Medivance Hospital
                  </span>
                </div>
              </div>

              {/* Pin 2: City Care Hospital (Top-Left) */}
              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
                style={{ left: "24%", top: "34%" }}
                onClick={() => setSelectedFacility(DEFAULT_FACILITIES[0])}
              >
                <div className="relative flex flex-col items-center">
                  <span className={`grid h-7 w-7 place-items-center rounded-full bg-blue-500 text-white shadow-md ring-2 ring-white/60 transition group-hover:scale-110 ${selectedFacility?.id === "hosp-1" ? "ring-4 ring-primary scale-110 shadow-glow" : ""}`}>
                    <Building2 className="h-3.5 w-3.5" />
                  </span>
                  <span className={`mt-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold shadow border transition ${selectedFacility?.id === "hosp-1" ? "bg-primary text-primary-fg border-primary shadow-glow" : "bg-surface/90 border-line/40"}`}>
                    City Care
                  </span>
                </div>
              </div>

              {/* Pin 3: Dr. Ayesha Khan (Bottom-Left) */}
              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
                style={{ left: "26%", top: "68%" }}
                onClick={() => setSelectedFacility(DEFAULT_FACILITIES[3])}
              >
                <div className="relative flex flex-col items-center">
                  <span className={`grid h-7 w-7 place-items-center rounded-full bg-rose-500 text-white shadow-md ring-2 ring-white/60 transition group-hover:scale-110 ${selectedFacility?.id === "doc-1" ? "ring-4 ring-primary scale-110 shadow-glow" : ""}`}>
                    <Stethoscope className="h-3.5 w-3.5" />
                  </span>
                  <span className={`mt-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold shadow border transition ${selectedFacility?.id === "doc-1" ? "bg-primary text-primary-fg border-primary shadow-glow" : "bg-surface/90 border-line/40"}`}>
                    Dr. Ayesha
                  </span>
                </div>
              </div>

              {/* Pin 4: HealthPlus Pharmacy (Bottom-Right) */}
              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
                style={{ left: "70%", top: "64%" }}
                onClick={() => setSelectedFacility(DEFAULT_FACILITIES[6])}
              >
                <div className="relative flex flex-col items-center">
                  <span className={`grid h-7 w-7 place-items-center rounded-full bg-emerald-500 text-white shadow-md ring-2 ring-white/60 transition group-hover:scale-110 ${selectedFacility?.id === "pharm-1" ? "ring-4 ring-primary scale-110 shadow-glow" : ""}`}>
                    <Pill className="h-3.5 w-3.5" />
                  </span>
                  <span className={`mt-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold shadow border transition ${selectedFacility?.id === "pharm-1" ? "bg-primary text-primary-fg border-primary shadow-glow" : "bg-surface/90 border-line/40"}`}>
                    HealthPlus
                  </span>
                </div>
              </div>

              {/* Active Marker Card (Docked cleanly at bottom, leaving zoom controls free, zero clipping) */}
              {selectedFacility && (
                <div
                  className="absolute z-30 animate-fadeUp bottom-3 left-3 right-16 sm:right-auto sm:w-80 sm:bottom-4 sm:left-4"
                >
                  <div className="card !rounded-2xl p-3 sm:p-3.5 shadow-2xl border border-primary/50 bg-surface/95 backdrop-blur-md">
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-line/50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={selectedFacility.image} alt={selectedFacility.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs sm:text-sm text-fg truncate">{selectedFacility.name}</p>
                          <p className="text-[11px] text-muted flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className="font-semibold text-primary">{selectedFacility.distanceKm} km</span>
                            <span>•</span>
                            <span className="text-ok font-medium">Open Now</span>
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedFacility(null)}
                        className="grid h-6 w-6 place-items-center rounded-lg text-muted hover:bg-primary/10 hover:text-fg text-xs transition shrink-0"
                        aria-label="Close"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="mt-2.5 flex items-center gap-2">
                      <button
                        onClick={() => setDirectionsFacility(selectedFacility)}
                        className="btn-primary !py-1.5 !px-3 !text-xs flex-1 inline-flex items-center justify-center gap-1.5"
                      >
                        <Navigation className="h-3.5 w-3.5" />
                        <span>Directions</span>
                      </button>
                      {selectedFacility.phone && (
                        <a
                          href={`tel:${selectedFacility.phone}`}
                          className="btn-ghost !py-1.5 !px-2.5 !text-xs text-ok hover:bg-ok/10 shrink-0"
                          title={`Call ${selectedFacility.name}`}
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {selectedFacility.doctorId && (
                        <Link
                          href={`/patient/book?doctor=${selectedFacility.doctorId}`}
                          className="btn-ghost !py-1.5 !px-3 !text-xs text-primary shrink-0"
                        >
                          Book
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Right: Zoom & Center GPS Controls */}
            <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1.5 rounded-xl border border-line/60 bg-surface/85 p-1 shadow-md backdrop-blur-md">
              <button
                onClick={() => setZoomLevel((z) => Math.min(18, z + 1))}
                title="Zoom In"
                className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-primary/15 hover:text-fg transition"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(10, z - 1))}
                title="Zoom Out"
                className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-primary/15 hover:text-fg transition"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <div className="h-[1px] bg-line/40 my-0.5" />
              <button
                onClick={handleEnableLocation}
                title="Center on My Location"
                className="grid h-8 w-8 place-items-center rounded-lg text-primary hover:bg-primary/20 transition"
              >
                <Crosshair className="h-4 w-4" />
              </button>
            </div>
          </div>
        </main>

        {/* -----------------------------------------------------------------------
            RIGHT COLUMN: Nearby Doctors & Nearby Pharmacies (Matching Reference)
            ----------------------------------------------------------------------- */}
        <aside className="space-y-5 lg:col-span-3">
          {/* Nearby Doctors Card */}
          <div className="card !rounded-2xl p-4 border border-line/40 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h2 className="font-display text-sm font-bold flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-primary" />
                Nearby Doctors
              </h2>
              <Link
                href="/doctors"
                className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-0.5"
              >
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {nearbyDoctors.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between gap-3 border-b border-line/30 pb-2.5 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Doctor Photo */}
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-primary/30 ring-1 ring-primary/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={doc.image} alt={doc.name} className="h-full w-full object-cover" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-fg">{doc.name}</p>
                      <p className="truncate text-[11px] text-muted">{doc.speciality}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted">
                        <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                          <Star className="h-2.5 w-2.5 fill-amber-500" />
                          {doc.rating}
                        </span>
                        <span>•</span>
                        <span className="text-primary font-medium">{doc.distanceKm} km</span>
                      </div>
                    </div>
                  </div>

                  {/* Connects to existing booking wizard */}
                  <Link
                    href={`/patient/book?doctor=${doc.doctorId || "d1"}`}
                    className="btn-primary !rounded-lg !px-3 !py-1.5 !text-xs shrink-0"
                  >
                    Book
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Nearby Pharmacies & Clinics Card */}
          <div className="card !rounded-2xl p-4 border border-line/40 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h2 className="font-display text-sm font-bold flex items-center gap-2">
                <Pill className="h-4 w-4 text-emerald-500" />
                Nearby Pharmacies
              </h2>
              <button
                onClick={() => setActiveCategory("pharmacies")}
                className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-0.5"
              >
                View All <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="space-y-3">
              {nearbyPharmacies.map((pharm) => (
                <div key={pharm.id} className="flex items-center justify-between gap-3 border-b border-line/30 pb-2.5 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-line/50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={pharm.image} alt={pharm.name} className="h-full w-full object-cover" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-fg">{pharm.name}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted">
                        <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                          <Star className="h-2.5 w-2.5 fill-amber-500" />
                          {pharm.rating}
                        </span>
                        <span>•</span>
                        <span className="text-primary font-medium">{pharm.distanceKm} km</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedFacility(pharm);
                      setDirectionsFacility(pharm);
                    }}
                    className="btn-ghost !rounded-lg !px-3 !py-1.5 !text-xs shrink-0 text-emerald-500 hover:bg-emerald-500/10"
                  >
                    Visit
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      {/* =========================================================================
          SECTION H: BOTTOM FEATURE STRIP (Matching Reference Image)
          ========================================================================= */}
      <section className="grid gap-4 md:grid-cols-12 items-stretch">
        {/* 4 Feature Items */}
        <div className="card !rounded-2xl p-4 md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <MapPin className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold text-fg">Real-Time</p>
              <p className="text-[11px] text-muted">Location Tracking</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <Building2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold text-fg">Find Nearest</p>
              <p className="text-[11px] text-muted">Hospitals & Doctors</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <Navigation className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold text-fg">Get Directions</p>
              <p className="text-[11px] text-muted">Instantly</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold text-fg">Safe & Secure</p>
              <p className="text-[11px] text-muted">Navigation</p>
            </div>
          </div>
        </div>

        {/* Cyber Neon Healthcare Priority Banner */}
        <div className="card cyber-priority-card !rounded-2xl p-4 md:col-span-4 bg-gradient-to-r from-[#031533] via-[#062452] to-[#041a3d] border border-sky-400/40 text-white flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-sky-500/20 text-sky-400 ring-2 ring-sky-400/30">
              <Activity className="h-5 w-5 animate-pulse" />
            </span>
            <div>
              <p className="text-xs font-extrabold tracking-wide text-sky-200">Your Health, Our Priority</p>
              <p className="text-[11px] text-sky-300/80">Find care. Get there. Feel better.</p>
            </div>
          </div>

          {/* Glowing ECG heartbeat mini icon */}
          <svg viewBox="0 0 60 20" className="h-6 w-14 text-sky-400 opacity-80" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M0 10h18l3-6 4 12 4-9 3 3h28" />
          </svg>
        </div>
      </section>

      {/* Safety Notice & Sample Data Disclaimer */}
      <div className="rounded-xl border border-line/30 bg-surface/30 px-4 py-3 text-center text-xs text-muted">
        <p>
          <span className="font-semibold text-fg">Sample Healthcare Directory:</span> Demonstrative medical facility listings. For acute life-threatening medical emergencies, dial your local emergency services (1122 / 911) directly.
        </p>
      </div>

      {/* =========================================================================
          DIRECTIONS MODAL (Step-by-step route and map launcher)
          ========================================================================= */}
      {directionsFacility && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeUp">
          <div className="card !rounded-3xl p-6 max-w-lg w-full border border-line/60 bg-surface shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary uppercase tracking-wider">
                  <Navigation className="h-3.5 w-3.5" /> Route Navigation
                </span>
                <h3 className="font-display text-xl font-bold mt-1 text-fg">Directions to {directionsFacility.name}</h3>
                <p className="text-xs text-muted">{directionsFacility.address}</p>
              </div>
              <button
                onClick={() => setDirectionsFacility(null)}
                className="grid h-8 w-8 place-items-center rounded-full bg-surface text-muted hover:text-fg border border-line/40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Travel stats */}
            <div className="grid grid-cols-3 gap-2 rounded-2xl border border-line/50 bg-primary/5 p-3 text-center">
              <div>
                <span className="block text-[10px] uppercase font-semibold text-muted">Total Distance</span>
                <span className="font-bold text-sm text-primary">{directionsFacility.distanceKm} km</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-semibold text-muted flex items-center justify-center gap-1">
                  <Car className="h-3 w-3" /> By Car
                </span>
                <span className="font-bold text-sm text-fg">~{Math.max(4, Math.round(directionsFacility.distanceKm * 2.8))} mins</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-semibold text-muted flex items-center justify-center gap-1">
                  <Footprints className="h-3 w-3" /> Walking
                </span>
                <span className="font-bold text-sm text-fg">~{Math.round(directionsFacility.distanceKm * 13)} mins</span>
              </div>
            </div>

            {/* Step by step directions */}
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/20 text-primary font-bold text-[10px]">1</span>
                <div>
                  <p className="font-semibold text-fg">Depart from your current location</p>
                  <p className="text-muted text-[11px]">Head toward the nearest main arterial avenue.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/20 text-primary font-bold text-[10px]">2</span>
                <div>
                  <p className="font-semibold text-fg">Continue along Medical Express Boulevard</p>
                  <p className="text-muted text-[11px]">Drive for {Math.round(directionsFacility.distanceKm * 0.7 * 10) / 10} km following signs toward healthcare corridor.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/20 text-primary font-bold text-[10px]">3</span>
                <div>
                  <p className="font-semibold text-fg">Turn into {directionsFacility.name} access ramp</p>
                  <p className="text-muted text-[11px]">Clear signage for Emergency and Outpatient Parking is available on your right.</p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${directionsFacility.lat},${directionsFacility.lng}`}
                target="_blank"
                rel="noreferrer"
                className="btn-primary !rounded-xl text-xs inline-flex items-center justify-center gap-1.5"
              >
                <span>Google Maps</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <button
                onClick={() => setDirectionsFacility(null)}
                className="btn-ghost !rounded-xl text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
