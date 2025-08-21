import { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, Mail, Lock, Smartphone } from "lucide-react";
import { ProgressiveRegistrationForm } from "@/components/ProgressiveRegistrationForm";
import { motion, AnimatePresence } from "framer-motion";

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
  const [activeTab, setActiveTab] = useState("signin");

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
        const response = await apiRequest("POST", "/api/auth/signin", data);
        
        if (response.status === 403) {
          // Email verification required
          const result = await response.json();
          console.log('Email verification required:', result);
          throw { 
            status: 403, 
            message: result.message, 
            emailVerified: result.emailVerified || false,
            userFriendlyMessage: result.userFriendlyMessage 
          };
        }
        
        if (!response.ok) {
          const errorResult = await response.json().catch(() => ({}));
          throw new Error(errorResult.message || `Server error: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Signin response received:', result);
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
      
      if (error?.status === 403 && error?.emailVerified === false) {
        // Email verification required - use server message if available, otherwise fallback
        const userMessage = error?.userFriendlyMessage || "Email verification required before you can sign in";
        const description = error?.message || "We've sent you a verification link. Please check your email (including spam folder) and click the link to activate your account before signing in.";
        
        toast({
          title: "📧 Please Verify Your Email",
          description: description,
          variant: "default", // Use default instead of destructive for friendlier appearance
          duration: 8000 // Show longer for user to read
        });
        return;
      }
      
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

  const handleReplitAuth = () => {
    // Redirect to Replit Auth login endpoint
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
      <Card className="border-2 text-card-foreground shadow-sm hover:shadow-md transition-all duration-200 backdrop-blur-sm w-full max-w-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 pl-[10px] pr-[10px]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-black dark:text-white">TrainPro</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            {t("welcome") || "AI-Powered Fitness Platform"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-2 pl-[0px] pr-[0px]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800 relative overflow-hidden transition-all duration-300 ease-in-out p-1 rounded-lg">
              <TabsTrigger 
                value="signin" 
                className="text-gray-700 dark:text-gray-300 data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:text-black dark:data-[state=active]:text-white transition-all duration-300 ease-in-out transform data-[state=active]:scale-[1.02] data-[state=active]:shadow-sm hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-black dark:hover:text-white relative z-10 rounded-md"
              >
                {t("sign_in") || "Sign In"}
              </TabsTrigger>
              <TabsTrigger 
                value="signup"
                className="text-gray-700 dark:text-gray-300 data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:text-black dark:data-[state=active]:text-white transition-all duration-300 ease-in-out transform data-[state=active]:scale-[1.02] data-[state=active]:shadow-sm hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-black dark:hover:text-white relative z-10 rounded-md"
              >
                {t("sign_up") || "Sign Up"}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-4"
              >
                {/* Replit Auth Section - Supports Google, Apple, Email, GitHub */}
                <div className="space-y-3">
                <Button 
                  onClick={handleReplitAuth}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                  type="button"
                >
                  <Smartphone className="h-4 w-4" />
                  Sign in with Google • Apple • Email
                </Button>
                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  Choose from multiple secure login options
                </p>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full bg-gray-300 dark:bg-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">
                      Or use existing account
                    </span>
                  </div>
                </div>
              </div>

              {/* Legacy Email/Password Login for existing users */}
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="signin-email" className="text-black dark:text-white flex items-center gap-2 pt-[10px] pb-[10px]">
                    <Mail className="h-4 w-4" />
                    {t("email") || "Email"}
                  </Label>
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
                  <Label htmlFor="signin-password" className="text-black dark:text-white flex items-center gap-2 pt-[10px] pb-[10px]">
                    <Lock className="h-4 w-4" />
                    {t("password") || "Password"}
                  </Label>
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
              </motion.div>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-4"
              >
                {/* Enhanced Registration with Replit Auth Options */}
                <div className="space-y-4">
                {/* Replit Auth Section */}
                <div className="space-y-3">
                  <Button 
                    onClick={handleReplitAuth}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                    type="button"
                  >
                    <Smartphone className="h-4 w-4" />
                    Sign up with Google • Apple • Email
                  </Button>
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                    Quick setup with your preferred account
                  </p>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full bg-gray-300 dark:bg-gray-600" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">
                        Or use enhanced manual registration
                      </span>
                    </div>
                  </div>
                </div>

                {/* Enhanced Progressive Registration Form */}
                <ProgressiveRegistrationForm 
                  onSuccess={onSuccess} 
                  onSwitchToSignIn={() => setActiveTab("signin")}
                />
                </div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}