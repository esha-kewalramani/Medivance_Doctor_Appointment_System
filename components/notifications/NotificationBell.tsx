"use client";
import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { useApp } from "@/hooks/useApp";
import { timeAgo } from "@/lib/utilities";

export default function NotificationBell() {
  const { data, session, markAllRead, clearNotifications } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  if (!session) return null;
  const mine = data.notifications.filter((n) => n.role === session.role && (!n.userId || n.userId === session.userId));
  const unread = mine.filter((n) => !n.read).length;

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="card relative grid h-10 w-10 place-items-center !rounded-xl hover:text-primary" aria-label={`Notifications (${unread} unread)`} aria-expanded={open}>
        <Bell className="h-5 w-5" />
        {unread > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-bad px-1 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <div className="card absolute right-0 z-50 mt-2 w-[min(92vw,360px)] animate-pop !bg-surface p-2 shadow-soft">
          <div className="flex items-center justify-between px-2 py-1.5 pb-2 mb-1 border-b border-border/40">
            <h4 className="font-display font-semibold">Notifications</h4>
            <div className="flex gap-1">
              <button onClick={markAllRead} className="btn-ghost btn-sm" title="Mark all as read"><CheckCheck className="h-4 w-4" /></button>
              <button onClick={clearNotifications} className="btn-ghost btn-sm" title="Clear all"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
          <ul className="max-h-80 overflow-y-auto flex flex-col gap-2.5 p-1">
            {mine.length === 0 && <li className="px-3 py-8 text-center text-sm text-muted">You are all caught up.</li>}
            {mine.map((n) => (
              <li key={n.id} className={`rounded-xl px-3.5 py-2.5 text-sm transition-colors border ${n.read ? "border-transparent hover:bg-surface-2/60" : "border-primary/20 bg-primary/10 hover:bg-primary/15"}`}>
                <div className="flex items-start justify-between gap-2"><p className="font-semibold">{n.title}</p><span className="shrink-0 text-[10px] text-muted">{timeAgo(n.time)}</span></div>
                <p className="mt-0.5 text-xs text-muted leading-relaxed">{n.body}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
