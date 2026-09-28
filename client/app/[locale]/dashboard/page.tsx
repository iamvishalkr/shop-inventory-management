"use client";

import { Link } from "@/i18n/navigation";
import { useProducts } from "@/hooks/use-products";
import { useSales } from "@/hooks/use-sales";
import { useShop } from "@/store/shop-store";
import { calculateGrandTotal, formatPrice } from "@/utils/price";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Store,
  Package,
  Receipt,
  PlusCircle,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  MapPin,
} from "lucide-react";
import Title from "@/components/Title";

export default function POSDashboardPage() {
  const { activeShop } = useShop();
  const { data: products = [] } = useProducts({ page: 1, limit: 100 });
  const { data: sales = [] } = useSales({ page: 1, limit: 100 });

  const totalProductsCount = products.pagination?.totalItems ?? products.length;
  const totalSalesCount = sales.pagination?.totalItems ?? sales.length;

  const lowStockCount = products.filter((p) => p.p_stock <= 5).length;
  const totalRevenueCents = sales.reduce(
    (total, sale) => total + calculateGrandTotal(sale.cartItems),
    0
  );

  const currencySymbol = activeShop?.currency || "$";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Title>Dashboard</Title>
      {/* Banner Card */}
      <Card className="border-border bg-card shadow-xs">
        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/10 text-primary mb-3"
            >
              Supermarket POS Terminal
            </Badge>
            <h1 className="text-3xl font-extrabold tracking-tight text-card-foreground">
              {activeShop?.name || "My Business Shop"}
            </h1>
            <div className="text-muted-foreground text-sm mt-1 max-w-xl">
              {activeShop?.address ? (
                <div className="flex items-center">
                  <MapPin className="w-3 h-3" />
                  <p>{activeShop.address}</p>
                </div>
              ) : (
                <p>
                  Manage products, track real-time sales, and process checkout.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              nativeButton={false}
              size="default"
              render={(props) => (
                <Link href="/dashboard/products" {...props}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Products
                </Link>
              )}
            />
            <Button
              nativeButton={false}
              variant="outline"
              size="default"
              render={(props) => (
                <Link href="/dashboard/sales" {...props}>
                  <Receipt className="mr-2 h-4 w-4" /> View Sales History
                </Link>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Inventory Products
            </CardTitle>
            <Package className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProductsCount} Items</div>
            <p className="text-xs text-muted-foreground mt-1">
              {lowStockCount > 0 ? (
                <span className="text-destructive flex items-center gap-1 font-medium">
                  <AlertTriangle className="h-3.5 w-3.5" /> {lowStockCount}{" "}
                  items low in stock
                </span>
              ) : (
                "All products sufficiently stocked"
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Sales Transactions
            </CardTitle>
            <Receipt className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSalesCount} Orders</div>
            <p className="text-xs text-muted-foreground mt-1">
              Recorded in current shop
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(totalRevenueCents, currencySymbol)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Gross total sales value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:border-primary/50 transition-all cursor-pointer shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Products Management
              </span>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardTitle>
            <CardDescription>
              Add, update, or remove products and adjust prices.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              nativeButton={false}
              variant="secondary"
              className="w-full justify-between"
              render={(props) => (
                <Link href="/dashboard/products" {...props}>
                  <span>Go to Inventory</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            />
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-all cursor-pointer shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Sales & Invoicing
              </span>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardTitle>
            <CardDescription>
              Browse past sales, print receipts, and track orders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              nativeButton={false}
              variant="secondary"
              className="w-full justify-between"
              render={(props) => (
                <Link href="/dashboard/sales" {...props}>
                  <span>Go to Sales History</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
