import { z } from "zod";

export const cartItemSchema = z.object({
    c_id: z.string().min(1, "Product ID is required"),
    c_name: z.string().optional(),
    c_unit_price: z.number().nonnegative().optional(),
    c_price: z.number().optional(),
    c_quantity: z.number().int().positive("Quantity must be greater than 0"),
    c_discount: z.number().min(0).max(100).optional().default(0),
    c_subtotal: z.union([z.number(), z.string()]).optional(),
});

export const createSaleSchema = z.object({
    cust_name: z.string().min(1, "Customer name is required"),
    cust_email: z.string().email("Valid customer email is required"),
    cust_contact: z.string().optional(),
    cartItems: z.array(cartItemSchema).min(1, "At least one item is required in the cart"),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
