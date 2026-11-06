"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateProduct } from "@/hooks/use-products";
import type { Product } from "@/types/shop";
import { toCents, toMajor } from "@/utils/price";

interface ProductDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    productToEdit: Product | null;
}

export function ProductDialog({ open, onOpenChange, productToEdit }: ProductDialogProps) {
    if (!productToEdit) return null;

    return (
        <ProductDialogContent
            key={`${productToEdit.id}-${open}`}
            open={open}
            onOpenChange={onOpenChange}
            productToEdit={productToEdit}
        />
    );
}

function ProductDialogContent({ open, onOpenChange, productToEdit }: { open: boolean; onOpenChange: (open: boolean) => void; productToEdit: Product }) {
    const [pName, setPName] = useState(productToEdit.p_name || "");
    const [pCostPrice, setPCostPrice] = useState(
        productToEdit.p_costprice !== undefined && productToEdit.p_costprice !== null
            ? String(toMajor(productToEdit.p_costprice))
            : ""
    );
    const [pPrice, setPPrice] = useState(String(toMajor(productToEdit.p_price)));
    const [pStock, setPStock] = useState(String(productToEdit.p_stock));
    const [errorMsg, setErrorMsg] = useState("");

    const updateProductMutation = useUpdateProduct();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");

        if (!pName.trim()) {
            setErrorMsg("Product name is required.");
            return;
        }

        const rawPrice = parseFloat(pPrice);
        if (isNaN(rawPrice) || rawPrice <= 0) {
            setErrorMsg("Please enter a valid price greater than 0.");
            return;
        }
        const priceInCents = toCents(pPrice);

        let costPriceInCents = 0;
        if (pCostPrice.trim()) {
            const rawCostPrice = parseFloat(pCostPrice);
            if (isNaN(rawCostPrice) || rawCostPrice < 0) {
                setErrorMsg("Please enter a valid cost price (0 or greater).");
                return;
            }
            costPriceInCents = toCents(pCostPrice);
        }

        const stock = parseInt(pStock, 10);
        if (isNaN(stock) || stock < 0) {
            setErrorMsg("Please enter a valid stock amount (0 or greater).");
            return;
        }

        try {
            await updateProductMutation.mutateAsync({
                id: productToEdit.id,
                data: {
                    p_name: pName.trim(),
                    p_price: priceInCents,
                    p_costprice: costPriceInCents,
                    p_stock: stock,
                },
            });
            onOpenChange(false);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to update product.";
            setErrorMsg(message);
        }
    };

    const isLoading = updateProductMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Update Product Details</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    {errorMsg && (
                        <div className="p-3 text-xs rounded-md bg-destructive/15 text-destructive font-medium">
                            {errorMsg}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label htmlFor="p_name">Product Name</Label>
                        <Input
                            id="p_name"
                            placeholder="e.g. Wireless Mouse"
                            value={pName}
                            onChange={(e) => setPName(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="p_costprice">Cost Price (₹ / $)</Label>
                            <Input
                                id="p_costprice"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="e.g. 15.00"
                                value={pCostPrice}
                                onChange={(e) => setPCostPrice(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="p_price">Selling Price (₹ / $)</Label>
                            <Input
                                id="p_price"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="e.g. 29.99"
                                value={pPrice}
                                onChange={(e) => setPPrice(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="p_stock">Stock Quantity</Label>
                        <Input
                            id="p_stock"
                            type="number"
                            min="0"
                            placeholder="e.g. 50"
                            value={pStock}
                            onChange={(e) => setPStock(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Updating..." : "Update Product"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
