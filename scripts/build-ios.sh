#!/bin/bash

echo "🚀 開始 FlexSync iOS 應用程式構建流程..."

# 切換到 mobile 目錄
cd mobile

# 檢查 EAS CLI
if ! command -v eas &> /dev/null; then
    echo "安裝 EAS CLI..."
    npm install -g eas-cli
fi

# 登錄 EAS（需要用戶手動操作）
echo "請運行以下命令進行登錄："
echo "npx eas login"
echo ""

# 配置構建
echo "配置 EAS 構建..."
npx eas build:configure

# 開始 iOS 構建
echo "開始 iOS 生產構建..."
echo "運行命令: npx eas build --platform ios --profile production"

echo ""
echo "✅ 構建腳本已準備就緒"
echo "📋 下一步："
echo "1. cd mobile"
echo "2. npx eas login"
echo "3. npx eas build --platform ios --profile production"
echo "4. 等待構建完成後下載 .ipa 文件"
echo "5. 上傳到 App Store Connect"