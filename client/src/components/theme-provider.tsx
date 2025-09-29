import { createContext, useContext, useEffect, useState } from "react";

interface ReactNodeProps {
  children: React.ReactNode;
}

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: ReactNodeProps) {
  const [theme, setThemeState] = useState<Theme>("dark");

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("trainpro-theme") as Theme;
      if (stored) {
        setThemeState(stored);
        return;
      }
      
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      setThemeState(systemTheme);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(theme);
      localStorage.setItem("trainpro-theme", theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(theme === "light" ? "dark" : "light");
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    // iOS WebView compatibility: provide fallback instead of throwing error
    console.warn("useTheme hook used outside of ThemeProvider, using fallback values");
    
    return {
      theme: "dark" as Theme,
      toggleTheme: () => {
        console.warn("toggleTheme called outside of ThemeProvider context");
      },
      setTheme: () => {
        console.warn("setTheme called outside of ThemeProvider context");
      }
    };
  }
  return context;
}
