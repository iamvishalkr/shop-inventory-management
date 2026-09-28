"use client";

import React, { useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Sale } from "@/types/shop";
import { calculateGrandTotal, formatPrice } from "@/utils/price";

// Dynamically import React-PDF component to disable SSR
const InvoicePdfDownload = dynamic(
  () => import("./invoice-pdf-document").then((mod) => mod.InvoicePdfDownload),
  { ssr: false },
);

function subscribe() {
  return () => {};
}

function getSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

interface InvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale | null;
}

export function InvoiceModal({ open, onOpenChange, sale }: InvoiceModalProps) {
  const isMounted = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (!sale) return null;

  const grandTotalCents = calculateGrandTotal(sale.cartItems);
  const grandTotalDisplay = formatPrice(grandTotalCents, "Rs.");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <ReceiptIcon className="h-5 w-5 text-primary" />
            Sales Invoice #{sale.id.slice(-6).toUpperCase()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4 border-y border-border text-sm">
          {/* Header info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 p-3 rounded-lg border border-border">
              <h4 className="font-semibold text-muted-foreground mb-1 text-xs uppercase">
                Billing Information
              </h4>
              <p className="font-bold text-foreground">Shop Admin Store</p>
              <p className="text-muted-foreground text-xs">123 Main Street</p>
              <p className="text-muted-foreground text-xs">City, State 12345</p>
              <p className="text-muted-foreground text-xs">
                Contact: (555) 555-5555
              </p>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg border border-border">
              <h4 className="font-semibold text-muted-foreground mb-1 text-xs uppercase">
                Client Information
              </h4>
              <p className="font-bold text-foreground">{sale.cust_name}</p>
              <p className="text-muted-foreground text-xs">{sale.cust_email}</p>
              <p className="text-muted-foreground text-xs">
                Contact: {sale.cust_contact}
              </p>
            </div>
          </div>

          {/* Cart Items Table Preview */}
          <div>
            <h4 className="font-semibold text-foreground mb-2">
              Order Details
            </h4>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted font-medium text-muted-foreground border-b border-border">
                  <tr>
                    <th className="p-2">#</th>
                    <th className="p-2">Item</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Unit Price</th>
                    <th className="p-2 text-right">Disc %</th>
                    <th className="p-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sale.cartItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2 text-muted-foreground">{idx + 1}</td>
                      <td className="p-2 font-medium">{item.c_name}</td>
                      <td className="p-2 text-center">{item.c_quantity}</td>
                      <td className="p-2 text-right">
                        {formatPrice(item.c_unit_price, "Rs.")}
                      </td>
                      <td className="p-2 text-right">{item.c_discount}%</td>
                      <td className="p-2 text-right font-medium">
                        {formatPrice(item.c_subtotal, "Rs.")}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/30 font-bold border-t border-border">
                    <td colSpan={5} className="p-2 text-right">
                      Grand Total:
                    </td>
                    <td className="p-2 text-right text-primary text-sm">
                      {grandTotalDisplay}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>

          {isMounted && (
            <InvoicePdfDownload sale={sale} grandTotal={grandTotalDisplay} />
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReceiptIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M16 8h-6" />
      <path d="M16 12H8" />
      <path d="M13 16H8" />
    </svg>
  );
}
