"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { Store, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useShop } from "@/store/shop-store";
import { WEB_APP_NAME } from "@/constant";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  // Custom states to handle the manual fetch lifecycle
  const [isLoading, setIsLoading] = useState(true);
  const [userSession, setUserSession] = useState<any>(null);

  const {
    activeShop,
    shops,
    isLoading: isShopLoading,
    hasFetched,
    fetchShops,
  } = useShop();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function checkAuth() {
      try {
        console.log("Fetching session...");
        // Imperative method to get the session data
        const { data: session, error } = await authClient.getSession();

        if (error || !session) {
          console.log("No session found imperatively - redirecting to signin");
          router.push("/auth/signin");
        } else {
          console.log("Session verified imperatively:", session);
          setUserSession(session);

          // Call your shop fetching logic since auth is safe
          await fetchShops();
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch session:", err);
        router.push("/auth/signin");
      }
    }

    checkAuth();
  }, []);

  // Check if authenticated user has 0 shops ONLY after shop list has finished fetching
  useEffect(() => {
    if (
      userSession &&
      hasFetched &&
      !isShopLoading &&
      shops.length === 0 &&
      !pathname.includes("/onboarding")
    ) {
      router.push("/onboarding");
    }
  }, [userSession, hasFetched, isShopLoading, shops]);

  if (isLoading || isShopLoading || !hasFetched) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8 text-primary" />
          <p className="text-sm font-medium text-muted-foreground">
            Loading workspace & shop...
          </p>
        </div>
      </div>
    );
  }

  if (!userSession) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <DashboardSidebar />

        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top Header Bar */}
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-card/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-lg font-semibold tracking-tight">
                {WEB_APP_NAME}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className="gap-1.5 border-primary/30 bg-primary/10 text-primary font-semibold"
              >
                <Store className="h-3.5 w-3.5" />
                {activeShop ? activeShop.name : "No Shop Selected"}
              </Badge>
              <div className="flex items-center gap-2 rounded-full border border-border px-3 py-1 bg-muted/40 text-xs font-medium">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{userSession.user.name || userSession.user.email}</span>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
