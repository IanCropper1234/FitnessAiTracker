#!/bin/bash

# FitAI iOS Build Script
# 用於準備 iOS App Store 部署的建構腳本

echo "🚀 開始 FitAI iOS 建構流程..."

# 1. 清理之前的建構
echo "📁 清理之前的建構檔案..."
rm -rf dist/

# 2. 建構生產版本
echo "🔨 建構生產版本..."
npm run build

# 3. 檢查建構結果
if [ ! -f "dist/public/index.html" ]; then
    echo "❌ 建構失敗：找不到 index.html"
    exit 1
fi

# 4. 同步到 iOS 專案
echo "📱 同步 web 資源到 iOS 專案..."
npx cap sync ios

# 5. 複製額外資源（如果需要）
echo "📋 複製應用程式圖示和元資料..."

# 6. 檢查 iOS 專案結構
if [ -d "ios/App" ]; then
    echo "✅ iOS 專案已準備就緒"
    echo "📂 iOS 專案位置: ./ios/App/App.xcworkspace"
    echo ""
    echo "下一步驟："
    echo "1. 在 macOS 上開啟 Xcode"
    echo "2. 執行: npx cap open ios"
    echo "3. 配置 Signing & Capabilities"
    echo "4. 在模擬器或實體設備上測試"
else
    echo "❌ iOS 專案建立失敗"
    exit 1
fi

echo "🎉 iOS 建構完成！"