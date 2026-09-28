"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
    const router = useRouter();

    useEffect(() => {
        const lang = navigator.language?.startsWith("ro") ? "ro" : "en";
        router.replace(`/${lang}`);
    }, [router]);

    return (
        <html lang="en">
            <head>
                <meta httpEquiv="refresh" content="0;url=/en" />
            </head>
            <body className="bg-background"></body>
        </html>
    );
}