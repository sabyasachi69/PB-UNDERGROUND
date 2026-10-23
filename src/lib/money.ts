const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  currencyDisplay: "symbol",
  maximumFractionDigits: 0,
});

export function formatInrFromPaise(valueInPaise: number): string {
  if (!Number.isInteger(valueInPaise)) {
    throw new TypeError("Money must be represented as integer paise.");
  }

  return inrFormatter.format(valueInPaise / 100);
}

export function deliveryFeeForSubtotal(
  subtotalInPaise: number,
  freeAboveInPaise = 49_900,
  deliveryFeeInPaise = 3_000,
): number {
  return subtotalInPaise >= freeAboveInPaise ? 0 : deliveryFeeInPaise;
}
