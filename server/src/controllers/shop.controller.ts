import type { Request, Response, NextFunction } from "express";
import { shopService } from "../services/shop.service.js";
import { createShopSchema, updateShopSchema } from "../validators/shop.validator.js";

export class ShopController {
    async createShop(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.session.user.id;
            const validatedData = createShopSchema.parse(req.body);
            const shop = await shopService.createShop(userId, validatedData);

            res.status(201).json({
                success: true,
                message: "Shop created successfully",
                shop,
            });
        } catch (error) {
            next(error);
        }
    }

    async getUserShops(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.session.user.id;
            const shops = await shopService.getUserShops(userId);

            res.status(200).json({
                success: true,
                shops,
            });
        } catch (error) {
            next(error);
        }
    }

    async getShopById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.session.user.id;
            const shopId = req.params.id as string;
            const shop = await shopService.getShopById(shopId, userId);

            res.status(200).json({
                success: true,
                shop,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateShop(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.session.user.id;
            const shopId = req.params.id as string;
            const validatedData = updateShopSchema.parse(req.body);
            const shop = await shopService.updateShop(shopId, userId, validatedData);

            res.status(200).json({
                success: true,
                message: "Shop updated successfully",
                shop,
            });
        } catch (error) {
            next(error);
        }
    }
}

export const shopController = new ShopController();
