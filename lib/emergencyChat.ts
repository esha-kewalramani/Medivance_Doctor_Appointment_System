/** Rule-based emergency triage guidance for the Aura AI "Emergency Assistance" chat. General first-aid information only, never a diagnosis. */
import { AMBULANCES, EMERGENCY_HOSPITALS } from "@/lib/emergency";

export interface EmergencyReply { text: string; urgent: boolean }

const CALL = "Call 115 or 1122 now.";
const RULES: { keys: RegExp; title: string; steps: string[] }[] = [
  { keys: /chest|heart attack|heart pain|tight(ness)? in (my )?chest|pressure.*chest|left arm/, title: "Heavy chest pain can be a heart emergency.", steps: [CALL + " Do not drive yourself.", "Sit down, stay calm and loosen tight clothing.", "If you are not allergic and a doctor has not told you otherwise, chew one regular (300 mg) aspirin.", "Unlock the door and ask someone to stay with you.", "If you stop responding and are not breathing normally, start CPR (push hard and fast in the centre of the chest)."] },
  { keys: /breath|choking|choke|suffocat|asthma|wheez/, title: "Trouble breathing needs urgent help.", steps: [CALL, "Sit upright, lean slightly forward and loosen clothing.", "Use your reliever inhaler if you have one (1 puff every 30 to 60 seconds, up to 10).", "If someone is choking and cannot cough or speak: give 5 back blows, then 5 abdominal thrusts, and repeat."] },
  { keys: /stroke|face droop|slurred|speech|\\bnumb(ness)?\\b|paraly|weak(ness)? (on|in) (one|my)/, title: "These can be signs of a stroke. Minutes matter.", steps: [CALL, "Note the time the symptoms started and tell the responders.", "Keep the person sitting or lying with the head slightly raised.", "Give nothing to eat or drink.", "Do not give aspirin unless a doctor says so."] },
  { keys: /bleed|blood|cut|wound|stab|gunshot/, title: "Heavy bleeding must be stopped fast.", steps: [CALL + " if bleeding is heavy or will not stop.", "Press firmly on the wound with a clean cloth and do not remove it.", "Raise the injured part above the heart if possible.", "Add more cloth on top if it soaks through. Keep pressing for 10 minutes."] },
  { keys: /unconscious|faint|collaps|not responding|passed out|not breathing|cardiac/, title: "An unresponsive person is an emergency.", steps: [CALL, "Check breathing. If not breathing normally, start CPR: 30 chest pushes, then 2 breaths if trained.", "If breathing, lay them on their side (recovery position).", "Stay until help arrives."] },
  { keys: /seizure|fit|convuls|epilep/, title: "Seizure first aid.", steps: [CALL + " if it lasts over 5 minutes or repeats.", "Move hard objects away and cushion the head.", "Do not hold them down or put anything in the mouth.", "Turn them on their side when the shaking stops."] },
  { keys: /burn|scald|fire/, title: "Burn first aid.", steps: [CALL + " for large, deep, face or chemical burns.", "Cool the burn under running cool water for 20 minutes.", "Remove rings and tight items near the burn.", "Cover loosely with a clean non-fluffy cloth. No ice, butter or toothpaste."] },
  { keys: /allerg|anaphyl|swelling.*(throat|tongue|face)|sting/, title: "This may be a severe allergic reaction.", steps: [CALL, "Use an adrenaline auto-injector if one is prescribed.", "Lie down with legs raised (sit up if breathing is hard).", "Do not give food or drink."] },
  { keys: /poison|overdose|swallow|ingest|bleach|pills/, title: "Possible poisoning.", steps: [CALL, "Do not make them vomit.", "Keep the package or pill strip to show the responders.", "If they are drowsy, lay them on their side."] },
  { keys: /fractur|broken|bone|head injury|fell|fall|accident|crash/, title: "Injury first aid.", steps: [CALL + " for head, neck or back injuries, or if the person cannot move.", "Do not move them unless there is danger.", "Support the injured part and apply a cold pack wrapped in cloth.", "Keep them warm and still."] },
  { keys: /pregnan|labou?r|contraction|delivery/, title: "Pregnancy emergency.", steps: [CALL, "Lie on the left side and stay calm.", "Note contraction timing and any bleeding or fluid.", "Have the hospital bag and documents ready."] },
  { keys: /fever|child|baby|infant|vomit|diarr|dehydrat/, title: "Fever, vomiting or illness in a child.", steps: ["Go to the hospital now if there is a stiff neck, rash, fits, trouble breathing, or a baby under 3 months with a fever.", "Give small sips of fluids often.", "Keep them lightly dressed and cool.", CALL + " if they are very drowsy or hard to wake."] },
];

export function emergencyReply(input: string): EmergencyReply {
  const t = input.toLowerCase();
  const rule = RULES.find((r) => r.keys.test(t));
  if (rule) {
    const text = `${rule.title}\n\n${rule.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nI am a simulated assistant and cannot examine you. Please get professional help right away.`;
    return { text, urgent: true };
  }
  if (/ambulance|number|helpline|who (do i|should i) call|phone/.test(t)) {
    return { text: `Emergency numbers:\n${AMBULANCES.map((a) => `- ${a.name}: ${a.number}`).join("\n")}\n\nUse the Ambulance Numbers button to call directly.`, urgent: true };
  }
  if (/hospital|nearest|nearby|clinic/.test(t)) {
    return { text: `Nearby hospitals:\n${EMERGENCY_HOSPITALS.map((h) => `- ${h.name}, ${h.phone}`).join("\n")}\n\nTap Find Nearby Hospitals for directions from your location.`, urgent: true };
  }
  if (/thank|\bok(ay)?\b|better|fine now/.test(t)) {
    return { text: "I am glad. Stay safe. If symptoms return or get worse, call 115 or 1122 straight away, and see a doctor to get checked.", urgent: false };
  }
  if (/scared|afraid|panic|anxious|worried|serious|will i (die|be ok)/.test(t)) {
    return { text: "Stay calm. Breathe slowly in through your nose and out through your mouth. You are not alone. Tell me your main symptom and I will guide you. If it feels life-threatening, call 115 or 1122 now.", urgent: true };
  }
  if (/help|emergency|urgent|dying|pain|hurt|sick|ill/.test(t)) {
    return { text: `I am here with you. Tell me what is happening, for example "chest pain", "cannot breathe", "heavy bleeding" or "sudden weakness".\n\nIf the person is in danger, ${CALL.toLowerCase()}`, urgent: true };
  }
  return { text: `I did not catch that. Please describe the emergency in a few words (symptom, who is affected, and how long).\n\nIf anyone is in danger, ${CALL.toLowerCase()}`, urgent: false };
}
