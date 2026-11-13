import { describe, expect, it } from "vitest";
import { resolvedTheme } from "./theme";

const oslo = (hhmm: string, offset = "+01:00") => new Date(`2026-11-20T${hhmm}:00${offset}`);

describe("resolvedTheme", () => {
  it("auto is dark from 21:00 until 06:00 Oslo time", () => {
    expect(resolvedTheme("auto", oslo("20:59"))).toBe("light");
    expect(resolvedTheme("auto", oslo("21:00"))).toBe("dark");
    expect(resolvedTheme("auto", oslo("05:59"))).toBe("dark");
    expect(resolvedTheme("auto", oslo("06:00"))).toBe("light");
  });

  it("uses Oslo time in summer too", () => {
    expect(resolvedTheme("auto", new Date("2026-06-20T20:59:00+02:00"))).toBe("light");
    expect(resolvedTheme("auto", new Date("2026-06-20T21:00:00+02:00"))).toBe("dark");
  });

  it("lys and mørk ignore the time", () => {
    expect(resolvedTheme("light", oslo("23:00"))).toBe("light");
    expect(resolvedTheme("dark", oslo("12:00"))).toBe("dark");
  });
});
