#!/bin/bash

echo "🚀 Starting Prompt Craft Development Server..."
echo ""

# Build the core components first
echo "📦 Building core components..."
npm run build

# Start the web development server
echo "🌐 Starting web server..."
npm run web:dev