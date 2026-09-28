import type { Request, Response, NextFunction } from "express";
import { createSaleSchema } from "../validators/sales.validator.js";
import * as salesService from "../services/sales.service.js";

export async function getSales(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const shopId = req.shopId!;
        const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
        const search = req.query.search ? (req.query.search as string) : undefined;

        const result = await salesService.getSalesByShop(shopId, { page, limit, search });
        res.status(200).json({ status: true, data: result.sales, pagination: result.pagination });
    } catch (error) {
        next(error);
    }
}

export async function createSale(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const shopId = req.shopId!;
        const userId = req.session.user.id;
        const validated = createSaleSchema.parse(req.body);
        const sale = await salesService.createSale(shopId, userId, validated);
        res.status(201).json({ status: true, message: "Sale created successfully", data: sale });
    } catch (error) {
        next(error);
    }
}

export async function deleteSale(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const shopId = req.shopId!;
        const salesId = req.params.id || req.body.salesId;
        await salesService.deleteSale(shopId, salesId);
        res.status(200).json({ status: true, message: "Sale deleted successfully" });
    } catch (error) {
        next(error);
    }
}
