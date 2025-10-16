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
import { 
  ExternalLink, Mail, Lock, Dumbbell, Activity, Brain, Shield, 
  TrendingUp, Users, Award, Star, CheckCircle2, Zap, Target, 
  BarChart3, ArrowRight, Menu, X, ChevronRight, Sparkles
} from "lucide-react";
import { SiGoogle, SiApple } from "react-icons/si";
import { ProgressiveRegistrationForm } from "@/components/ProgressiveRegistrationForm";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);

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
      console.error('Signup error:', error);
      const message = error?.message || "Failed to create account";
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    }
  });

  const signInMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/signin", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data && data.user) {
        toast({
          title: t("welcome_back") || "Welcome back",
          description: `${t("welcome_back") || "Welcome back"} ${data.user.name || 'User'}!`
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
      const message = error?.message || "Invalid email or password";
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    }
  });

  const [signInData, setSignInData] = useState({ email: "", password: "" });
  const [signUpData, setSignUpData] = useState({ email: "", password: "", name: "" });

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    signInMutation.mutate(signInData);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    signUpMutation.mutate(signUpData);
  };

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    setIsLoading(true);
    try {
      const isDesktop = window.innerWidth >= 768;
      const authUrl = provider === 'google' 
        ? `/api/auth/google`
        : `/api/auth/apple`;
      
      if (isDesktop) {
        const width = 500;
        const height = 600;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        
        const popup = window.open(
          authUrl,
          `${provider}Auth`,
          `width=${width},height=${height},left=${left},top=${top}`
        );
        
        const checkAuth = setInterval(async () => {
          if (popup?.closed) {
            clearInterval(checkAuth);
            const response = await apiRequest('GET', '/api/auth/me');
            if (response.ok) {
              const userData = await response.json();
              onSuccess(userData);
            }
            setIsLoading(false);
          }
        }, 500);
      } else {
        window.location.href = authUrl;
      }
    } catch (error) {
      console.error(`${provider} sign-in error:`, error);
      toast({
        title: "Error",
        description: `Failed to sign in with ${provider}`,
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const stats = [
    { number: "50K+", label: "Active Users", icon: Users },
    { number: "98%", label: "Success Rate", icon: TrendingUp },
    { number: "4.9", label: "App Rating", icon: Star },
    { number: "24/7", label: "AI Support", icon: Zap }
  ];

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Intelligence",
      description: "Advanced GPT-5 model analyzes your progress and adapts your program in real-time",
      gradient: "from-purple-600 to-indigo-600"
    },
    {
      icon: BarChart3,
      title: "Scientific Periodization",
      description: "Evidence-based training methodologies with auto-regulation and volume landmarks",
      gradient: "from-blue-600 to-cyan-600"
    },
    {
      icon: Target,
      title: "Precision Nutrition",
      description: "AI-powered food recognition and macro tracking with automated adjustments",
      gradient: "from-green-600 to-emerald-600"
    },
    {
      icon: Dumbbell,
      title: "Personalized Programs",
      description: "Custom mesocycles and training templates tailored to your goals and experience",
      gradient: "from-orange-600 to-red-600"
    }
  ];

  const testimonials = [
    {
      name: "Michael Chen",
      role: "Competitive Bodybuilder",
      content: "MyTrainPro's periodization system helped me gain 15lbs of muscle in my last bulking phase. The AI adjustments are spot-on.",
      rating: 5
    },
    {
      name: "Sarah Johnson", 
      role: "Fitness Enthusiast",
      content: "Finally, an app that understands progressive overload! The auto-regulation feature prevents me from overtraining.",
      rating: 5
    },
    {
      name: "David Park",
      role: "Personal Trainer",
      content: "I recommend MyTrainPro to all my clients. The science-based approach sets it apart from every other fitness app.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* iOS Safe Area Top */}
      <div className="h-[env(safe-area-inset-top)] bg-gray-900" />
      
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Navigation Bar */}
      <nav className="relative z-50 border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-3"
              >
                <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg">
                  <Dumbbell className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">MyTrainPro</span>
              </motion.div>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#testimonials" className="text-gray-300 hover:text-white transition-colors">Testimonials</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
              <Button 
                onClick={() => {
                  setShowAuthForm(!showAuthForm);
                  if (!showAuthForm) {
                    setTimeout(() => {
                      document.getElementById('auth-form')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }
                }}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                Sign In / Sign Up
              </Button>
            </div>

            <button 
              className="md:hidden text-gray-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-gray-900/95 backdrop-blur-xl border-t border-gray-800"
            >
              <div className="px-4 py-4 space-y-3 pb-[env(safe-area-inset-bottom)]">
                <a href="#features" className="block text-gray-300 hover:text-white transition-colors">Features</a>
                <a href="#testimonials" className="block text-gray-300 hover:text-white transition-colors">Testimonials</a>
                <a href="#pricing" className="block text-gray-300 hover:text-white transition-colors">Pricing</a>
                <Button 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowAuthForm(!showAuthForm);
                    if (!showAuthForm) {
                      setTimeout(() => {
                        document.getElementById('auth-form')?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  Sign In / Sign Up
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-full mb-6">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span className="text-sm text-purple-300">Powered by Advanced AI</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Transform Your
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                Fitness Journey
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Experience the future of fitness with AI-powered coaching, scientific periodization, 
              and intelligent nutrition tracking. Join thousands achieving their dream physique.
            </p>

            <div className="flex justify-center">
              <Button 
                onClick={() => {
                  setShowAuthForm(!showAuthForm);
                  if (!showAuthForm) {
                    setTimeout(() => {
                      document.getElementById('auth-form')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }
                }}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-6 text-lg shadow-2xl shadow-purple-500/25"
              >
                Sign In / Sign Up
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-gray-900/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-white mb-4">
                Everything You Need to Succeed
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Cutting-edge technology meets proven fitness science
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="group relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-xl"
                    style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }}
                  />
                  <Card className="relative h-full bg-gray-800/50 backdrop-blur-sm border-gray-700 hover:border-gray-600 transition-all duration-300">
                    <CardHeader>
                      <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.gradient} mb-4`}>
                        <feature.icon className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-white text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-400">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-white mb-4">
                Trusted by Fitness Enthusiasts
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                See what our users are saying about their transformation
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full bg-gray-800/30 backdrop-blur-sm border-gray-700">
                    <CardHeader>
                      <div className="flex mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                      <CardDescription className="text-gray-300 text-base">
                        "{testimonial.content}"
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div>
                        <div className="text-white font-semibold">{testimonial.name}</div>
                        <div className="text-gray-400 text-sm">{testimonial.role}</div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Auth Form Section - Only show when showAuthForm is true */}
        {showAuthForm && (
          <section id="auth-form" className="py-20 bg-gray-900/50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-md mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-2xl text-center text-white">
                      Start Your Journey
                    </CardTitle>
                    <CardDescription className="text-center text-gray-400">
                      Join thousands transforming their fitness
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* OAuth Buttons */}
                    <div className="space-y-3 mb-6">
                      <Button
                        variant="outline"
                        className="w-full border-gray-600 hover:bg-gray-700 text-white"
                        onClick={() => handleOAuthSignIn('google')}
                        disabled={isLoading}
                        data-testid="button-google-signin"
                      >
                        <SiGoogle className="mr-2 h-4 w-4" />
                        Continue with Google
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="w-full border-gray-600 hover:bg-gray-700 text-white"
                        onClick={() => handleOAuthSignIn('apple')}
                        disabled={isLoading}
                        data-testid="button-apple-signin"
                      >
                        <SiApple className="mr-2 h-4 w-4" />
                        Continue with Apple
                      </Button>
                    </div>

                    <div className="relative mb-6">
                      <div className="absolute inset-0 flex items-center">
                        <Separator className="bg-gray-700" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-gray-800 px-2 text-gray-400">Or continue with email</span>
                      </div>
                    </div>

                    {/* Tabs for Sign In / Sign Up */}
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="grid w-full grid-cols-2 bg-gray-700">
                        <TabsTrigger value="signin" className="data-[state=active]:bg-gray-600">
                          Sign In
                        </TabsTrigger>
                        <TabsTrigger value="signup" className="data-[state=active]:bg-gray-600">
                          Sign Up
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="signin">
                        <form onSubmit={handleSignIn} className="space-y-4">
                          <div>
                            <Label htmlFor="signin-email" className="text-gray-300">Email</Label>
                            <Input
                              id="signin-email"
                              type="email"
                              value={signInData.email}
                              onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                              required
                              className="bg-gray-700 border-gray-600 text-white"
                              placeholder="john@example.com"
                              data-testid="input-signin-email"
                            />
                          </div>
                          <div>
                            <Label htmlFor="signin-password" className="text-gray-300">Password</Label>
                            <Input
                              id="signin-password"
                              type="password"
                              value={signInData.password}
                              onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                              required
                              className="bg-gray-700 border-gray-600 text-white"
                              placeholder="••••••••"
                              data-testid="input-signin-password"
                            />
                          </div>
                          <Button 
                            type="submit" 
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                            disabled={signInMutation.isPending}
                            data-testid="button-signin-submit"
                          >
                            {signInMutation.isPending ? "Signing in..." : "Sign In"}
                          </Button>
                        </form>
                      </TabsContent>

                      <TabsContent value="signup">
                        <ProgressiveRegistrationForm onSuccess={onSuccess} />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>
        )}

        {/* Privacy Notice */}
        <section className="py-12 bg-gray-900/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto text-center"
            >
              <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 backdrop-blur-sm border border-blue-800/50 rounded-2xl p-8">
                <Shield className="h-8 w-8 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-3">Your Privacy Matters</h3>
                <p className="text-gray-300 mb-4">
                  We request access to your basic profile information (email and name) solely to provide 
                  you with personalized fitness recommendations and track your progress. Your data is 
                  encrypted and never shared with third parties.
                </p>
                <div className="flex justify-center space-x-4 text-sm">
                  <Link href="/privacy-policy" className="text-blue-400 hover:text-blue-300 underline">
                    Privacy Policy
                  </Link>
                  <span className="text-gray-500">•</span>
                  <Link href="/terms-of-service" className="text-blue-400 hover:text-blue-300 underline">
                    Terms of Service
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-gray-800 pb-[calc(2rem+env(safe-area-inset-bottom))]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-3 mb-4 md:mb-0">
                <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl">
                  <Dumbbell className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">MyTrainPro</span>
              </div>
              
              <div className="flex space-x-6 text-sm text-gray-400">
                <Link href="/privacy-policy" className="hover:text-white transition-colors">
                  Privacy
                </Link>
                <Link href="/terms-of-service" className="hover:text-white transition-colors">
                  Terms
                </Link>
                <a href="mailto:support@mytrainpro.app" className="hover:text-white transition-colors">
                  Contact
                </a>
              </div>
              
              <div className="text-sm text-gray-400 mt-4 md:mt-0">
                © {new Date().getFullYear()} MyTrainPro. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}