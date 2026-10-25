export const DEMO_SUPPLIER_COMMISSION_BPS = 1_200;

export type SupplierEarnings = {
  grossInPaise: number;
  commissionInPaise: number;
  netInPaise: number;
};

export function calculateSupplierEarnings(
  grossInPaise: number,
  commissionBps = DEMO_SUPPLIER_COMMISSION_BPS,
): SupplierEarnings {
  if (!Number.isInteger(grossInPaise) || grossInPaise < 0) {
    throw new TypeError("Gross sales must be a non-negative integer number of paise.");
  }
  if (!Number.isInteger(commissionBps) || commissionBps < 0 || commissionBps > 10_000) {
    throw new TypeError("Commission must be an integer between 0 and 10,000 basis points.");
  }

  const commissionInPaise = Math.floor((grossInPaise * commissionBps) / 10_000);
  return {
    grossInPaise,
    commissionInPaise,
    netInPaise: grossInPaise - commissionInPaise,
  };
}
