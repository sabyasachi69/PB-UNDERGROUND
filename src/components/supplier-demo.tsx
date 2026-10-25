"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, BadgeCheck, Box, Check, Download, PackageCheck, RotateCcw, Store } from "lucide-react";
import Link from "next/link";

import { formatInrFromPaise } from "@/lib/money";
import {
  advanceSupplierDemoOrder,
  approveSupplierDemoReturn,
  initialSupplierDemoState,
  moveSupplierDemoToStep,
  SUPPLIER_DEMO_STEP_COUNT,
  type SupplierDemoState,
} from "@/lib/supplier-demo";
import { calculateSupplierEarnings } from "@/lib/supplier-earnings";

const steps = ["Welcome", "Profile", "Add product", "New order", "Accept & pack", "Earnings", "Return", "Finish"] as const;

export function SupplierDemo() {
  const [state, setState] = useState(initialSupplierDemoState);

  const move = (step: number) => setState((current) => moveSupplierDemoToStep(current, step));
  const reset = () => setState(initialSupplierDemoState);

  return (
    <div className="supplier-demo-shell">
      <header className="supplier-demo-topbar">
        <div><span>PB / SUPPLIER</span><strong>Guided demo</strong></div>
        <p><i aria-hidden="true" /> Sample data. Nothing here is live.</p>
        <button type="button" onClick={reset}><RotateCcw aria-hidden="true" size={15} /> Reset demo</button>
      </header>

      <div className="supplier-demo-layout">
        <aside className="supplier-demo-sidebar" aria-label="Demo steps">
          <Link className="supplier-demo-wordmark" href="/partner"><span>PB</span> UNDERGROUND</Link>
          <ol>
            {steps.map((label, index) => (
              <li key={label} className={index === state.step ? "is-active" : index < state.step ? "is-done" : ""}>
                <button type="button" onClick={() => move(index)} aria-current={index === state.step ? "step" : undefined}>
                  <span>{index < state.step ? <Check aria-hidden="true" size={13} /> : index + 1}</span>{label}
                </button>
              </li>
            ))}
          </ol>
          <div className="supplier-demo-progress"><span style={{ width: `${((state.step + 1) / SUPPLIER_DEMO_STEP_COUNT) * 100}%` }} /></div>
          <small>Step {state.step + 1} of {SUPPLIER_DEMO_STEP_COUNT}</small>
        </aside>

        <main className="supplier-demo-main" id="main-content">
          <DemoStep state={state} setState={setState} move={move} reset={reset} />
          {state.step > 0 && state.step < 7 ? (
            <footer className="supplier-demo-controls">
              <button type="button" onClick={() => move(state.step - 1)}><ArrowLeft aria-hidden="true" size={16} /> Back</button>
              <button type="button" onClick={() => move(state.step + 1)}>Next step <ArrowRight aria-hidden="true" size={16} /></button>
            </footer>
          ) : null}
        </main>
      </div>
    </div>
  );
}

function DemoStep({ state, setState, move, reset }: {
  state: SupplierDemoState;
  setState: React.Dispatch<React.SetStateAction<SupplierDemoState>>;
  move: (step: number) => void;
  reset: () => void;
}) {
  if (state.step === 0) return <WelcomeStep start={() => move(1)} />;
  if (state.step === 1) return <ProfileStep state={state} setState={setState} />;
  if (state.step === 2) return <ProductStep state={state} setState={setState} />;
  if (state.step === 3) return <NewOrderStep state={state} accept={() => setState((current) => advanceSupplierDemoOrder(current))} />;
  if (state.step === 4) return <FulfilmentStep state={state} advance={() => setState((current) => advanceSupplierDemoOrder(current))} />;
  if (state.step === 5) return <EarningsStep state={state} />;
  if (state.step === 6) return <ReturnStep state={state} approve={() => setState((current) => approveSupplierDemoReturn(current))} />;
  return <FinishStep state={state} reset={reset} />;
}

function StepHeading({ kicker, title, text }: { kicker: string; title: string; text: string }) {
  return <header className="demo-step-heading"><p>{kicker}</p><h1>{title}</h1><span>{text}</span></header>;
}

function WelcomeStep({ start }: { start: () => void }) {
  return <section className="demo-welcome"><StepHeading kicker="Step 01 / Welcome" title="The whole supplier cycle. Six minutes." text="This guided workspace runs on sample data in your browser. Edit a profile, add a product, fulfil an order and inspect the settlement." /><div className="demo-welcome-grid"><article><Store aria-hidden="true" /><strong>No website needed</strong><span>Products, orders and money live in one focused workspace.</span></article><article><PackageCheck aria-hidden="true" /><strong>A visible hand-off</strong><span>The customer sees each status without receiving private supplier data.</span></article><article><BadgeCheck aria-hidden="true" /><strong>Every rupee traced</strong><span>Gross, commission and deductions stay attached to the statement.</span></article></div><button className="button button--signal" type="button" onClick={start}>Start guided demo <ArrowRight aria-hidden="true" size={18} /></button></section>;
}

function ProfileStep({ state, setState }: { state: SupplierDemoState; setState: React.Dispatch<React.SetStateAction<SupplierDemoState>> }) {
  return <section><StepHeading kicker="Step 02 / Supplier profile" title="Start with the business buyers should trust." text="The real onboarding checks identity, pickup details and a masked bank reference before approval." /><div className="demo-two-column"><div className="demo-form-card"><label htmlFor="demo-business-name">Business name</label><input id="demo-business-name" value={state.businessName} onChange={(event) => setState((current) => ({ ...current, businessName: event.target.value }))} /><label>Pickup point</label><input value="Phagwara, Punjab · Sample address" readOnly /><label>Bank reference</label><input value="•••• 4821 · Sample only" readOnly /></div><article className="demo-profile-card"><div><Store aria-hidden="true" /></div><span>Supplier profile</span><h2>{state.businessName || "Your business"}</h2><p><BadgeCheck aria-hidden="true" size={16} /> Demo verification complete</p><ul><li>Business details <Check size={14} /></li><li>Pickup point <Check size={14} /></li><li>Settlement reference <Check size={14} /></li></ul><strong>3 / 3 ready for review</strong></article></div></section>;
}

function ProductStep({ state, setState }: { state: SupplierDemoState; setState: React.Dispatch<React.SetStateAction<SupplierDemoState>> }) {
  const update = <K extends keyof SupplierDemoState["product"]>(key: K, value: SupplierDemoState["product"][K]) => setState((current) => ({ ...current, product: { ...current.product, [key]: value } }));
  return <section><StepHeading kicker="Step 03 / Add a product" title="One form. A live customer preview." text="Enter the details you already know from the counter. The full product manager adds photos, GST, care and dispatch time." /><div className="demo-two-column"><div className="demo-form-card demo-product-form"><label htmlFor="demo-product-name">Product name</label><input id="demo-product-name" value={state.product.name} onChange={(event) => update("name", event.target.value)} /><label htmlFor="demo-fabric">Fabric</label><input id="demo-fabric" value={state.product.fabric} onChange={(event) => update("fabric", event.target.value)} /><div><label>Colour<input value={state.product.colour} onChange={(event) => update("colour", event.target.value)} /></label><label>Sizes<input value={state.product.sizes} onChange={(event) => update("sizes", event.target.value)} /></label></div><div><label>Price (₹)<input type="number" min="1" value={state.product.priceRupees} onChange={(event) => update("priceRupees", Number(event.target.value))} /></label><label>Stock<input type="number" min="0" value={state.product.stock} onChange={(event) => update("stock", Number(event.target.value))} /></label></div><button type="button"><Box aria-hidden="true" size={16} /> Sample fabric image selected</button></div><article className="demo-product-preview"><div><span>[SAMPLE IMAGE]</span><Box aria-hidden="true" /></div><small>{state.businessName}</small><h2>{state.product.name || "Untitled product"}</h2><p>{state.product.colour} · {state.product.sizes}</p><strong>{formatInrFromPaise(Math.max(0, Math.round(state.product.priceRupees * 100)))}</strong><span>{state.product.stock} in stock · GST inclusive</span></article></div></section>;
}

function NewOrderStep({ state, accept }: { state: SupplierDemoState; accept: () => void }) {
  return <section><StepHeading kicker="Step 04 / New order" title="A new campus order arrives with a clear clock." text="Only the first name, delivery zone and slot are shown here. The full address stays with the delivery workflow." /><article className="demo-order-card"><header><div><span>New order</span><strong>PBU-DEMO-0421</strong></div><b>{state.orderStatus === "new" ? "29:42 to respond" : "Accepted"}</b></header><div className="demo-order-person"><div>AK</div><p><strong>Aman</strong><span>Boys’ Hostels · Gate hand-off</span></p><time>Today<br />18:00–20:00</time></div><div className="demo-order-line"><Box aria-hidden="true" /><p><strong>1 × {state.product.name}</strong><span>{state.product.colour} / M</span></p><strong>{formatInrFromPaise(Math.round(state.product.priceRupees * 100))}</strong></div><footer><span>COD · Customer total {formatInrFromPaise(Math.round(state.product.priceRupees * 100))}</span><button className="button button--signal" type="button" disabled={state.orderStatus !== "new"} onClick={accept}>{state.orderStatus === "new" ? "Accept order" : "Order accepted"}</button></footer></article></section>;
}

function FulfilmentStep({ state, advance }: { state: SupplierDemoState; advance: () => void }) {
  const statusIndex = ["new", "accepted", "packed", "dispatched"].indexOf(state.orderStatus);
  const action = state.orderStatus === "new" ? "Accept order" : state.orderStatus === "accepted" ? "Mark packed" : state.orderStatus === "packed" ? "Hand to delivery" : "Hand-off complete";
  return <section><StepHeading kicker="Step 05 / Accept and pack" title="Three taps keep everyone in the loop." text="Each change becomes a timestamped order event. Invalid backwards moves are rejected by the server in the connected dashboard." /><div className="demo-fulfilment"><ol>{["Order received", "Accepted", "Packed", "Handed to delivery"].map((label, index) => <li key={label} className={index <= statusIndex ? "is-done" : ""}><span>{index < statusIndex ? <Check size={14} /> : index + 1}</span><div><strong>{label}</strong><small>{index <= statusIndex ? "Recorded in demo" : "Waiting"}</small></div></li>)}</ol><aside><span>Customer tracking preview</span><h3>{state.orderStatus === "dispatched" ? "Out for delivery" : state.orderStatus === "packed" ? "Packed" : state.orderStatus === "accepted" ? "Confirmed by supplier" : "Placed"}</h3><p>Aman sees this update without seeing private shop or payout details.</p><button className="button button--signal" type="button" onClick={advance} disabled={state.orderStatus === "dispatched"}>{action}</button></aside></div></section>;
}

function EarningsStep({ state }: { state: SupplierDemoState }) {
  const gross = Math.round(state.product.priceRupees * 100 * 14);
  const earnings = calculateSupplierEarnings(gross);
  const download = () => {
    const csv = `statement,period,gross_paise,commission_paise,deductions_paise,net_paise,status\nPBU-SET-DEMO,Sample week,${earnings.grossInPaise},${earnings.commissionInPaise},0,${earnings.netInPaise},scheduled\n`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "pb-underground-sample-settlement.csv"; link.click(); URL.revokeObjectURL(url);
  };
  return <section><StepHeading kicker="Step 06 / Earnings" title="The settlement explains itself." text="This sample statement groups fourteen delivered units. The real view itemises orders and makes the dispute window visible." /><article className="demo-settlement"><header><div><span>Statement</span><strong>PBU-SET-DEMO</strong></div><b>Scheduled</b></header><dl><div><dt>Gross delivered sales</dt><dd>{formatInrFromPaise(earnings.grossInPaise)}</dd></div><div><dt>PB commission · 12%</dt><dd>−{formatInrFromPaise(earnings.commissionInPaise)}</dd></div><div><dt>Approved deductions</dt><dd>₹0</dd></div><div className="demo-settlement-total"><dt>Supplier payout</dt><dd>{formatInrFromPaise(earnings.netInPaise)}</dd></div></dl><footer><p><span>Period</span>Sample week</p><p><span>Payout date</span>Next Monday</p><p><span>Dispute until</span>14 days after issue</p><button type="button" onClick={download}><Download aria-hidden="true" size={16} /> Download sample CSV</button></footer></article></section>;
}

function ReturnStep({ state, approve }: { state: SupplierDemoState; approve: () => void }) {
  return <section><StepHeading kicker="Step 07 / Return" title="A problem stays visible and fair." text="The sample customer reported a stitching defect inside the 48-hour window and supplied evidence. Approval records the resolution and future deduction." /><div className="demo-return"><div className="demo-return-photo"><span>[SAMPLE EVIDENCE]</span><Box aria-hidden="true" /></div><article><span>{state.returnStatus === "approved" ? "Approved" : "Review requested"}</span><h2>{state.product.name}</h2><p><strong>Reason:</strong> Defect · loose seam near cuff</p><p>The refund deduction is not hidden. It will appear as a separate line in the next settlement statement.</p><dl><div><dt>Customer refund</dt><dd>₹150 sample deduction</dd></div><div><dt>Response window</dt><dd>14 days to dispute</dd></div></dl><button className="button button--signal" type="button" onClick={approve} disabled={state.returnStatus === "approved"}>{state.returnStatus === "approved" ? "Return approved" : "Approve sample return"}</button></article></div></section>;
}

function FinishStep({ state, reset }: { state: SupplierDemoState; reset: () => void }) {
  return <section className="demo-finish"><StepHeading kicker="Step 08 / Finish" title="That is the working loop." text="You prepared a profile, listed a product, moved an order to hand-off, checked earnings and resolved a return—all with sample data." /><div className="demo-finish-summary"><article><span>Profile</span><strong>{state.businessName}</strong><small>Ready for review</small></article><article><span>Product</span><strong>{state.product.name}</strong><small>{state.product.stock} sample units</small></article><article><span>Order</span><strong>{state.orderStatus.replaceAll("_", " ")}</strong><small>PBU-DEMO-0421</small></article><article><span>Return</span><strong>{state.returnStatus}</strong><small>Statement deduction visible</small></article></div><div><Link className="button button--signal" href="/signup?intent=supplier">Apply to supply <ArrowRight aria-hidden="true" size={18} /></Link><button className="button button--ghost" type="button" onClick={reset}><RotateCcw aria-hidden="true" size={16} /> Run it again</button></div><p>[SAMPLE WORKFLOW] A submitted application will not be treated as approved until the PB team verifies the business and confirms final commercial terms.</p></section>;
}
