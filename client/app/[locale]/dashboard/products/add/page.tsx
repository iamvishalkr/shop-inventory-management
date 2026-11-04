"use client";

import React, { useState, useRef } from "react";
import { useRouter, Link } from "@/i18n/navigation";
import { useBulkCreateProducts } from "@/hooks/use-products";
import { useShop } from "@/store/shop-store";
import { toCents } from "@/utils/price";
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
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  Save,
  RotateCcw,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

interface DraftRow {
  id: string;
  p_name: string;
  p_costprice: string;
  p_price: string;
  p_stock: string;
  errors?: {
    p_name?: string;
    p_costprice?: string;
    p_price?: string;
    p_stock?: string;
  };
}

function createEmptyRow(): DraftRow {
  return {
    id: Math.random().toString(36).substring(2, 9),
    p_name: "",
    p_costprice: "",
    p_price: "",
    p_stock: "",
  };
}

export default function BulkAddProductsPage() {
  const router = useRouter();
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
  const bulkCreateMutation = useBulkCreateProducts();

  // Reference for focusing input elements dynamically
  const nameInputsRef = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleRowChange = (id: string, field: keyof DraftRow, value: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };
        // Clear specific field error when user types
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

    // First pass: count occurrences of each normalized product name to identify duplicates
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
      // if (row.p_costprice.trim()) {
      // }

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
            Quickly enter multiple items in spreadsheet mode. Empty rows will be ignored.
          </p>
        </div>

        <div className="flex items-center gap-3">
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
              <span>Press <kbd className="px-1.5 py-0.5 rounded bg-muted border font-mono">Tab</kbd> on the last cell to add a new row</span>
            </div>
          </div>
          <CardDescription>
            Enter details for each product.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[50px] text-center font-semibold text-muted-foreground">
                    #
                  </TableHead>
                  <TableHead className="min-w-[240px]">
                    Product Name <span className="text-destructive">*</span>
                  </TableHead>
                  <TableHead className="w-[140px]">Cost Price</TableHead>
                  <TableHead className="w-[140px]">
                    Selling Price <span className="text-destructive">*</span>
                  </TableHead>
                  <TableHead className="w-[120px] text-center">Est. Margin</TableHead>
                  <TableHead className="w-[130px]">
                    Stock <span className="text-destructive">*</span>
                  </TableHead>
                  <TableHead className="w-[100px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, idx) => {
                  const cost = parseFloat(row.p_costprice);
                  const price = parseFloat(row.p_price);
                  const hasMargin = !isNaN(cost) && !isNaN(price) && price > 0 && cost >= 0;
                  const profit = hasMargin ? price - cost : 0;
                  const marginPct = hasMargin && price > 0 ? (profit / price) * 100 : 0;

                  return (
                    <TableRow key={row.id} className="hover:bg-muted/20 transition-colors">
                      {/* Row Index */}
                      <TableCell className="text-center font-medium text-muted-foreground text-xs">
                        {idx + 1}
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
                          {/* New InputGroup implementation */}
                          <InputGroup
                            className={`h-9 ${row.errors?.p_costprice
                              ? "border-destructive ring-destructive/20"
                              : ""
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
                          {/* New InputGroup implementation */}
                          <InputGroup
                            className={`h-9 ${row.errors?.p_price
                              ? "border-destructive ring-destructive/20"
                              : ""
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
    </div>
  );
}