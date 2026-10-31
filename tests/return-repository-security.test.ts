import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  serverClient: vi.fn(),
  adminClient: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  isSupabaseConfigured: () => true,
  createSupabaseServerClient: mocks.serverClient,
}));
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient: mocks.adminClient }));

import { createAccountReturn } from "@/lib/account-repository";

const user = { id: "11111111-1111-4111-8111-111111111111", email: "buyer@example.com", displayName: "Buyer", phone: null };
const itemId = "aaaaaaaa-aaaa-4aaa-8aaa-000000000001";
const orderId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const png = `data:image/png;base64,${Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]).toString("base64")}`;
const input = { orderId, itemIds: [itemId], reason: "size" as const, details: "The fit is too large.", photos: [png] };

function query(result: unknown) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    in: vi.fn(async () => result),
    maybeSingle: vi.fn(async () => result),
  };
  return chain;
}

function setup(options: { itemIds?: string[]; insertError?: string } = {}) {
  const upload = vi.fn(async () => ({ error: null }));
  const remove = vi.fn(async (paths: string[]) => ({ error: null, removed: paths }));
  const order = query({ data: { id: orderId, status: "delivered", updated_at: new Date().toISOString() }, error: null });
  const items = query({ data: (options.itemIds ?? [itemId]).map((id) => ({ id })), error: null });
  const returns = {
    select: vi.fn(() => returns),
    eq: vi.fn(() => returns),
    maybeSingle: vi.fn(async () => ({ data: null, error: null })),
    insert: vi.fn(() => ({
      select: () => ({ single: async () => options.insertError
        ? { data: null, error: { message: options.insertError } }
        : { data: { id: "new-return", order_id: orderId, reason: "size", details: input.details, photo_urls: ["path"], status: "requested", created_at: new Date().toISOString(), orders: { order_number: "PBU-SAMPLE" } }, error: null } }),
    })),
  };
  mocks.serverClient.mockResolvedValue({ from: (table: string) => ({ orders: order, order_items: items, returns })[table as "orders" | "order_items" | "returns"] });
  mocks.adminClient.mockReturnValue({ storage: { from: () => ({ upload, remove }) } });
  return { upload, remove, returns };
}

beforeEach(() => {
  mocks.serverClient.mockReset();
  mocks.adminClient.mockReset();
});

describe("connected return evidence boundary", () => {
  it("rejects an unrelated item before uploading anything", async () => {
    const { upload, returns } = setup({ itemIds: [] });
    await expect(createAccountReturn(user, input)).rejects.toThrow("do not belong to this order");
    expect(upload).not.toHaveBeenCalled();
    expect(returns.insert).not.toHaveBeenCalled();
  });

  it("uploads valid photos through the server and removes them if the insert fails", async () => {
    const { upload, remove } = setup({ insertError: "duplicate return" });
    await expect(createAccountReturn(user, input)).rejects.toThrow("duplicate return");
    expect(upload).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledOnce();
    expect(remove.mock.calls[0][0]).toHaveLength(1);
  });

  it("keeps a valid return and rejects mismatched image bytes", async () => {
    const { upload, remove } = setup();
    const created = await createAccountReturn(user, input);
    expect(created.status).toBe("requested");
    expect(upload).toHaveBeenCalledOnce();
    expect(remove).not.toHaveBeenCalled();
    await expect(createAccountReturn(user, { ...input, photos: ["data:image/png;base64,YQ=="] }))
      .rejects.toThrow("does not match its image type");
    expect(upload).toHaveBeenCalledOnce();
  });
});
