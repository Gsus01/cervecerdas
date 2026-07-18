import { describe, expect, it } from "vitest";

import { statisticsTimeZoneSchema } from "@/lib/validation/statistics";

describe("statisticsTimeZoneSchema", () => {
  it("acepta zonas horarias IANA y usa UTC por defecto", () => {
    expect(statisticsTimeZoneSchema.parse("Europe/Madrid")).toBe("Europe/Madrid");
    expect(statisticsTimeZoneSchema.parse(undefined)).toBe("UTC");
  });

  it("rechaza una zona horaria inexistente", () => {
    expect(statisticsTimeZoneSchema.safeParse("Marte/Olympus").success).toBe(false);
  });
});
