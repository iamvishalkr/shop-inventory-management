import { Router } from "express";
import { requireAuth } from "../middleware/require-auth.middleware.js";
import { requireShop } from "../middleware/require-shop.middleware.js";
import {
    getSales,
    createSale,
    deleteSale,
} from "../controllers/sales.controller.js";

export const salesRoutes = Router();

// Protect all sales routes with auth & shop isolation middleware
salesRoutes.use(requireAuth);
salesRoutes.use(requireShop);

salesRoutes.get("/", getSales);
salesRoutes.post("/", createSale);
salesRoutes.delete("/:id", deleteSale);
