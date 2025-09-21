#!/bin/bash

# =============================================================================
# Prompt Craft - GitHub Codespace Setup Script
# =============================================================================
# This script automatically sets up the development environment in Codespaces

set -e  # Exit on any error

echo "🚀 Setting up Prompt Craft development environment..."

# Change to the workspace directory
cd /workspaces/prompt-manager

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Wait for PostgreSQL to be ready
print_header "Waiting for PostgreSQL"
print_status "Checking database connectivity..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if pg_isready -h db -p 5432 -U postgres; then
        print_status "PostgreSQL is ready!"
        break
    else
        print_warning "PostgreSQL not ready yet (attempt $attempt/$max_attempts)..."
        sleep 2
        ((attempt++))
    fi
done

if [ $attempt -gt $max_attempts ]; then
    print_error "PostgreSQL failed to start within expected time"
    exit 1
fi

# Create .env file if it doesn't exist
print_header "Environment Configuration"
if [ ! -f ".env" ]; then
    print_status "Creating .env file from template..."
    cp .env.example .env
    
    # Update .env with Codespace-specific values
    sed -i 's|DATABASE_URL=.*|DATABASE_URL=postgresql://postgres:postgres@db:5432/promptcraft|' .env
    sed -i 's|REPOSITORY_TYPE=.*|REPOSITORY_TYPE=database|' .env
    sed -i 's|NODE_ENV=.*|NODE_ENV=development|' .env
    
    print_status ".env file created and configured for Codespace"
else
    print_status ".env file already exists"
fi

# Install dependencies
print_header "Installing Dependencies"
print_status "Installing npm dependencies..."
npm install

# Build the project
print_header "Building Project"
print_status "Building TypeScript project..."
npm run build

# Database setup
print_header "Database Setup"
print_status "Generating database migrations..."
npm run db:generate

print_status "Running database migrations..."
npm run db:migrate

# Seed the database with sample data
print_status "Seeding database with sample prompts..."
if npm run db:seed; then
    print_status "Database seeded successfully"
else
    print_warning "Database seeding failed - this is normal if no prompts exist yet"
fi

# Create helpful aliases and scripts
print_header "Development Environment Setup"
print_status "Setting up development aliases..."

cat >> ~/.bashrc << 'EOF'

# Prompt Craft Development Aliases
alias pc-build="npm run build"
alias pc-dev="npm run dev:web"
alias pc-test="npm test"
alias pc-lint="npm run lint"
alias pc-db-studio="npm run db:studio"
alias pc-db-reset="npm run db:reset"
alias pc-clean="npm run clean"
alias pc-start="npm start"

# Development shortcuts
alias ll="ls -alF"
alias la="ls -A" 
alias l="ls -CF"
alias ..="cd .."
alias ...="cd ../.."

# Git shortcuts
alias gs="git status"
alias ga="git add"
alias gc="git commit"
alias gp="git push"
alias gl="git log --oneline"

echo "🎯 Prompt Craft development environment loaded!"
echo "📚 Available commands:"
echo "  pc-build   - Build the project"
echo "  pc-dev     - Start development server"
echo "  pc-test    - Run tests"
echo "  pc-lint    - Run linting"
echo "  pc-start   - Start CLI application"
echo ""
echo "🗄️  Database commands:"
echo "  pc-db-studio - Open Drizzle Studio"
echo "  pc-db-reset  - Reset database"
echo ""
echo "📖 Run 'npm run' to see all available scripts"
echo ""
EOF

# Create a welcome message
cat > ~/CODESPACE_WELCOME.md << 'EOF'
# 🎯 Welcome to Prompt Craft Codespace!

Your development environment is ready! Here's what's been set up:

## ✅ Environment Status
- ✅ Node.js 18 installed
- ✅ PostgreSQL database running
- ✅ Dependencies installed
- ✅ Project built
- ✅ Database migrated and seeded

## 🚀 Quick Start Commands

### Development
```bash
npm run dev:web        # Start web development server
npm run dev:cli        # Start CLI in development mode
npm run build          # Build the project
npm test               # Run tests
```

### Database
```bash
npm run db:studio      # Open Drizzle Studio (database GUI)
npm run db:migrate     # Run database migrations
npm run db:seed        # Seed database with sample data
npm run db:reset       # Reset database
```

### Shortcuts (aliases available in terminal)
```bash
pc-dev                 # Start development server
pc-build               # Build project
pc-test                # Run tests
pc-db-studio          # Open database GUI
```

## 🌐 Ports
- **3000**: Web development server
- **5432**: PostgreSQL database

## 📁 Key Directories
- `packages/apps/cli/` - Command line interface
- `packages/apps/web/` - Web interface
- `packages/core/` - Core domain logic
- `packages/infrastructure/` - Data layer
- `prompts/` - Prompt storage (filesystem mode)

## 🔗 Useful Links
- [Project Documentation](./README.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [MCP Server Guide](./docs/MCP_WEB_SERVER.md)

Happy coding! 🎨
EOF

print_header "Setup Complete!"
print_status "Codespace is ready for development!"
print_status "Welcome message available at: ~/CODESPACE_WELCOME.md"

# Display final status
echo ""
echo "🎉 Setup completed successfully!"
echo "💡 Open a new terminal to load aliases, or run: source ~/.bashrc"
echo "📖 Check ~/CODESPACE_WELCOME.md for quick start guide"
echo "🌐 Web server will be available at: http://localhost:3000"
echo ""