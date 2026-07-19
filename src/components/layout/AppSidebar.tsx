import { Link, useRouterState } from "@tanstack/react-router";
import {
  ArchiveRestore,
  BarChart3,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  ShoppingBag,
  Store,
  Tags,
  Truck,
  Users,
} from "lucide-react";
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
  useSidebar,
} from "@/components/ui/sidebar";

const groups = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "Point of Sale", url: "/pos", icon: ShoppingCart },
    ],
  },
  {
    label: "Catalog",
    items: [
      { title: "Products", url: "/products", icon: Package },
      { title: "Categories", url: "/categories", icon: Tags },
    ],
  },
  {
    label: "Stock",
    items: [
      { title: "Inventory", url: "/inventory", icon: Boxes },
      { title: "Purchases", url: "/purchases", icon: ArchiveRestore },
      { title: "Suppliers", url: "/suppliers", icon: Truck },
    ],
  },
  {
    label: "Sell",
    items: [
      { title: "Sales", url: "/sales", icon: Receipt },
      { title: "Orders", url: "/orders", icon: ShoppingBag },
      { title: "Customers", url: "/customers", icon: Users },
    ],
  },
  {
    label: "Insights",
    items: [
      { title: "Reports", url: "/reports", icon: BarChart3 },
      { title: "Audit Logs", url: "/audit-logs", icon: ClipboardList },
    ],
  },
  {
    label: "System",
    items: [{ title: "Settings", url: "/settings", icon: Settings }],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const currentPath = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Store className="size-4.5" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <p className="font-display text-sm font-semibold text-sidebar-accent-foreground">
                NovaPOS
              </p>
              <p className="text-[11px] text-sidebar-foreground/70">Retail &amp; Inventory</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={currentPath === item.url}
                      tooltip={item.title}
                    >
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed && (
          <p className="px-2 py-1 text-[11px] text-sidebar-foreground/50">
            v1.0 · frontend ready for your API
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}