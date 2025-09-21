import { Menu, MenuItemConstructorOptions, app, shell } from 'electron';

export interface MenuCallbacks {
  onNewPrompt: () => void;
  onOpenPrompts: () => void;
  onOpenSearch: () => void;
  onToggleDevTools: () => void;
}

export const createApplicationMenu = (callbacks: MenuCallbacks): Menu => {
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'Prompt Craft',
      submenu: [
        {
          label: 'About Prompt Craft',
          click: () => {
            shell.openExternal('https://lukeus.com');
          }
        },
        { type: 'separator' },
        {
          label: 'Preferences...',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            // TODO: Open preferences window
          }
        },
        { type: 'separator' },
        {
          label: 'Services',
          role: 'services',
          submenu: []
        },
        { type: 'separator' },
        {
          label: 'Hide Prompt Craft',
          accelerator: 'Command+H',
          role: 'hide'
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Option+H',
          role: 'hideOthers'
        },
        {
          label: 'Show All',
          role: 'unhide'
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'New Prompt',
          accelerator: 'CmdOrCtrl+N',
          click: callbacks.onNewPrompt
        },
        { type: 'separator' },
        {
          label: 'Open Prompts Library',
          accelerator: 'CmdOrCtrl+O',
          click: callbacks.onOpenPrompts
        },
        { type: 'separator' },
        {
          label: 'Import Prompts...',
          accelerator: 'CmdOrCtrl+I',
          click: () => {
            // TODO: Import prompts functionality
          }
        },
        {
          label: 'Export Prompts...',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            // TODO: Export prompts functionality
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          role: 'undo'
        },
        {
          label: 'Redo',
          accelerator: 'Shift+CmdOrCtrl+Z',
          role: 'redo'
        },
        { type: 'separator' },
        {
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          role: 'cut'
        },
        {
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          role: 'copy'
        },
        {
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          role: 'paste'
        },
        {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          role: 'selectAll'
        },
        { type: 'separator' },
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: callbacks.onOpenSearch
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          role: 'reload'
        },
        {
          label: 'Force Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          role: 'forceReload'
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'F12',
          click: callbacks.onToggleDevTools
        },
        { type: 'separator' },
        {
          label: 'Actual Size',
          accelerator: 'CmdOrCtrl+0',
          role: 'resetZoom'
        },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          role: 'zoomIn'
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          role: 'zoomOut'
        },
        { type: 'separator' },
        {
          label: 'Toggle Fullscreen',
          accelerator: 'Ctrl+Command+F',
          role: 'togglefullscreen'
        }
      ]
    },
    {
      label: 'Navigate',
      submenu: [
        {
          label: 'Dashboard',
          accelerator: 'CmdOrCtrl+1',
          click: () => {
            // Navigate to dashboard
          }
        },
        {
          label: 'Prompts Library',
          accelerator: 'CmdOrCtrl+2',
          click: callbacks.onOpenPrompts
        },
        {
          label: 'Search',
          accelerator: 'CmdOrCtrl+3',
          click: callbacks.onOpenSearch
        },
        {
          label: 'MCP Server',
          accelerator: 'CmdOrCtrl+4',
          click: () => {
            // Navigate to MCP server
          }
        }
      ]
    },
    {
      label: 'Tools',
      submenu: [
        {
          label: 'Start MCP Server',
          click: () => {
            // TODO: Start MCP server
          }
        },
        {
          label: 'Stop MCP Server',
          click: () => {
            // TODO: Stop MCP server
          }
        },
        { type: 'separator' },
        {
          label: 'Database Manager',
          click: () => {
            // TODO: Open database manager
          }
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'CmdOrCtrl+M',
          role: 'minimize'
        },
        {
          label: 'Close',
          accelerator: 'CmdOrCtrl+W',
          role: 'close'
        },
        { type: 'separator' },
        {
          label: 'Bring All to Front',
          role: 'front'
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Prompt Craft',
          click: () => {
            // TODO: Show about dialog
          }
        },
        {
          label: 'Documentation',
          click: () => {
            shell.openExternal('https://github.com/lukeus/prompt-manager');
          }
        },
        {
          label: 'What is MCP?',
          click: () => {
            shell.openExternal('https://modelcontextprotocol.io');
          }
        },
        { type: 'separator' },
        {
          label: 'Report Issue',
          click: () => {
            shell.openExternal('https://github.com/lukeus/prompt-manager/issues');
          }
        }
      ]
    }
  ];

  return Menu.buildFromTemplate(template);
};