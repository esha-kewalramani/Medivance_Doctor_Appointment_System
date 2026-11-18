"use client";
import { useState } from "react";
import { Send } from "lucide-react";
import { isEmail } from "@/lib/validation";
import { toast } from "@/components/notifications/alerts";
import { useApp } from "@/hooks/useApp";

export default function ContactForm() {
  const { notify } = useApp();
  const [f, setF] = useState({ name: "", email: "", message: "" });
  const [e, setE] = useState<Record<string, string>>({});
  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().length < 2) er.name = "Please enter your name.";
    if (!isEmail(f.email)) er.email = "Enter a valid email address.";
    if (f.message.trim().length < 10) er.message = "Message must be at least 10 characters.";
    setE(er);
    if (Object.keys(er).length) { toast("error", "Please fix the highlighted fields"); return; }
    notify({ role: "admin", title: "New contact message", body: `${f.name} (${f.email}): ${f.message.slice(0, 80)}` });
    toast("success", "Message sent", "Our team will reply to your email soon.");
    setF({ name: "", email: "", message: "" });
  };
  return (
    <form onSubmit={submit} className="card space-y-4 p-5 sm:p-6" noValidate>
      <div><label className="label" htmlFor="c-name">Name</label><input id="c-name" className="input" value={f.name} onChange={(x) => setF({ ...f, name: x.target.value })} />{e.name && <p className="err">{e.name}</p>}</div>
      <div><label className="label" htmlFor="c-email">Email</label><input id="c-email" type="email" className="input" value={f.email} onChange={(x) => setF({ ...f, email: x.target.value })} />{e.email && <p className="err">{e.email}</p>}</div>
      <div><label className="label" htmlFor="c-msg">Message</label><textarea id="c-msg" rows={4} className="input" value={f.message} onChange={(x) => setF({ ...f, message: x.target.value })} />{e.message && <p className="err">{e.message}</p>}</div>
      <button className="btn-primary w-full"><Send className="h-4 w-4" /> Send message</button>
    </form>
  );
}
