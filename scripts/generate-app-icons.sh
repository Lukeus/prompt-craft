#!/bin/bash

# Generate App Icons Script for Prompt Craft Electron App
# This script generates all required icon formats from a base PNG file

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎨 Generating app icons for Prompt Craft...${NC}"

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ASSETS_DIR="$PROJECT_ROOT/packages/apps/electron/assets"
SOURCE_ICON="$ASSETS_DIR/app-icon.png"

# Check if source icon exists
if [ ! -f "$SOURCE_ICON" ]; then
    echo -e "${RED}❌ Source icon not found at: $SOURCE_ICON${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found source icon: $SOURCE_ICON${NC}"

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo -e "${YELLOW}⚠️ ImageMagick not found. Installing via Homebrew...${NC}"
    if command -v brew &> /dev/null; then
        brew install imagemagick
    else
        echo -e "${RED}❌ Homebrew not found. Please install ImageMagick manually:${NC}"
        echo "brew install imagemagick"
        echo "or visit: https://imagemagick.org/script/download.php"
        exit 1
    fi
fi

echo -e "${GREEN}✅ ImageMagick found${NC}"

# Function to generate icon
generate_icon() {
    local size=$1
    local output=$2
    local format=$3
    
    echo "  → Generating ${format} icon (${size}x${size}): $(basename "$output")"
    convert "$SOURCE_ICON" -resize "${size}x${size}" "$output"
}

# Generate ICO file for Windows (contains multiple sizes)
echo -e "${BLUE}🪟 Generating Windows ICO file...${NC}"
convert "$SOURCE_ICON" \
    \( -clone 0 -resize 16x16 \) \
    \( -clone 0 -resize 32x32 \) \
    \( -clone 0 -resize 48x48 \) \
    \( -clone 0 -resize 64x64 \) \
    \( -clone 0 -resize 128x128 \) \
    \( -clone 0 -resize 256x256 \) \
    -delete 0 \
    "$ASSETS_DIR/app-icon.ico"

echo -e "${GREEN}✅ Generated app-icon.ico${NC}"

# Generate ICNS file for macOS
echo -e "${BLUE}🍎 Generating macOS ICNS file...${NC}"

# Create temporary iconset directory
ICONSET_DIR="$ASSETS_DIR/app-icon.iconset"
mkdir -p "$ICONSET_DIR"

# Generate all required macOS icon sizes
generate_icon 16 "$ICONSET_DIR/icon_16x16.png" "macOS"
generate_icon 32 "$ICONSET_DIR/icon_16x16@2x.png" "macOS"
generate_icon 32 "$ICONSET_DIR/icon_32x32.png" "macOS"
generate_icon 64 "$ICONSET_DIR/icon_32x32@2x.png" "macOS"
generate_icon 128 "$ICONSET_DIR/icon_128x128.png" "macOS"
generate_icon 256 "$ICONSET_DIR/icon_128x128@2x.png" "macOS"
generate_icon 256 "$ICONSET_DIR/icon_256x256.png" "macOS"
generate_icon 512 "$ICONSET_DIR/icon_256x256@2x.png" "macOS"
generate_icon 512 "$ICONSET_DIR/icon_512x512.png" "macOS"
generate_icon 1024 "$ICONSET_DIR/icon_512x512@2x.png" "macOS"

# Convert iconset to ICNS
if command -v iconutil &> /dev/null; then
    iconutil -c icns "$ICONSET_DIR" -o "$ASSETS_DIR/app-icon.icns"
    echo -e "${GREEN}✅ Generated app-icon.icns${NC}"
else
    echo -e "${YELLOW}⚠️ iconutil not found (macOS only). ICNS file not generated.${NC}"
fi

# Clean up temporary iconset directory
rm -rf "$ICONSET_DIR"

# Generate additional sizes for Linux and other uses
echo -e "${BLUE}🐧 Generating additional PNG sizes...${NC}"
generate_icon 48 "$ASSETS_DIR/app-icon-48.png" "Linux"
generate_icon 64 "$ASSETS_DIR/app-icon-64.png" "Linux"
generate_icon 96 "$ASSETS_DIR/app-icon-96.png" "Linux"
generate_icon 128 "$ASSETS_DIR/app-icon-128.png" "Linux"
generate_icon 256 "$ASSETS_DIR/app-icon-256.png" "Linux"
generate_icon 512 "$ASSETS_DIR/app-icon-512.png" "Linux"

# Update tray icon (typically smaller)
echo -e "${BLUE}📊 Updating tray icon...${NC}"
generate_icon 32 "$ASSETS_DIR/tray-icon.png" "Tray"

# Display results
echo -e "\n${GREEN}🎉 Icon generation complete!${NC}"
echo -e "${BLUE}Generated files:${NC}"

ls -la "$ASSETS_DIR" | grep -E "\.(ico|icns|png)$" | while read -r line; do
    filename=$(echo "$line" | awk '{print $NF}')
    size=$(echo "$line" | awk '{print $5}')
    echo -e "  ${GREEN}✅${NC} $filename (${size} bytes)"
done

echo -e "\n${BLUE}📋 Summary:${NC}"
echo -e "  • ${GREEN}Windows${NC}: app-icon.ico (multi-size)"
echo -e "  • ${GREEN}macOS${NC}: app-icon.icns (Retina support)"
echo -e "  • ${GREEN}Linux${NC}: app-icon.png (original) + additional sizes"
echo -e "  • ${GREEN}System Tray${NC}: tray-icon.png (32x32)"

echo -e "\n${YELLOW}💡 Next Steps:${NC}"
echo -e "  1. Verify icons look good at different sizes"
echo -e "  2. Test the build process: ${BLUE}npm run electron:build${NC}"
echo -e "  3. Create a release: ${BLUE}git tag v1.0.0 && git push origin v1.0.0${NC}"

echo -e "\n${GREEN}✨ Ready for release automation!${NC}"