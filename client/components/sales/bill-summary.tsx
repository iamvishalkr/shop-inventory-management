"use client";

import React from "react";
import { Zap, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/utils/price";
import type { CartItem } from "@/types/shop";

interface BillSummaryProps {
  cartItems: CartItem[];
  totalUnits: number;
  rawSubtotalCents: number;
  totalDiscountCents: number;
  grandTotalCents: number;
  currencySymbol: string;
  formError: string;
  successMessage: string;
  isSubmitting: boolean;
  onPlaceOrder: (e: React.FormEvent) => void;
}

export function BillSummary({
  cartItems,
  totalUnits,
  rawSubtotalCents,
  totalDiscountCents,
  grandTotalCents,
  currencySymbol,
  formError,
  successMessage,
  isSubmitting,
  onPlaceOrder,
}: BillSummaryProps) {
  return (
    <Card className="shadow-xs border-border/80 sticky top-4">
      <CardHeader className="py-3 px-4 border-b border-border">
        <CardTitle className="text-base font-semibold">
          Bill Summary
        </CardTitle>
        <CardDescription className="text-xs">
          Calculated order breakdown & grand total.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Distinct Items</span>
            <span className="font-medium text-foreground">
              {cartItems.length}
            </span>
          </div>

          <div className="flex justify-between text-muted-foreground">
            <span>Total Units</span>
            <span className="font-medium text-foreground">{totalUnits}</span>
          </div>

          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal (Gross)</span>
            <span className="font-medium text-foreground">
              {formatPrice(rawSubtotalCents, currencySymbol)}
            </span>
          </div>

          {totalDiscountCents > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
              <span>Discount Savings</span>
              <span>-{formatPrice(totalDiscountCents, currencySymbol)}</span>
            </div>
          )}

          <div className="pt-2 border-t border-border flex items-baseline justify-between">
            <span className="text-base font-bold text-foreground">
              Grand Total
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-primary">
              {formatPrice(grandTotalCents, currencySymbol)}
            </span>
          </div>
        </div>

        {formError && (
          <div className="p-3 rounded-md bg-destructive/15 text-destructive font-medium text-xs flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-medium text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <Button
          onClick={onPlaceOrder}
          disabled={isSubmitting || cartItems.length === 0}
          size="lg"
          className="w-full font-bold shadow-md h-12 text-base gap-2"
        >
          <Zap className="h-5 w-5" />
          {isSubmitting ? "Processing Sale..." : "Complete Sale & Checkout"}
        </Button>
      </CardContent>
    </Card>
  );
}

