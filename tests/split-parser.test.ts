import { describe, it, expect } from "vitest";
import { parseRanges } from "@/lib/split-parser";

describe("parseRanges", () => {
  it("single page", () => expect(parseRanges("1", 10)).toEqual({ pages: [1] }));
  it("range", () => expect(parseRanges("1-3", 10).pages).toEqual([1, 2, 3]));
  it("mixed", () => expect(parseRanges("1-3,7,10-12", 12).pages).toEqual([1, 2, 3, 7, 10, 11, 12]));
  it("deduplicates", () => expect(parseRanges("1,1-3", 5).pages).toEqual([1, 2, 3]));
  it("rejects out of bounds", () => expect(parseRanges("0", 5).error).toBeTruthy());
  it("rejects invalid", () => expect(parseRanges("1-3,foo", 10).error).toBeTruthy());
  it("rejects start>end", () => expect(parseRanges("5-2", 10).error).toBeTruthy());
  it("rejects empty", () => expect(parseRanges("", 10).error).toBeTruthy());
  it("rejects page beyond max", () => expect(parseRanges("1-20", 10).error).toBeTruthy());
});
