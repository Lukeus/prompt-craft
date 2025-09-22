# Agent Instructions for Prompt Craft

## Quick Start for Agents

This repository contains a TypeScript-based AI prompt management system. **Always run `npm run build` before starting any application work.**

## Critical Commands (Test These First)

```bash
# Essential workflow
npm run clean          # Clean all build artifacts
npm run build          # Build all TypeScript packages  
npm run lint           # Type check (must pass before deployment)
npm test              # Run test suite

# Database setup (if needed)
npm run db:generate    # Generate migrations after schema changes
npm run db:migrate     # Apply database migrations

# Application starts
npm run electron:dev   # Desktop app development
npm run web:dev        # Web interface development
```

## Common Issues & Solutions

### Build Failures
- **Issue**: TypeScript compilation errors
- **Solution**: Run `npm run clean` then `npm run build`
- **Prevention**: Always run `npm run lint` before making changes

### Database Connection Issues  
- **Issue**: Database operations failing
- **Solution**: Check `DATABASE_URL` environment variable is set
- **Fallback**: System automatically falls back to filesystem mode

### Electron Build Issues
- **Issue**: Electron renderer webpack warnings
- **Solution**: Webpack performance optimizations are implemented
- **Commands**: `npm run electron:build:renderer` to test

## Repository Rules (Critical)

1. **Never change the repository architecture** - follow existing patterns
2. **Never deploy without explicit confirmation** - user approval required
3. **Always run linting before deployment** - zero lint errors allowed
4. **Maintain webpack performance optimizations** - bundle size targets in place
5. **Generate database migrations before schema changes** - use proper workflow

## Testing Strategy

- Focus on PromptManager operations and MCP server functionality
- Mock external dependencies (file system, database)  
- Test both repository modes (filesystem and database)
- Ensure repository implementations remain interchangeable

## File Locations for Quick Reference

```
packages/core/                 # Domain logic and interfaces
packages/infrastructure/       # Repository implementations  
packages/apps/cli/            # Command line interface
packages/apps/mcp-server/     # MCP server (stdio)
packages/apps/web/            # Web interface + MCP endpoints
packages/apps/electron/       # Desktop application
scripts/                      # Database management
```

## Environment Setup

```bash
# Repository type (defaults to filesystem)
REPOSITORY_TYPE=database      # Use PostgreSQL
DATABASE_URL=postgresql://... # Required for database mode

# Optional
PROMPTS_DIRECTORY=./prompts   # Custom prompts directory
```

**Remember**: Quality and correctness over speed. Take time to understand the existing patterns before making changes.