import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, DollarSign, Package, Utensils, Download, Calendar, Target } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ShoppingListItem {
  foodName: string;
  category: string;
  totalQuantity: number;
  unit: string;
  estimatedCost?: number;
  macroContribution: {
    protein: number;
    carbs: number;
    fat: number;
    calories: number;
  };
}

interface ShoppingListGroup {
  category: string;
  items: ShoppingListItem[];
  totalItems: number;
  estimatedCost: number;
}

interface ShoppingListGeneratorProps {
  userId: number;
}

export function ShoppingListGenerator({ userId }: ShoppingListGeneratorProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<'history' | 'optimized'>('optimized');
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  // Fetch shopping list based on food history
  const { data: historyShoppingList, isLoading: historyLoading } = useQuery({
    queryKey: ['/api/shopping-list', dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const response = await fetch(`/api/shopping-list?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      return response.json();
    },
    enabled: selectedTab === 'history'
  });

  // Fetch optimized shopping list based on diet goals
  const { data: optimizedShoppingList, isLoading: optimizedLoading } = useQuery({
    queryKey: ['/api/shopping-list/optimized'],
    queryFn: async () => {
      const response = await fetch(`/api/shopping-list/optimized`);
      return response.json();
    },
    enabled: selectedTab === 'optimized'
  });

  const currentShoppingList = selectedTab === 'history' ? historyShoppingList : optimizedShoppingList;
  const isLoading = selectedTab === 'history' ? historyLoading : optimizedLoading;

  const calculateTotalCost = (shoppingList: ShoppingListGroup[]): number => {
    return shoppingList?.reduce((total, group) => total + group.estimatedCost, 0) || 0;
  };

  const calculateTotalItems = (shoppingList: ShoppingListGroup[]): number => {
    return shoppingList?.reduce((total, group) => total + group.totalItems, 0) || 0;
  };

  const exportShoppingList = () => {
    if (!currentShoppingList) return;

    const listText = currentShoppingList.map((group: any) => {
      const items = group.items.map((item: any) => 
        `• ${item.foodName} - ${item.totalQuantity} ${item.unit} ${item.estimatedCost ? `($${item.estimatedCost})` : ''}`
      ).join('\n');
      
      return `${group.category.toUpperCase()}\n${items}\nSubtotal: $${group.estimatedCost}\n`;
    }).join('\n');

    const blob = new Blob([listText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shopping-list-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Shopping List Exported",
      description: "Your shopping list has been downloaded as a text file."
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700  w-20"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 dark:bg-gray-700  w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Scientific Diet Coach Shopping List
          </CardTitle>
          <CardDescription>
            Automated shopping lists based on evidence-based nutrition methodology
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 ">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Package className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900 dark:text-blue-100">Total Items</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">{calculateTotalItems(currentShoppingList)}</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950 ">
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900 dark:text-green-100">Estimated Cost</span>
              </div>
              <div className="text-2xl font-bold text-green-600">${calculateTotalCost(currentShoppingList)}</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 ">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Utensils className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-900 dark:text-purple-100">Categories</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">{currentShoppingList?.length || 0}</div>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as 'history' | 'optimized')}>
              <TabsList>
                <TabsTrigger value="optimized" className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Scientifically Optimized
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  From History
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Button onClick={exportShoppingList} disabled={!currentShoppingList} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export List
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Shopping List Content */}
      <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as 'history' | 'optimized')}>
        <TabsContent value="optimized" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Evidence-Based Optimized List</CardTitle>
              <CardDescription>
                Foods selected based on your macro targets and evidence-based nutrition principles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {optimizedShoppingList && optimizedShoppingList.length > 0 ? (
                <div className="space-y-6">
                  {optimizedShoppingList.map((group: ShoppingListGroup, groupIndex: number) => (
                    <div key={groupIndex} className="border  p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg">{group.category}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{group.totalItems} items</Badge>
                          <Badge variant="outline">${group.estimatedCost}</Badge>
                        </div>
                      </div>
                      
                      <div className="grid gap-3">
                        {group.items.map((item: ShoppingListItem, itemIndex: number) => (
                          <div key={itemIndex} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 ">
                            <div className="flex-1">
                              <div className="font-medium">{item.foodName}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {item.totalQuantity} {item.unit}
                                {item.macroContribution && (
                                  <span className="ml-2">
                                    • P: {item.macroContribution.protein.toFixed(0)}g 
                                    • C: {item.macroContribution.carbs.toFixed(0)}g 
                                    • F: {item.macroContribution.fat.toFixed(0)}g
                                  </span>
                                )}
                              </div>
                            </div>
                            {item.estimatedCost && (
                              <div className="text-right">
                                <div className="font-medium text-green-600">${item.estimatedCost}</div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 ">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Scientific Shopping Tips:
                    </h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• Buy protein sources in bulk for cost efficiency</li>
                      <li>• Choose complex carbs for sustained energy</li>
                      <li>• Select minimally processed foods when possible</li>
                      <li>• Frozen vegetables are cost-effective and nutritious</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Set up your diet goals to generate an optimized shopping list
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">History-Based Shopping List</CardTitle>
              <CardDescription>
                Generated from your recent food logs and eating patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border "
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Date</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border "
                  />
                </div>
              </div>

              {historyShoppingList && historyShoppingList.length > 0 ? (
                <div className="space-y-4">
                  {historyShoppingList.map((group: ShoppingListGroup, groupIndex: number) => (
                    <div key={groupIndex} className="border  p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">{group.category}</h3>
                        <Badge variant="secondary">{group.totalItems} items</Badge>
                      </div>
                      
                      <div className="grid gap-2">
                        {group.items.map((item: ShoppingListItem, itemIndex: number) => (
                          <div key={itemIndex} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 ">
                            <div>
                              <span className="font-medium">{item.foodName}</span>
                              <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                                {item.totalQuantity} {item.unit}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No food logs found for the selected date range
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}