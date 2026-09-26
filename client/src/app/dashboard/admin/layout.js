import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AdminDashboardLayout({ children }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="min-h-screen flex-1">{children}</main>
    </SidebarProvider>
  );
}
