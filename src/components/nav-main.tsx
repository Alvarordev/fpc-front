import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { NavGroup } from "@/types/navigation";

interface NavMainProps {
  groups: NavGroup[];
}

export function NavMain({ groups }: NavMainProps) {
  const { pathname } = useLocation();

  function isItemActive(url: string): boolean {
    if (url === "/pacientes") {
      return pathname === "/pacientes" || pathname.startsWith("/pacientes/");
    }
    return pathname === url;
  }

  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => {
                const isActive = isItemActive(item.url);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      render={<Link to={item.url} />}
                      isActive={isActive}
                      tooltip={item.title}
                      className={cn(
                        item.highlight &&
                          !isActive &&
                          "text-sidebar-primary font-medium",
                      )}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}
