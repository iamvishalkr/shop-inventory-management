import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "../../server/src/lib/auth";

export const authClient = createAuthClient({
    // Point this directly to your Express backend API endpoint
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL, // e.g., http://localhost:5000
    plugins: [
        inferAdditionalFields<typeof auth>()
    ],
    sessionOptions: {
        refetchOnWindowFocus: false
    }
});