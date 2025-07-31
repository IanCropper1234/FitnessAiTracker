import { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  email: string;
  name: string;
}

interface AuthProps {
  onSuccess: (user: User) => void;
}

export default function Auth({ onSuccess }: AuthProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const signUpMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; name: string }) => {
      try {
        const response = await apiRequest("POST", "/api/auth/signup", data);
        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }
        return response.json();
      } catch (error) {
        console.error('API request failed:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data && data.user) {
        toast({
          title: t("welcome") || "Welcome",
          description: `${t("welcome") || "Welcome"} ${data.user.name || 'User'}!`
        });
        onSuccess(data.user);
      } else {
        toast({
          title: "Error",
          description: "Invalid response from server",
          variant: "destructive"
        });
      }
    },
    onError: (error: any) => {
      console.error('Sign up error:', error);
      toast({
        title: "Error",
        description: error?.message || "Sign up failed",
        variant: "destructive"
      });
    }
  });

  const signInMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      try {
        console.log('Making signin request...');
        
        // Check if running as iOS PWA for enhanced handling
        const isIOSPWA = window.navigator.standalone === true || 
                         (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
        console.log('iOS PWA signin mode:', isIOSPWA);
        
        const response = await apiRequest("POST", "/api/auth/signin", data);
        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }
        const result = await response.json();
        console.log('Signin response received:', result);
        
        // For PWA mode, ensure session is properly established
        if (isIOSPWA && result?.user) {
          console.log('PWA signin success, storing auth cache');
          localStorage.setItem('fitai-auth-cache', JSON.stringify({
            timestamp: Date.now(),
            user: result.user
          }));
        }
        
        return result;
      } catch (error) {
        console.error('API request failed:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('SignIn mutation success:', data);
      if (data && data.user) {
        toast({
          title: t("welcome") || "Welcome",
          description: `${t("welcome") || "Welcome"} ${data.user.name || 'User'}!`
        });
        console.log('Calling onSuccess with user:', data.user);
        onSuccess(data.user);
      } else {
        console.error('Invalid response structure:', data);
        toast({
          title: "Error",
          description: "Invalid response from server",
          variant: "destructive"
        });
      }
    },
    onError: (error: any) => {
      console.error('Sign in error:', error);
      toast({
        title: "Error",
        description: error?.message || "Sign in failed",
        variant: "destructive"
      });
    }
  });

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");
    const name = formData.get("name");
    
    if (!email || !password || !name) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }
    
    const data = {
      email: email as string,
      password: password as string,
      name: name as string
    };
    signUpMutation.mutate(data);
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }
    
    const data = {
      email: email as string,
      password: password as string
    };
    signInMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-black dark:text-white">FitAI</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            {t("welcome") || "Welcome to FitAI"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800">
              <TabsTrigger 
                value="signin" 
                className="text-gray-700 dark:text-gray-300 data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:text-black dark:data-[state=active]:text-white"
              >
                {t("sign_in") || "Sign In"}
              </TabsTrigger>
              <TabsTrigger 
                value="signup"
                className="text-gray-700 dark:text-gray-300 data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:text-black dark:data-[state=active]:text-white"
              >
                {t("sign_up") || "Sign Up"}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="signin-email" className="text-black dark:text-white">{t("email") || "Email"}</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    required
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-black dark:text-white"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="signin-password" className="text-black dark:text-white">{t("password") || "Password"}</Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    required
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-black dark:text-white"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                  disabled={signInMutation.isPending}
                >
                  {signInMutation.isPending ? (t("loading") || "Loading...") : (t("sign_in") || "Sign In")}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <Label htmlFor="signup-name" className="text-black dark:text-white">{t("name") || "Name"}</Label>
                  <Input
                    id="signup-name"
                    name="name"
                    type="text"
                    required
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-black dark:text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="signup-email" className="text-black dark:text-white">{t("email") || "Email"}</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    required
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-black dark:text-white"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="signup-password" className="text-black dark:text-white">{t("password") || "Password"}</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    required
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-black dark:text-white"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                  disabled={signUpMutation.isPending}
                >
                  {signUpMutation.isPending ? (t("loading") || "Loading...") : (t("sign_up") || "Sign Up")}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}