#!/bin/bash

# Build script for Video Speed Controller extension
# Creates distributable packages for Chrome and Firefox

echo "Building Video Speed Controller for multiple browsers..."

# Create dist directory
mkdir -p dist

# Create zip files from browser-specific folders
echo "Creating packages..."
cd chrome && zip -r ../dist/video-speed-controller-chrome.zip * -x "*.DS_Store" && cd ..
cd firefox && zip -r ../dist/video-speed-controller-firefox.zip * -x "*.DS_Store" && cd ..

echo "Build complete!"
echo ""
echo "Packages created:"
echo "  - dist/video-speed-controller-chrome.zip (for Chrome, Edge, Brave, etc.)"
echo "  - dist/video-speed-controller-firefox.zip (for Firefox)"
echo ""
echo "Installation instructions:"
echo ""
echo "Chrome/Edge/Brave:"
echo "  1. Go to chrome://extensions/"
echo "  2. Enable 'Developer mode'"
echo "  3. Click 'Load unpacked' and select the 'chrome' folder"
echo "  OR drag and drop the .zip file"
echo ""
echo "Firefox:"
echo "  1. Go to about:debugging"
echo "  2. Click 'This Firefox'"
echo "  3. Click 'Load Temporary Add-on'"
echo "  4. Select any file in the 'firefox' folder"
echo "  OR select the .zip file"