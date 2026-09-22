import {
  LayoutDashboard,
  Home,
  ArrowRightLeft,
  UploadCloud,
  Radar,
  ListChecks,
  AlertTriangle,
  Stamp,
  ScrollText,
  Search,
  Landmark,
  Gavel,
  Database,
  Compass,
  FileStack,
  Users2,
  KeyRound,
  ShieldCheck,
  Grid3x3,
  Percent,
  MapPin,
  Building2,
  type LucideIcon,
} from "lucide-react";

export const MENU_ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Home,
  ArrowRightLeft,
  UploadCloud,
  Radar,
  ListChecks,
  AlertTriangle,
  Stamp,
  ScrollText,
  Search,
  Landmark,
  Gavel,
  Database,
  Compass,
  FileStack,
  Users2,
  KeyRound,
  ShieldCheck,
  Grid3x3,
  Percent,
  MapPin,
  Building2,
};

export const MENU_ICON_NAMES = Object.keys(MENU_ICONS);

export function MenuIcon({ name, size = 14 }: { name?: string; size?: number }) {
  const Icon = (name && MENU_ICONS[name]) || Grid3x3;
  return <Icon size={size} />;
}
