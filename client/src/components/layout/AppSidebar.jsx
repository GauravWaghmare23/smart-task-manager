"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";

import {
  LayoutDashboard,
  ListTodo,
  Users,
  LogOut,
  CheckSquare2,
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
} from "@/components/ui/sidebar";

import { logout } from "@/store/slices/authSlice";

const navigationItems = [
  {
    title: "Dashboard",
    href: "/dashboard/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Tasks",
    href: "/dashboard/admin/tasks",
    icon: ListTodo,
  },
  {
    title: "Users",
    href: "/dashboard/admin/users",
    icon: Users,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();

  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    localStorage.removeItem("token");

    dispatch(logout());

    router.replace("/login");
  };

  return (
    <Sidebar
      collapsible="icon"
      className="border-r"
    >
      {/* =========================
          HEADER
      ========================== */}
      <SidebarHeader className="border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Smart Task Manager"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <CheckSquare2 className="size-4" />
              </div>

              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  Smart Task Manager
                </span>

                <span className="truncate text-xs text-muted-foreground">
                  Admin Panel
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* =========================
          NAVIGATION
      ========================== */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            Management
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const Icon = item.icon;

                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive}
                      tooltip={item.title}
                      size="default"
                    >
                      <Icon className="size-4" />

                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* =========================
          FOOTER / USER
      ========================== */}
      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip={user?.name || "Account"}
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>

              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {user?.name || "User"}
                </span>

                <span className="truncate text-xs text-muted-foreground">
                  {user?.email || ""}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Logout"
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="size-4" />

              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}