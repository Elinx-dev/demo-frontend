import { Link } from "react-router-dom";
import { ShieldCheck, UserPlus, MapPin } from "lucide-react";
import { Card } from "@/ui/primitives/Card/Card";
import Title from "@/ui/primitives/Title/Title";
import Text from "@/ui/primitives/Text/Text";
import { useAuth } from "@/app/AuthContext";
import { ROUTES } from "@/navigation/routes";

const quickLinks = [
  {
    to: ROUTES.PATHS.APP.USER_ACCESS_MANAGEMENT,
    icon: ShieldCheck,
    label: "User Access Management",
    description: "Manage roles, permissions, modules and menus.",
  },
  {
    to: ROUTES.PATHS.APP.USER_ONBOARDING,
    icon: UserPlus,
    label: "User Onboarding",
    description: "Create and manage user accounts.",
  },
  {
    to: ROUTES.PATHS.APP.SLATE.ROOT,
    icon: MapPin,
    label: "SLATE: Land Registry POC",
    description: "Citizen, Officer, Bank and Court/Admin land-registry demo.",
  },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="p-6 max-w-3xl mx-auto flex flex-col gap-6">
      <div>
        <Title>Welcome{user?.authUserName ? `, ${user.authUserName}` : ""}</Title>
        <Text className="text-ipc-text-muted">Pick where you'd like to go.</Text>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickLinks.map(({ to, icon: Icon, label, description }) => (
          <Link key={to} to={to}>
            <Card className="h-full flex flex-col gap-2 hover:shadow-ipc-md transition-shadow">
              <Icon size={20} />
              <Text className="font-semibold">{label}</Text>
              <Text className="text-ipc-text-muted text-sm">{description}</Text>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
