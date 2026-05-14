import { useNavigate } from "react-router-dom";
import { ChevronsUpDown, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/store/auth-store";
import type { User, UserRole } from "@/types";

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Administrador",
  AGENT: "Agente",
  VOLUNTEER: "Voluntario",
};

function getInitials(email: string): string {
  const localPart = email.split("@")[0];
  return localPart
    .split(/[._-]/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface NavUserProps {
  user: User;
}

export function NavUser({ user }: NavUserProps) {
  const { isMobile } = useSidebar();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const initials = getInitials(user.email);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-[popup-open]:bg-sidebar-accent"
              />
            }
          >
            <Avatar className="size-8 shrink-0 rounded-lg">
              <AvatarFallback className="bg-primary text-primary-foreground rounded-lg text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="text-sidebar-foreground truncate font-medium">
                {user.email}
              </span>
              <span className="text-sidebar-foreground/50 truncate text-xs">
                {roleLabels[user.role]}
              </span>
            </div>
            <ChevronsUpDown className="text-sidebar-foreground/50 ml-auto size-4 shrink-0" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <div className="px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Avatar className="size-8 rounded-lg">
                  <AvatarFallback className="bg-primary text-primary-foreground rounded-lg text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.email}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {roleLabels[user.role]}
                  </span>
                </div>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              <LogOut className="size-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
