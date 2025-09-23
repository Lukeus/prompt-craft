import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Cog6ToothIcon,
  ComputerDesktopIcon,
  MoonIcon,
  SunIcon,
  BellIcon,
  FolderIcon,
  ServerIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { useElectronAPI } from '../hooks/useElectronAPI';

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  autoStart: boolean;
  minimizeToTray: boolean;
  notifications: boolean;
  defaultCategory: string;
}

const SettingsPage: React.FC = () => {
  const electronAPI = useElectronAPI();
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'dark',
    autoStart: false,
    minimizeToTray: true,
    notifications: true,
    defaultCategory: 'work',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [appVersion, setAppVersion] = useState<string>('');
  const [platform, setPlatform] = useState<string>('');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load app info
        if (electronAPI?.system) {
          const versionResult = await electronAPI.system.getAppVersion();
          if (versionResult.success) {
            setAppVersion(versionResult.data || '');
          }

          const platformResult = await electronAPI.system.getPlatform();
          if (platformResult.success) {
            setPlatform(platformResult.data || '');
          }
        }

        // Load settings (would be implemented via IPC)
        if (electronAPI?.settings) {
          const settingsResult = await electronAPI.settings.get();
          if (settingsResult.success && settingsResult.data) {
            setSettings(settingsResult.data);
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [electronAPI]);

  const handleSettingsChange = async (updates: Partial<AppSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);

    if (!electronAPI?.settings) return;

    setIsSaving(true);
    try {
      await electronAPI.settings.set(updates);
    } catch (error) {
      console.error('Failed to save settings:', error);
      // Revert on error
      setSettings(settings);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSettings = async () => {
    if (!electronAPI?.settings) return;
    if (!confirm('Are you sure you want to reset all settings to default values?')) return;

    setIsSaving(true);
    try {
      await electronAPI.settings.reset();
      setSettings({
        theme: 'dark',
        autoStart: false,
        minimizeToTray: true,
        notifications: true,
        defaultCategory: 'work',
      });
    } catch (error) {
      console.error('Failed to reset settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <motion.div
          className="w-8 h-8 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg flex items-center justify-center shadow-lg"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Cog6ToothIcon className="w-4 h-4 text-white" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-600/20 to-accent-600/20 border border-primary-500/30 rounded-full text-sm font-semibold text-primary-300 backdrop-blur-sm">
          <Cog6ToothIcon className="w-4 h-4 mr-2" />
          Application Settings
        </div>
        <h1 className="text-4xl font-bold text-balance">
          <span className="bg-gradient-to-r from-gray-100 via-primary-300 to-accent-400 bg-clip-text text-transparent">
            Customize Your Experience
          </span>
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Configure Prompt Craft to work exactly how you want it. Changes are saved automatically.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appearance Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-6 space-y-6"
        >
          <h2 className="text-xl font-semibold text-gray-100 flex items-center">
            <ComputerDesktopIcon className="w-5 h-5 mr-2 text-primary-300" />
            Appearance
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'light', label: 'Light', icon: SunIcon },
                  { value: 'dark', label: 'Dark', icon: MoonIcon },
                  { value: 'system', label: 'System', icon: ComputerDesktopIcon },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => handleSettingsChange({ theme: value as AppSettings['theme'] })}
                    className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-2 ${
                      settings.theme === value
                        ? 'bg-primary-600/20 text-primary-200 border-primary-500/50'
                        : 'bg-dark-800/40 text-gray-400 border-dark-600/50 hover:text-gray-200 hover:bg-dark-700/40'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Default Category for New Prompts
              </label>
              <select
                value={settings.defaultCategory}
                onChange={(e) => handleSettingsChange({ defaultCategory: e.target.value })}
                className="w-full px-3 py-2 bg-dark-800/60 border border-dark-600/50 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              >
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="shared">Shared</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Behavior Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-6 space-y-6"
        >
          <h2 className="text-xl font-semibold text-gray-100 flex items-center">
            <ServerIcon className="w-5 h-5 mr-2 text-primary-300" />
            Behavior
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-300">
                  Start with System
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Launch Prompt Craft when you log in
                </p>
              </div>
              <button
                onClick={() => handleSettingsChange({ autoStart: !settings.autoStart })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.autoStart ? 'bg-primary-600' : 'bg-dark-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.autoStart ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-300">
                  Minimize to Tray
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Keep running in system tray when closed
                </p>
              </div>
              <button
                onClick={() => handleSettingsChange({ minimizeToTray: !settings.minimizeToTray })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.minimizeToTray ? 'bg-primary-600' : 'bg-dark-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.minimizeToTray ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-300 flex items-center">
                  <BellIcon className="w-4 h-4 mr-2" />
                  Notifications
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Show desktop notifications for important events
                </p>
              </div>
              <button
                onClick={() => handleSettingsChange({ notifications: !settings.notifications })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notifications ? 'bg-primary-600' : 'bg-dark-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </motion.div>

        {/* About Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-6 space-y-6"
        >
          <h2 className="text-xl font-semibold text-gray-100 flex items-center">
            <InformationCircleIcon className="w-5 h-5 mr-2 text-primary-300" />
            About
          </h2>

          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Application Version</span>
              <span className="text-gray-100 font-mono">{appVersion || 'Unknown'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Platform</span>
              <span className="text-gray-100">{platform || 'Unknown'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Electron Version</span>
              <span className="text-gray-100 font-mono">
                {window.electronEnv?.electronVersion || 'Unknown'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-6 space-y-6"
        >
          <h2 className="text-xl font-semibold text-gray-100 flex items-center">
            <FolderIcon className="w-5 h-5 mr-2 text-primary-300" />
            Actions
          </h2>

          <div className="space-y-3">
            <button
              onClick={handleResetSettings}
              disabled={isSaving}
              className="w-full px-4 py-3 bg-red-600/20 text-red-200 border border-red-500/40 rounded-lg hover:bg-red-600/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Resetting...' : 'Reset to Defaults'}
            </button>
            <p className="text-xs text-gray-500">
              This will restore all settings to their default values. This action cannot be undone.
            </p>
          </div>
        </motion.div>
      </div>

      {isSaving && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-8 right-8 bg-primary-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Cog6ToothIcon className="w-4 h-4" />
          </motion.div>
          <span>Saving settings...</span>
        </motion.div>
      )}
    </div>
  );
};

export default SettingsPage;