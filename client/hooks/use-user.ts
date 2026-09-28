"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { ApiResponse, Product, Sale } from "@/types/shop";

export interface UserProfileData {
    id: string;
    name: string;
    email: string;
    role: string;
    products?: Product[];
    sales?: Sale[];
}

export function useUserProfile() {
    return useQuery({
        queryKey: ["user-profile"],
        queryFn: async () => {
            const res = await apiFetch<ApiResponse<UserProfileData>>("/api/user/me");
            return res.data;
        },
    });
}
