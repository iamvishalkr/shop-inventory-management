"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Sale, CartItem, ApiResponse } from "@/types/shop";

export interface UseSalesParams {
    page?: number;
    limit?: number;
    search?: string;
}

export function useSales(params?: UseSalesParams) {
    const page = params?.page;
    const limit = params?.limit;
    const search = params?.search;

    return useQuery({
        queryKey: ["sales", { page, limit, search }],
        queryFn: async () => {
            const queryParams = new URLSearchParams();
            if (page !== undefined) queryParams.set("page", page.toString());
            if (limit !== undefined) queryParams.set("limit", limit.toString());
            if (search && search.trim() !== "") queryParams.set("search", search.trim());

            const url = `/api/sales${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
            const res = await apiFetch<ApiResponse<Sale[]>>(url);
            const items = res.data || [];
            (items as any).pagination = res.pagination;
            return items as Sale[] & { pagination?: ApiResponse<Sale[]>["pagination"] };
        },
    });
}

export function useCreateSale() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: {
            cust_name: string;
            cust_email: string;
            cust_contact: string;
            cartItems: CartItem[];
        }) => {
            return apiFetch<ApiResponse<Sale>>("/api/sales", {
                method: "POST",
                body: JSON.stringify(data),
            });
        },
        onSuccess: () => {
            // Invalidate both sales and products because sale reduces product stock levels in server!
            queryClient.invalidateQueries({ queryKey: ["sales"] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
        },
    });
}

export function useDeleteSale() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            return apiFetch<ApiResponse<null>>(`/api/sales/${id}`, {
                method: "DELETE",
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sales"] });
        },
    });
}
