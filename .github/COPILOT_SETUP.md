# GitHub Copilot Custom Instructions Setup

This repository is configured with comprehensive GitHub Copilot custom instructions to provide context-aware code suggestions and assistance.

## Files Created

### Repository-Wide Instructions
- **`.github/copilot-instructions.md`** - Main instructions applied to all Copilot interactions in this repository

### Path-Specific Instructions
- **`.github/instructions/typescript-core.instructions.md`** - Core TypeScript and infrastructure patterns
- **`.github/instructions/react-electron.instructions.md`** - React Electron renderer guidelines  
- **`.github/instructions/database.instructions.md`** - Database schema and migration patterns
- **`.github/instructions/mcp-server.instructions.md`** - MCP server implementation standards

### Agent Instructions
- **`.github/AGENTS.md`** - Instructions specifically for GitHub Copilot coding agents

## Supported Features by Platform

| Platform | Repository-wide | Path-specific | Agent Instructions |
|----------|----------------|---------------|-------------------|
| VS Code | ✅ | ✅ | ✅ |
| GitHub.com | ✅ | ✅ | ✅ |
| JetBrains | ✅ | ❌ | ❌ |
| Visual Studio | ✅ | ❌ | ❌ |

## How to Verify Instructions Are Working

### In GitHub Copilot Chat
1. Start a conversation in the context of this repository
2. Look for the **References** section in Copilot's response
3. You should see `.github/copilot-instructions.md` listed as a reference
4. Click the reference to view the instructions being used

### In VS Code
1. Open Copilot Chat (Ctrl/Cmd + Shift + P → "Chat: Focus on Chat View")
2. Ask a question about the codebase
3. Check the references list in the response
4. Path-specific instructions will automatically apply based on the files you're working with

### For Coding Agent
- Instructions are automatically applied when using GitHub Copilot coding agent
- Agent will follow the build commands and architectural patterns specified
- Will respect deployment restrictions and quality requirements

## Customization

### Adding New Path-Specific Instructions
1. Create a new file in `.github/instructions/` 
2. Name it `[purpose].instructions.md`
3. Add frontmatter with `applyTo` using glob patterns:
   ```yaml
   ---
   applyTo: "path/to/files/**/*.ts"
   ---
   ```

### Modifying Instructions
- Edit the relevant `.md` files directly
- Changes take effect immediately (no restart required)
- Test changes by asking Copilot questions and checking references

### Disabling Instructions
Instructions can be disabled per-user:
- **VS Code**: Settings → "Code Generation: Use Instruction Files"
- **GitHub.com**: Chat settings button → "Disable custom instructions"

## Best Practices

1. **Keep instructions concise** - They're sent with every request
2. **Focus on repository-specific guidance** - Not general programming advice  
3. **Update regularly** - As the codebase evolves, update the instructions
4. **Test effectiveness** - Regularly check if Copilot is following the guidelines

## Support

- Instructions follow [GitHub's official documentation](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions)
- Feature is supported across VS Code, GitHub.com, and other major platforms
- Custom instructions are in active development - more features may be added

## Impact on Development

These custom instructions help ensure:
- **Consistency** - Code follows established patterns and standards
- **Efficiency** - Copilot understands the project structure and requirements
- **Quality** - Suggestions align with testing and deployment requirements
- **Context** - AI assistance is tailored to this specific TypeScript/Electron/MCP project