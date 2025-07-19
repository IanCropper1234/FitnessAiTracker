import { UserProfile } from "@/components/user-profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogOut, User as UserIcon } from "lucide-react";
import { useLocation } from "wouter";

interface User {
  id: number;
  email: string;
  name: string;
}

interface ProfilePageProps {
  user: User;
  onSignOut?: () => void;
}

export function ProfilePage({ user, onSignOut }: ProfilePageProps) {
  const [, setLocation] = useLocation();

  const handleSignOut = () => {
    if (onSignOut) {
      onSignOut();
    }
    setLocation("/auth");
  };
  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <div className="container mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your personal information and preferences
            </p>
          </div>
        </div>

        {/* User Info Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-black dark:text-white">{user.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                </div>
              </div>
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Profile Component */}
        <UserProfile userId={user.id} />
      </div>
    </div>
  );
}