// React hooks for Electron API integration

export const useElectronAPI = () => {
  // Check window.electronAPI directly each time to ensure synchronous access
  if (typeof window !== 'undefined' && window.electronAPI) {
    return window.electronAPI;
  }
  
  return null;
};

// Type-safe wrapper functions for common operations
export const usePrompts = () => {
  const electronAPI = useElectronAPI();

  const getAllPrompts = async () => {
    if (!electronAPI) {
      return { success: false, error: 'Electron API not available' };
    }
    if (!electronAPI.prompts) {
      return { success: false, error: 'Prompts API not available' };
    }
    try {
      const result = await electronAPI.prompts.getAll();
      return result;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const getPromptById = async (id: string) => {
    if (!electronAPI) return { success: false, error: 'Electron API not available' };
    return electronAPI.prompts.getById(id);
  };

  const createPrompt = async (promptData: any) => {
    if (!electronAPI) return { success: false, error: 'Electron API not available' };
    return electronAPI.prompts.create(promptData);
  };

  const updatePrompt = async (id: string, promptData: any) => {
    if (!electronAPI) return { success: false, error: 'Electron API not available' };
    return electronAPI.prompts.update(id, promptData);
  };

  const deletePrompt = async (id: string) => {
    if (!electronAPI) return { success: false, error: 'Electron API not available' };
    return electronAPI.prompts.delete(id);
  };

  const searchPrompts = async (query: string, category?: string) => {
    if (!electronAPI) return { success: false, error: 'Electron API not available' };
    return electronAPI.prompts.search(query, category);
  };

  const getPromptsByCategory = async (category: string) => {
    if (!electronAPI) return { success: false, error: 'Electron API not available' };
    return electronAPI.prompts.getByCategory(category);
  };

  return {
    getAllPrompts,
    getPromptById,
    createPrompt,
    updatePrompt,
    deletePrompt,
    searchPrompts,
    getPromptsByCategory,
  };
};

export const useDatabase = () => {
  const electronAPI = useElectronAPI();

  const getStats = async () => {
    if (!electronAPI) {
      return { success: false, error: 'Electron API not available' };
    }
    if (!electronAPI.database) {
      return { success: false, error: 'Database API not available' };
    }
    try {
      const result = await electronAPI.database.getStats();
      return result;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const exportData = async (filePath: string) => {
    if (!electronAPI) return { success: false, error: 'Electron API not available' };
    return electronAPI.database.export(filePath);
  };

  const importData = async (filePath: string) => {
    if (!electronAPI) return { success: false, error: 'Electron API not available' };
    return electronAPI.database.import(filePath);
  };

  return {
    getStats,
    exportData,
    importData,
  };
};

export const useMCP = () => {
  const electronAPI = useElectronAPI();

  const startServer = async () => {
    if (!electronAPI) return { success: false, error: 'Electron API not available' };
    return electronAPI.mcp.startServer();
  };

  const stopServer = async () => {
    if (!electronAPI) return { success: false, error: 'Electron API not available' };
    return electronAPI.mcp.stopServer();
  };

  const getStatus = async () => {
    if (!electronAPI) return { success: false, error: 'Electron API not available' };
    return electronAPI.mcp.getStatus();
  };

  const onStatusChanged = (callback: (status: any) => void) => {
    if (!electronAPI) return;
    electronAPI.mcp.onStatusChanged(callback);
  };

  return {
    startServer,
    stopServer,
    getStatus,
    onStatusChanged,
  };
};