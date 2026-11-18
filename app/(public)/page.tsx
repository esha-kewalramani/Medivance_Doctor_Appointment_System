import { AmbianceGallery, Departments, HomeHero, PatientJourney, WorldClassFacilities } from "@/components/home/Experience";
import Stats from "@/components/home/Stats";
import Specializations from "@/components/home/Specializations";
import FeaturedDoctors from "@/components/home/FeaturedDoctors";
import HowItWorks from "@/components/home/HowItWorks";
import WhyChoose from "@/components/home/WhyChoose";
import Testimonials from "@/components/home/Testimonials";
import ContactSection from "@/components/home/ContactSection";

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <AmbianceGallery />
      <Departments />
      <WorldClassFacilities />
      <PatientJourney />
      <Stats />
      <Specializations />
      <FeaturedDoctors />
      <HowItWorks />
      <WhyChoose />
      <Testimonials />
      <ContactSection />
    </>
  );
}
