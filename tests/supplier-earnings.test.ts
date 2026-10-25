import { describe, expect, it } from "vitest";

import { calculateSupplierEarnings } from "@/lib/supplier-earnings";

describe("supplier earnings", () => {
  it("calculates the default twelve-percent commission in integer paise", () => {
    expect(calculateSupplierEarnings(1_000_000)).toEqual({
      grossInPaise: 1_000_000,
      commissionInPaise: 120_000,
      netInPaise: 880_000,
    });
  });

  it("rounds commission down without creating fractional paise", () => {
    expect(calculateSupplierEarnings(101, 1_200)).toEqual({
      grossInPaise: 101,
      commissionInPaise: 12,
      netInPaise: 89,
    });
  });

  it("rejects invalid money and commission values", () => {
    expect(() => calculateSupplierEarnings(-1)).toThrow(TypeError);
    expect(() => calculateSupplierEarnings(100, 10_001)).toThrow(TypeError);
  });
});
