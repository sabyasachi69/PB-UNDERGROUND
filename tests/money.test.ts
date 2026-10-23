import { describe, expect, it } from "vitest";

import { deliveryFeeForSubtotal, formatInrFromPaise } from "@/lib/money";

describe("money rules", () => {
  it("formats integer paise without decimals", () => {
    expect(formatInrFromPaise(49_900)).toBe("₹499");
  });

  it("charges delivery below the launch threshold", () => {
    expect(deliveryFeeForSubtotal(49_800)).toBe(3_000);
  });

  it("makes delivery free at the launch threshold", () => {
    expect(deliveryFeeForSubtotal(49_900)).toBe(0);
  });

  it("rejects fractional paise", () => {
    expect(() => formatInrFromPaise(499.5)).toThrow(TypeError);
  });
});
