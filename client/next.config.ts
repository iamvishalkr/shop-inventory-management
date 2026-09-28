import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
    // reactStrictMode: false,
    /* config options here */
    // Enforces a completely static build output
    output: 'export',

    // Optional: Disable server-dependent image optimization if deploying to a standard static host
    images: {
        unoptimized: true,
    },
    trailingSlash: true
};

export default withNextIntl(nextConfig);

