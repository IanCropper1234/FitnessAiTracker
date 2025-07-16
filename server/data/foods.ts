import { storage } from "../storage";

export interface FoodItem {
  name: string;
  barcode?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  translations: Record<string, string>;
}

export const mockFoodDatabase: FoodItem[] = [
  {
    name: "Chicken Breast",
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    servingSize: "100g",
    translations: {
      en: "Chicken Breast",
      es: "Pechuga de Pollo",
      ja: "鶏胸肉",
      "zh-CN": "鸡胸肉",
      de: "Hähnchenbrust",
      "zh-TW": "雞胸肉"
    }
  },
  {
    name: "Brown Rice",
    calories: 111,
    protein: 2.6,
    carbs: 22,
    fat: 0.9,
    servingSize: "100g cooked",
    translations: {
      en: "Brown Rice",
      es: "Arroz Integral",
      ja: "玄米",
      "zh-CN": "糙米",
      de: "Vollkornreis",
      "zh-TW": "糙米"
    }
  },
  {
    name: "Broccoli",
    calories: 34,
    protein: 2.8,
    carbs: 7,
    fat: 0.4,
    servingSize: "100g",
    translations: {
      en: "Broccoli",
      es: "Brócoli",
      ja: "ブロッコリー",
      "zh-CN": "西兰花",
      de: "Brokkoli",
      "zh-TW": "青花菜"
    }
  },
  {
    name: "Salmon",
    calories: 208,
    protein: 22,
    carbs: 0,
    fat: 12,
    servingSize: "100g",
    translations: {
      en: "Salmon",
      es: "Salmón",
      ja: "サーモン",
      "zh-CN": "三文鱼",
      de: "Lachs",
      "zh-TW": "鮭魚"
    }
  },
  {
    name: "Sweet Potato",
    calories: 86,
    protein: 1.6,
    carbs: 20,
    fat: 0.1,
    servingSize: "100g",
    translations: {
      en: "Sweet Potato",
      es: "Batata",
      ja: "さつまいも",
      "zh-CN": "红薯",
      de: "Süßkartoffel",
      "zh-TW": "地瓜"
    }
  },
  {
    name: "Greek Yogurt",
    calories: 100,
    protein: 17,
    carbs: 6,
    fat: 0.7,
    servingSize: "100g",
    translations: {
      en: "Greek Yogurt",
      es: "Yogur Griego",
      ja: "ギリシャヨーグルト",
      "zh-CN": "希腊酸奶",
      de: "Griechischer Joghurt",
      "zh-TW": "希臘優格"
    }
  },
  {
    name: "Almonds",
    calories: 576,
    protein: 21,
    carbs: 22,
    fat: 49,
    servingSize: "100g",
    translations: {
      en: "Almonds",
      es: "Almendras",
      ja: "アーモンド",
      "zh-CN": "杏仁",
      de: "Mandeln",
      "zh-TW": "杏仁"
    }
  },
  {
    name: "Banana",
    calories: 89,
    protein: 1.1,
    carbs: 23,
    fat: 0.3,
    servingSize: "100g",
    translations: {
      en: "Banana",
      es: "Plátano",
      ja: "バナナ",
      "zh-CN": "香蕉",
      de: "Banane",
      "zh-TW": "香蕉"
    }
  },
  {
    name: "Oatmeal",
    calories: 68,
    protein: 2.4,
    carbs: 12,
    fat: 1.4,
    servingSize: "100g cooked",
    translations: {
      en: "Oatmeal",
      es: "Avena",
      ja: "オートミール",
      "zh-CN": "燕麦",
      de: "Haferflocken",
      "zh-TW": "燕麥"
    }
  },
  {
    name: "Eggs",
    calories: 155,
    protein: 13,
    carbs: 1.1,
    fat: 11,
    servingSize: "100g",
    translations: {
      en: "Eggs",
      es: "Huevos",
      ja: "卵",
      "zh-CN": "鸡蛋",
      de: "Eier",
      "zh-TW": "雞蛋"
    }
  },
  {
    name: "Avocado",
    calories: 160,
    protein: 2,
    carbs: 9,
    fat: 15,
    servingSize: "100g",
    translations: {
      en: "Avocado",
      es: "Aguacate",
      ja: "アボカド",
      "zh-CN": "牛油果",
      de: "Avocado",
      "zh-TW": "酪梨"
    }
  },
  {
    name: "Quinoa",
    calories: 120,
    protein: 4.4,
    carbs: 22,
    fat: 1.9,
    servingSize: "100g cooked",
    translations: {
      en: "Quinoa",
      es: "Quinua",
      ja: "キノア",
      "zh-CN": "藜麦",
      de: "Quinoa",
      "zh-TW": "藜麥"
    }
  },
  {
    name: "Spinach",
    calories: 23,
    protein: 2.9,
    carbs: 3.6,
    fat: 0.4,
    servingSize: "100g",
    translations: {
      en: "Spinach",
      es: "Espinaca",
      ja: "ほうれん草",
      "zh-CN": "菠菜",
      de: "Spinat",
      "zh-TW": "菠菜"
    }
  },
  {
    name: "Turkey Breast",
    calories: 135,
    protein: 30,
    carbs: 0,
    fat: 1,
    servingSize: "100g",
    translations: {
      en: "Turkey Breast",
      es: "Pechuga de Pavo",
      ja: "七面鳥胸肉",
      "zh-CN": "火鸡胸肉",
      de: "Putenbrust",
      "zh-TW": "火雞胸肉"
    }
  },
  {
    name: "Lentils",
    calories: 116,
    protein: 9,
    carbs: 20,
    fat: 0.4,
    servingSize: "100g cooked",
    translations: {
      en: "Lentils",
      es: "Lentejas",
      ja: "レンズ豆",
      "zh-CN": "扁豆",
      de: "Linsen",
      "zh-TW": "扁豆"
    }
  }
];

export function searchFoodDatabase(query: string, language: string = "en"): FoodItem[] {
  const normalizedQuery = query.toLowerCase();
  
  return mockFoodDatabase.filter(food => {
    const translatedName = food.translations[language] || food.name;
    return translatedName.toLowerCase().includes(normalizedQuery) ||
           food.name.toLowerCase().includes(normalizedQuery);
  });
}

export function getFoodByBarcode(barcode: string): FoodItem | undefined {
  return mockFoodDatabase.find(food => food.barcode === barcode);
}
