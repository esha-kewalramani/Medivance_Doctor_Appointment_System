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
        <>
          {/* Mobile backdrop overlay to focus attention and allow 1-tap dismiss */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs sm:hidden"
            onClick={() => setOpen(false)}
          />

          {/* Responsive Notification Dropdown Card */}
          <div className="fixed inset-x-2.5 top-[4.25rem] z-50 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-[380px] max-w-[calc(100vw-1.25rem)] card animate-pop !bg-surface p-2.5 sm:p-3 shadow-2xl border border-line/60 rounded-2xl">
            <div className="flex items-center justify-between px-2 pb-2.5 mb-1.5 border-b border-line/40">
              <div className="flex items-center gap-2">
                <h4 className="font-display font-semibold text-sm sm:text-base">Notifications</h4>
                {unread > 0 && (
                  <span className="rounded-full bg-primary/15 text-primary px-2 py-0.5 text-[10px] font-bold">
                    {unread} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={markAllRead}
                  className="btn-ghost btn-sm h-8 px-2 text-xs flex items-center gap-1"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span className="hidden xs:inline text-[11px]">Read all</span>
                </button>
                <button
                  onClick={clearNotifications}
                  className="btn-ghost btn-sm h-8 w-8 p-0 grid place-items-center text-bad hover:bg-bad/10"
                  title="Clear all notifications"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <ul className="max-h-[62vh] sm:max-h-80 overflow-y-auto flex flex-col gap-2 p-0.5 overscroll-contain scrollbar-thin">
              {mine.length === 0 && (
                <li className="px-3 py-8 text-center text-xs sm:text-sm text-muted">
                  You are all caught up. No new notifications.
                </li>
              )}
              {mine.map((n) => (
                <li
                  key={n.id}
                  className={`rounded-xl px-3 py-2.5 text-xs sm:text-sm transition-colors border ${
                    n.read
                      ? "border-transparent bg-surface-2/30 hover:bg-surface-2/60"
                      : "border-primary/20 bg-primary/10 hover:bg-primary/15"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-fg text-xs sm:text-sm leading-snug">{n.title}</p>
                    <span className="shrink-0 text-[10px] text-muted whitespace-nowrap">{timeAgo(n.time)}</span>
                  </div>
                  <p className="mt-1 text-[11px] sm:text-xs text-muted leading-relaxed break-words">{n.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
