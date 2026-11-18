export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
export const isPhone = (v: string) => /^\+?[0-9\s-]{10,15}$/.test(v.trim());
export const passwordIssue = (v: string): string | null => {
  if (v.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(v) || !/[0-9]/.test(v)) return "Use letters and numbers in your password.";
  return null;
};

export type Errors<T extends string = string> = Partial<Record<T, string>>;

export function validatePatient(f: { name: string; email: string; phone: string; dob: string; gender: string; password?: string; confirm?: string }, withPassword = true) {
  const e: Errors = {};
  if (f.name.trim().length < 3) e.name = "Enter your full name (min 3 letters).";
  if (!isEmail(f.email)) e.email = "Enter a valid email address.";
  if (!isPhone(f.phone)) e.phone = "Enter a valid phone number (10-15 digits).";
  if (!f.dob) e.dob = "Select your date of birth.";
  else if (new Date(f.dob) > new Date()) e.dob = "Date of birth cannot be in the future.";
  if (!f.gender) e.gender = "Select a gender.";
  if (withPassword) {
    const p = passwordIssue(f.password || "");
    if (p) e.password = p;
    if ((f.password || "") !== (f.confirm || "")) e.confirm = "Passwords do not match.";
  }
  return e;
}
