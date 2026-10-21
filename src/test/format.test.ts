import { describe, expect, it } from "vitest";
import { formatUtc } from "@/lib/format";

describe("GMT timestamps", () => {
  it("displays dates in GMT rather than the input timezone", () => {
    expect(formatUtc("2026-10-21T19:08:00+03:00")).toBe("21 Oct 2026 16:08 GMT");
  });
});