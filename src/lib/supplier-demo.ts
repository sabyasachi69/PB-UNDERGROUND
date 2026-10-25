export const SUPPLIER_DEMO_STEP_COUNT = 8;

export type SupplierDemoOrderStatus = "new" | "accepted" | "packed" | "dispatched";
export type SupplierDemoReturnStatus = "requested" | "approved";

export type SupplierDemoState = {
  step: number;
  businessName: string;
  product: {
    name: string;
    fabric: string;
    colour: string;
    sizes: string;
    priceRupees: number;
    stock: number;
  };
  orderStatus: SupplierDemoOrderStatus;
  returnStatus: SupplierDemoReturnStatus;
};

export const initialSupplierDemoState: SupplierDemoState = {
  step: 0,
  businessName: "[SAMPLE] Singh Cloth House",
  product: {
    name: "Campus Weight Overshirt",
    fabric: "Mid-weight cotton twill",
    colour: "Rust",
    sizes: "S, M, L, XL",
    priceRupees: 999,
    stock: 18,
  },
  orderStatus: "new",
  returnStatus: "requested",
};

export function moveSupplierDemoToStep(state: SupplierDemoState, step: number): SupplierDemoState {
  if (!Number.isInteger(step)) throw new TypeError("Demo step must be an integer.");
  return { ...state, step: Math.min(SUPPLIER_DEMO_STEP_COUNT - 1, Math.max(0, step)) };
}

export function advanceSupplierDemoOrder(state: SupplierDemoState): SupplierDemoState {
  const next: Record<SupplierDemoOrderStatus, SupplierDemoOrderStatus> = {
    new: "accepted",
    accepted: "packed",
    packed: "dispatched",
    dispatched: "dispatched",
  };
  return { ...state, orderStatus: next[state.orderStatus] };
}

export function approveSupplierDemoReturn(state: SupplierDemoState): SupplierDemoState {
  return { ...state, returnStatus: "approved" };
}
