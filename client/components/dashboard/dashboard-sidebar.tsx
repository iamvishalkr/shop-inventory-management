"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Receipt,
  User,
  Store,
} from "lucide-react";
import { useShop } from "@/store/shop-store";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const navItems = [
  {
    title: "Dashboard Overview",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "New POS Register",
    url: "/dashboard/sales/new",
    icon: ShoppingCart,
  },
  {
    title: "Products Inventory",
    url: "/dashboard/products",
    icon: Package,
  },
  {
    title: "Sales & Invoices",
    url: "/dashboard/sales",
    icon: Receipt,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { shops, activeShop, selectShop } = useShop();
  const router = useRouter();

  return (
    <Sidebar className="border-r border-border bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs shrink-0">
              <Store className="h-5 w-5" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold tracking-tight text-sidebar-foreground truncate">
                {activeShop?.name || "My Shop"}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {activeShop?.currency
                  ? `Currency: ${activeShop.currency}`
                  : "POS Workstation"}
              </span>
            </div>
          </div>

          {/* Shop Switcher */}
          {shops.length > 0 && (
            <div className="mt-1">
              <select
                value={activeShop?.id || ""}
                onChange={(e) => {
                  if (e.target.value === "new") {
                    router.push("/onboarding");
                  } else {
                    selectShop(e.target.value);
                  }
                }}
                className="w-full bg-background border border-input text-sidebar-foreground text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    🏪 {s.name}
                  </option>
                ))}
                <option value="new">+ Add New Shop (Free Tier 1 Limit)</option>
              </select>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60">
            Supermarket POS
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-2">
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  pathname === item.url ||
                  (item.url !== "/dashboard" && pathname.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.title}
                      className={`w-full justify-start gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      }`}
                    >
                      <Link
                        href={item.url}
                        className="flex w-full items-center gap-3"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-xs font-medium"
          nativeButton={false}
          render={(props) => (
            <Link href="/dashboard/profile" {...props}>
              <User className="h-3.5 w-3.5" />
              My Profile
            </Link>
          )}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
