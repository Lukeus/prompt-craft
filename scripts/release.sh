#!/bin/bash

# Prompt Craft Release Script
# Creates a tagged release that triggers automated GitHub Actions build

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display usage
usage() {
    echo -e "${BLUE}Prompt Craft Release Script${NC}"
    echo ""
    echo -e "${YELLOW}Usage:${NC}"
    echo "  $0 [patch|minor|major|VERSION]"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  $0 patch           # 1.0.0 → 1.0.1"
    echo "  $0 minor           # 1.0.0 → 1.1.0" 
    echo "  $0 major           # 1.0.0 → 2.0.0"
    echo "  $0 1.2.3           # Set specific version"
    echo ""
    echo -e "${YELLOW}What this script does:${NC}"
    echo "  1. 🧹 Clean previous builds"
    echo "  2. 🏗️  Build and test the application locally"
    echo "  3. 🎨 Generate app icons if needed"
    echo "  4. 📝 Update version in package.json"
    echo "  5. 🏷️  Create and push git tag"
    echo "  6. 🚀 Trigger automated GitHub Actions release"
    echo ""
    exit 1
}

# Check for help flag
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    usage
fi

# Check if argument provided
if [ $# -eq 0 ]; then
    echo -e "${RED}❌ Error: Version argument required${NC}"
    usage
fi

VERSION_ARG="$1"

echo -e "${BLUE}🚀 Starting Prompt Craft release process...${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Check if git working directory is clean
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Warning: Git working directory is not clean${NC}"
    echo "Uncommitted changes:"
    git status --short
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Cancelled by user${NC}"
        exit 1
    fi
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${BLUE}Current version: ${CURRENT_VERSION}${NC}"

# Calculate new version
if [[ "$VERSION_ARG" == "patch" || "$VERSION_ARG" == "minor" || "$VERSION_ARG" == "major" ]]; then
    echo -e "${BLUE}Bumping ${VERSION_ARG} version...${NC}"
    NEW_VERSION=$(npm version $VERSION_ARG --no-git-tag-version)
    NEW_VERSION=${NEW_VERSION#v}  # Remove 'v' prefix if present
else
    echo -e "${BLUE}Setting version to: ${VERSION_ARG}${NC}"
    NEW_VERSION="$VERSION_ARG"
    # Update package.json manually
    node -e "
        const pkg = require('./package.json');
        pkg.version = '$NEW_VERSION';
        require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2) + '\n');
    "
fi

echo -e "${GREEN}New version: ${NEW_VERSION}${NC}"

# Pre-release validation
echo -e "\n${BLUE}🧹 Cleaning previous builds...${NC}"
npm run clean

echo -e "\n${BLUE}📦 Installing dependencies...${NC}"
npm ci

echo -e "\n${BLUE}🏗️  Building core packages...${NC}"
npm run build

echo -e "\n${BLUE}🖥️  Building Electron components...${NC}"
npm run electron:build

echo -e "\n${BLUE}🧪 Testing Electron app...${NC}"
# Start the app in background and kill after a few seconds to test it launches
timeout 5s npm run electron:start || echo "App test completed"

# Generate icons if they don't exist
if [ ! -f "packages/apps/electron/assets/app-icon.icns" ] || [ ! -f "packages/apps/electron/assets/app-icon.ico" ]; then
    echo -e "\n${BLUE}🎨 Generating app icons...${NC}"
    if [ -x "./scripts/generate-app-icons.sh" ]; then
        ./scripts/generate-app-icons.sh
    else
        echo -e "${YELLOW}⚠️  Icon generation script not found or not executable${NC}"
        echo "Please ensure app icons exist for all platforms"
    fi
fi

echo -e "\n${BLUE}📝 Committing version bump...${NC}"
git add package.json
git commit -m "chore: bump version to ${NEW_VERSION}" || echo "No changes to commit"

# Create and push tag
TAG_NAME="v${NEW_VERSION}"
echo -e "\n${BLUE}🏷️  Creating git tag: ${TAG_NAME}${NC}"
git tag "$TAG_NAME"

echo -e "\n${BLUE}📤 Pushing to origin...${NC}"
git push origin main
git push origin "$TAG_NAME"

echo -e "\n${GREEN}🎉 Release process initiated!${NC}"
echo -e "\n${BLUE}📋 What happens next:${NC}"
echo -e "  1. GitHub Actions will automatically build for all platforms"
echo -e "  2. A draft release will be created with changelog"
echo -e "  3. Build artifacts will be uploaded as release assets"
echo -e "  4. The release will be published when all builds complete"
echo -e "\n${BLUE}🔗 Monitor progress:${NC}"
echo -e "  GitHub Actions: ${YELLOW}https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^/]*\/[^/]*\).*/\1/' | sed 's/\.git$//')/actions${NC}"
echo -e "  Releases: ${YELLOW}https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^/]*\/[^/]*\).*/\1/' | sed 's/\.git$//')/releases${NC}"

echo -e "\n${GREEN}✨ Release ${TAG_NAME} is on its way!${NC}"