"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { useBulkCreateProducts } from "@/hooks/use-products";
import { useShop } from "@/store/shop-store";
import { toCents } from "@/utils/price";
import { io, Socket } from "socket.io-client";
import QRCode from "react-qr-code";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  Save,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  ScanBarcode,
  QrCode,
  Smartphone,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

interface DraftRow {
  id: string;
  barcode: string;
  p_name: string;
  p_costprice: string;
  p_price: string;
  p_stock: string;
  errors?: {
    barcode?: string;
    p_name?: string;
    p_costprice?: string;
    p_price?: string;
    p_stock?: string;
  };
}

function createEmptyRow(): DraftRow {
  return {
    id: Math.random().toString(36).substring(2, 9),
    barcode: "",
    p_name: "",
    p_costprice: "",
    p_price: "",
    p_stock: "",
  };
}

function playScanChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6 chime
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch (err) {
    console.warn("Chime error:", err);
  }
}

export default function BulkAddProductsPage() {
  const router = useRouter();
  const locale = useLocale();
  const { activeShop } = useShop();
  const currencySymbol = activeShop?.currency || "$";

  const [rows, setRows] = useState<DraftRow[]>([
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
  ]);
  const [globalError, setGlobalError] = useState("");
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [recentlyScannedRowId, setRecentlyScannedRowId] = useState<string | null>(null);

  // Companion Scanner State
  const [sessionId] = useState(() => "s-" + Math.random().toString(36).substring(2, 8));
  const [phoneConnected, setPhoneConnected] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const bulkCreateMutation = useBulkCreateProducts();

  // References for focusing input elements dynamically
  const nameInputsRef = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const barcodeInputsRef = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const activeRowIdRef = useRef<string | null>(null);
  activeRowIdRef.current = activeRowId;
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const socketRef = useRef<Socket | null>(null);

  // Compute mobile scanner URL
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const scanUrl = `${origin}/${locale}/scan?id=${sessionId}`;

  // Handle incoming barcode from phone
  const handleBarcodeReceived = useCallback((code: string) => {
    playScanChime();

    setRows((currentRows) => {
      let targetIndex = -1;

      // 1. If user has actively focused a row, use that row
      if (activeRowIdRef.current) {
        targetIndex = currentRows.findIndex((r) => r.id === activeRowIdRef.current);
      }

      // 2. Otherwise find the first row without a barcode
      if (targetIndex === -1 || (currentRows[targetIndex] && currentRows[targetIndex].barcode.trim())) {
        targetIndex = currentRows.findIndex((r) => !r.barcode.trim() && !r.p_name.trim());
      }

      // 3. Fallback: find any row without barcode
      if (targetIndex === -1) {
        targetIndex = currentRows.findIndex((r) => !r.barcode.trim());
      }

      let updatedRows = [...currentRows];
      let targetRowId = "";

      if (targetIndex !== -1) {
        targetRowId = updatedRows[targetIndex].id;
        updatedRows[targetIndex] = {
          ...updatedRows[targetIndex],
          barcode: code,
          errors: { ...updatedRows[targetIndex].errors, barcode: undefined },
        };
      } else {
        // All existing rows have barcodes, create a new row
        const newRow = createEmptyRow();
        newRow.barcode = code;
        targetRowId = newRow.id;
        updatedRows.push(newRow);
      }

      // Flash highlight on the updated row
      setRecentlyScannedRowId(targetRowId);
      setTimeout(() => setRecentlyScannedRowId(null), 1500);

      // Focus product name on target row so user can immediately type
      setTimeout(() => {
        if (nameInputsRef.current[targetRowId]) {
          nameInputsRef.current[targetRowId]?.focus();
          setActiveRowId(targetRowId);
        }
      }, 50);

      return updatedRows;
    });
  }, []);

  // Connect PC to Socket.IO pairing room
  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
    const socket = io(backendUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-session", { sessionId, role: "pc" });
    });

    socket.on("phone-connected", () => {
      setPhoneConnected(true);
    });

    socket.on("peer-status", (data: { role: string; status: string }) => {
      if (data.role === "phone") {
        setPhoneConnected(data.status === "connected");
      }
    });

    socket.on("phone-disconnected", () => {
      setPhoneConnected(false);
    });

    socket.on("barcode-received", (data: { code: string; format?: string }) => {
      if (data?.code) {
        handleBarcodeReceived(data.code);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [sessionId, handleBarcodeReceived]);

  const handleRowChange = (id: string, field: keyof DraftRow, value: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };
        if (updated.errors) {
          updated.errors = { ...updated.errors, [field]: undefined };
        }
        return updated;
      })
    );
  };

  const addRows = (count = 1) => {
    const newItems = Array.from({ length: count }, () => createEmptyRow());
    setRows((prev) => [...prev, ...newItems]);
    setTimeout(() => {
      if (newItems[0] && nameInputsRef.current[newItems[0].id]) {
        nameInputsRef.current[newItems[0].id]?.focus();
      }
    }, 50);
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) {
      setRows([createEmptyRow()]);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const duplicateRow = (id: string) => {
    const target = rows.find((r) => r.id === id);
    if (!target) return;
    const duplicated: DraftRow = {
      ...target,
      id: Math.random().toString(36).substring(2, 9),
      p_name: target.p_name ? `${target.p_name} (Copy)` : "",
      errors: undefined,
    };
    const targetIdx = rows.findIndex((r) => r.id === id);
    const updated = [...rows];
    updated.splice(targetIdx + 1, 0, duplicated);
    setRows(updated);
  };

  const clearAll = () => {
    setRows([
      createEmptyRow(),
      createEmptyRow(),
      createEmptyRow(),
      createEmptyRow(),
      createEmptyRow(),
    ]);
    setGlobalError("");
  };

  // Check whether a row has any user input
  const isRowPartiallyFilled = (row: DraftRow) => {
    return (
      (row.barcode?.trim() || "") !== "" ||
      row.p_name.trim() !== "" ||
      row.p_costprice.trim() !== "" ||
      row.p_price.trim() !== "" ||
      row.p_stock.trim() !== ""
    );
  };

  // Validation function
  const validateRows = () => {
    let hasErrors = false;
    let filledCount = 0;

    const nameCounts = new Map<string, number>();
    for (const row of rows) {
      if (isRowPartiallyFilled(row)) {
        const normalizedName = row.p_name.trim().toLowerCase();
        if (normalizedName) {
          nameCounts.set(normalizedName, (nameCounts.get(normalizedName) || 0) + 1);
        }
      }
    }

    const validated = rows.map((row) => {
      if (!isRowPartiallyFilled(row)) {
        return { ...row, errors: undefined };
      }

      filledCount++;
      const errors: DraftRow["errors"] = {};
      const trimmedName = row.p_name.trim();

      if (!trimmedName) {
        errors.p_name = "Product name is required";
        hasErrors = true;
      } else if ((nameCounts.get(trimmedName.toLowerCase()) || 0) > 1) {
        errors.p_name = "Duplicate product name in list";
        hasErrors = true;
      }

      const rawPrice = parseFloat(row.p_price);
      if (!row.p_price.trim() || isNaN(rawPrice) || rawPrice <= 0) {
        errors.p_price = "Selling price must be > 0";
        hasErrors = true;
      }

      const rawCost = parseFloat(row.p_costprice);
      if (isNaN(rawCost) || rawCost < 0) {
        errors.p_costprice = "Cost price must be >= 0";
        hasErrors = true;
      }

      const rawStock = parseInt(row.p_stock, 10);
      if (!row.p_stock.trim() || isNaN(rawStock) || rawStock < 0) {
        errors.p_stock = "Stock must be >= 0";
        hasErrors = true;
      }

      return { ...row, errors };
    });

    setRows(validated);

    if (filledCount === 0) {
      setGlobalError("Please fill in at least one product before saving.");
      return null;
    }

    if (hasErrors) {
      setGlobalError("Please fix highlighted errors before saving.");
      return null;
    }

    setGlobalError("");
    return validated.filter(isRowPartiallyFilled);
  };

  const handleSaveAll = async () => {
    const validRows = validateRows();
    if (!validRows) return;

    // As requested: ignores barcode field for backend payload until server model is updated
    const payload = validRows.map((r) => {
      const costPriceInCents = r.p_costprice.trim() ? toCents(r.p_costprice) : 0;
      const priceInCents = toCents(r.p_price);
      const stock = parseInt(r.p_stock, 10);
      return {
        p_name: r.p_name.trim(),
        p_price: priceInCents,
        p_costprice: costPriceInCents,
        p_stock: stock,
      };
    });

    try {
      await bulkCreateMutation.mutateAsync(payload);
      router.push("/dashboard/products");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to bulk create products.";
      setGlobalError(msg);
    }
  };

  // Keyboard navigation: pressing Tab on the last row's stock cell creates a new row
  const handleKeyDownOnLastCell = (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number
  ) => {
    if (e.key === "Tab" && !e.shiftKey && idx === rows.length - 1) {
      e.preventDefault();
      addRows(1);
    }
  };

  const copyScanUrl = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(scanUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const filledRowsCount = rows.filter(isRowPartiallyFilled).length;

  return (
    <div className="p-2 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link
              href="/dashboard/products"
              className="hover:text-foreground inline-flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Products
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Bulk Add Products
          </h1>
          <p className="text-muted-foreground text-sm">
            Quickly enter multiple items in spreadsheet mode or use your phone camera to scan barcodes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Companion Scanner Trigger Button */}
          <Button
            variant={phoneConnected ? "default" : "outline"}
            onClick={() => setIsQrModalOpen(true)}
            className={`gap-2 ${phoneConnected
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "border-slate-300 dark:border-slate-700"
              }`}
          >
            {phoneConnected ? (
              <>
                <Smartphone className="h-4 w-4" />
                <span>Phone Scanner Linked</span>
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4" />
                <span>Scan via Phone</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={clearAll}
            disabled={bulkCreateMutation.isPending}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset All
          </Button>

          <Button
            onClick={handleSaveAll}
            disabled={bulkCreateMutation.isPending || filledRowsCount === 0}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {bulkCreateMutation.isPending
              ? "Saving Products..."
              : `Save ${filledRowsCount} Product${filledRowsCount === 1 ? "" : "s"}`}
          </Button>
        </div>
      </div>

      {/* Phone Connected Active Banner */}
      {phoneConnected && (
        <div className="flex items-center justify-between p-3.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs">
          <div className="flex items-center gap-2.5 font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>
              <strong>Companion Phone Scanner Active</strong> (Session:{" "}
              <code className="bg-emerald-500/15 px-1 py-0.5 rounded font-mono font-semibold">
                {sessionId}
              </code>
              ). Point your phone camera at barcodes to auto-fill the rows below.
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsQrModalOpen(true)}
            className="h-7 text-xs text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/20"
          >
            View QR
          </Button>
        </div>
      )}

      {/* Global Error Banner */}
      {globalError && (
        <div className="flex items-center gap-2 p-4 text-sm rounded-lg bg-destructive/15 text-destructive font-medium border border-destructive/20">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{globalError}</span>
        </div>
      )}

      {/* Spreadsheet Card */}
      <Card className="shadow-xs overflow-hidden p-0!">
        <CardHeader className="py-4 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">Inventory Spreadsheet</CardTitle>
              <Badge variant="outline" className="text-xs">
                {rows.length} Rows ({filledRowsCount} filled)
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <HelpCircle className="h-3.5 w-3.5" />
              <span>
                Press <kbd className="px-1.5 py-0.5 rounded bg-muted border font-mono">Tab</kbd> on the last cell to add a new row
              </span>
            </div>
          </div>
          <CardDescription>
            Enter details for each product or auto-fill barcodes using your phone.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[1050px]">
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[50px] text-center font-semibold text-muted-foreground">
                    #
                  </TableHead>
                  <TableHead className="w-[180px]">
                    <div className="flex items-center gap-1.5">
                      <ScanBarcode className="h-4 w-4 text-muted-foreground" />
                      <span>Barcode</span>
                    </div>
                  </TableHead>
                  <TableHead className="min-w-[220px]">
                    Product Name <span className="text-destructive">*</span>
                  </TableHead>
                  <TableHead className="w-[130px]">Cost Price</TableHead>
                  <TableHead className="w-[130px]">
                    Selling Price <span className="text-destructive">*</span>
                  </TableHead>
                  <TableHead className="w-[110px] text-center">Est. Margin</TableHead>
                  <TableHead className="w-[120px]">
                    Stock <span className="text-destructive">*</span>
                  </TableHead>
                  <TableHead className="w-[90px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, idx) => {
                  const cost = parseFloat(row.p_costprice);
                  const price = parseFloat(row.p_price);
                  const hasMargin = !isNaN(cost) && !isNaN(price) && price > 0 && cost >= 0;
                  const profit = hasMargin ? price - cost : 0;
                  const marginPct = hasMargin && price > 0 ? (profit / price) * 100 : 0;
                  const isRecentlyScanned = recentlyScannedRowId === row.id;

                  return (
                    <TableRow
                      key={row.id}
                      className={`hover:bg-muted/20 transition-colors ${isRecentlyScanned
                          ? "bg-emerald-500/15 transition-all duration-500"
                          : row.id === activeRowId
                            ? "bg-muted/10"
                            : ""
                        }`}
                    >
                      {/* Row Index */}
                      <TableCell className="text-center font-medium text-muted-foreground text-xs">
                        {idx + 1}
                      </TableCell>

                      {/* Barcode Input */}
                      <TableCell>
                        <InputGroup
                          className={`h-9 font-mono ${isRecentlyScanned
                              ? "border-emerald-500 ring-2 ring-emerald-500/20"
                              : row.id === activeRowId
                                ? "border-primary/50"
                                : ""
                            }`}
                        >
                          <InputGroupAddon align="inline-start" className="text-muted-foreground px-2">
                            <ScanBarcode className="h-3.5 w-3.5" />
                          </InputGroupAddon>
                          <InputGroupInput
                            ref={(el) => {
                              barcodeInputsRef.current[row.id] = el;
                            }}
                            placeholder="Scan or type..."
                            value={row.barcode}
                            onFocus={() => setActiveRowId(row.id)}
                            onChange={(e) => handleRowChange(row.id, "barcode", e.target.value)}
                            className="text-xs px-1"
                          />
                        </InputGroup>
                      </TableCell>

                      {/* Product Name */}
                      <TableCell>
                        <div className="space-y-1">
                          <Input
                            ref={(el) => {
                              nameInputsRef.current[row.id] = el;
                            }}
                            placeholder="e.g. Wireless Mouse"
                            value={row.p_name}
                            onFocus={() => setActiveRowId(row.id)}
                            onChange={(e) => handleRowChange(row.id, "p_name", e.target.value)}
                            className={`h-9 text-sm ${row.errors?.p_name ? "border-destructive focus-visible:ring-destructive" : ""
                              }`}
                          />
                          {row.errors?.p_name && (
                            <span className="text-[11px] text-destructive font-medium block">
                              {row.errors.p_name}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Cost Price */}
                      <TableCell>
                        <div className="space-y-1">
                          <InputGroup
                            className={`h-9 ${row.errors?.p_costprice ? "border-destructive ring-destructive/20" : ""
                              }`}
                          >
                            <InputGroupAddon align="inline-start" className="text-xs font-semibold px-2">
                              {currencySymbol}
                            </InputGroupAddon>
                            <InputGroupInput
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={row.p_costprice}
                              onFocus={() => setActiveRowId(row.id)}
                              onChange={(e) =>
                                handleRowChange(row.id, "p_costprice", e.target.value)
                              }
                              className="text-sm px-1"
                            />
                          </InputGroup>

                          {row.errors?.p_costprice && (
                            <span className="text-[11px] text-destructive font-medium block">
                              {row.errors.p_costprice}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Selling Price */}
                      <TableCell>
                        <div className="space-y-1">
                          <InputGroup
                            className={`h-9 ${row.errors?.p_price ? "border-destructive ring-destructive/20" : ""
                              }`}
                          >
                            <InputGroupAddon align="inline-start" className="text-xs font-semibold px-2">
                              {currencySymbol}
                            </InputGroupAddon>
                            <InputGroupInput
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={row.p_price}
                              onFocus={() => setActiveRowId(row.id)}
                              onChange={(e) => handleRowChange(row.id, "p_price", e.target.value)}
                              className="text-sm px-1"
                            />
                          </InputGroup>

                          {row.errors?.p_price && (
                            <span className="text-[11px] text-destructive font-medium block">
                              {row.errors.p_price}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Estimated Margin */}
                      <TableCell className="text-center">
                        {hasMargin ? (
                          <div className="inline-flex flex-col items-center">
                            <Badge
                              variant={profit >= 0 ? "secondary" : "destructive"}
                              className="text-[11px] font-semibold px-2 py-0.5"
                            >
                              {profit >= 0 ? "+" : ""}
                              {marginPct.toFixed(0)}%
                            </Badge>
                            <span className="text-[10px] text-muted-foreground mt-0.5">
                              {profit >= 0 ? "+" : ""}
                              {currencySymbol}
                              {profit.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>

                      {/* Stock Quantity */}
                      <TableCell>
                        <div className="space-y-1">
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={row.p_stock}
                            onFocus={() => setActiveRowId(row.id)}
                            onChange={(e) => handleRowChange(row.id, "p_stock", e.target.value)}
                            onKeyDown={(e) => handleKeyDownOnLastCell(e, idx)}
                            className={`h-9 text-sm ${row.errors?.p_stock ? "border-destructive focus-visible:ring-destructive" : ""
                              }`}
                          />
                          {row.errors?.p_stock && (
                            <span className="text-[11px] text-destructive font-medium block">
                              {row.errors.p_stock}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => duplicateRow(row.id)}
                            title="Duplicate Row"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => removeRow(row.id)}
                            title="Delete Row"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Add Row Controls */}
          <div className="p-4 border-t border-border bg-muted/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addRows(1)}
                className="gap-1.5 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Row
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addRows(5)}
                className="gap-1.5 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Add 5 Rows
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {filledRowsCount} of {rows.length} rows ready
              </span>
              <Button
                size="sm"
                onClick={handleSaveAll}
                disabled={bulkCreateMutation.isPending || filledRowsCount === 0}
                className="gap-1.5 text-xs"
              >
                <Save className="h-3.5 w-3.5" />
                Save All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Companion Scanner Dialog */}
      <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2 text-lg">
              <Smartphone className="h-5 w-5 text-primary" />
              <span>Connect Phone Scanner</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Scan this QR code with your mobile camera. Once linked, any barcode scanned on your phone will automatically fill in this table.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-4 space-y-4">
            {/* QR Code Box */}
            <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200 inline-flex items-center justify-center">
              <QRCode value={scanUrl} size={190} level="M" />
            </div>

            {/* Connection Status Indicator */}
            <Badge
              variant={phoneConnected ? "default" : "outline"}
              className={`py-1 px-3 text-xs flex items-center gap-2 ${phoneConnected
                  ? "bg-emerald-600 text-white"
                  : "border-slate-300 dark:border-slate-700 text-muted-foreground"
                }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${phoneConnected ? "bg-white animate-pulse" : "bg-amber-500"
                  }`}
              />
              {phoneConnected ? "Phone Connected & Ready!" : "Waiting for phone to scan QR..."}
            </Badge>

            {/* Direct Link & Copy */}
            <div className="w-full space-y-1.5 text-left pt-2 border-t border-border">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Scanner Link:</span>
                <span className="font-mono text-[11px]">Session: {sessionId}</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={scanUrl}
                  className="text-xs font-mono h-8 bg-muted/40 select-all"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyScanUrl}
                  className="h-8 px-2.5 shrink-0 text-xs"
                >
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  {copiedUrl ? "Copied!" : "Copy"}
                </Button>
                <a
                  href={scanUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
                  title="Open scanner in new tab (for testing)"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground text-center">
              Make sure your phone and PC can reach the same network address.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}