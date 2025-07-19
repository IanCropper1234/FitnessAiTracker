import { CustomizableDashboard } from "@/components/customizable-dashboard";

interface User {
  id: number;
  email: string;
  name: string;
}

interface DashboardProps {
  user: User;
}

export function Dashboard({ user }: DashboardProps) {
  return <CustomizableDashboard user={user} />;
}