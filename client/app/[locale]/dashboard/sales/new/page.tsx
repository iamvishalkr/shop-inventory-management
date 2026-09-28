"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useProducts } from "@/hooks/use-products";
import { useCreateSale } from "@/hooks/use-sales";
import { useShop } from "@/store/shop-store";
import type { CartItem, Product } from "@/types/shop";
import {
  calculateSubtotal,
  calculateGrandTotal,
  formatPrice,
  toMajor,
} from "@/utils/price";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShoppingCart,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import Title from "@/components/Title";

export default function DashboardNewSalePage() {
  const router = useRouter();
  const { activeShop } = useShop();

  // Product search state
  const [productSearch, setProductSearch] = useState("");
  const [debouncedProductSearch, setDebouncedProductSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedProductSearch(productSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch]);

  const { data: products = [], isLoading: isLoadingProducts } = useProducts({
    limit: 25,
    search: debouncedProductSearch,
  });

  const createSaleMutation = useCreateSale();
  const currencySymbol = activeShop?.currency || "$";

  // Customer Form State
  const [custName, setCustName] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custContact, setCustContact] = useState("");

  // Selected product builder state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);

  // Cart Items State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Subtotal calculation
  const subtotalCents = selectedProduct
    ? calculateSubtotal(selectedProduct.p_price, quantity, discount)
    : 0;
  const subtotalDisplay = formatPrice(subtotalCents, currencySymbol);

  const handleAddToCart = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!selectedProduct) {
      setFormError("Please select a product to add to cart.");
      return;
    }

    if (quantity < 1) {
      setFormError("Quantity must be at least 1.");
      return;
    }

    if (quantity > selectedProduct.p_stock) {
      setFormError(
        `Insufficient stock! Only ${selectedProduct.p_stock} items available.`,
      );
      return;
    }

    if (discount < 0 || discount > 100) {
      setFormError("Discount percentage must be between 0 and 100.");
      return;
    }

    // Check if already in cart
    if (cartItems.some((item) => item.c_id === selectedProduct.id)) {
      setFormError(`"${selectedProduct.p_name}" is already in your cart.`);
      return;
    }

    const newItem: CartItem = {
      c_id: selectedProduct.id,
      c_name: selectedProduct.p_name,
      c_quantity: quantity,
      c_unit_price: selectedProduct.p_price,
      c_discount: discount,
      c_subtotal: subtotalCents,
      c_stock: selectedProduct.p_stock,
    };

    setCartItems((prev) => [...prev, newItem]);
    // Reset product selection
    setSelectedProduct(null);
    setProductSearch("");
    setQuantity(1);
    setDiscount(0);
  };

  const handleRemoveCartItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.c_id !== id));
  };

  const grandTotalCents = calculateGrandTotal(cartItems);
  const grandTotalDisplay = formatPrice(grandTotalCents, currencySymbol);

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
      setFormError(
        "Cart is empty! Insert at least one product before placing order.",
      );
      return;
    }

    try {
      await createSaleMutation.mutateAsync({
        cust_name: custName.trim(),
        cust_email: custEmail.trim(),
        cust_contact: custContact.trim(),
        cartItems,
      });

      setSuccessMessage(
        "Sale created successfully! Product stock has been updated.",
      );
      // Reset form
      setCustName("");
      setCustEmail("");
      setCustContact("");
      setCartItems([]);
      // Navigate back to sales history after brief delay
      setTimeout(() => {
        router.push("/dashboard/sales");
      }, 1200);
    } catch (err: any) {
      setFormError(err.message || "Failed to create sale. Please try again.");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <Title>New Sale</Title>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShoppingCart className="h-7 w-7 text-primary" />
            New POS Sale ({activeShop?.name || "My Shop"})
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create customer orders and update inventory stock in real-time.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard/sales")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Sales History
        </Button>
      </div>

      {formError && (
        <div className="p-4 rounded-lg bg-destructive/15 text-destructive font-medium text-sm flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {formError}
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-lg bg-emerald-500/15 text-emerald-600 font-medium text-sm flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {successMessage}
        </div>
      )}

      {/* Customer Details Form */}
      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            1. Customer Information
          </CardTitle>
          <CardDescription>
            Enter billing contact details for the receipt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cust_name">Customer Name *</Label>
              <Input
                id="cust_name"
                placeholder="John Doe"
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cust_email">Customer Email *</Label>
              <Input
                id="cust_email"
                type="email"
                placeholder="john@example.com"
                value={custEmail}
                onChange={(e) => setCustEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cust_contact">
                Customer Contact (10 digits) *
              </Label>
              <Input
                id="cust_contact"
                type="text"
                maxLength={10}
                placeholder="9876543210"
                value={custContact}
                onChange={(e) =>
                  setCustContact(e.target.value.replace(/\D/g, ""))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Selection & Item Builder Form */}
      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            2. Select Product & Add to Cart
          </CardTitle>
          <CardDescription>
            Choose items from inventory to populate the order.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddToCart} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              {/* Product Selector */}
              <div className="md:col-span-3 ">
                <Label>Select Product</Label>
                <Combobox
                  value={selectedProduct}
                  onValueChange={(val: Product | null) => {
                    if (val) {
                      setSelectedProduct(val);
                      setProductSearch(val.p_name);
                    }
                  }}
                  onInputValueChange={(val: string) => setProductSearch(val)}
                  itemToStringLabel={(item: Product | null) =>
                    item?.p_name ?? ""
                  }
                  isItemEqualToValue={(a, b) => a?.id === b?.id}
                  filter={null}
                >
                  <ComboboxInput
                    placeholder={
                      isLoadingProducts
                        ? "Searching products..."
                        : "Type product name..."
                    }
                    value={productSearch}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setProductSearch(e.target.value)
                    }
                    className="w-full mb-0! mt-1"
                    showClear
                  />
                  <ComboboxContent>
                    <ComboboxList>
                      {isLoadingProducts ? (
                        <div className="p-3 text-center text-xs text-muted-foreground">
                          Searching products...
                        </div>
                      ) : products.length === 0 ? (
                        <ComboboxEmpty>No products found</ComboboxEmpty>
                      ) : (
                        products.map((prod) => (
                          <ComboboxItem
                            key={prod.id}
                            value={prod}
                            disabled={prod.p_stock <= 0}
                          >
                            {prod.p_name}
                          </ComboboxItem>
                        ))
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>

              {/* Stock */}
              <div className="md:col-span-1 space-y-1.5">
                <Label htmlFor="select_qty">Stock</Label>
                <Input
                  disabled
                  readOnly
                  id="stock_readOnly"
                  type="number"
                  value={selectedProduct ? selectedProduct.p_stock : 0}
                />
              </div>
              {/* Unit Price */}
              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="select_qty">Price</Label>
                <Input
                  disabled
                  readOnly
                  id="stock_readOnly"
                  type="number"
                  value={selectedProduct ? toMajor(selectedProduct.p_price) : 0}
                />
              </div>
              {/* Quantity */}
              <div className="md:col-span-1 space-y-1.5">
                <Label htmlFor="select_qty">Quantity</Label>
                <Input
                  id="select_qty"
                  type="number"
                  min="1"
                  max={selectedProduct?.p_stock || 1}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(parseInt(e.target.value, 10) || 1)
                  }
                />
              </div>

              {/* Discount % */}
              <div className="md:col-span-1 space-y-1.5">
                <Label htmlFor="select_disc">Discount (%)</Label>
                <Input
                  id="select_disc"
                  type="number"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) =>
                    setDiscount(parseInt(e.target.value, 10) || 0)
                  }
                />
              </div>

              {/* Subtotal */}
              <div className="md:col-span-2 space-y-1.5">
                <Label>Subtotal</Label>
                <Input
                  value={subtotalDisplay}
                  disabled
                  className="bg-muted font-semibold"
                />
              </div>

              {/* Insert Button */}
              <div className="md:col-span-2">
                <Button type="submit" className="w-full gap-1">
                  <Plus className="h-4 w-4" /> Insert Item
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Cart Items Table */}
      {cartItems.length > 0 && (
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              3. Order Items Cart
            </CardTitle>
            <CardDescription>
              Review cart items before processing order.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="w-[60px] text-center">#</TableHead>
                    <TableHead>Product Name</TableHead>
                    {/* <TableHead className="text-center">Stock</TableHead> */}
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right pr-6">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cartItems.map((item, idx) => (
                    <TableRow key={item.c_id}>
                      <TableCell className="text-center text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        {item.c_name}
                      </TableCell>
                      {/* <TableCell className="text-center text-muted-foreground font-medium">
                        {item.c_stock !== undefined ? item.c_stock : "-"}
                      </TableCell> */}
                      <TableCell className="text-center font-medium">
                        {item.c_quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPrice(item.c_unit_price, currencySymbol)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.c_discount}%
                      </TableCell>
                      <TableCell className="text-right font-bold text-foreground">
                        {formatPrice(item.c_subtotal, currencySymbol)}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveCartItem(item.c_id)}
                          className="h-8 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/20">
                <div className="text-sm font-medium">
                  Total Items in Cart:{" "}
                  <span className="font-bold text-foreground">
                    {cartItems.length}
                  </span>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground uppercase block font-semibold">
                      Grand Total
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      {grandTotalDisplay}
                    </span>
                  </div>

                  <Button
                    onClick={handlePlaceOrder}
                    disabled={createSaleMutation.isPending}
                    size="lg"
                    className="font-bold px-8 shadow-xs"
                  >
                    {createSaleMutation.isPending
                      ? "Processing Order..."
                      : "Place Order"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
