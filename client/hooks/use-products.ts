"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Product, ApiResponse } from "@/types/shop";

export interface UseProductsParams {
    page?: number;
    limit?: number;
    search?: string;
}

export function useProducts(params?: UseProductsParams) {
    const page = params?.page;
    const limit = params?.limit;
    const search = params?.search;

    return useQuery({
        queryKey: ["products", { page, limit, search }],
        queryFn: async () => {
            const queryParams = new URLSearchParams();
            if (page !== undefined) queryParams.set("page", page.toString());
            if (limit !== undefined) queryParams.set("limit", limit.toString());
            if (search && search.trim() !== "") queryParams.set("search", search.trim());

            const url = `/api/products${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
            const res = await apiFetch<ApiResponse<Product[]>>(url);
            const items = res.data || [];
            (items as any).pagination = res.pagination;
            return items as Product[] & { pagination?: ApiResponse<Product[]>["pagination"] };
        },
    });
}

export function useCreateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { p_name: string; p_price: number; p_stock: number; p_thumbnail?: string }) => {
            return apiFetch<ApiResponse<Product>>("/api/products", {
                method: "POST",
                body: JSON.stringify(data),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
        },
    });
}

export function useUpdateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: { p_name: string; p_price: number; p_stock: number; p_thumbnail?: string } }) => {
            return apiFetch<ApiResponse<Product>>(`/api/products/${id}`, {
                method: "PUT",
                body: JSON.stringify(data),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
        },
    });
}

export function useDeleteProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            return apiFetch<ApiResponse<null>>(`/api/products/${id}`, {
                method: "DELETE",
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
        },
    });
}
