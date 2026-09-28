"use client";

import React, { useState, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { useSales, useDeleteSale } from "@/hooks/use-sales";
import { InvoiceModal } from "@/components/shop/invoice-modal";
import type { Sale } from "@/types/shop";
import { useShop } from "@/store/shop-store";
import { calculateGrandTotal, formatPrice } from "@/utils/price";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  PlusCircle,
  Search,
  Printer,
  Trash2,
  Receipt,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Title from "@/components/Title";

export default function DashboardSalesPage() {
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
    data: sales = [],
    isLoading,
    isError,
  } = useSales({
    page,
    limit,
    search: debouncedSearch,
  });

  const pagination = sales.pagination;
  const deleteSaleMutation = useDeleteSale();

  const [selectedInvoiceSale, setSelectedInvoiceSale] = useState<Sale | null>(
    null,
  );
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);

  const handleDelete = async () => {
    if (!saleToDelete) return;
    try {
      await deleteSaleMutation.mutateAsync(saleToDelete.id);
      setSaleToDelete(null);
    } catch (error) {
      console.error("Failed to delete sale", error);
    }
  };

  const currencySymbol = activeShop?.currency || "$";

  const totalItems = pagination?.totalItems ?? sales.length;
  const totalPages = pagination?.totalPages ?? 1;
  const startItem = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalItems);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <Title>Sales</Title>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Sales History
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            View customer transactions and print invoices for{" "}
            {activeShop?.name || "your shop"}.
          </p>
        </div>

        <Button
          nativeButton={false}
          className=""
          render={(props) => (
            <Link href="/dashboard/sales/new" {...props}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New POS Register
            </Link>
          )}
        />
      </div>

      {/* Main Sales List Card */}
      <Card className="shadow-xs">
        <CardHeader className="pb-4 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Receipt className="h-5 w-5 " />
                All Sales ({totalItems})
              </CardTitle>
              <CardDescription>
                Track transactions and manage invoices.
              </CardDescription>
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer name, email..."
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
              Loading sales transactions...
            </div>
          ) : isError ? (
            <div className="p-8 text-center text-destructive text-sm flex items-center justify-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Failed to load sales. Please verify server connection.
            </div>
          ) : sales.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground space-y-3">
              <Receipt className="h-10 w-10 mx-auto text-muted-foreground/50" />
              <p className="font-medium text-foreground">No Sales Recorded</p>
              <p className="text-xs">
                {searchQuery
                  ? `No sale records matching "${searchQuery}"`
                  : 'Click "New POS Register" above to record your first order!'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="w-[60px] text-center">S.No</TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Grand Total</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale, idx) => {
                    const grandTotalCents = calculateGrandTotal(sale.cartItems);

                    return (
                      <TableRow
                        key={sale.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="font-medium text-center text-muted-foreground">
                          {(page - 1) * limit + idx + 1}
                        </TableCell>
                        <TableCell className="font-semibold text-foreground">
                          {sale.cust_name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {sale.cust_contact || "N/A"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {sale.cust_email}
                        </TableCell>
                        <TableCell className="text-right font-bold text-foreground">
                          {formatPrice(grandTotalCents, currencySymbol)}
                        </TableCell>
                        <TableCell className="text-right pr-6 space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedInvoiceSale(sale)}
                            className="h-8 gap-1"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            Print Invoice
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setSaleToDelete(sale)}
                            className="h-8 gap-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
                of <strong>{totalItems}</strong> transactions
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

      {/* Invoice Modal */}
      <InvoiceModal
        open={!!selectedInvoiceSale}
        onOpenChange={(open) => !open && setSelectedInvoiceSale(null)}
        sale={selectedInvoiceSale}
      />

      {/* Delete Confirmation Alert */}
      <AlertDialog
        open={!!saleToDelete}
        onOpenChange={(open) => !open && setSaleToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this sale record?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will remove sale #{saleToDelete?.id.slice(-6).toUpperCase()}{" "}
              for customer <strong>{saleToDelete?.cust_name}</strong> from your
              records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSaleMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteSaleMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSaleMutation.isPending ? "Deleting..." : "Delete Sale"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
