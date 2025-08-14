import * as React from "react";
const { createContext, useContext, useEffect, useState } = React;

type Language = "en" | "es" | "ja" | "zh-CN" | "de" | "zh-TW";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Simple translation map
const translations: Record<Language, Record<string, string>> = {
  en: {
    "dashboard": "Dashboard",
    "nutrition": "Nutrition",
    "training": "Training",
    "reports": "Reports",
    "profile": "Profile",
    "calories": "Calories",
    "protein": "Protein",
    "carbs": "Carbs",
    "fat": "Fat",
    "goal": "Goal",
    "current": "Current",
    "log_food": "Log Food",
    "start_workout": "Start Workout",
    "weight": "Weight",
    "sets": "Sets",
    "reps": "Reps",
    "rest": "Rest",
    "completed": "Completed",
    "save": "Save",
    "cancel": "Cancel",
    "submit": "Submit",
    "loading": "Loading...",
    "welcome": "Welcome to TrainPro",
    "sign_in": "Sign In",
    "sign_up": "Sign Up",
    "email": "Email",
    "password": "Password",
    "name": "Name",
    "language": "Language",
    "theme": "Theme",
    "light": "Light",
    "dark": "Dark"
  },
  es: {
    "dashboard": "Panel",
    "nutrition": "Nutrición",
    "training": "Entrenamiento",
    "reports": "Informes",
    "profile": "Perfil",
    "calories": "Calorías",
    "protein": "Proteína",
    "carbs": "Carbohidratos",
    "fat": "Grasa",
    "goal": "Objetivo",
    "current": "Actual",
    "log_food": "Registrar Comida",
    "start_workout": "Iniciar Entrenamiento",
    "weight": "Peso",
    "sets": "Series",
    "reps": "Repeticiones",
    "rest": "Descanso",
    "completed": "Completado",
    "save": "Guardar",
    "cancel": "Cancelar",
    "submit": "Enviar",
    "loading": "Cargando...",
    "welcome": "Bienvenido a TrainPro",
    "sign_in": "Iniciar Sesión",
    "sign_up": "Registrarse",
    "email": "Correo",
    "password": "Contraseña",
    "name": "Nombre",
    "language": "Idioma",
    "theme": "Tema",
    "light": "Claro",
    "dark": "Oscuro"
  },
  ja: {
    "dashboard": "ダッシュボード",
    "nutrition": "栄養",
    "training": "トレーニング",
    "reports": "レポート",
    "profile": "プロフィール",
    "calories": "カロリー",
    "protein": "プロテイン",
    "carbs": "炭水化物",
    "fat": "脂質",
    "goal": "目標",
    "current": "現在",
    "log_food": "食事記録",
    "start_workout": "ワークアウト開始",
    "weight": "重量",
    "sets": "セット",
    "reps": "レップ",
    "rest": "休憩",
    "completed": "完了",
    "save": "保存",
    "cancel": "キャンセル",
    "submit": "送信",
    "loading": "読み込み中...",
    "welcome": "TrainProへようこそ",
    "sign_in": "サインイン",
    "sign_up": "サインアップ",
    "email": "メール",
    "password": "パスワード",
    "name": "名前",
    "language": "言語",
    "theme": "テーマ",
    "light": "ライト",
    "dark": "ダーク"
  },
  "zh-CN": {
    "dashboard": "仪表板",
    "nutrition": "营养",
    "training": "训练",
    "reports": "报告",
    "profile": "个人资料",
    "calories": "卡路里",
    "protein": "蛋白质",
    "carbs": "碳水化合物",
    "fat": "脂肪",
    "goal": "目标",
    "current": "当前",
    "log_food": "记录食物",
    "start_workout": "开始锻炼",
    "weight": "重量",
    "sets": "组",
    "reps": "次",
    "rest": "休息",
    "completed": "已完成",
    "save": "保存",
    "cancel": "取消",
    "submit": "提交",
    "loading": "加载中...",
    "welcome": "欢迎使用TrainPro",
    "sign_in": "登录",
    "sign_up": "注册",
    "email": "邮箱",
    "password": "密码",
    "name": "姓名",
    "language": "语言",
    "theme": "主题",
    "light": "浅色",
    "dark": "深色"
  },
  de: {
    "dashboard": "Dashboard",
    "nutrition": "Ernährung",
    "training": "Training",
    "reports": "Berichte",
    "profile": "Profil",
    "calories": "Kalorien",
    "protein": "Protein",
    "carbs": "Kohlenhydrate",
    "fat": "Fett",
    "goal": "Ziel",
    "current": "Aktuell",
    "log_food": "Essen Protokollieren",
    "start_workout": "Training Starten",
    "weight": "Gewicht",
    "sets": "Sätze",
    "reps": "Wiederholungen",
    "rest": "Pause",
    "completed": "Abgeschlossen",
    "save": "Speichern",
    "cancel": "Abbrechen",
    "submit": "Senden",
    "loading": "Laden...",
    "welcome": "Willkommen bei TrainPro",
    "sign_in": "Anmelden",
    "sign_up": "Registrieren",
    "email": "E-Mail",
    "password": "Passwort",
    "name": "Name",
    "language": "Sprache",
    "theme": "Design",
    "light": "Hell",
    "dark": "Dunkel"
  },
  "zh-TW": {
    "dashboard": "儀表板",
    "nutrition": "營養",
    "training": "訓練",
    "reports": "報告",
    "profile": "個人資料",
    "calories": "卡路里",
    "protein": "蛋白質",
    "carbs": "碳水化合物",
    "fat": "脂肪",
    "goal": "目標",
    "current": "當前",
    "log_food": "記錄食物",
    "start_workout": "開始鍛鍊",
    "weight": "重量",
    "sets": "組",
    "reps": "次",
    "rest": "休息",
    "completed": "已完成",
    "save": "儲存",
    "cancel": "取消",
    "submit": "提交",
    "loading": "載入中...",
    "welcome": "歡迎使用TrainPro",
    "sign_in": "登入",
    "sign_up": "註冊",
    "email": "信箱",
    "password": "密碼",
    "name": "姓名",
    "language": "語言",
    "theme": "主題",
    "light": "淺色",
    "dark": "深色"
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("fitai-language") as Language;
      if (stored && translations[stored]) return stored;
      
      // Detect browser language
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith("es")) return "es";
      if (browserLang.startsWith("ja")) return "ja";
      if (browserLang.startsWith("zh-cn") || browserLang === "zh") return "zh-CN";
      if (browserLang.startsWith("de")) return "de";
      if (browserLang.startsWith("zh-tw")) return "zh-TW";
    }
    return "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("fitai-language", lang);
    }
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}