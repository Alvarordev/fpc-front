import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { Outlet } from "react-router-dom";

export function DashboardLayout() {
  return (
    <TooltipProvider delay={0}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppTopbar />
          <div className="flex-1 p-6">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
