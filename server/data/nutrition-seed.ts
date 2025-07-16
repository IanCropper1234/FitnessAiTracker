import { storage } from "../storage";

// Food categories based on RP Diet Coach methodology
const foodCategories = [
  // Protein Sources
  { name: "Lean Meats", macroType: "protein", description: "Low-fat meat sources" },
  { name: "Fish & Seafood", macroType: "protein", description: "Marine protein sources" },
  { name: "Poultry", macroType: "protein", description: "Chicken, turkey, and other birds" },
  { name: "Dairy", macroType: "protein", description: "Milk, yogurt, cheese" },
  { name: "Plant Proteins", macroType: "protein", description: "Legumes, tofu, tempeh" },
  { name: "Protein Supplements", macroType: "protein", description: "Powders and bars" },
  
  // Carbohydrate Sources
  { name: "Starchy Vegetables", macroType: "carbs", description: "Potatoes, sweet potatoes, corn" },
  { name: "Grains", macroType: "carbs", description: "Rice, oats, quinoa, pasta" },
  { name: "Fruits", macroType: "carbs", description: "Fresh and dried fruits" },
  { name: "Legumes", macroType: "carbs", description: "Beans, lentils, chickpeas" },
  { name: "Bread & Cereals", macroType: "carbs", description: "Whole grain breads and cereals" },
  
  // Fat Sources
  { name: "Nuts & Seeds", macroType: "fat", description: "Almonds, walnuts, chia seeds" },
  { name: "Oils", macroType: "fat", description: "Olive oil, coconut oil, avocado oil" },
  { name: "Avocados", macroType: "fat", description: "Fresh avocados and guacamole" },
  { name: "Fatty Fish", macroType: "fat", description: "Salmon, sardines, mackerel" },
  { name: "Nut Butters", macroType: "fat", description: "Almond butter, peanut butter" },
  
  // Vegetables (low calorie)
  { name: "Leafy Greens", macroType: "vegetables", description: "Spinach, kale, lettuce" },
  { name: "Cruciferous", macroType: "vegetables", description: "Broccoli, cauliflower, cabbage" },
  { name: "Other Vegetables", macroType: "vegetables", description: "Peppers, tomatoes, zucchini" }
];

// Sample food items for each category - matching schema fields exactly
const foodItems = [
  // Lean Meats
  { name: "Chicken Breast", categoryId: 1, calories: 165, protein: 31, carbs: 0, fat: 3.6, servingSize: "100", servingUnit: "g" },
  { name: "Lean Ground Beef (93/7)", categoryId: 1, calories: 176, protein: 26, carbs: 0, fat: 7, servingSize: "100", servingUnit: "g" },
  { name: "Pork Tenderloin", categoryId: 1, calories: 143, protein: 26, carbs: 0, fat: 3.5, servingSize: "100", servingUnit: "g" },
  
  // Fish & Seafood
  { name: "Salmon Fillet", categoryId: 2, calories: 208, protein: 25, carbs: 0, fat: 12, servingSize: "100", servingUnit: "g" },
  { name: "Cod Fillet", categoryId: 2, calories: 82, protein: 18, carbs: 0, fat: 0.7, servingSize: "100", servingUnit: "g" },
  { name: "Shrimp", categoryId: 2, calories: 99, protein: 24, carbs: 0, fat: 0.3, servingSize: "100", servingUnit: "g" },
  
  // Grains
  { name: "White Rice (cooked)", categoryId: 7, calories: 195, protein: 4, carbs: 42, fat: 0.4, servingSize: "150", servingUnit: "g" },
  { name: "Oats (dry)", categoryId: 7, calories: 156, protein: 7, carbs: 26, fat: 3, servingSize: "40", servingUnit: "g" },
  { name: "Quinoa (cooked)", categoryId: 7, calories: 180, protein: 7, carbs: 33, fat: 3, servingSize: "150", servingUnit: "g" },
  
  // Fruits
  { name: "Banana", categoryId: 9, calories: 107, protein: 1, carbs: 28, fat: 0.4, servingSize: "120", servingUnit: "g" },
  { name: "Apple", categoryId: 9, calories: 94, protein: 0.5, carbs: 25, fat: 0.3, servingSize: "180", servingUnit: "g" },
  { name: "Blueberries", categoryId: 9, calories: 86, protein: 1, carbs: 21, fat: 0.5, servingSize: "150", servingUnit: "g" },
  
  // Nuts & Seeds
  { name: "Almonds", categoryId: 12, calories: 162, protein: 6, carbs: 6, fat: 14, servingSize: "28", servingUnit: "g" },
  { name: "Walnuts", categoryId: 12, calories: 183, protein: 4, carbs: 4, fat: 18, servingSize: "28", servingUnit: "g" },
  { name: "Chia Seeds", categoryId: 12, calories: 136, protein: 5, carbs: 12, fat: 9, servingSize: "28", servingUnit: "g" },
  
  // Vegetables
  { name: "Broccoli", categoryId: 18, calories: 51, protein: 4, carbs: 11, fat: 0.6, servingSize: "150", servingUnit: "g" },
  { name: "Spinach", categoryId: 17, calories: 23, protein: 3, carbs: 4, fat: 0.4, servingSize: "100", servingUnit: "g" },
  { name: "Sweet Potato", categoryId: 6, calories: 129, protein: 3, carbs: 30, fat: 0.2, servingSize: "150", servingUnit: "g" }
];

export async function initializeNutritionDatabase() {
  try {
    console.log("Initializing nutrition database...");
    
    // Check if categories already exist
    const existingCategories = await storage.getFoodCategories();
    if (existingCategories.length > 0) {
      console.log("Nutrition database already initialized");
      return;
    }
    
    // Create food categories
    console.log("Creating food categories...");
    const createdCategories = [];
    for (const category of foodCategories) {
      const created = await storage.createFoodCategory(category);
      createdCategories.push(created);
    }
    
    // Create food items with correct category IDs
    console.log("Creating food items...");
    for (const item of foodItems) {
      // Find the category by index (since we created them in order)
      const categoryIndex = item.categoryId - 1;
      if (createdCategories[categoryIndex]) {
        await storage.createFoodItem({
          ...item,
          categoryId: createdCategories[categoryIndex].id
        });
      }
    }
    
    console.log("Nutrition database initialized successfully!");
    console.log(`Created ${createdCategories.length} food categories and ${foodItems.length} food items`);
    
  } catch (error) {
    console.error("Error initializing nutrition database:", error);
  }
}