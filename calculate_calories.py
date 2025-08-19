import math

# 營養記錄數據 (從 SQL 查詢結果)
nutrition_logs = [
    ("95% lean minced beef - HKMEATLO", 154.72),
    ("NOW Foods, Zinc Picolinat", 0.00),
    ("Chicken Breast Fillet", 165.00),
    ("Natrol, Melatonin, Time Release, 3 mg", 0.00),
    ("Broccoli", 57.57),
    ("Liquid Egg white", 117.50),
    ("white rice (uncooked)", 337.50),
    ("Sport research Omegas 3", 60.00),
    ("Redon1 Mre", 530.00),
    ("Canola oil", 53.14),
    ("Excellence Mint Intense Chocolate", 107.00),
    ("Mark and Spencer's protein bagel", 237.06),
    ("Life Extension, Two-Per-Day Multivitamin", 0.00),
    ("California Gold Nutrition, CoQ10 with Bioperine", 0.00),
    ("NOW Foods, NAC", 0.00),
    ("淮山麵", 351.51),
    ("Life Extension, Super K", 0.00),
    ("Fried Egg", 90.00),
    ("Alpen no added sugar (v3)", 276.75),
    ("Oatly Chocolate Oatmilk (updated)", 151.11),
    ("Oatly Chocolate Oatmilk (updated)", 151.11),
    ("Life Extension, Two-Per-Day Multivitamin", 0.00)
]

total_calories = 0
print("卡路里明細計算:")
print("-" * 50)

for food_name, calories in nutrition_logs:
    print(f"{food_name:<45} {calories:>8.2f} cal")
    total_calories += calories

print("-" * 50)
print(f"{'總計':<45} {total_calories:>8.2f} cal")
print(f"四捨五入後: {round(total_calories)} cal")

# 後端回傳的值
backend_value = 2839.97
print(f"\n後端 API 回傳: {backend_value:.2f} cal")
print(f"差異: {abs(total_calories - backend_value):.2f} cal")

# IntegratedNutritionOverview 顯示值
ui_display = round(total_calories)
print(f"UI 顯示 (四捨五入): {ui_display} cal")
