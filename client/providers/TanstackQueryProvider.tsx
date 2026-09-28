"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // Keep cached data fresh for 5 minutes
            refetchOnWindowFocus: false, // Turn off automatic refetch on window focus globally
            retry: 1,
        },
    },
});

const TanstackQueryProvider = ({ children }: { children: React.ReactNode }) => {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};

export default TanstackQueryProvider;