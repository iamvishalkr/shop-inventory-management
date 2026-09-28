import { Router } from "express";
import { requireAuth } from "../middleware/require-auth.middleware.js";
import { requireShop } from "../middleware/require-shop.middleware.js";
import {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
} from "../controllers/product.controller.js";

export const productRoutes = Router();

// Protect all product routes with auth & shop isolation middleware
productRoutes.use(requireAuth);
productRoutes.use(requireShop);

productRoutes.get("/", getProducts);
productRoutes.post("/", createProduct);
productRoutes.put("/:id", updateProduct);
productRoutes.delete("/:id", deleteProduct);
