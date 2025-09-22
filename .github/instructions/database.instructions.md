---
applyTo: "packages/infrastructure/database/**/*.ts,scripts/**/*.ts,drizzle/**/*"
---

# Database & Migration Instructions

## Drizzle ORM Standards

- Always use Drizzle ORM patterns and conventions
- Define schemas in `packages/infrastructure/database/schema.ts`
- Use proper column types and constraints
- Implement proper indexing for performance
- Follow Drizzle naming conventions

## Migration Workflow

1. **Make schema changes** in `schema.ts` first
2. **Generate migrations** with `npm run db:generate`  
3. **Review generated migration files** before applying
4. **Apply migrations** with `npm run db:migrate`
5. **Test migrations** on development database first

## Schema Design Principles

- Use proper PostgreSQL data types
- Implement foreign key constraints where appropriate
- Add indexes for frequently queried columns
- Use meaningful column and table names
- Include created_at and updated_at timestamps

## Repository Implementation

- Implement DrizzlePromptRepository following the PromptRepository interface
- Handle database connections properly with connection pooling
- Implement proper transaction handling
- Provide meaningful error messages for database failures
- Support both local PostgreSQL and cloud databases (Neon)

## Script Guidelines

- Database scripts should be idempotent when possible  
- Always validate environment variables (DATABASE_URL)
- Provide clear logging and error messages
- Support dry-run mode for destructive operations
- Handle connection failures gracefully

## Testing Database Code

- Use test database instances
- Clean up test data after tests
- Test both success and failure scenarios
- Mock database connections for unit tests
- Use integration tests for repository implementations