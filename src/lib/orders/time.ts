// ZeDuc@Space est à Douala : UTC+1 toute l'année (pas d'heure d'été).
export const DOUALA_OFFSET_MINUTES = 60;
const OFFSET_MS = DOUALA_OFFSET_MINUTES * 60_000;
const DAY_MS = 86_400_000;

// "19:30" choisi par le client -> instant précis. Une heure déjà passée de
// plus de 10 minutes désigne le lendemain (ex. 00:30 choisi à 23:00).
export function arrivalFromClock(clock: string, now: Date = new Date()): Date | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(clock);
  if (!match) return null;
  const local = new Date(now.getTime() + OFFSET_MS);
  const midnightLocal = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  let at = midnightLocal - OFFSET_MS + (Number(match[1]) * 60 + Number(match[2])) * 60_000;
  if (at < now.getTime() - 10 * 60_000) at += DAY_MS;
  return new Date(at);
}

export type Period = "jour" | "semaine" | "mois";

// Début et fin (exclue) de la période en cours, à l'heure de Douala.
// La semaine commence le lundi.
export function periodRange(period: Period, now: Date = new Date()): { from: Date; to: Date } {
  const local = new Date(now.getTime() + OFFSET_MS);
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth();
  const d = local.getUTCDate();
  let startLocal: number;
  let endLocal: number;
  if (period === "jour") {
    startLocal = Date.UTC(y, m, d);
    endLocal = startLocal + DAY_MS;
  } else if (period === "semaine") {
    const weekday = (local.getUTCDay() + 6) % 7; // lundi = 0
    startLocal = Date.UTC(y, m, d - weekday);
    endLocal = startLocal + 7 * DAY_MS;
  } else {
    startLocal = Date.UTC(y, m, 1);
    endLocal = Date.UTC(y, m + 1, 1);
  }
  return { from: new Date(startLocal - OFFSET_MS), to: new Date(endLocal - OFFSET_MS) };
}

const timeFmt = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Douala" });
const dateTimeFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Douala",
});
const dayFmt = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", timeZone: "UTC" });

export function formatTime(iso: string): string {
  return timeFmt.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return dateTimeFmt.format(new Date(iso));
}

// "2026-10-24" (jour local renvoyé par la base) -> "sam. 24"
export function formatDay(day: string): string {
  return dayFmt.format(new Date(`${day}T00:00:00Z`));
}

// Heure courante à Douala au format "HH:MM", arrondie aux 5 minutes suivantes.
export function suggestedArrival(now: Date = new Date(), delayMinutes = 30): string {
  const t = new Date(now.getTime() + OFFSET_MS + delayMinutes * 60_000);
  const minutes = Math.ceil(t.getUTCMinutes() / 5) * 5;
  t.setUTCMinutes(minutes, 0, 0);
  return `${String(t.getUTCHours()).padStart(2, "0")}:${String(t.getUTCMinutes()).padStart(2, "0")}`;
}
