import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const iconOptions = [
  {
    id: 1,
    name: "經典啞鈴設計",
    description: "簡潔的白色啞鈴配上 TP 文字，黑色背景，專業感強",
    path: "/icons/trainpro-icon-option1.svg",
    features: ["極簡設計", "高對比度", "易識別"]
  },
  {
    id: 2,
    name: "幾何 T+P 組合",
    description: "現代幾何風格，T 和 P 字母融合設計，橙色強調線",
    path: "/icons/trainpro-icon-option2.svg",
    features: ["現代感", "品牌色彩", "字母融合"]
  },
  {
    id: 3,
    name: "盾牌徽章風格",
    description: "白色盾牌背景，內含啞鈴和 TRAIN PRO 文字，漸變背景",
    path: "/icons/trainpro-icon-option3.svg",
    features: ["權威感", "漸變效果", "完整品牌名"]
  },
  {
    id: 4,
    name: "極簡 T 字設計",
    description: "大型 T 字結構配橙色重量片，現代極簡風格",
    path: "/icons/trainpro-icon-option4.svg",
    features: ["極簡主義", "橙色亮點", "大膽設計"]
  },
  {
    id: 5,
    name: "圓形徽章設計",
    description: "圓形邊框內含六角形啞鈴重量片，TP 字母在上方",
    path: "/icons/trainpro-icon-option5.svg",
    features: ["圓形設計", "六角重量片", "專業徽章感"]
  },
  {
    id: 6,
    name: "六角形現代設計",
    description: "白色六角形背景，內含方形重量片啞鈴和完整品牌名",
    path: "/icons/trainpro-icon-option6.svg",
    features: ["六角形背景", "方形元素", "現代工業風"]
  }
];

export function IconPreview() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">TrainPro 應用程式圖標設計方案</h1>
          <p className="text-muted-foreground">以下是為 TrainPro 設計的六個圖標選項，請選擇您喜歡的設計</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {iconOptions.map((option) => (
            <Card key={option.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center p-2">
                    <img
                      src={option.path}
                      alt={option.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <CardTitle className="text-lg font-semibold">{option.name}</CardTitle>
                <CardDescription>{option.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">特色：</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {option.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="bg-muted/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">使用說明</h3>
            <p className="text-muted-foreground">
              這些圖標將用於：PWA 應用程式圖標、iOS App Store 圖標、網站 favicon、
              以及所有品牌相關的視覺識別。每個設計都採用了 TrainPro 的品牌色彩
              （黑色背景、白色主體、橙色強調）並融合了健身訓練元素。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}