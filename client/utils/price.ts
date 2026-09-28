import type { CartItem } from "@/types/shop";

/**
 * Converts a price in major currency units (e.g. 29.99 or "29.99")
 * into integer cents/minor units (e.g. 2999).
 */
export function toCents(amount: number | string): number {
  const num = typeof amount === "number" ? amount : parseFloat(amount);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Converts a price in integer cents (e.g. 2999)
 * back to major currency units decimal float (e.g. 29.99).
 */
export function toMajor(amountInCents: number | string): number {
  const num = typeof amountInCents === "number" ? amountInCents : parseFloat(amountInCents);
  if (isNaN(num)) return 0;
  return num / 100;
}

/**
 * Formats integer cents into a localized price string.
 * Example: formatPrice(2999, "$") => "$ 29.99"
 */
export function formatPrice(amountInCents: number | string, currencySymbol: string = "$"): string {
  const major = toMajor(amountInCents);
  return `${currencySymbol} ${major.toFixed(2)}`;
}

/**
 * Calculates item subtotal in integer cents.
 * Applies discount percentage and rounds to nearest integer cent.
 */
export function calculateSubtotal(
  unitPriceCents: number | string,
  quantity: number,
  discountPercent: number = 0
): number {
  const price = typeof unitPriceCents === "number" ? unitPriceCents : parseFloat(unitPriceCents) || 0;
  if (quantity <= 0) return 0;
  const rawSubtotal = price * quantity * ((100 - discountPercent) / 100);
  return Math.round(rawSubtotal);
}

/**
 * Sums the subtotals of all cart items in integer cents.
 */
export function calculateGrandTotal(cartItems: CartItem[]): number {
  return cartItems.reduce((acc, item) => {
    const subtotal =
      typeof item.c_subtotal === "number"
        ? item.c_subtotal
        : parseFloat(item.c_subtotal as string) || 0;
    return acc + subtotal;
  }, 0);
}
