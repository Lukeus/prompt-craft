---
applyTo: "packages/core/**/*.ts,packages/infrastructure/**/*.ts"
---

# TypeScript Core & Infrastructure Instructions

## Core Domain Rules

- Follow Domain-Driven Design principles
- Keep domain entities pure with no external dependencies
- Use cases should orchestrate operations between entities and repositories
- All interfaces should be defined in the core package

## Repository Pattern Implementation

- Repository interfaces go in `packages/core/repositories/`
- Repository implementations go in `packages/infrastructure/`
- Support both FileSystemPromptRepository and DrizzlePromptRepository
- Always implement proper error handling for database and file operations

## TypeScript Standards

- Use strict TypeScript configuration
- All functions must have explicit return types
- Prefer interfaces over types for public APIs
- Use proper async/await patterns with error handling
- No `any` types - use proper typing or generics

## Error Handling

- Create custom error classes that extend Error
- Always provide meaningful error messages
- Handle both sync and async operations properly
- Log errors appropriately but don't expose sensitive information

## Testing Considerations

- Write testable code with dependency injection
- Mock external dependencies (file system, database)
- Test both success and error scenarios
- Ensure repository implementations are interchangeable