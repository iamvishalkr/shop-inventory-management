import { z } from "zod";

export const createShopSchema = z.object({
    name: z.string().min(2, "Shop name must be at least 2 characters long"),
    slug: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    currency: z.string().default("USD"),
});

export const updateShopSchema = z.object({
    name: z.string().min(2, "Shop name must be at least 2 characters long").optional(),
    slug: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    currency: z.string().optional(),
});

export type CreateShopInput = z.infer<typeof createShopSchema>;
export type UpdateShopInput = z.infer<typeof updateShopSchema>;
