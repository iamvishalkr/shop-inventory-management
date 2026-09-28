import { Router } from "express";
import { requireAuth } from "../middleware/require-auth.middleware.js";
import { getUserProfile } from "../controllers/user.controller.js";

export const userRoutes = Router();

// Protect all user profile routes with authentication middleware
userRoutes.use(requireAuth);

userRoutes.get("/me", getUserProfile);
userRoutes.get("/getUser", getUserProfile);
