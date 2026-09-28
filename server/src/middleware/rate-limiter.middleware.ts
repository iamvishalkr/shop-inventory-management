import { rateLimit } from "express-rate-limit";

/**
 * Strict rate limiter for authentication endpoints (login, signup, password reset, etc.).
 * Allows 10 requests per 15 minutes per IP.
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 15, // 15 attempts per IP per 15-minute window
    standardHeaders: "draft-7", // Return standard `RateLimit` header
    legacyHeaders: false, // Disable non-standard `X-RateLimit-*` headers
    message: {
        success: false,
        message: "Too many authentication attempts. Please try again after 15 minutes.",
    },
});

/**
 * Generous rate limiter for general application API endpoints.
 * Allows 200 requests per 15 minutes per IP.
 */
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 200, // 200 requests per IP per 15-minute window
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests. Please slow down and try again later.",
    },
});
