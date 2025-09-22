#!/bin/bash

# Pre-release validation script
# Ensures the built Electron app has no TypeScript path alias issues

set -e

echo "🔍 PRE-RELEASE VALIDATION"
echo "========================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

VALIDATION_FAILED=false

echo -e "${BLUE}1. Building Electron application...${NC}"
npm run electron:build

echo ""
echo -e "${BLUE}2. Checking for TypeScript path aliases in built JavaScript...${NC}"

# Find any remaining @core, @infrastructure, @apps imports in built JS
if find dist/electron -name "*.js" -exec grep -l "@core\|@infrastructure\|@apps" {} \; 2>/dev/null | head -1 > /dev/null; then
    echo -e "${RED}❌ VALIDATION FAILED: TypeScript path aliases found in built JavaScript:${NC}"
    find dist/electron -name "*.js" -exec grep -l "@core\|@infrastructure\|@apps" {} \; 2>/dev/null | while read file; do
        echo -e "${YELLOW}   File: $file${NC}"
        grep -n "@core\|@infrastructure\|@apps" "$file" | head -3 | while read line; do
            echo -e "${RED}   $line${NC}"
        done
        echo ""
    done
    VALIDATION_FAILED=true
else
    echo -e "${GREEN}✅ No TypeScript path aliases found in built JavaScript${NC}"
fi

echo ""
echo -e "${BLUE}3. Validating critical file structure...${NC}"

# Check if critical files exist
critical_files=(
    "dist/electron/packages/apps/electron/main/index.js"
    "dist/electron/packages/apps/electron/main/ipc/ipcHandlers.js"
    "dist/electron/shared/preload.js"
    "dist/electron/packages/core/infrastructure/Container.js"
    "dist/electron/packages/infrastructure/RepositoryFactory.js"
)

for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ Missing: $file${NC}"
        VALIDATION_FAILED=true
    fi
done

echo ""
echo -e "${BLUE}4. Validating ipcHandlers uses relative paths...${NC}"

if [ -f "dist/electron/packages/apps/electron/main/ipc/ipcHandlers.js" ]; then
    if grep -q "require(\"../../../../core/infrastructure/Container\")" dist/electron/packages/apps/electron/main/ipc/ipcHandlers.js; then
        echo -e "${GREEN}✅ ipcHandlers uses relative paths correctly${NC}"
    else
        echo -e "${RED}❌ ipcHandlers does not use expected relative paths${NC}"
        echo -e "${YELLOW}Expected: require(\"../../../../core/infrastructure/Container\")${NC}"
        echo -e "${YELLOW}Found:${NC}"
        grep "require.*Container" dist/electron/packages/apps/electron/main/ipc/ipcHandlers.js || echo "No Container import found"
        VALIDATION_FAILED=true
    fi
else
    echo -e "${RED}❌ ipcHandlers.js not found${NC}"
    VALIDATION_FAILED=true
fi

echo ""
echo -e "${BLUE}5. Testing module resolution...${NC}"

# Run the CI-safe test to validate module resolution (ignore coverage thresholds)
if npm test -- --testNamePattern="Electron Module Resolution \(CI Safe\)" --silent --passWithNoTests --coverage=false; then
    echo -e "${GREEN}✅ Module resolution tests passed${NC}"
else
    echo -e "${RED}❌ Module resolution tests failed${NC}"
    VALIDATION_FAILED=true
fi

echo ""
echo "========================="

if [ "$VALIDATION_FAILED" = true ]; then
    echo -e "${RED}❌ VALIDATION FAILED${NC}"
    echo -e "${YELLOW}The Electron build has issues that will cause Windows compatibility problems.${NC}"
    echo -e "${YELLOW}DO NOT create a release until these issues are resolved.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ VALIDATION PASSED${NC}"
    echo -e "${GREEN}The Electron build is ready for release.${NC}"
    echo -e "${BLUE}Safe to proceed with release creation.${NC}"
fi