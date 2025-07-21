// Script to add realistic food data for macro management testing
const foodEntries = [
  // July 19, 2025 - Balanced day
  { date: '2025-07-19', mealType: 'breakfast', foodName: 'Oatmeal with Banana', quantity: '1', unit: 'bowl', calories: '350', protein: '12', carbs: '65', fat: '6', category: 'carb_source' },
  { date: '2025-07-19', mealType: 'breakfast', foodName: 'Greek Yogurt', quantity: '150', unit: 'g', calories: '130', protein: '15', carbs: '9', fat: '4', category: 'protein_source' },
  { date: '2025-07-19', mealType: 'lunch', foodName: 'Grilled Chicken Salad', quantity: '1', unit: 'serving', calories: '420', protein: '35', carbs: '12', fat: '25', category: 'mixed_source' },
  { date: '2025-07-19', mealType: 'dinner', foodName: 'Salmon with Rice', quantity: '1', unit: 'serving', calories: '550', protein: '40', carbs: '45', fat: '22', category: 'mixed_source' },
  { date: '2025-07-19', mealType: 'snack', foodName: 'Almonds', quantity: '30', unit: 'g', calories: '180', protein: '6', carbs: '3', fat: '16', category: 'fat_source' },

  // July 20, 2025 - Higher protein day
  { date: '2025-07-20', mealType: 'breakfast', foodName: 'Protein Smoothie', quantity: '1', unit: 'cup', calories: '380', protein: '25', carbs: '35', fat: '12', category: 'protein_source' },
  { date: '2025-07-20', mealType: 'breakfast', foodName: 'Whole Grain Toast', quantity: '2', unit: 'slices', calories: '160', protein: '6', carbs: '28', fat: '3', category: 'carb_source' },
  { date: '2025-07-20', mealType: 'lunch', foodName: 'Tuna Sandwich', quantity: '1', unit: 'sandwich', calories: '450', protein: '32', carbs: '38', fat: '18', category: 'mixed_source' },
  { date: '2025-07-20', mealType: 'dinner', foodName: 'Beef Steak with Vegetables', quantity: '1', unit: 'serving', calories: '520', protein: '45', carbs: '15', fat: '30', category: 'mixed_source' },
  { date: '2025-07-20', mealType: 'snack', foodName: 'Cottage Cheese', quantity: '100', unit: 'g', calories: '120', protein: '14', carbs: '4', fat: '5', category: 'protein_source' },

  // July 18, 2025 - Lower calorie day
  { date: '2025-07-18', mealType: 'breakfast', foodName: 'Green Smoothie', quantity: '1', unit: 'cup', calories: '220', protein: '8', carbs: '45', fat: '3', category: 'carb_source' },
  { date: '2025-07-18', mealType: 'lunch', foodName: 'Quinoa Salad', quantity: '1', unit: 'bowl', calories: '320', protein: '12', carbs: '55', fat: '8', category: 'carb_source' },
  { date: '2025-07-18', mealType: 'dinner', foodName: 'Grilled Fish with Broccoli', quantity: '1', unit: 'serving', calories: '380', protein: '30', carbs: '20', fat: '18', category: 'mixed_source' },
  { date: '2025-07-18', mealType: 'snack', foodName: 'Apple with Peanut Butter', quantity: '1', unit: 'serving', calories: '190', protein: '4', carbs: '25', fat: '8', category: 'mixed_source' },

  // July 17, 2025 - Higher carb day
  { date: '2025-07-17', mealType: 'breakfast', foodName: 'Pancakes with Syrup', quantity: '3', unit: 'pieces', calories: '450', protein: '12', carbs: '75', fat: '12', category: 'carb_source' },
  { date: '2025-07-17', mealType: 'lunch', foodName: 'Pasta with Chicken', quantity: '1', unit: 'serving', calories: '580', protein: '28', carbs: '68', fat: '20', category: 'mixed_source' },
  { date: '2025-07-17', mealType: 'dinner', foodName: 'Rice Bowl with Tofu', quantity: '1', unit: 'bowl', calories: '420', protein: '18', carbs: '55', fat: '14', category: 'mixed_source' },
  { date: '2025-07-17', mealType: 'snack', foodName: 'Granola Bar', quantity: '1', unit: 'bar', calories: '140', protein: '3', carbs: '22', fat: '5', category: 'carb_source' },

  // July 16, 2025 - Balanced day
  { date: '2025-07-16', mealType: 'breakfast', foodName: 'Eggs with Avocado Toast', quantity: '1', unit: 'serving', calories: '420', protein: '18', carbs: '32', fat: '24', category: 'mixed_source' },
  { date: '2025-07-16', mealType: 'lunch', foodName: 'Turkey Wrap', quantity: '1', unit: 'wrap', calories: '380', protein: '25', carbs: '35', fat: '16', category: 'mixed_source' },
  { date: '2025-07-16', mealType: 'dinner', foodName: 'Chicken Curry with Rice', quantity: '1', unit: 'serving', calories: '520', protein: '32', carbs: '48', fat: '22', category: 'mixed_source' },
  { date: '2025-07-16', mealType: 'snack', foodName: 'Trail Mix', quantity: '30', unit: 'g', calories: '150', protein: '4', carbs: '12', fat: '10', category: 'fat_source' }
];

console.log('Food entries to add:', foodEntries.length);
console.log('Date range:', '2025-07-16 to 2025-07-20');