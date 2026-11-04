import { z } from "zod";

export const createProductSchema = z.object({
    p_name: z.string().min(1, "Product name is required"),
    p_price: z.number().positive("Price must be a positive number"),
    p_costprice: z.number().nonnegative("Cost price must be a non-negative number").optional().default(0),
    p_stock: z.number().int().nonnegative("Stock must be a non-negative integer"),
    p_thumbnail: z.string().optional(),
});

export const bulkCreateProductsSchema = z.object({
    products: z.array(createProductSchema).min(1, "At least one product is required"),
});

export const updateProductSchema = z.object({
    p_name: z.string().min(1).optional(),
    p_price: z.number().positive().optional(),
    p_costprice: z.number().nonnegative().optional(),
    p_stock: z.number().int().nonnegative().optional(),
    p_thumbnail: z.string().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type BulkCreateProductsInput = z.infer<typeof bulkCreateProductsSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
