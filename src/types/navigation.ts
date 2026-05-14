import type { LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  highlight?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}
