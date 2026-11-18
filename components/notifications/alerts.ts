"use client";
// SweetAlert2 helpers. Colours follow the active theme (reads CSS variables).
type Icon = "success" | "error" | "warning" | "info" | "question";

function palette() {
  const cs = getComputedStyle(document.documentElement);
  const c = (n: string) => `rgb(${cs.getPropertyValue(n).trim().split(/\s+/).join(",")})`;
  return { background: c("--card"), color: c("--fg"), primary: c("--primary"), bad: c("--bad") };
}

export async function toast(icon: Icon, title: string, text?: string) {
  const Swal = (await import("sweetalert2")).default;
  const p = palette();
  // Success toasts disappear in ~1s so the user sees confirmation without blocking navigation.
  // Error / warning / info toasts stay longer so the user has time to read them.
  const timer = icon === "success" ? 1200 : 3200;
  Swal.fire({ toast: true, position: "top-end", icon, title, text, showConfirmButton: false, timer, timerProgressBar: icon !== "success", background: p.background, color: p.color });
}

/** Fire-and-forget success toast (never awaited). Use before router.push() so toast and navigation happen simultaneously. */
export function successToast(title: string, text?: string): void {
  toast("success", title, text);
}

export async function confirmDialog(title: string, text: string, confirmText = "Yes, continue", danger = false): Promise<boolean> {
  const Swal = (await import("sweetalert2")).default;
  const p = palette();
  const r = await Swal.fire({
    title, text, icon: danger ? "warning" : "question", showCancelButton: true, confirmButtonText: confirmText, cancelButtonText: "Cancel",
    confirmButtonColor: danger ? p.bad : p.primary, background: p.background, color: p.color, reverseButtons: true, focusCancel: danger,
  });
  return r.isConfirmed;
}

export async function infoBox(icon: Icon, title: string, html: string) {
  const Swal = (await import("sweetalert2")).default;
  const p = palette();
  await Swal.fire({ icon, title, html, confirmButtonColor: p.primary, background: p.background, color: p.color });
}
