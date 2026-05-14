import { useLocation } from "react-router-dom";
import { Bell } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { pathTitles } from "@/lib/navigation";

export function AppTopbar() {
  const { pathname } = useLocation();
  const baseSegment = "/" + (pathname.split("/")[1] ?? "");
  const title = pathTitles[baseSegment] ?? "Dashboard";

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-background/95 backdrop-blur-sm px-4">
      <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />

      <span className="text-sm font-medium">{title}</span>

      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="relative size-8 text-muted-foreground hover:text-foreground"
        >
          <Bell className="size-4" />
          <span className="absolute top-1 right-1.5 flex size-2 rounded-full bg-primary" />
        </Button>
      </div>
    </header>
  );
}
