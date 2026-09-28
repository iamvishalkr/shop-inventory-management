import type { NextFunction, Request, Response } from "express";
import prisma from "../lib/db.js";

export async function requireShop(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.session?.user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const userId = req.session.user.id;

        // 1. Check shopId from header, query, params, or body
        let shopId =
            (req.headers["x-shop-id"] as string) ||
            (req.query.shopId as string) ||
            (req.params.shopId as string) ||
            req.body?.shopId;

        let shop = null;

        if (shopId) {
            // Verify shop ownership
            shop = await prisma.shop.findFirst({
                where: {
                    id: shopId,
                    userId: userId,
                },
            });

            if (!shop) {
                res.status(403).json({
                    error: "Forbidden: You do not have access to this shop",
                });
                return;
            }
        } else {
            // Default to user's first shop if only 1 shop exists
            const userShops = await prisma.shop.findMany({
                where: { userId: userId },
            });

            if (userShops.length === 0) {
                res.status(400).json({
                    error: "No shop found. Please complete shop onboarding first.",
                    code: "NO_SHOP",
                });
                return;
            }

            if (userShops.length === 1) {
                shop = userShops[0];
                shopId = shop.id;
            } else {
                res.status(400).json({
                    error: "Multiple shops available. Please specify x-shop-id header.",
                });
                return;
            }
        }

        req.shopId = shopId;
        req.shop = shop;
        next();
    } catch (error) {
        next(error);
    }
}
