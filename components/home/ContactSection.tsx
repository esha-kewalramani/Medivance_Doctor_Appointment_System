import { Mail, MapPin, Phone } from "lucide-react";
import ContactForm from "@/components/forms/ContactForm";

export default function ContactSection() {
  return (
    <section id="contact" className="container-x mt-20 scroll-mt-28">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col justify-center">
          <p className="eyebrow">Contact</p>
          <h2 className="section-title mt-2">We are here to help</h2>
          <p className="mt-3 max-w-md text-muted">Questions about appointments, doctors or your account? Send us a message and our support team will get back to you.</p>
          <ul className="mt-6 space-y-3 text-sm">
            <li className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary"><Phone className="h-5 w-5" /></span> +92 300 123 4567</li>
            <li className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary"><Mail className="h-5 w-5" /></span> info@medivance.pk</li>
            <li className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary"><MapPin className="h-5 w-5" /></span> Hyderabad, Sindh, Pakistan</li>
          </ul>
        </div>
        <ContactForm />
      </div>
    </section>
  );
}
