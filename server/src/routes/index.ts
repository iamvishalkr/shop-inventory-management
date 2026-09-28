import type { Express } from "express";
import { productRoutes } from "./product.routes.js";
import { salesRoutes } from "./sales.routes.js";
import shopRoutes from "./shop.routes.js";
import { userRoutes } from "./user.routes.js";

export function registerRoutes(app: Express): void {
    app.use("/api/shops", shopRoutes);
    app.use("/api/products", productRoutes);
    app.use("/api/sales", salesRoutes);
    app.use("/api/user", userRoutes);
}