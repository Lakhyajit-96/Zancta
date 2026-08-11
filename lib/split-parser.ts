export function parseRanges(input: string, maxPage: number): { pages: number[]; error?: string } {
  if (!input.trim()) return { pages: [], error: "Empty range" };
  const pages = new Set<number>();
  const parts = input.split(",").map((s) => s.trim()).filter(Boolean);
  for (const p of parts) {
    if (p.includes("-")) {
      const [aStr, bStr] = p.split("-").map((s) => s.trim());
      const a = parseInt(aStr, 10);
      const b = parseInt(bStr, 10);
      if (Number.isNaN(a) || Number.isNaN(b)) return { pages: [], error: `Invalid range "${p}"` };
      if (a < 1 || b < 1 || a > maxPage || b > maxPage) return { pages: [], error: `Range "${p}" out of bounds (1-${maxPage})` };
      if (a > b) return { pages: [], error: `Invalid range "${p}" — start > end` };
      for (let i = a; i <= b; i++) pages.add(i);
    } else {
      const n = parseInt(p, 10);
      if (Number.isNaN(n)) return { pages: [], error: `Invalid page "${p}"` };
      if (n < 1 || n > maxPage) return { pages: [], error: `Page ${n} out of bounds (1-${maxPage})` };
      pages.add(n);
    }
  }
  if (pages.size === 0) return { pages: [], error: "No pages selected" };
  return { pages: Array.from(pages).sort((a, b) => a - b) };
}
