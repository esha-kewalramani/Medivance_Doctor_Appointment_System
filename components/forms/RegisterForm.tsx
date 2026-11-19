"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { useApp } from "@/hooks/useApp";
import { useQueryParam } from "@/hooks/useQueryParam";
import { validatePatient, Errors } from "@/lib/validation";
import { toast } from "@/components/notifications/alerts";

export default function RegisterForm() {
  const router = useRouter();
  const { registerPatient, login } = useApp();
  const qName = useQueryParam("name");
  const qEmail = useQueryParam("email");
  const qPhone = useQueryParam("phone");

  const [f, setF] = useState({ name: "", email: "", phone: "", dob: "", gender: "", password: "", confirm: "" });
  const [e, setE] = useState<Errors>({});
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (qName || qEmail || qPhone) {
      setF((prev) => ({
        ...prev,
        name: qName || prev.name,
        email: qEmail || prev.email,
        phone: qPhone || prev.phone,
      }));
    }
  }, [qName, qEmail, qPhone]);
  const set = (k: keyof typeof f) => (ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: ev.target.value });

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const er = validatePatient(f);
    setE(er);
    if (Object.keys(er).length) { toast("error", "Please fix the highlighted fields"); return; }
    const r = await registerPatient({ name: f.name.trim(), email: f.email, phone: f.phone.trim(), dob: f.dob, gender: f.gender as "Male" | "Female" | "Other", password: f.password });
    if (!r.ok) { setE({ email: r.error }); toast("error", "Registration failed", r.error); return; }
    await login("patient", f.email, f.password, true);
    // Fire toast and navigate simultaneously — toast is visible during page transition.
    toast("success", "Account created", "Welcome to MEDIVANCE!");
    router.push("/patient");
  };

  const Field = ({ k, label, type = "text", ph }: { k: keyof typeof f; label: string; type?: string; ph?: string }) => (
    <div><label className="label" htmlFor={k}>{label}</label><input id={k} type={type} className="input" value={f[k]} onChange={set(k)} placeholder={ph} max={k === "dob" ? new Date().toISOString().slice(0, 10) : undefined} />{e[k] && <p className="err">{e[k]}</p>}</div>
  );

  return (
    <div className="container-x flex justify-center py-10">
      <div className="card w-full max-w-2xl p-6 sm:p-8">
        <div className="mb-6 text-center"><h1 className="font-display text-3xl font-bold">Create patient account</h1><p className="mt-1 text-sm text-muted">Join MEDIVANCE to book and manage your appointments.</p></div>
        <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">{Field({ k: "name", label: "Full name", ph: "Your name here" })}</div>
          {Field({ k: "email", label: "Email address", type: "email", ph: "you@example.com" })}
          {Field({ k: "phone", label: "Phone number", type: "tel", ph: "+92 3XX XXXXXXX" })}
          {Field({ k: "dob", label: "Date of birth", type: "date" })}
          <div><label className="label" htmlFor="gender">Gender</label>
            <select id="gender" className="input" value={f.gender} onChange={set("gender")}><option value="">Select</option><option>Female</option><option>Male</option><option>Other</option></select>{e.gender && <p className="err">{e.gender}</p>}</div>
          <div><label className="label" htmlFor="password">Password</label>
            <div className="relative"><input id="password" type={show ? "text" : "password"} className="input pr-10" value={f.password} onChange={set("password")} placeholder="Min 8 chars, letters + numbers" />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted" aria-label="Toggle password visibility">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
            {e.password && <p className="err">{e.password}</p>}</div>
          {Field({ k: "confirm", label: "Confirm password", type: show ? "text" : "password" })}
          <button className="btn-primary !py-3 sm:col-span-2"><UserPlus className="h-4 w-4" /> Create account</button>
        </form>
        <p className="mt-4 text-center text-sm text-muted">Already registered? <Link href="/login/patient" className="font-semibold text-primary hover:underline">Sign in</Link></p>
      </div>
    </div>
  );
}
