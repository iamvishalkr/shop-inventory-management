import { Router } from "express";
import { shopController } from "../controllers/shop.controller.js";
import { requireAuth } from "../middleware/require-auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.post("/onboarding", (req, res, next) => shopController.createShop(req, res, next));
router.get("/my-shops", (req, res, next) => shopController.getUserShops(req, res, next));
router.get("/:id", (req, res, next) => shopController.getShopById(req, res, next));
router.put("/:id", (req, res, next) => shopController.updateShop(req, res, next));

export default router;
