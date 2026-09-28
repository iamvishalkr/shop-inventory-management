import { z } from "zod";

export const createProductSchema = z.object({
    p_name: z.string().min(1, "Product name is required"),
    p_price: z.number().positive("Price must be a positive number"),
    p_stock: z.number().int().nonnegative("Stock must be a non-negative integer"),
    p_thumbnail: z.string().optional(),
});

export const updateProductSchema = z.object({
    p_name: z.string().min(1).optional(),
    p_price: z.number().positive().optional(),
    p_stock: z.number().int().nonnegative().optional(),
    p_thumbnail: z.string().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
