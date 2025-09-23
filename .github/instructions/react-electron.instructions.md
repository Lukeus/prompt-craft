---
applyTo: "packages/apps/electron/renderer/**/*.tsx,packages/apps/electron/renderer/**/*.ts"
---

# React Electron Renderer Instructions - PRODUCTION READY

## Production Status
- ✅ Complete VS Code-like interface implemented
- ✅ All major components and pages working
- ✅ Settings system fully functional
- ✅ MCP integration with live diagnostics
- ✅ Advanced search and filtering working

## React Standards

- Use functional components with hooks (no class components)
- Implement proper TypeScript interfaces for all props
- Use React.lazy() for route-based code splitting
- Implement proper Suspense boundaries with loading states
- Follow React best practices for state management

## Electron Integration

- Access Electron APIs through `window.electronAPI` (defined in preload script)
- Check `window.electronEnv?.isElectron` before using Electron-specific features
- Handle cases where Electron APIs might not be available
- Use proper IPC communication patterns

## UI/UX Guidelines

- Use Tailwind CSS for styling with consistent design system
- Implement responsive design principles
- Use Framer Motion for animations and transitions
- Maintain consistent color scheme and typography
- Provide proper loading states and error boundaries

## Performance Optimization

- Maintain webpack code splitting configuration
- Use lazy loading for heavy components
- Implement proper memoization with useMemo and useCallback
- Avoid unnecessary re-renders
- Keep bundle sizes optimized (current target: <500KB per chunk)

## State Management

- Use React hooks for local state
- Implement proper error handling in components
- Use context providers sparingly (only for truly global state)
- Maintain immutable state updates

## Navigation & Routing

- Use React Router for client-side navigation
- Implement proper route guards and error boundaries
- Handle navigation events from main Electron process
- Provide proper 404 handling

## Production Features (Implemented)

- **VS Code Layout**: Activity Bar, Sidebar, Command Bar, Status Bar, Bottom Panel
- **Settings Page**: Complete configuration interface (/settings)
- **Command Palette**: Quick actions (⌘⇧P / Ctrl⇧P)
- **Keyboard Shortcuts**: Professional shortcuts (⌘K for search)
- **Responsive Design**: Mobile overlay navigation
- **Error Handling**: Comprehensive user feedback
- **Performance**: Code splitting and lazy loading optimized
