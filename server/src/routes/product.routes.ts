import { Router } from "express";
import { requireAuth } from "../middleware/require-auth.middleware.js";
import { requireShop } from "../middleware/require-shop.middleware.js";
import {
    getProducts,
    getProductByBarcode,
    createProduct,
    bulkCreateProducts,
    updateProduct,
    deleteProduct,
} from "../controllers/product.controller.js";

export const productRoutes = Router();

// Protect all product routes with auth & shop isolation middleware
productRoutes.use(requireAuth);
productRoutes.use(requireShop);

productRoutes.get("/", getProducts);
productRoutes.get("/barcode/:barcode", getProductByBarcode);
productRoutes.post("/", createProduct);
productRoutes.post("/bulk", bulkCreateProducts);
productRoutes.put("/:id", updateProduct);
productRoutes.delete("/:id", deleteProduct);
