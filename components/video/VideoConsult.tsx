"use client";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Camera, CameraOff, Mic, MicOff, PhoneOff, Send, ShieldCheck, Video } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { useApp } from "@/hooks/useApp";
import { fmtDate, fmtTime, todayISO } from "@/lib/utilities";

type Msg = { id: number; from: "me" | "doctor" | "system"; text: string };
const REPLIES = ["Hello! I can see you. How are you feeling today?", "Thank you. Could you tell me when the symptoms started?", "Understood. I will note that down. Anything else you want to share?"];

/** Demo video-consultation room: real camera preview in the browser, simulated doctor + chat (no real call is made). */
export default function VideoConsult() {
  const { data, session, doctorById } = useApp();
  const mine = useMemo(() => data.appointments.filter((a) => a.patientId === session?.userId && a.status === "approved" && a.date >= todayISO()).sort((a, b) => (a.date + a.time > b.date + b.time ? 1 : -1)), [data.appointments, session]);
  const [apptId, setApptId] = useState("");
  const appt = mine.find((a) => a.id === apptId) ?? mine[0];
  const doctor = appt ? doctorById(appt.doctorId) : data.doctors[0];

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camOn, setCamOn] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camErr, setCamErr] = useState("");
  const [inCall, setInCall] = useState(false);
  const [connected, setConnected] = useState(false);
  const [secs, setSecs] = useState(0);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const replyIdx = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);

  const stopStream = () => { streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null; setCamOn(false); };
  useEffect(() => () => stopStream(), []);
  useEffect(() => { if (videoRef.current) videoRef.current.srcObject = streamRef.current; });
  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest" }); }, [msgs]);

  const startCam = async () => {
    setCamErr("");
    if (!navigator.mediaDevices?.getUserMedia) { setCamErr("Camera is not supported in this browser (it needs HTTPS or localhost)."); return; }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      s.getAudioTracks().forEach((t) => (t.enabled = micOn));
      streamRef.current = s; setCamOn(true);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch { setCamErr("Camera or microphone permission was blocked. You can still join without video."); }
  };
  const toggleCam = () => (camOn ? stopStream() : startCam());
  const toggleMic = () => { const n = !micOn; setMicOn(n); streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = n)); };

  const join = () => {
    setInCall(true); setConnected(false); setSecs(0); replyIdx.current = 0;
    setMsgs([{ id: 1, from: "system", text: "Waiting room: the doctor will join shortly..." }]);
  };
  const leave = () => { setInCall(false); setConnected(false); setMsgs([]); };

  useEffect(() => {
    if (!inCall) return;
    const t = setTimeout(() => { setConnected(true); setMsgs((m) => [...m, { id: Date.now(), from: "system", text: `${doctor?.name ?? "Doctor"} joined the consultation.` }]); }, 2500);
    return () => clearTimeout(t);
  }, [inCall, doctor?.name]);
  useEffect(() => {
    if (!connected) return;
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [connected]);

  const send = (e: FormEvent) => {
    e.preventDefault();
    const v = text.trim(); if (!v) return;
    setMsgs((m) => [...m, { id: Date.now(), from: "me", text: v }]); setText("");
    if (inCall && connected) setTimeout(() => setMsgs((m) => [...m, { id: Date.now() + 1, from: "doctor", text: REPLIES[replyIdx.current++ % REPLIES.length] }]), 1200);
  };
  const clock = `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={doctor?.name ?? "Doctor"} photo={doctor?.photo} size={44} />
          <div className="min-w-0">
            <p className="truncate font-semibold">{doctor?.name ?? "No doctor selected"}</p>
            <p className="text-xs text-muted">{appt ? `${fmtDate(appt.date)} - ${fmtTime(appt.time)}` : "Demo consultation room"}</p>
          </div>
        </div>
        {mine.length > 1 && !inCall && (
          <select className="input !w-auto" value={appt?.id} onChange={(e) => setApptId(e.target.value)} aria-label="Choose appointment">
            {mine.map((a) => <option key={a.id} value={a.id}>{doctorById(a.doctorId)?.name} - {fmtDate(a.date)} {fmtTime(a.time)}</option>)}
          </select>
        )}
        <span className="inline-flex items-center gap-1.5 text-xs text-muted"><ShieldCheck className="h-4 w-4 text-ok" /> Demo room - nothing is recorded or uploaded</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card overflow-hidden lg:col-span-2" aria-label="Video area">
          <div className="relative aspect-video bg-[#020917]">
            {inCall ? (
              <div className="absolute inset-0 grid place-items-center text-center text-white">
                {connected ? (
                  <div><Avatar name={doctor?.name ?? "Doctor"} photo={doctor?.photo} size={112} /><p className="mt-3 font-semibold">{doctor?.name}</p><p className="text-xs text-sky-200">Connected - {clock}</p></div>
                ) : (
                  <div><span className="mx-auto block h-10 w-10 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" /><p className="mt-3 text-sm">Waiting for {doctor?.name ?? "the doctor"} to join...</p></div>
                )}
              </div>
            ) : (
              <video ref={videoRef} autoPlay muted playsInline className={`absolute inset-0 h-full w-full -scale-x-100 object-cover ${camOn ? "" : "hidden"}`} />
            )}
            {!inCall && !camOn && (
              <div className="absolute inset-0 grid place-items-center p-6 text-center text-white">
                <div><CameraOff className="mx-auto h-10 w-10 text-sky-300" /><p className="mt-3 text-sm font-semibold">Camera preview is off</p><p className="mt-1 text-xs text-sky-200">Check your camera and microphone before joining.</p></div>
              </div>
            )}
            {inCall && (
              <div className="absolute bottom-3 end-3 h-24 w-36 overflow-hidden rounded-xl border-2 border-white/40 bg-black shadow-lg sm:h-28 sm:w-44">
                <video ref={videoRef} autoPlay muted playsInline className={`h-full w-full -scale-x-100 object-cover ${camOn ? "" : "hidden"}`} />
                {!camOn && <div className="grid h-full place-items-center text-[11px] text-white/80">You (camera off)</div>}
              </div>
            )}
          </div>
          {camErr && <p className="px-4 pt-3 text-xs text-warn" role="alert">{camErr}</p>}
          <div className="flex flex-wrap items-center justify-center gap-2.5 p-4">
            <button onClick={toggleMic} className={`btn-sm ${micOn ? "btn-ghost" : "btn-danger"}`} aria-pressed={!micOn}>{micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />} {micOn ? "Mute" : "Unmute"}</button>
            <button onClick={toggleCam} className={`btn-sm ${camOn ? "btn-ghost" : "btn-primary"}`}>{camOn ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />} {camOn ? "Turn camera off" : "Turn camera on"}</button>
            {inCall ? <button onClick={leave} className="btn-danger btn-sm"><PhoneOff className="h-4 w-4" /> Leave call</button> : <button onClick={join} className="btn-primary btn-sm"><Video className="h-4 w-4" /> Join consultation</button>}
          </div>
        </section>

        <section className="card flex h-[420px] flex-col p-4 lg:h-auto lg:min-h-[420px]" aria-label="Chat">
          <h2 className="mb-2 font-display text-lg font-semibold">Chat</h2>
          <div className="flex-1 space-y-2 overflow-y-auto pe-1" aria-live="polite">
            {msgs.length === 0 && <p className="text-sm text-muted">Messages will appear here once you join.</p>}
            {msgs.map((m) => m.from === "system" ? <p key={m.id} className="text-center text-xs text-muted">{m.text}</p> : (
              <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                <span className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.from === "me" ? "bg-primary text-primary-fg" : "bg-primary/10"}`}>{m.text}</span>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <form onSubmit={send} className="mt-3 flex gap-2">
            <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder={inCall ? "Type a message" : "Join to start chatting"} disabled={!inCall} aria-label="Chat message" />
            <button className="btn-primary btn-sm" disabled={!inCall || !text.trim()} aria-label="Send message"><Send className="h-4 w-4" /></button>
          </form>
        </section>
      </div>
      {mine.length === 0 && <p className="text-xs text-muted">You have no approved upcoming appointments, so this is a demo room. <Link href="/patient/book" className="font-semibold text-primary">Book an appointment</Link> to see it linked to a real visit.</p>}
    </div>
  );
}
