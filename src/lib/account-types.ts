export type AccountUser = {
  id: string;
  email: string;
  displayName: string;
  phone: string | null;
};

export type SavedAddress = {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string | null;
  landmark: string | null;
  pincode: string;
  zoneId: string | null;
  isDefault: boolean;
};

export type WishlistEntry = {
  variantId: string;
  productSlug: string;
  productName: string;
  size: string;
  colour: string;
  priceInPaise: number;
  addedAt: string;
};

export type AccountOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalInPaise: number;
  placedAt: string;
  deliveredAt: string | null;
  returnEligibleUntil: string | null;
  items: Array<{
    id: string;
    variantId: string;
    productSlug: string;
    name: string;
    size: string;
    colour: string;
    quantity: number;
    lineTotalInPaise: number;
  }>;
};

export type ReturnRequest = {
  id: string;
  orderId: string;
  orderNumber: string;
  reason: "size" | "defect";
  details: string;
  photoUrls: string[];
  status: "requested" | "approved" | "rejected" | "refunded" | "exchanged";
  createdAt: string;
};

export type AccountSnapshot = {
  runtime: "supabase" | "demo";
  user: AccountUser;
  addresses: SavedAddress[];
  orders: AccountOrder[];
  wishlist: WishlistEntry[];
  returns: ReturnRequest[];
};
