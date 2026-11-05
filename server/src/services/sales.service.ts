import prisma from "../lib/db.js";
import { NotFoundError, ValidationError } from "../types/app-error.js";
import type { CreateSaleInput } from "../validators/sales.validator.js";

export interface GetSalesOptions {
    page?: number;
    limit?: number;
    search?: string;
}

export async function getSalesByShop(shopId: string, options: GetSalesOptions = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 25));
    const skip = (page - 1) * limit;

    const where: any = { shopId };

    if (options.search && options.search.trim() !== "") {
        const searchTerm = options.search.trim();
        where.OR = [
            { cust_name: { contains: searchTerm, mode: "insensitive" } },
            { cust_email: { contains: searchTerm, mode: "insensitive" } },
            { cust_contact: { contains: searchTerm, mode: "insensitive" } },
        ];
    }

    const [totalItems, sales] = await prisma.$transaction([
        prisma.sale.count({ where }),
        prisma.sale.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return {
        sales,
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

export async function createSale(shopId: string, userId: string, input: CreateSaleInput) {
    return prisma.$transaction(async (tx) => {
        // 1. Verify availability and decrement stock for each item in the cart
        for (const item of input.cartItems) {
            const product = await tx.product.findFirst({
                where: {
                    id: item.c_id,
                    shopId,
                },
            });

            if (!product) {
                throw new NotFoundError(`Product "${item.c_name}" not found in this shop.`);
            }

            if (product.p_stock < item.c_quantity) {
                throw new ValidationError(
                    `Insufficient stock for "${product.p_name}". Available: ${product.p_stock}, Requested: ${item.c_quantity}`
                );
            }

            await tx.product.update({
                where: {
                    id: item.c_id,
                },
                data: {
                    p_stock: {
                        decrement: item.c_quantity,
                    },
                },
            });
        }

        // 2. Create the sale record within the same transaction
        const sale = await tx.sale.create({
            data: {
                shopId,
                userId,
                cust_name: input.cust_name,
                cust_email: input.cust_email,
                cust_contact: input.cust_contact,
                cartItems: input.cartItems as any,
            },
        });

        return sale;
    });
}

export async function deleteSale(shopId: string, salesId: string) {
    const sale = await prisma.sale.findFirst({
        where: { id: salesId, shopId },
    });

    if (!sale) {
        throw new NotFoundError("Sale not found or access denied");
    }

    return prisma.sale.delete({
        where: { id: salesId },
    });
}
