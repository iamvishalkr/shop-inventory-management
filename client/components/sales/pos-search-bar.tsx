"use client";

import React, { useRef, useEffect } from "react";
import { Search, X, ScanBarcode } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Kbd } from "@/components/ui/kbd";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/utils/price";
import type { Product } from "@/types/shop";

interface PosSearchBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  filteredProducts: Product[];
  onSelectProduct: (product: Product) => void;
  currencySymbol: string;
  phoneConnected: boolean;
  phoneCount: number;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
}

export function PosSearchBar({
  searchQuery,
  onSearchChange,
  onSearchKeyDown,
  filteredProducts,
  onSelectProduct,
  currencySymbol,
  phoneConnected,
  phoneCount,
  isDropdownOpen,
  setIsDropdownOpen,
}: PosSearchBarProps) {
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsDropdownOpen]);

  // Global "/" shortcut to focus search input
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, []);

  return (
    <Card className="shadow-xs overflow-visible border-border/80">
      <CardContent className="p-3 sm:p-4 space-y-2">
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              ref={searchInputRef}
              id="pos-search-input"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => {
                if (searchQuery.trim().length > 0) setIsDropdownOpen(true);
              }}
              onKeyDown={onSearchKeyDown}
              placeholder="Search by name or scan barcode (Press Enter to add)..."
              className="pl-9 pr-24 h-11 text-base bg-background"
            />
            <div className="absolute right-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    onSearchChange("");
                    setIsDropdownOpen(false);
                    searchInputRef.current?.focus();
                  }}
                  className="text-muted-foreground hover:text-foreground p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <Kbd className="hidden sm:inline-flex">/</Kbd>
              )}
            </div>
          </div>

          {/* Instant Offline Search Dropdown */}
          {isDropdownOpen && searchQuery.trim().length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-popover text-popover-foreground rounded-lg border border-border shadow-xl max-h-80 overflow-y-auto"
            >
              {filteredProducts.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-sm font-medium text-foreground">
                    No products found matching &ldquo;{searchQuery}&rdquo;
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Press <Kbd>Enter</Kbd> to lookup or register this barcode.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {filteredProducts.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => onSelectProduct(prod)}
                      className={`p-3 flex items-center justify-between cursor-pointer transition-colors hover:bg-muted/60 ${
                        prod.p_stock <= 0
                          ? "opacity-60 cursor-not-allowed bg-muted/20"
                          : ""
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                          <span>{prod.p_name}</span>
                          {prod.barcode && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] font-mono px-1.5 py-0"
                            >
                              <ScanBarcode className="h-3 w-3 inline mr-1" />
                              {prod.barcode}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Stock:{" "}
                          <span
                            className={`font-semibold ${
                              prod.p_stock <= 5
                                ? "text-amber-500"
                                : "text-foreground"
                            }`}
                          >
                            {prod.p_stock} available
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-foreground text-sm">
                          {formatPrice(prod.p_price, currencySymbol)}
                        </span>
                        <div className="text-[11px] text-primary font-medium mt-0.5">
                          {prod.p_stock > 0 ? "Click to add" : "Out of stock"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hardware Scanner & Companion Status Badges */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              HID Scanner Ready
            </span>
            <span>•</span>
            <span>Scan barcode guns directly anywhere</span>
          </div>

          <div className="flex items-center gap-1 text-[11px]">
            <span>Phone camera:</span>
            <span
              className={
                phoneConnected
                  ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                  : "text-muted-foreground"
              }
            >
              {phoneConnected ? `${phoneCount} phone active` : "not paired"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
