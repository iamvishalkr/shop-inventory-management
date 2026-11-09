"use client";

import React from "react";
import { Package, Trash2, ScanBarcode } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { formatPrice, toMajor } from "@/utils/price";
import type { CartItem } from "@/types/shop";

interface PosCartTableProps {
  cartItems: CartItem[];
  recentlyScannedId: string | null;
  currencySymbol: string;
  totalUnits: number;
  onClearCart: () => void;
  onRemoveItem: (id: string) => void;
  onQuantityChange: (id: string, qty: number) => void;
  onDiscountChange: (id: string, discount: number) => void;
  onUnitPriceChange: (id: string, unitPriceMajor: number) => void;
}

export function PosCartTable({
  cartItems,
  recentlyScannedId,
  currencySymbol,
  totalUnits,
  onClearCart,
  onRemoveItem,
  onQuantityChange,
  onDiscountChange,
  onUnitPriceChange,
}: PosCartTableProps) {
  return (
    <Card className="shadow-xs overflow-hidden border-border/80">
      <CardHeader className="py-3 px-4 bg-muted/30 border-b border-border flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            Cart Spreadsheet
            {cartItems.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="text-xs">
            Review items, adjust quantities, or apply item discounts.
          </CardDescription>
        </div>

        {cartItems.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearCart}
            className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear Cart
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {cartItems.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="h-14 w-14 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
              <ScanBarcode className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-foreground text-sm">
                Cart is currently empty
              </p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Scan product barcodes with a USB scanner, connect a phone
                camera, or type product names in the search bar above.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="text-xs">
                  <TableHead className="w-[45px] text-center">#</TableHead>
                  <TableHead className="min-w-[180px]">Product</TableHead>
                  <TableHead className="w-[90px] text-center">Stock</TableHead>
                  <TableHead className="w-[120px] text-right">Price</TableHead>
                  <TableHead className="w-[110px] text-center">Qty</TableHead>
                  <TableHead className="w-[100px] text-center">Disc (%)</TableHead>
                  <TableHead className="w-[110px] text-right">Subtotal</TableHead>
                  <TableHead className="w-[50px] text-center pr-3"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cartItems.map((item, idx) => {
                  const isRecentlyScanned = recentlyScannedId === item.c_id;
                  return (
                    <TableRow
                      key={item.c_id}
                      className={`transition-colors duration-500 ${
                        isRecentlyScanned
                          ? "bg-primary/15 dark:bg-primary/20"
                          : ""
                      }`}
                    >
                      <TableCell className="text-center text-xs text-muted-foreground font-mono">
                        {idx + 1}
                      </TableCell>

                      {/* Product Name & Barcode */}
                      <TableCell className="py-2.5">
                        <div className="font-semibold text-sm text-foreground">
                          {item.c_name}
                        </div>
                        {item.c_barcode && (
                          <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-1 mt-0.5">
                            <ScanBarcode className="h-3 w-3 inline" />
                            <span>{item.c_barcode}</span>
                          </div>
                        )}
                      </TableCell>

                      {/* Stock Indicator */}
                      <TableCell className="text-center py-2.5">
                        <Badge
                          variant={
                            (item.c_stock ?? 0) <= 5 ? "destructive" : "secondary"
                          }
                          className="text-[11px] font-mono"
                        >
                          {item.c_stock !== undefined ? item.c_stock : "-"}
                        </Badge>
                      </TableCell>

                      {/* Unit Price (Editable override) */}
                      <TableCell className="text-right py-2.5">
                        <div className="flex items-center justify-end">
                          <span className="text-xs text-muted-foreground mr-1">
                            {currencySymbol}
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={toMajor(item.c_unit_price)}
                            onChange={(e) =>
                              onUnitPriceChange(
                                item.c_id,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="h-8 w-20 text-right text-xs font-mono font-medium px-2"
                          />
                        </div>
                      </TableCell>

                      {/* Quantity */}
                      <TableCell className="text-center py-2.5">
                        <Input
                          id={`qty-${item.c_id}`}
                          type="number"
                          min={1}
                          max={item.c_stock || 9999}
                          value={item.c_quantity}
                          onChange={(e) =>
                            onQuantityChange(
                              item.c_id,
                              parseInt(e.target.value, 10) || 1
                            )
                          }
                          className="h-8 w-20 mx-auto text-center font-bold text-xs"
                        />
                      </TableCell>

                      {/* Discount (%) */}
                      <TableCell className="text-center py-2.5">
                        <div className="flex items-center justify-center">
                          <Input
                            id={`disc-${item.c_id}`}
                            type="number"
                            min={0}
                            max={100}
                            value={item.c_discount}
                            onChange={(e) =>
                              onDiscountChange(
                                item.c_id,
                                parseInt(e.target.value, 10) || 0
                              )
                            }
                            className="h-8 w-16 text-center text-xs font-mono"
                          />
                          <span className="text-xs text-muted-foreground ml-1">
                            %
                          </span>
                        </div>
                      </TableCell>

                      {/* Subtotal */}
                      <TableCell className="text-right font-bold text-sm text-foreground py-2.5">
                        {formatPrice(item.c_subtotal, currencySymbol)}
                      </TableCell>

                      {/* Remove Action */}
                      <TableCell className="text-center py-2.5 pr-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onRemoveItem(item.c_id)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Table Keyboard Navigation Shortcuts Footer */}
        <div className="p-3 bg-muted/20 border-t border-border flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1">
              <Kbd>Tab</Kbd> Next field
            </span>
            <span className="flex items-center gap-1">
              <Kbd>Shift + Tab</Kbd> Prev field
            </span>
            <span className="flex items-center gap-1">
              <Kbd>↑ / ↓</Kbd> Adjust Quantity
            </span>
          </div>

          <div className="font-medium text-foreground">
            Total Items: <span className="font-bold">{cartItems.length}</span> |
            Units: <span className="font-bold">{totalUnits}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

