import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailService } from "../services/email.service.js";
import prisma from "./db.js";

const clientUrl = process.env.CLIENT_URL || `http://localhost:3000`;

// Map to track the last time a verification email was sent to an email address (rate limit: 2 minutes / 120,000 ms)
const resendRateLimiter = new Map<string, number>();
const forgotPasswordRateLimiter = new Map<string, number>();
const RESEND_COOLDOWN_MS = 2 * 60 * 1000;

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: [clientUrl],
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true, // Enables Email & Password provider
        requireEmailVerification: true, // Requires email verification before login
        sendResetPassword: async ({ user, url, token }, request) => {
            const normalizedEmail = user.email.toLowerCase().trim();
            const now = Date.now();
            const lastSent = forgotPasswordRateLimiter.get(normalizedEmail);

            if (lastSent && now - lastSent < RESEND_COOLDOWN_MS) {
                console.warn(`[Auth] Rate limit prevented spamming reset password email to: ${normalizedEmail}`);
                return;
            }

            forgotPasswordRateLimiter.set(normalizedEmail, now);

            console.log(`[Auth Log] Password reset email triggered for user: ${user.email}`);

            await emailService.sendResetPasswordEmail(user.email, user.name, url);
        },
    },
    emailVerification: {
        expiresIn: 15 * 60, // 15 minutes (in seconds)
        sendOnSignUp: true, // Automatically triggers when a new user registers
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url, token }, request) => {
            const normalizedEmail = user.email.toLowerCase().trim();
            const now = Date.now();
            const lastSent = resendRateLimiter.get(normalizedEmail);

            if (lastSent && now - lastSent < RESEND_COOLDOWN_MS) {
                // We use a silent return here (with a warning) instead of throwing an Error 
                // to prevent Better Auth from logging a messy stack trace to the console.
                // Normal users will be blocked by the frontend's 2-minute timer anyway.
                console.warn(`[Auth] Rate limit prevented spamming verification email to: ${normalizedEmail}`);
                return;
            }

            resendRateLimiter.set(normalizedEmail, now);

            // Ensure verification URL always includes a valid callbackURL fallback
            let verificationUrl = url;
            const fullCallbackUrl = `${clientUrl}/dashboard`;
            if (verificationUrl.endsWith("callbackURL=") || verificationUrl.endsWith("callbackURL")) {
                verificationUrl += encodeURIComponent(fullCallbackUrl);
            } else if (!verificationUrl.includes("callbackURL=")) {
                verificationUrl += (verificationUrl.includes("?") ? "&" : "?") + "callbackURL=" + encodeURIComponent(fullCallbackUrl);
            }

            await emailService.sendVerificationEmail(user.email, user.name, verificationUrl);
        },
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!
        },
    },
    // advanced: {
    //     cookies: {
    //       state: {
    //         attributes: {
    //           sameSite: "none",
    //           secure: true,
    //         }
    //       }
    //     }
    //   }
});