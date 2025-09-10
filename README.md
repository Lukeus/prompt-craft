# 📝 PromptCraft

A comprehensive TypeScript-based prompt management system with MCP (Model Context Protocol) server integration for organizing and using work and personal prompts across different AI tools and applications.

## ✨ Features

- **Organized Prompt Storage**: Categorize prompts into work, personal, and shared collections
- **Variable Interpolation**: Dynamic prompts with customizable variables
- **MCP Server Integration**: Expose prompts as tools for AI assistants
- **CLI Interface**: Command-line tools for prompt management
- **TypeScript**: Full type safety and modern development experience
- **Flexible Search**: Find prompts by name, content, tags, or category

## 📁 Project Structure

```
prompt-craft/
├── src/                    # TypeScript source code
│   ├── types/             # Type definitions and interfaces
│   ├── managers/          # Core prompt management logic
│   ├── mcp/              # MCP server implementation
│   └── utils/            # Utility functions
├── prompts/              # Prompt storage directories
│   ├── work/            # Work-related prompts (software engineering)
│   ├── personal/        # Personal prompts (creative, artistic)
│   └── shared/          # Shared prompts for general use
├── config/              # Configuration files
└── dist/               # Compiled JavaScript output
```

## 🚀 Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Lukeus/prompt-craft.git
   cd prompt-craft
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the project**:
   ```bash
   npm run build
   ```

4. **Optional: Install globally**:
   ```bash
   npm link
   ```

## 🎯 Usage

### CLI Commands

Once installed, you can use the `prompt-craft` command:

```bash
# List all prompts
prompt-craft list

# List prompts in a specific category
prompt-craft list work

# Search for prompts
prompt-craft search "code review"

# Render a prompt with variables
prompt-craft render work_code_review_01 language=TypeScript code="console.log('hello')"

# Show available categories
prompt-craft categories

# Show help
prompt-craft help
```

### Programmatic Usage

```typescript
import { PromptManager, PromptCategory } from 'prompt-craft';

// Initialize the prompt manager
const manager = new PromptManager();
await manager.initialize();

// Search for prompts
const workPrompts = manager.getPromptsByCategory(PromptCategory.WORK);

// Render a prompt with variables
const rendered = await manager.renderPrompt('work_code_review_01', {
  language: 'TypeScript',
  code: 'const x = 1;'
});

console.log(rendered);
```

### MCP Server

Start the MCP server to expose prompts as tools:

```bash
npm run mcp-server
```

The MCP server exposes each prompt as a tool that can be called by AI assistants with proper variable validation.

## 📋 Prompt Structure

Each prompt is stored as a JSON file with the following structure:

```json
{
  "id": "unique_prompt_id",
  "name": "Prompt Name",
  "description": "Brief description of what this prompt does",
  "content": "The prompt content with {{variable}} placeholders",
  "category": "work|personal|shared",
  "tags": ["tag1", "tag2"],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "author": "Author Name",
  "variables": [
    {
      "name": "variable_name",
      "description": "Description of the variable",
      "type": "string|number|boolean|array",
      "required": true,
      "defaultValue": "optional_default"
    }
  ]
}
```

## 🔧 Configuration

The system uses `config/prompts.json` for configuration:

```json
{
  "version": "1.0.0",
  "collections": {
    "work": ["code-review", "documentation", "debugging"],
    "personal": ["music", "visual-art", "branding"],
    "shared": ["general-writing", "brainstorming"]
  },
  "mcpServer": {
    "name": "prompt-craft-mcp",
    "version": "1.0.0",
    "port": 3000
  }
}
```

## 📝 Creating New Prompts

### Work Prompts (Software Engineering)

Work prompts are designed for software development tasks:
- Code reviews
- API design
- Documentation
- Debugging
- Architecture planning
- Testing strategies

### Personal Prompts (Creative & Artistic)

Personal prompts help with creative endeavors:
- Music composition
- Visual art concepts
- Brand identity design
- Website planning
- Photography projects
- Creative writing

### Shared Prompts

General-purpose prompts for:
- Brainstorming sessions
- Problem-solving
- Content writing
- Research planning

## 🛠 Development

### Scripts

```bash
npm run build          # Compile TypeScript
npm run dev           # Run in development mode
npm start            # Start the CLI
npm run mcp-server   # Start MCP server
npm test            # Run tests
npm run lint        # Type checking
```

### Adding New Prompts

1. Create a new JSON file in the appropriate category directory
2. Follow the prompt structure format
3. Include appropriate variables for customization
4. Add relevant tags for searchability
5. Rebuild the project to include new prompts

### TypeScript Development

The project is fully typed with TypeScript. Key types include:

- `Prompt`: Core prompt interface
- `PromptVariable`: Variable definition
- `PromptCategory`: Enum for categorization
- `PromptSearchOptions`: Search configuration
- `PromptConfig`: System configuration

## 🔗 MCP Integration

The MCP server exposes prompts as callable tools. Each prompt becomes a tool with:
- Dynamic input schema based on prompt variables
- Automatic validation of required fields
- Variable interpolation on execution
- Error handling for missing or invalid variables

### Using with AI Assistants

Configure your AI assistant to connect to the MCP server:

```json
{
  "mcpServers": {
    "prompt-craft": {
      "command": "node",
      "args": ["./dist/mcp-server.js"],
      "cwd": "/path/to/prompt-craft"
    }
  }
}
```

## 🎨 Examples

### Code Review Prompt

```bash
prompt-craft render work_code_review_01 \\
  language=TypeScript \\
  code="function add(a: number, b: number) { return a + b; }"
```

### Music Composition Prompt

```bash
prompt-craft render personal_music_01 \\
  genre="jazz" \\
  mood="uplifting" \\
  length=5 \\
  instruments="piano, bass, drums" \\
  inspiration="Bill Evans"
```

### Brand Identity Prompt

```bash
prompt-craft render personal_brand_01 \\
  project_name="CreativeStudio" \\
  project_description="boutique design agency" \\
  target_audience="small businesses" \\
  values="creativity, authenticity, collaboration"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Model Context Protocol SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- Inspired by the need for organized, reusable prompts across different contexts
- TypeScript for type safety and modern development experience
