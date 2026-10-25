"use client";

import { useMemo, useState } from "react";

import { formatInrFromPaise } from "@/lib/money";
import { calculateSupplierEarnings, DEMO_SUPPLIER_COMMISSION_BPS } from "@/lib/supplier-earnings";

const MIN_SALES_RUPEES = 1_000;
const MAX_SALES_RUPEES = 500_000;

export function SupplierEarningsCalculator() {
  const [monthlySalesRupees, setMonthlySalesRupees] = useState(50_000);
  const earnings = useMemo(
    () => calculateSupplierEarnings(monthlySalesRupees * 100),
    [monthlySalesRupees],
  );

  return (
    <section className="supplier-calculator" aria-labelledby="earnings-heading">
      <div className="supplier-calculator-copy">
        <p className="eyebrow eyebrow--signal">Demo economics / Transparent by default</p>
        <h2 id="earnings-heading">See where every rupee goes.</h2>
        <p>
          Move the monthly sales figure. The example uses the proposed 12% demo commission and shows the
          supplier amount before any approved return deductions.
        </p>
        <label htmlFor="monthly-sales">Average monthly sales</label>
        <div className="supplier-sales-input">
          <span aria-hidden="true">₹</span>
          <input
            id="monthly-sales"
            type="number"
            min={MIN_SALES_RUPEES}
            max={MAX_SALES_RUPEES}
            step="1000"
            inputMode="numeric"
            value={monthlySalesRupees}
            onChange={(event) => {
              const value = Number(event.target.value);
              setMonthlySalesRupees(Number.isFinite(value) ? Math.min(MAX_SALES_RUPEES, Math.max(0, Math.round(value))) : 0);
            }}
          />
        </div>
        <input
          className="supplier-sales-range"
          aria-label="Average monthly sales slider"
          type="range"
          min={MIN_SALES_RUPEES}
          max={MAX_SALES_RUPEES}
          step="1000"
          value={Math.max(MIN_SALES_RUPEES, monthlySalesRupees)}
          onChange={(event) => setMonthlySalesRupees(Number(event.target.value))}
        />
      </div>

      <div className="payout-statement" aria-live="polite">
        <div className="payout-statement-head">
          <span>[SAMPLE] Monthly estimate</span>
          <strong>PB / SETTLEMENT</strong>
        </div>
        <dl>
          <div><dt>Gross sales</dt><dd>{formatInrFromPaise(earnings.grossInPaise)}</dd></div>
          <div><dt>PB commission ({DEMO_SUPPLIER_COMMISSION_BPS / 100}%)</dt><dd>−{formatInrFromPaise(earnings.commissionInPaise)}</dd></div>
          <div className="payout-total"><dt>Estimated supplier earnings</dt><dd>{formatInrFromPaise(earnings.netInPaise)}</dd></div>
        </dl>
        <div className="payout-date"><span>Settlement rhythm</span><strong>Weekly · Mondays</strong></div>
        <p>[SAMPLE] Actual statements list each delivered order, commission and approved deduction.</p>
      </div>
    </section>
  );
}
