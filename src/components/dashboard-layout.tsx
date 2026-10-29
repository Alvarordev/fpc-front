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
          {/* Fondo único del sistema de diseño (src/components/ds/README.md). */}
          <div className="min-w-0 flex-1 bg-[#f6f6f6] p-6">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
