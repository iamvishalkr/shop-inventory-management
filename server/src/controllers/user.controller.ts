import type { Request, Response, NextFunction } from "express";
import * as userService from "../services/user.service.js";

export async function getUserProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = req.session.user.id;
        const userProfile = await userService.getUserProfile(userId);
        res.status(200).json({ status: true, data: userProfile });
    } catch (error) {
        next(error);
    }
}
