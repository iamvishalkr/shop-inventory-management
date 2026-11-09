"use client";

import React, { useState } from "react";
import QRCode from "react-qr-code";
import { Smartphone, CheckCircle2, Copy, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CompanionScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phoneConnected: boolean;
  phoneCount: number;
  scanUrl: string;
}

export function CompanionScannerDialog({
  open,
  onOpenChange,
  phoneConnected,
  phoneCount,
  scanUrl,
}: CompanionScannerDialogProps) {
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(scanUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            <DialogTitle>Pair Phone as Barcode Scanner</DialogTitle>
          </div>
          <DialogDescription>
            Scan barcodes with your smartphone camera directly into this POS
            cart in real time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 flex flex-col items-center">
          {/* Live Connection Badge */}
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                phoneConnected
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-muted-foreground"
              }`}
            />
            <span className="text-xs font-medium">
              {phoneConnected
                ? `${phoneCount} smartphone(s) connected and ready to scan`
                : "Waiting for smartphone to scan QR code..."}
            </span>
          </div>

          {/* QR Code Container */}
          <div className="p-4 bg-white rounded-xl shadow-inner border border-slate-200">
            <QRCode
              value={scanUrl}
              size={180}
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              viewBox={`0 0 256 256`}
            />
          </div>

          {/* Copy Pairing Link */}
          <div className="w-full space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Or open URL directly on phone:
            </Label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={scanUrl}
                className="text-xs font-mono select-all h-9"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopy}
                className="h-9 px-3 shrink-0"
              >
                {copiedUrl ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <a
                href={scanUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
                title="Open scanner in new tab (for testing)"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground text-center">
            Make sure your phone and PC are connected to the same local network.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

