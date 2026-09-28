import prisma from "../lib/db.js";
import { AppError, NotFoundError } from "../types/app-error.js";
import type { CreateShopInput, UpdateShopInput } from "../validators/shop.validator.js";

export class ShopService {
    async createShop(userId: string, input: CreateShopInput) {
        const existingCount = await prisma.shop.count({
            where: { userId },
        });

        // Enforce 1 shop for free tier
        if (existingCount >= 1) {
            throw new AppError(
                400,
                "Free tier limit reached: You can currently only create 1 shop per account."
            );
        }

        const shop = await prisma.shop.create({
            data: {
                name: input.name,
                slug: input.slug || input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                address: input.address,
                phone: input.phone,
                currency: input.currency || "USD",
                userId,
            },
        });

        return shop;
    }

    async getUserShops(userId: string) {
        return prisma.shop.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
    }

    async getShopById(shopId: string, userId: string) {
        const shop = await prisma.shop.findFirst({
            where: {
                id: shopId,
                userId,
            },
        });

        if (!shop) {
            throw new NotFoundError("Shop not found or access denied");
        }

        return shop;
    }

    async updateShop(shopId: string, userId: string, input: UpdateShopInput) {
        await this.getShopById(shopId, userId);

        return prisma.shop.update({
            where: { id: shopId },
            data: {
                ...(input.name && { name: input.name }),
                ...(input.slug && { slug: input.slug }),
                ...(input.address !== undefined && { address: input.address }),
                ...(input.phone !== undefined && { phone: input.phone }),
                ...(input.currency && { currency: input.currency }),
            },
        });
    }
}

export const shopService = new ShopService();
