"use client";

import React, { useState, useEffect } from "react";
import { useProducts } from "@/hooks/use-products";
import { ProductDialog } from "@/components/shop/product-dialog";
import { DeleteProductDialog } from "@/components/shop/delete-product-dialog";
import type { Product } from "@/types/shop";
import { useShop } from "@/store/shop-store";
import { formatPrice } from "@/utils/price";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PlusCircle,
  Search,
  Edit2,
  Trash2,
  Package,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function DashboardProductsPage() {
  const { activeShop } = useShop();

  // Pagination and Search State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    data: products = [],
    isLoading,
    isError,
  } = useProducts({
    page,
    limit,
    search: debouncedSearch,
  });

  const pagination = products.pagination;

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const currencySymbol = activeShop?.currency || "$";

  const totalItems = pagination?.totalItems ?? products.length;
  const totalPages = pagination?.totalPages ?? 1;
  const startItem = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalItems);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Product Inventory
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage inventory, prices, and stock levels for{" "}
            {activeShop?.name || "your shop"}.
          </p>
        </div>

        <Button onClick={() => setIsAddOpen(true)} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Main Content Card */}
      <Card className="shadow-xs">
        <CardHeader className="pb-4 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Package className="h-5 w-5" />
                All Products ({totalItems})
              </CardTitle>
              <CardDescription>
                Search and manage your product inventory.
              </CardDescription>
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search product name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Loading products list...
            </div>
          ) : isError ? (
            <div className="p-8 text-center text-destructive text-sm flex items-center justify-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Failed to load products. Please check server connection.
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground space-y-3">
              <Package className="h-10 w-10 mx-auto text-muted-foreground/50" />
              <p className="font-medium text-foreground">No Products Found</p>
              <p className="text-xs">
                {searchQuery
                  ? `No product matches "${searchQuery}"`
                  : 'Click "Add Product" above to create your first item!'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="w-[60px] text-center">S.No</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock Level</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product, idx) => (
                    <TableRow
                      key={product.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="font-medium text-center text-muted-foreground">
                        {(page - 1) * limit + idx + 1}
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        {product.p_name}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatPrice(product.p_price, currencySymbol)}
                      </TableCell>
                      <TableCell>
                        {product.p_stock <= 5 ? (
                          <Badge variant="destructive" className="font-medium">
                            Low Stock ({product.p_stock})
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="font-medium">
                            {product.p_stock} in stock
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-6 space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setProductToEdit(product)}
                          className="h-8 gap-1"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          Update
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setProductToDelete(product)}
                          className="h-8 gap-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        {/* Pagination Footer */}
        {totalItems > 0 && (
          <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border p-4">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                Showing <strong>{startItem}</strong>-<strong>{endItem}</strong>{" "}
                of <strong>{totalItems}</strong> products
              </span>
              <div className="flex items-center gap-1">
                <span>Per page:</span>
                <Select
                  value={limit.toString()}
                  onValueChange={(val) => {
                    setLimit(Number(val));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-16 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground mr-2">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous Page</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next Page</span>
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Modals */}
      <ProductDialog open={isAddOpen} onOpenChange={setIsAddOpen} />

      <ProductDialog
        open={!!productToEdit}
        onOpenChange={(open) => !open && setProductToEdit(null)}
        productToEdit={productToEdit}
      />

      <DeleteProductDialog
        open={!!productToDelete}
        onOpenChange={(open) => !open && setProductToDelete(null)}
        product={productToDelete}
      />
    </div>
  );
}
