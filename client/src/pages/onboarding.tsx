import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/theme-provider";
import { useLanguage } from "@/components/language-provider";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Español" },
    { code: "ja", name: "日本語" },
    { code: "zh-CN", name: "简体中文" },
    { code: "de", name: "Deutsch" },
    { code: "zh-TW", name: "繁體中文" },
  ];

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 bg-gradient-to-br from-background to-muted">
      <div className="text-center max-w-sm mx-auto animate-fade-in">
        {/* App Logo */}
        <div className="w-24 h-24 mx-auto mb-8 bg-gradient-primary  flex items-center justify-center shadow-2xl">
          <div className="text-white font-bold text-2xl">Fi</div>
        </div>
        
        <h1 className="text-4xl font-bold mb-4 text-foreground">FlexSync</h1>
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
          Evidence-based training and nutrition coaching powered by Renaissance Periodization methodology
        </p>
        
        {/* Language Selector */}
        <div className="mb-8">
          <Select value={language} onValueChange={(value) => setLanguage(value as any)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Theme Toggle */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-3 bg-card border border-border  px-4 py-3">
            <span className="text-sm font-medium">
              {theme === "dark" ? "Dark Mode" : "Light Mode"}
            </span>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={toggleTheme}
            />
          </div>
        </div>
        
        <Button 
          onClick={() => setLocation("/auth")}
          className="w-full mb-4"
          size="lg"
        >
          Get Started
        </Button>
        
        <p className="text-sm text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
