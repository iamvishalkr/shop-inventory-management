"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { useShop } from "@/store/shop-store";
import { useProducts } from "@/hooks/use-products";
import { useCreateSale } from "@/hooks/use-sales";
import { apiFetch } from "@/lib/api";
import type { CartItem, Product, ApiResponse } from "@/types/shop";
import {
  calculateSubtotal,
  calculateGrandTotal,
  formatPrice,
  toMajor,
  toCents,
} from "@/utils/price";
import { io, Socket } from "socket.io-client";
import QRCode from "react-qr-code";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Kbd } from "@/components/ui/kbd";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ShoppingCart,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ScanBarcode,
  Smartphone,
  QrCode,
  Search,
  Copy,
  ExternalLink,
  UserCheck,
  X,
  Zap,
  Package,
} from "lucide-react";
import Title from "@/components/Title";

function playScanChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
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

export default function DashboardNewSalePage() {
  const router = useRouter();
  const locale = useLocale();
  const { activeShop } = useShop();
  const currencySymbol = activeShop?.currency || "$";

  // Customer Form State
  const [custName, setCustName] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custContact, setCustContact] = useState("");

  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [recentlyScannedId, setRecentlyScannedId] = useState<string | null>(null);

  // Search State & Autocomplete
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Status & Feedback
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // "Barcode Not Found" Dialog State
  const [notFoundBarcode, setNotFoundBarcode] = useState<string | null>(null);
  const [isNotFoundModalOpen, setIsNotFoundModalOpen] = useState(false);

  // Companion Scanner State
  const [sessionId] = useState(() => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return "s-" + crypto.randomUUID().replace(/-/g, "").slice(0, 18);
    }
    return (
      "s-" +
      Math.random().toString(36).substring(2, 12) +
      Math.random().toString(36).substring(2, 12)
    );
  });
  const [phoneCount, setPhoneCount] = useState(0);
  const phoneConnected = phoneCount > 0;
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Refs for tracking mutable state in event listeners
  const cartItemsRef = useRef(cartItems);
  cartItemsRef.current = cartItems;
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const createSaleMutation = useCreateSale();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Product query for dropdown
  const { data: products = [], isFetching: isSearching } = useProducts({
    limit: 10,
    search: debouncedSearch,
  });

  // Mobile scanner URL
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const scanUrl = `${origin}/${locale}/scan?id=${sessionId}`;

  // Helper: Flash row highlight
  const flashRow = (id: string) => {
    setRecentlyScannedId(id);
    setTimeout(() => setRecentlyScannedId(null), 1200);
  };

  // Cart operations
  const handleQuantityChange = useCallback(
    (itemId: string, newQty: number) => {
      setFormError("");
      setCartItems((prev) =>
        prev.map((item) => {
          if (item.c_id !== itemId) return item;
          const maxStock = item.c_stock !== undefined ? item.c_stock : 99999;
          const validQty = Math.max(1, Math.min(newQty, maxStock));
          if (newQty > maxStock) {
            setFormError(`Only ${maxStock} units available for "${item.c_name}".`);
          }
          return {
            ...item,
            c_quantity: validQty,
            c_subtotal: calculateSubtotal(
              item.c_unit_price,
              validQty,
              item.c_discount
            ),
          };
        })
      );
    },
    []
  );

  const handleDiscountChange = useCallback(
    (itemId: string, newDiscount: number) => {
      setFormError("");
      setCartItems((prev) =>
        prev.map((item) => {
          if (item.c_id !== itemId) return item;
          const validDiscount = Math.max(0, Math.min(newDiscount, 100));
          return {
            ...item,
            c_discount: validDiscount,
            c_subtotal: calculateSubtotal(
              item.c_unit_price,
              item.c_quantity,
              validDiscount
            ),
          };
        })
      );
    },
    []
  );

  const handleUnitPriceChange = useCallback(
    (itemId: string, newPriceMajor: number) => {
      setFormError("");
      setCartItems((prev) =>
        prev.map((item) => {
          if (item.c_id !== itemId) return item;
          const newPriceCents = toCents(Math.max(0, newPriceMajor));
          return {
            ...item,
            c_unit_price: newPriceCents,
            c_subtotal: calculateSubtotal(
              newPriceCents,
              item.c_quantity,
              item.c_discount
            ),
          };
        })
      );
    },
    []
  );

  const handleRemoveCartItem = useCallback((id: string) => {
    setCartItems((prev) => prev.filter((item) => item.c_id !== id));
  }, []);

  // Add product to cart (or increment if already in cart)
  const handleAddProduct = useCallback(
    (product: Product) => {
      setFormError("");
      const existing = cartItemsRef.current.find((i) => i.c_id === product.id);

      if (existing) {
        if (
          existing.c_stock !== undefined &&
          existing.c_quantity + 1 > existing.c_stock
        ) {
          setFormError(
            `Cannot add more. Insufficient stock (only ${existing.c_stock} available).`
          );
          return;
        }
        handleQuantityChange(existing.c_id, existing.c_quantity + 1);
        flashRow(existing.c_id);
        playScanChime();
      } else {
        if (product.p_stock <= 0) {
          setFormError(`"${product.p_name}" is out of stock!`);
          return;
        }

        const newItem: CartItem = {
          c_id: product.id,
          c_name: product.p_name,
          c_barcode: product.barcode,
          c_quantity: 1,
          c_unit_price: product.p_price,
          c_discount: 0,
          c_subtotal: calculateSubtotal(product.p_price, 1, 0),
          c_stock: product.p_stock,
        };

        setCartItems((prev) => [...prev, newItem]);
        flashRow(newItem.c_id);
        playScanChime();
      }

      setSearchQuery("");
      setIsDropdownOpen(false);
    },
    [handleQuantityChange]
  );

  // Process scanned or entered barcode
  const handleProcessBarcode = useCallback(
    async (rawCode: string) => {
      const code = rawCode.trim();
      if (!code) return;
      setFormError("");

      // 1. If product is already in the cart, increment it
      const existingInCart = cartItemsRef.current.find(
        (item) => item.c_barcode?.toLowerCase() === code.toLowerCase()
      );

      if (existingInCart) {
        if (
          existingInCart.c_stock !== undefined &&
          existingInCart.c_quantity + 1 > existingInCart.c_stock
        ) {
          setFormError(
            `Cannot add more. Insufficient stock (only ${existingInCart.c_stock} available).`
          );
          return;
        }
        handleQuantityChange(existingInCart.c_id, existingInCart.c_quantity + 1);
        flashRow(existingInCart.c_id);
        playScanChime();
        setSearchQuery("");
        setIsDropdownOpen(false);
        return;
      }

      // 2. Fetch product by barcode from backend
      try {
        const res = await apiFetch<ApiResponse<Product>>(
          `/api/products/barcode/${encodeURIComponent(code)}`
        );
        if (res.data) {
          handleAddProduct(res.data);
          setSearchQuery("");
          setIsDropdownOpen(false);
        }
      } catch (err: any) {
        // Barcode not found in inventory
        setNotFoundBarcode(code);
        setIsNotFoundModalOpen(true);
      }
    },
    [handleAddProduct, handleQuantityChange]
  );

  // Global HID USB/Bluetooth Barcode Scanner Listener
  useEffect(() => {
    let buffer = "";
    let lastTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept shortcut combos (Ctrl+C, Ctrl+V, etc.)
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const currentTime = Date.now();
      const interval = currentTime - lastTime;
      lastTime = currentTime;

      // Hardware barcode scanners send keystrokes < 45-50ms apart.
      // Human typing is usually > 70ms apart.
      if (interval > 55) {
        buffer = "";
      }

      if (e.key === "Enter") {
        if (buffer.length >= 3) {
          e.preventDefault();
          e.stopPropagation();
          const scannedCode = buffer.trim();
          buffer = "";
          handleProcessBarcode(scannedCode);
          return;
        }
        buffer = "";
        return;
      }

      if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleProcessBarcode]);

  // Connect to Socket.IO for Companion Phone Scanner
  useEffect(() => {
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
    const socket = io(backendUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-session", { sessionId, role: "pc" });
    });

    socket.on("phone-count", (data: { count: number }) => {
      setPhoneCount(data.count ?? 0);
    });

    socket.on("phone-connected", (data?: { count?: number }) => {
      setPhoneCount((prev) =>
        data?.count !== undefined ? data.count : Math.max(prev, 1)
      );
    });

    socket.on("phone-disconnected", (data?: { count?: number }) => {
      setPhoneCount(data?.count !== undefined ? data.count : 0);
    });

    socket.on("peer-status", (data: { role: string; status: string }) => {
      if (data.role === "phone" && data.status === "connected") {
        setPhoneCount((prev) => Math.max(prev, 1));
      }
    });

    socket.on("barcode-received", (data: { code: string; format?: string }) => {
      if (data?.code) {
        handleProcessBarcode(data.code);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionId, handleProcessBarcode]);

  // Close search dropdown on click outside
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
  }, []);

  // Shortcut "/" to focus search bar
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

  // Search input keydown handler
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const query = searchQuery.trim();
      if (!query) return;

      // If exact barcode matches an item in loaded results
      const exactBarcodeItem = products.find(
        (p) => p.barcode?.toLowerCase() === query.toLowerCase()
      );
      if (exactBarcodeItem) {
        handleAddProduct(exactBarcodeItem);
        return;
      }

      // If single item matched in search
      if (products.length === 1) {
        handleAddProduct(products[0]);
        return;
      }

      // Try processing barcode lookup directly
      handleProcessBarcode(query);
    } else if (e.key === "Escape") {
      setIsDropdownOpen(false);
    }
  };

  // Autofill Walk-in Customer
  const handleFillWalkIn = () => {
    setCustName("Walk-in Customer");
    setCustEmail("walkin@pos.local");
    setCustContact("9999999999");
  };

  // Totals calculations
  const totalUnits = cartItems.reduce((acc, item) => acc + item.c_quantity, 0);
  const rawSubtotalCents = cartItems.reduce(
    (acc, item) => acc + item.c_unit_price * item.c_quantity,
    0
  );
  const grandTotalCents = calculateGrandTotal(cartItems);
  const totalDiscountCents = Math.max(0, rawSubtotalCents - grandTotalCents);

  // Submit Sale
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");

    if (!custName.trim()) {
      setFormError("Customer name is required.");
      return;
    }

    if (
      !custEmail.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(custEmail.trim())
    ) {
      setFormError("Please enter a valid customer email address.");
      return;
    }

    if (!custContact.trim() || custContact.trim().length !== 10) {
      setFormError("Customer contact number must be exactly 10 digits.");
      return;
    }

    if (cartItems.length === 0) {
      setFormError("Cart is empty! Add at least one product before checkout.");
      return;
    }

    // Check for exceeding stock
    for (const item of cartItems) {
      if (item.c_stock !== undefined && item.c_quantity > item.c_stock) {
        setFormError(
          `"${item.c_name}" quantity exceeds stock (${item.c_stock} available).`
        );
        return;
      }
    }

    try {
      await createSaleMutation.mutateAsync({
        cust_name: custName.trim(),
        cust_email: custEmail.trim(),
        cust_contact: custContact.trim(),
        cartItems,
      });

      setSuccessMessage("Sale completed! Stock updated successfully.");
      setCartItems([]);
      setCustName("");
      setCustEmail("");
      setCustContact("");

      setTimeout(() => {
        router.push("/dashboard/sales");
      }, 1200);
    } catch (err: any) {
      setFormError(err.message || "Failed to process sale. Please try again.");
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <Title>New Sale (POS)</Title>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ShoppingCart className="h-7 w-7 text-primary" />
              New POS Sale
            </h1>
            <Badge variant="outline" className="text-xs font-medium">
              {activeShop?.name || "Active Shop"}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Barcode scanning, instant inventory lookup, and quick checkout.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Phone Scanner Pairing Button */}
          <Button
            variant={phoneConnected ? "default" : "outline"}
            size="sm"
            onClick={() => setIsQrModalOpen(true)}
            className="gap-2 shadow-xs"
          >
            <Smartphone className="h-4 w-4" />
            <span>
              {phoneConnected
                ? `Phone Scanner (${phoneCount})`
                : "Pair Phone Scanner"}
            </span>
            <span
              className={`h-2 w-2 rounded-full ${
                phoneConnected ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground"
              }`}
            />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/sales")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Sales History
          </Button>
        </div>
      </div>

      {/* Main 2-Column POS Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Search & Spreadsheet Cart (Col span 7/12 or 8/12) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Top Search Bar & Scanner Status */}
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
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => {
                      if (searchQuery.trim().length > 0) setIsDropdownOpen(true);
                    }}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Search by name or scan barcode (Press Enter to add)..."
                    className="pl-9 pr-24 h-11 text-base bg-background"
                  />
                  <div className="absolute right-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    {searchQuery ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
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

                {/* Instant Search Dropdown */}
                {isDropdownOpen && searchQuery.trim().length > 0 && (
                  <div
                    ref={dropdownRef}
                    className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-popover text-popover-foreground rounded-lg border border-border shadow-xl max-h-80 overflow-y-auto"
                  >
                    {isSearching ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        Searching inventory...
                      </div>
                    ) : products.length === 0 ? (
                      <div className="p-4 text-center">
                        <p className="text-sm font-medium text-foreground">
                          No products found matching &ldquo;{searchQuery}&rdquo;
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Press <Kbd>Enter</Kbd> to lookup as barcode or create it.
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border/60">
                        {products.map((prod) => (
                          <div
                            key={prod.id}
                            onClick={() => handleAddProduct(prod)}
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

          {/* Cart Items Spreadsheet Card */}
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
                  onClick={() => setCartItems([])}
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

                            {/* Unit Price (Editable or display) */}
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
                                    handleUnitPriceChange(
                                      item.c_id,
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="h-8 w-20 text-right text-xs font-mono font-medium px-2"
                                />
                              </div>
                            </TableCell>

                            {/* Quantity with arrow key handling */}
                            <TableCell className="text-center py-2.5">
                              <Input
                                id={`qty-${item.c_id}`}
                                type="number"
                                min={1}
                                max={item.c_stock || 9999}
                                value={item.c_quantity}
                                onChange={(e) =>
                                  handleQuantityChange(
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
                                    handleDiscountChange(
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
                                onClick={() => handleRemoveCartItem(item.c_id)}
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
                  Total Items:{" "}
                  <span className="font-bold">{cartItems.length}</span> | Units:{" "}
                  <span className="font-bold">{totalUnits}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Customer Details & Sticky Bill Summary (Col span 5/12 or 4/12) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Customer Information Card */}
          <Card className="shadow-xs border-border/80">
            <CardHeader className="py-3 px-4 border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  Customer Details
                </CardTitle>
                <CardDescription className="text-xs">
                  Billing information for invoice receipt.
                </CardDescription>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleFillWalkIn}
                className="h-7 text-xs gap-1"
                title="Quick fill for walk-in retail customer"
              >
                <UserCheck className="h-3.5 w-3.5 text-primary" />
                Walk-in
              </Button>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              <div className="space-y-1">
                <Label htmlFor="pos_cust_name" className="text-xs font-medium">
                  Customer Name *
                </Label>
                <Input
                  id="pos_cust_name"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="e.g. John Doe or Walk-in"
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="pos_cust_contact" className="text-xs font-medium">
                  Contact Phone (10 digits) *
                </Label>
                <Input
                  id="pos_cust_contact"
                  type="text"
                  maxLength={10}
                  value={custContact}
                  onChange={(e) =>
                    setCustContact(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="9876543210"
                  className="h-9 text-sm font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="pos_cust_email" className="text-xs font-medium">
                  Customer Email *
                </Label>
                <Input
                  id="pos_cust_email"
                  type="email"
                  value={custEmail}
                  onChange={(e) => setCustEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="h-9 text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Bill Summary Card (Sticky) */}
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
                onClick={handlePlaceOrder}
                disabled={createSaleMutation.isPending || cartItems.length === 0}
                size="lg"
                className="w-full font-bold shadow-md h-12 text-base gap-2"
              >
                <Zap className="h-5 w-5" />
                {createSaleMutation.isPending
                  ? "Processing Sale..."
                  : "Complete Sale & Checkout"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Barcode Not Found Modal Dialog */}
      <Dialog
        open={isNotFoundModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsNotFoundModalOpen(false);
            setNotFoundBarcode(null);
          }
        }}
      >
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
              {notFoundBarcode}
            </div>
            <p className="text-xs text-muted-foreground">
              Would you like to register this product now? The barcode will be
              automatically filled in the product creation spreadsheet.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsNotFoundModalOpen(false);
                setNotFoundBarcode(null);
              }}
            >
              Dismiss
            </Button>
            <Button
              onClick={() => {
                setIsNotFoundModalOpen(false);
                router.push(
                  `/dashboard/products/add?barcode=${encodeURIComponent(
                    notFoundBarcode || ""
                  )}`
                );
              }}
              className="gap-1.5"
            >
              <Package className="h-4 w-4" />
              Add to Inventory
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Companion Phone Scanner Pairing QR Modal */}
      <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
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
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(scanUrl);
                      setCopiedUrl(true);
                      setTimeout(() => setCopiedUrl(false), 2000);
                    }
                  }}
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
    </div>
  );
}
