import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/components/language-provider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Search, Scan } from "lucide-react";

interface NutritionLoggerProps {
  userId: number;
  onComplete?: () => void;
}

export function NutritionLogger({ userId, onComplete }: NutritionLoggerProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [mealType, setMealType] = useState<string>("");

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["/api/nutrition/search", searchQuery],
    enabled: searchQuery.length >= 2,
  });

  const logFood = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/nutrition/log", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nutrition/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nutrition/logs"] });
      toast({
        title: t("nutrition.food_logged"),
        description: `${selectedFood?.name} has been added to your log`,
      });
      onComplete?.();
      setSelectedFood(null);
      setSearchQuery("");
      setQuantity(1);
      setMealType("");
    },
    onError: (error) => {
      toast({
        title: t("error.failed_submit"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogFood = () => {
    if (!selectedFood) return;

    logFood.mutate({
      userId,
      foodName: selectedFood.name,
      quantity,
      unit: "g",
      mealType,
    });
  };

  const mealTypes = [
    { value: "breakfast", label: t("nutrition.breakfast") },
    { value: "lunch", label: t("nutrition.lunch") },
    { value: "dinner", label: t("nutrition.dinner") },
    { value: "snack", label: t("nutrition.snack") },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("nutrition.log_food")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <Label>{t("nutrition.food_search")}</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for food..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Search Results */}
        {searchResults && searchResults.length > 0 && (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {searchResults.map((food: any, index: number) => (
              <Button
                key={index}
                variant={selectedFood?.name === food.name ? "default" : "outline"}
                onClick={() => setSelectedFood(food)}
                className="w-full justify-start"
              >
                <div className="text-left">
                  <div className="font-medium">{food.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {food.calories} kcal per {food.servingSize}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        )}

        {/* Selected Food Details */}
        {selectedFood && (
          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <h4 className="font-medium">{selectedFood.name}</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("nutrition.quantity")}</Label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  min="0.1"
                  step="0.1"
                />
              </div>
              
              <div className="space-y-2">
                <Label>{t("nutrition.meal_type")}</Label>
                <Select value={mealType} onValueChange={setMealType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select meal" />
                  </SelectTrigger>
                  <SelectContent>
                    {mealTypes.map((meal) => (
                      <SelectItem key={meal.value} value={meal.value}>
                        {meal.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-sm">
              <div className="text-center">
                <div className="font-medium">{Math.round(selectedFood.calories * quantity)}</div>
                <div className="text-muted-foreground">kcal</div>
              </div>
              <div className="text-center">
                <div className="font-medium macro-protein">{Math.round(selectedFood.protein * quantity)}g</div>
                <div className="text-muted-foreground">Protein</div>
              </div>
              <div className="text-center">
                <div className="font-medium macro-carbs">{Math.round(selectedFood.carbs * quantity)}g</div>
                <div className="text-muted-foreground">Carbs</div>
              </div>
              <div className="text-center">
                <div className="font-medium macro-fat">{Math.round(selectedFood.fat * quantity)}g</div>
                <div className="text-muted-foreground">Fat</div>
              </div>
            </div>

            <Button
              onClick={handleLogFood}
              disabled={logFood.isPending || !mealType}
              className="w-full"
            >
              {logFood.isPending ? t("common.submitting") : t("nutrition.add_food")}
            </Button>
          </div>
        )}

        {/* Barcode Scanner Button */}
        <Button variant="outline" className="w-full" disabled>
          <Scan className="w-4 h-4 mr-2" />
          {t("nutrition.scan_barcode")}
        </Button>
      </CardContent>
    </Card>
  );
}
