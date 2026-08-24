export type RangeKey = "7d" | "28d" | "90d" | "custom";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

function utcYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function resolveDateRange(range: string | null, start?: string | null, end?: string | null) {
  const today = new Date();
  const endDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 1));
  let days = 28;
  let key: RangeKey = "28d";
  if (range === "7d") {
    days = 7;
    key = "7d";
  } else if (range === "90d") {
    days = 90;
    key = "90d";
  } else if (range === "custom" && start && end && ISO.test(start) && ISO.test(end) && start <= end) {
    const maxStart = utcYmd(new Date(endDate.getTime() - 16 * 30 * 24 * 60 * 60 * 1000));
    const s = start < maxStart ? maxStart : start;
    const e = end > utcYmd(endDate) ? utcYmd(endDate) : end;
    return { startDate: s, endDate: e, key: `custom:${s}:${e}` as const };
  }
  const startDate = new Date(endDate.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  return { startDate: utcYmd(startDate), endDate: utcYmd(endDate), key };
}
