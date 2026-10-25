// La liga opera en hora del centro de México, que desde 2022 ya no cambia
// de horario: siempre es UTC-6.
const MX_TIME_ZONE = "America/Mexico_City";
const MX_OFFSET = "-06:00";

/** ISO → "YYYY-MM-DD" y "HH:mm" en hora de México (para inputs). */
export function toMxParts(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: MX_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(d)
      .map((p) => [p.type, p.value])
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

/** "YYYY-MM-DD" + "HH:mm" en hora de México → ISO, o null si no es válido. */
export function fromMxParts(date: string, time: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return null;
  }
  const d = new Date(`${date}T${time}:00${MX_OFFSET}`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
