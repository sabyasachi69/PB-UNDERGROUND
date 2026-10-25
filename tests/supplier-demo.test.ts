import { describe, expect, it } from "vitest";

import { advanceSupplierDemoOrder, approveSupplierDemoReturn, initialSupplierDemoState, moveSupplierDemoToStep } from "@/lib/supplier-demo";

describe("supplier demo workflow", () => {
  it("clamps navigation to the eight guided steps", () => {
    expect(moveSupplierDemoToStep(initialSupplierDemoState, -2).step).toBe(0);
    expect(moveSupplierDemoToStep(initialSupplierDemoState, 20).step).toBe(7);
  });

  it("moves an order forward without allowing an extra transition", () => {
    const accepted = advanceSupplierDemoOrder(initialSupplierDemoState);
    const packed = advanceSupplierDemoOrder(accepted);
    const dispatched = advanceSupplierDemoOrder(packed);
    expect(advanceSupplierDemoOrder(dispatched).orderStatus).toBe("dispatched");
  });

  it("records return approval idempotently", () => {
    const approved = approveSupplierDemoReturn(initialSupplierDemoState);
    expect(approveSupplierDemoReturn(approved).returnStatus).toBe("approved");
  });
});
