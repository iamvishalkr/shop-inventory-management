"use client";

import React from "react";
import { AlertCircle, Package } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface BarcodeNotFoundDialogProps {
  open: boolean;
  barcode: string | null;
  onClose: () => void;
  onAddProduct: (barcode: string) => void;
}

export function BarcodeNotFoundDialog({
  open,
  barcode,
  onClose,
  onAddProduct,
}: BarcodeNotFoundDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-lg">Product Not Found</DialogTitle>
              <DialogDescription className="text-xs">
                Barcode is not registered in this shop.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-3 space-y-3">
          <p className="text-sm text-muted-foreground">
            No inventory record exists with barcode:
          </p>
          <div className="p-3 rounded-md bg-muted font-mono font-bold text-center text-foreground text-base tracking-wider border border-border">
            {barcode}
          </div>
          <p className="text-xs text-muted-foreground">
            Would you like to register this product now? The barcode will be
            automatically filled in the product creation spreadsheet.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Dismiss
          </Button>
          <Button
            onClick={() => {
              if (barcode) {
                onAddProduct(barcode);
              }
            }}
            className="gap-1.5"
          >
            <Package className="h-4 w-4" />
            Add to Inventory
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
