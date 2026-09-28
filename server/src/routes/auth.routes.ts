import { Router } from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "../lib/auth.js";
import { authLimiter } from "../middleware/rate-limiter.middleware.js";
import { validateSignUp, validateResetPassword, validateChangePassword } from "../validators/auth.validator.js";

export const authRoutes = Router();

// Specific Zod validation handlers and rate limiters for sensitive auth operations
authRoutes.post("/sign-up/email", authLimiter, validateSignUp);
authRoutes.post("/sign-in/email", authLimiter);
authRoutes.post("/reset-password", authLimiter, validateResetPassword);
authRoutes.post("/change-password", authLimiter, validateChangePassword);

// Fallback to the main Better Auth request handler (get-session, etc.)
authRoutes.all("/{*any}", toNodeHandler(auth));
