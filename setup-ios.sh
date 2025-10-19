#!/bin/bash

echo "🚀 Setting up iOS development environment for MyTrainPro..."

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js first."
    exit 1
fi

# Check if Xcode is installed
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Xcode is not installed. Please install from App Store."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "📱 Setting up iOS project..."
# Add iOS platform if not exists
if [ ! -d "ios" ]; then
    npx cap add ios
else
    echo "iOS platform already exists"
fi

echo "🔄 Syncing Capacitor..."
npx cap sync ios

echo "🔧 Installing CocoaPods dependencies..."
cd ios/App
if command -v pod &> /dev/null; then
    pod install
else
    echo "⚠️  CocoaPods not installed. Installing..."
    sudo gem install cocoapods
    pod install
fi

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Open Xcode: cd ios/App && open App.xcworkspace"
echo "2. Configure signing with your Apple Developer account"
echo "3. Verify URL Schemes (mytrainpro) in Info tab"
echo "4. Build and run: Product → Build"
echo ""
echo "To test deep links in simulator:"
echo "xcrun simctl openurl booted mytrainpro://auth/callback?test=1"