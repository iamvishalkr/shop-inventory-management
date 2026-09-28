"use client";

import React from "react";
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
import { useDeleteProduct } from "@/hooks/use-products";
import type { Product } from "@/types/shop";

interface DeleteProductDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: Product | null;
}

export function DeleteProductDialog({ open, onOpenChange, product }: DeleteProductDialogProps) {
    const deleteProductMutation = useDeleteProduct();

    if (!product) return null;

    const handleDelete = async () => {
        try {
            await deleteProductMutation.mutateAsync(product.id);
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to delete product", error);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to delete this product?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. Product &quot;{product.p_name}&quot; will be permanently removed.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleteProductMutation.isPending}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={deleteProductMutation.isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {deleteProductMutation.isPending ? "Deleting..." : "Delete Product"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
