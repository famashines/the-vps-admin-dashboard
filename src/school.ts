import { signInUrl } from "./session.ts";

export const GRADES = [
  ["playgroup", "Playgroup"],
  ["nursery", "Nursery"],
  ["prep", "Prep"],
  ...Array.from({ length: 10 }, (_, i) => [`class-${i + 1}`, `Class ${i + 1}`]),
] as [string, string][];

export const gradeLabel = (grade: string) => GRADES.find(([value]) => value === grade)?.[1] ?? grade;

export type Section = { classSectionId: string; version: number; grade: string; section: string; students: number };
export type Year = { academicYearId: string; version: number; name: string; startsOn: string; endsOn: string; sections: Section[] };
export type Answer = { ok: true; data: any } | { ok: false; status: number; message: string; fields: Record<string, string> };

export function schoolYearOf(today: Date) {
  const [year, month] = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit" }).format(today).split("-").map(Number);
  return yearStarting(month >= 4 ? year : year - 1);
}

export function yearStarting(start: number) {
  return { name: `${start}-${String((start + 1) % 100).padStart(2, "0")}`, startsOn: `${start}-04-01`, endsOn: `${start + 1}-03-31` };
}

export const todayInPakistan = (now: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(now);

const iso = (date: Date) => date.toISOString().slice(0, 10);

function yearsBefore(today: string, years: number) {
  const [y, m, d] = today.split("-").map(Number);
  const date = new Date(Date.UTC(y - years, m - 1, d));
  if (date.getUTCMonth() !== m - 1) date.setUTCDate(0);
  return date;
}

export function birthDateLimits(today: string, minAge = 2, maxAge = 25) {
  const earliest = yearsBefore(today, maxAge + 1);
  earliest.setUTCDate(earliest.getUTCDate() + 1);
  return { min: iso(earliest), max: iso(yearsBefore(today, minAge)) };
}

export const showDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

export async function send(path: string, body: object, key: string, method: "POST" | "PUT" = "POST"): Promise<Answer> {
  try {
    const response = await fetch(path, { method, headers: { "content-type": "application/json", "idempotency-key": key }, body: JSON.stringify(body) });
    if (response.status === 401) {
      location.assign(signInUrl());
      return { ok: false, status: 401, message: "Sign in again.", fields: {} };
    }
    const data = await response.json().catch(() => ({}));
    if (response.ok) return { ok: true, data };
    const fields: Record<string, string> = {};
    for (const f of (data.fields ?? []) as { field: string; message: string }[]) fields[f.field] ??= f.message;
    return { ok: false, status: response.status, message: data.error ?? "The change was not saved. Try again.", fields };
  } catch {
    return { ok: false, status: 0, message: "The change was not saved, because the connection failed. Try again.", fields: {} };
  }
}

export const isStale = (answer: Answer) => !answer.ok && answer.status === 409 && answer.message.includes("someone else");
