import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppSidebar } from "@/components/app-sidebar"
import { AppTopbar } from "@/components/app-topbar"
import {
  AssistantContent,
  AssistantWorkspace,
} from "@/components/assistant/assistant-workspace"
import { Outlet } from "react-router-dom"

export function DashboardLayout() {
  return (
    <TooltipProvider delay={0}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="min-w-0">
          <AssistantWorkspace>
            <AppTopbar />
            {/* Fondo único del sistema de diseño (src/components/ds/README.md). */}
            <AssistantContent>
              <div className="mx-auto max-w-7xl">
                <Outlet />
              </div>
            </AssistantContent>
          </AssistantWorkspace>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
