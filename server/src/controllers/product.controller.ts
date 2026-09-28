import type { Request, Response, NextFunction } from "express";
import { createProductSchema, updateProductSchema } from "../validators/product.validator.js";
import * as productService from "../services/product.service.js";

export async function getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const shopId = req.shopId!;
        const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
        const search = req.query.search ? (req.query.search as string) : undefined;

        const result = await productService.getProductsByShop(shopId, { page, limit, search });
        res.status(200).json({ status: true, data: result.products, pagination: result.pagination });
    } catch (error) {
        next(error);
    }
}

export async function createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const shopId = req.shopId!;
        const userId = req.session.user.id;
        const validated = createProductSchema.parse(req.body);
        const product = await productService.createProduct(shopId, userId, validated);
        res.status(201).json({ status: true, message: "Product created successfully", data: product });
    } catch (error) {
        next(error);
    }
}

export async function updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const shopId = req.shopId!;
        const productId = req.params.id || req.body.productId;
        const validated = updateProductSchema.parse(req.body.newdata || req.body);
        const updated = await productService.updateProduct(shopId, productId, validated);
        res.status(200).json({ status: true, message: "Product updated successfully", data: updated });
    } catch (error) {
        next(error);
    }
}

export async function deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const shopId = req.shopId!;
        const productId = req.params.id || req.body.productId;
        await productService.deleteProduct(shopId, productId);
        res.status(200).json({ status: true, message: "Product deleted successfully" });
    } catch (error) {
        next(error);
    }
}
