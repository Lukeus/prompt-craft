import { useCallback, useMemo } from 'react';

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

  const getAllPrompts = useCallback(async () => {
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
  }, [electronAPI]);

  const getPromptById = useCallback(async (id: string) => {
    if (!electronAPI) return { success: false, error: 'Electron API not available' };
    return electronAPI.prompts.getById(id);
  }, [electronAPI]);

  const getById = useCallback(async (id: string) => {
    if (!electronAPI) return { success: false, error: 'Electron API not available' };
    return electronAPI.prompts.getById(id);
  }, [electronAPI]);

  const render = useCallback(async (id: string, variables: Record<string, any>) => {
    if (!electronAPI) return { success: false, error: 'Electron API not available' };
    return electronAPI.prompts.render(id, variables);
  }, [electronAPI]);

  const createPrompt = useCallback(async (promptData: any) => {
    if (!electronAPI) return { success: false, error: 'Electron API not available' };
    return electronAPI.prompts.create(promptData);
  }, [electronAPI]);

  const updatePrompt = useCallback(async (id: string, promptData: any) => {
    if (!electronAPI) return { success: false, error: 'Electron API not available' };
    return electronAPI.prompts.update(id, promptData);
  }, [electronAPI]);

  const deletePrompt = useCallback(async (id: string) => {
    if (!electronAPI) return { success: false, error: 'Electron API not available' };
    return electronAPI.prompts.delete(id);
  }, [electronAPI]);

  const searchPrompts = useCallback(async (query: string, category?: string) => {
    if (!electronAPI) return { success: false, error: 'Electron API not available' };
    return electronAPI.prompts.search(query, category);
  }, [electronAPI]);

  const getPromptsByCategory = useCallback(async (category: string) => {
    if (!electronAPI) return { success: false, error: 'Electron API not available' };
    return electronAPI.prompts.getByCategory(category);
  }, [electronAPI]);

  const setFavorite = useCallback(async (id: string, isFavorite: boolean) => {
    if (!electronAPI) return { success: false, error: 'Electron API not available' };
    if (!electronAPI.prompts.setFavorite) {
      return { success: false, error: 'Favorites API not available' };
    }
    return electronAPI.prompts.setFavorite(id, isFavorite);
  }, [electronAPI]);

  return useMemo(() => ({
    getAllPrompts,
    getPromptById,
    getById,
    render,
    createPrompt,
    updatePrompt,
    deletePrompt,
    searchPrompts,
    getPromptsByCategory,
    setFavorite,
  }), [
    getAllPrompts,
    getPromptById,
    getById,
    render,
    createPrompt,
    updatePrompt,
    deletePrompt,
    searchPrompts,
    getPromptsByCategory,
    setFavorite,
  ]);
};

export const useDatabase = () => {
  const electronAPI = useElectronAPI();

  const getStats = useCallback(async () => {
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
  }, [electronAPI]);

  const exportData = useCallback(async (filePath: string) => {
    if (!electronAPI) return { success: false, error: 'Electron API not available' };
    return electronAPI.database.export(filePath);
  }, [electronAPI]);

  const importData = useCallback(async (filePath: string) => {
    if (!electronAPI) return { success: false, error: 'Electron API not available' };
    return electronAPI.database.import(filePath);
  }, [electronAPI]);

  return useMemo(() => ({
    getStats,
    exportData,
    importData,
  }), [getStats, exportData, importData]);
};

export const useMCP = () => {
  const electronAPI = useElectronAPI();

  const startServer = useCallback(async () => {
    if (!electronAPI) return { success: false, error: 'Electron API not available' };
    return electronAPI.mcp.startServer();
  }, [electronAPI]);

  const stopServer = useCallback(async () => {
    if (!electronAPI) return { success: false, error: 'Electron API not available' };
    return electronAPI.mcp.stopServer();
  }, [electronAPI]);

  const getStatus = useCallback(async () => {
    if (!electronAPI) return { success: false, error: 'Electron API not available' };
    return electronAPI.mcp.getStatus();
  }, [electronAPI]);

  const onStatusChanged = useCallback((callback: (status: any) => void) => {
    if (!electronAPI) return () => undefined;
    return electronAPI.mcp.onStatusChanged(callback);
  }, [electronAPI]);

  return useMemo(() => ({
    startServer,
    stopServer,
    getStatus,
    onStatusChanged,
  }), [startServer, stopServer, getStatus, onStatusChanged]);
};

export const useDiagnostics = () => {
  const electronAPI = useElectronAPI();

  const getSnapshot = useCallback(async () => {
    if (!electronAPI) return { success: false, error: 'Electron API not available' };
    return electronAPI.diagnostics.getSnapshot();
  }, [electronAPI]);

  const onUpdated = useCallback((callback: (payload: any) => void) => {
    if (!electronAPI) return () => undefined;
    return electronAPI.diagnostics.onUpdated(callback);
  }, [electronAPI]);

  return useMemo(() => ({
    getSnapshot,
    onUpdated,
  }), [getSnapshot, onUpdated]);
};
