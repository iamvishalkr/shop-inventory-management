"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { useShop } from "@/store/shop-store";
import { useProducts } from "@/hooks/use-products";
import { useCreateSale } from "@/hooks/use-sales";
import type { CartItem, Product } from "@/types/shop";
import { calculateSubtotal, calculateGrandTotal, toCents } from "@/utils/price";
import { playScanChime } from "@/utils/audio";
import { io, Socket } from "socket.io-client";
import Fuse from "fuse.js";
import { ShoppingCart, ArrowLeft, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Title from "@/components/Title";

import { PosSearchBar } from "@/components/sales/pos-search-bar";
import { PosCartTable } from "@/components/sales/pos-cart-table";
import { CustomerForm } from "@/components/sales/customer-form";
import { BillSummary } from "@/components/sales/bill-summary";
import { BarcodeNotFoundDialog } from "@/components/sales/barcode-not-found-dialog";
import { CompanionScannerDialog } from "@/components/sales/companion-scanner-dialog";

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

  // Search Input State
  const [searchQuery, setSearchQuery] = useState("");
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

  // Refs for tracking mutable state in event listeners
  const cartItemsRef = useRef(cartItems);
  cartItemsRef.current = cartItems;
  const socketRef = useRef<Socket | null>(null);

  const createSaleMutation = useCreateSale();

  // 1. Fetch entire catalog up to 1000 products for offline POS operation
  const { data: catalog = [] } = useProducts({ limit: 1000 });

  // 2. Build in-memory Barcode Map for O(1) instant barcode lookup
  const barcodeMap = useMemo(() => {
    const map = new Map<string, Product>();
    for (const prod of catalog) {
      if (prod.barcode && prod.barcode.trim()) {
        map.set(prod.barcode.trim().toLowerCase(), prod);
      }
    }
    return map;
  }, [catalog]);

  // 3. Initialize Fuse.js client-side search indexed strictly on 'barcode' and 'p_name'
  const fuse = useMemo(() => {
    return new Fuse(catalog, {
      keys: ["p_name", "barcode"],
      threshold: 0.35,
      minMatchCharLength: 2,
    });
  }, [catalog]);

  // Filtered products derived instantaneously from in-memory catalog / Fuse.js
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return [];
    const results = fuse.search(q, { limit: 10 });
    return results.map((r) => r.item);
  }, [searchQuery, fuse]);

  // Mobile scanner URL
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const scanUrl = `${origin}/${locale}/scan?id=${sessionId}`;

  // Helper: Flash row highlight
  const flashRow = (id: string) => {
    setRecentlyScannedId(id);
    setTimeout(() => setRecentlyScannedId(null), 1200);
  };

  // Cart operations
  const handleQuantityChange = useCallback((itemId: string, newQty: number) => {
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
  }, []);

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

  // Add product to cart (or increment if already present)
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

  // Process scanned or entered barcode instantaneously via in-memory Barcode Map
  const handleProcessBarcode = useCallback(
    (rawCode: string) => {
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

      // 2. Instant O(1) lookup from in-memory barcode map
      const matchedProduct = barcodeMap.get(code.toLowerCase());

      if (matchedProduct) {
        handleAddProduct(matchedProduct);
        setSearchQuery("");
        setIsDropdownOpen(false);
      } else {
        // Barcode not found in shop catalog
        setNotFoundBarcode(code);
        setIsNotFoundModalOpen(true);
      }
    },
    [barcodeMap, handleAddProduct, handleQuantityChange]
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

      // Barcode scanners send keystrokes < 55ms apart
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

  // Search input keydown handler
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const query = searchQuery.trim();
      if (!query) return;

      // 1. Check exact barcode match first
      const exactBarcodeItem = barcodeMap.get(query.toLowerCase());
      if (exactBarcodeItem) {
        handleAddProduct(exactBarcodeItem);
        return;
      }

      // 2. If single item matched in Fuse search results
      if (filteredProducts.length === 1) {
        handleAddProduct(filteredProducts[0]);
        return;
      }

      // 3. Otherwise treat as scanned barcode lookup
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
              className={`h-2 w-2 rounded-full ${phoneConnected
                  ? "bg-emerald-400 animate-pulse"
                  : "bg-muted-foreground"
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
        {/* LEFT COLUMN: Search & Spreadsheet Cart */}
        <div className="lg:col-span-8 space-y-4">
          <PosSearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchKeyDown={handleSearchKeyDown}
            filteredProducts={filteredProducts}
            onSelectProduct={handleAddProduct}
            currencySymbol={currencySymbol}
            phoneConnected={phoneConnected}
            phoneCount={phoneCount}
            isDropdownOpen={isDropdownOpen}
            setIsDropdownOpen={setIsDropdownOpen}
          />

          <PosCartTable
            cartItems={cartItems}
            recentlyScannedId={recentlyScannedId}
            currencySymbol={currencySymbol}
            totalUnits={totalUnits}
            onClearCart={() => setCartItems([])}
            onRemoveItem={handleRemoveCartItem}
            onQuantityChange={handleQuantityChange}
            onDiscountChange={handleDiscountChange}
            onUnitPriceChange={handleUnitPriceChange}
          />
        </div>

        {/* RIGHT COLUMN: Customer Details & Sticky Bill Summary */}
        <div className="lg:col-span-4 space-y-4">
          <CustomerForm
            custName={custName}
            setCustName={setCustName}
            custContact={custContact}
            setCustContact={setCustContact}
            custEmail={custEmail}
            setCustEmail={setCustEmail}
            onFillWalkIn={handleFillWalkIn}
          />

          <BillSummary
            cartItems={cartItems}
            totalUnits={totalUnits}
            rawSubtotalCents={rawSubtotalCents}
            totalDiscountCents={totalDiscountCents}
            grandTotalCents={grandTotalCents}
            currencySymbol={currencySymbol}
            formError={formError}
            successMessage={successMessage}
            isSubmitting={createSaleMutation.isPending}
            onPlaceOrder={handlePlaceOrder}
          />
        </div>
      </div>

      {/* Barcode Not Found Modal Dialog */}
      <BarcodeNotFoundDialog
        open={isNotFoundModalOpen}
        barcode={notFoundBarcode}
        onClose={() => {
          setIsNotFoundModalOpen(false);
          setNotFoundBarcode(null);
        }}
        onAddProduct={(barcode) => {
          setIsNotFoundModalOpen(false);
          router.push(
            `/dashboard/products/add?barcode=${encodeURIComponent(barcode)}`
          );
        }}
      />

      {/* Companion Phone Scanner Pairing QR Modal */}
      <CompanionScannerDialog
        open={isQrModalOpen}
        onOpenChange={setIsQrModalOpen}
        phoneConnected={phoneConnected}
        phoneCount={phoneCount}
        scanUrl={scanUrl}
      />
    </div>
  );
}
