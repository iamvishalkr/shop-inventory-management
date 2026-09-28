import prisma from "../lib/db.js";
import { NotFoundError } from "../types/app-error.js";
import type { CreateProductInput, UpdateProductInput } from "../validators/product.validator.js";

export interface GetProductsOptions {
    page?: number;
    limit?: number;
    search?: string;
}

export async function getProductsByShop(shopId: string, options: GetProductsOptions = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 25));
    const skip = (page - 1) * limit;

    const where: any = { shopId };

    if (options.search && options.search.trim() !== "") {
        where.p_name = {
            contains: options.search.trim(),
            mode: "insensitive",
        };
    }

    const [totalItems, products] = await prisma.$transaction([
        prisma.product.count({ where }),
        prisma.product.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return {
        products,
        pagination: {
            page,
            limit,
            totalItems,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        },
    };
}

export async function getProductById(shopId: string, productId: string) {
    const product = await prisma.product.findFirst({
        where: { id: productId, shopId },
    });

    if (!product) {
        throw new NotFoundError("Product not found or access denied");
    }

    return product;
}

export async function createProduct(shopId: string, userId: string, input: CreateProductInput) {
    return prisma.product.create({
        data: {
            shopId,
            userId,
            p_name: input.p_name,
            p_price: input.p_price,
            p_stock: input.p_stock,
            p_thumbnail: input.p_thumbnail,
        },
    });
}

export async function updateProduct(shopId: string, productId: string, input: UpdateProductInput) {
    await getProductById(shopId, productId);

    return prisma.product.update({
        where: { id: productId },
        data: input,
    });
}

export async function deleteProduct(shopId: string, productId: string) {
    await getProductById(shopId, productId);

    return prisma.product.delete({
        where: { id: productId },
    });
}
