import prisma from "../lib/db.js";
import { NotFoundError, ConflictError, ValidationError } from "../types/app-error.js";
import type { CreateProductInput, UpdateProductInput } from "../validators/product.validator.js";
import { generateRandomBarcode } from "../utils/barcode.js";

function getMaxProductsLimit(): number {
    return process.env.MAX_PRODUCTS_PER_SHOP
        ? parseInt(process.env.MAX_PRODUCTS_PER_SHOP, 10) || 1000
        : 1000;
}

export interface GetProductsOptions {
    page?: number;
    limit?: number;
    search?: string;
}

export async function getProductsByShop(shopId: string, options: GetProductsOptions = {}) {
    const page = Math.max(1, options.page || 1);
    const maxLimit = getMaxProductsLimit();
    const limit = Math.min(maxLimit, Math.max(1, options.limit || 25));
    const skip = (page - 1) * limit;

    const where: any = { shopId };

    if (options.search && options.search.trim() !== "") {
        const query = options.search.trim();
        where.OR = [
            {
                p_name: {
                    contains: query,
                    mode: "insensitive",
                },
            },
            {
                barcode: {
                    contains: query,
                    mode: "insensitive",
                },
            },
        ];
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

export async function getProductByBarcode(shopId: string, barcode: string) {
    const product = await prisma.product.findFirst({
        where: {
            shopId,
            barcode: barcode.trim(),
        },
    });

    if (!product) {
        throw new NotFoundError(`Product with barcode "${barcode}" not found`);
    }

    return product;
}

/**
 * Resolves a unique barcode for the product within the given shop.
 * If barcode is provided, checks for collision; if empty/omitted, generates
 * a random 6-character uppercase code and guarantees shop-level uniqueness.
 */
async function resolveUniqueBarcode(
    shopId: string,
    providedBarcode?: string,
    existingBatchBarcodes?: Set<string>,
): Promise<string> {
    if (providedBarcode && providedBarcode.trim().length > 0) {
        const trimmed = providedBarcode.trim();

        if (existingBatchBarcodes && existingBatchBarcodes.has(trimmed)) {
            throw new ConflictError(`Duplicate barcode "${trimmed}" in this batch`);
        }

        const existing = await prisma.product.findFirst({
            where: {
                shopId,
                barcode: trimmed,
            },
        });

        if (existing) {
            throw new ConflictError(`A product with barcode "${trimmed}" already exists in this shop`);
        }

        return trimmed;
    }

    // Auto-generate random 6-character identifier
    let attempts = 0;
    while (attempts < 10) {
        const candidate = generateRandomBarcode(6);

        if (existingBatchBarcodes && existingBatchBarcodes.has(candidate)) {
            attempts++;
            continue;
        }

        const existing = await prisma.product.findFirst({
            where: {
                shopId,
                barcode: candidate,
            },
        });

        if (!existing) {
            return candidate;
        }

        attempts++;
    }

    // Fallback if 6-character space is saturated
    return generateRandomBarcode(8);
}

export async function createProduct(shopId: string, userId: string, input: CreateProductInput) {
    const maxAllowed = getMaxProductsLimit();
    const currentCount = await prisma.product.count({ where: { shopId } });
    if (currentCount >= maxAllowed) {
        throw new ValidationError(
            `Product limit reached. Maximum allowed products per shop is ${maxAllowed}.`
        );
    }

    const barcode = await resolveUniqueBarcode(shopId, input.barcode);

    return prisma.product.create({
        data: {
            shopId,
            userId,
            p_name: input.p_name,
            p_price: input.p_price,
            p_costprice: input.p_costprice ?? 0,
            p_stock: input.p_stock,
            p_thumbnail: input.p_thumbnail,
            barcode,
        },
    });
}

export async function bulkCreateProducts(shopId: string, userId: string, products: CreateProductInput[]) {
    const maxAllowed = getMaxProductsLimit();
    const currentCount = await prisma.product.count({ where: { shopId } });
    if (currentCount + products.length > maxAllowed) {
        throw new ValidationError(
            `Product limit exceeded. Current count: ${currentCount}, adding: ${products.length}, max allowed: ${maxAllowed}.`
        );
    }

    const batchBarcodes = new Set<string>();
    const data = [];

    for (const input of products) {
        const barcode = await resolveUniqueBarcode(shopId, input.barcode, batchBarcodes);
        batchBarcodes.add(barcode);

        data.push({
            shopId,
            userId,
            p_name: input.p_name,
            p_price: input.p_price,
            p_costprice: input.p_costprice ?? 0,
            p_stock: input.p_stock,
            p_thumbnail: input.p_thumbnail,
            barcode,
        });
    }

    return prisma.product.createMany({
        data,
    });
}

export async function updateProduct(shopId: string, productId: string, input: UpdateProductInput) {
    const existing = await getProductById(shopId, productId);

    if (input.barcode && input.barcode !== existing.barcode) {
        const duplicate = await prisma.product.findFirst({
            where: {
                shopId,
                barcode: input.barcode,
            },
        });

        if (duplicate && duplicate.id !== productId) {
            throw new ConflictError(`A product with barcode "${input.barcode}" already exists in this shop`);
        }
    }

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
