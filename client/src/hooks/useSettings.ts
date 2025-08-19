import { useState, useEffect } from 'react';

interface WorkoutSettings {
  workoutExecutionV2: boolean;
  spinnerSetInput: boolean;
  gestureNavigation: boolean;
  circularProgress: boolean;
  restTimerFAB: boolean;
  workoutSummary: boolean;
  autoRegulationFeedback: boolean;
}

const defaultSettings: WorkoutSettings = {
  workoutExecutionV2: true,
  spinnerSetInput: true,
  gestureNavigation: true,
  circularProgress: true,
  restTimerFAB: true,
  workoutSummary: true,
  autoRegulationFeedback: false,
};

const STORAGE_KEY = 'trainpro-workout-settings';

// Simple persistent storage that prioritizes local data
class SettingsManager {
  private settings: WorkoutSettings;
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Always start with defaults
    this.settings = { ...defaultSettings };
    
    // Try to load from localStorage immediately
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all properties exist
        this.settings = { ...defaultSettings, ...parsed };
        console.log('Settings loaded from localStorage:', this.settings);
        this.notifyListeners();
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
      console.log('Settings saved to localStorage:', this.settings);
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
    }
  }

  get(key: keyof WorkoutSettings): boolean {
    return this.settings[key];
  }

  set(key: keyof WorkoutSettings, value: boolean) {
    console.log(`Setting ${key} = ${value}`);
    this.settings[key] = value;
    this.saveToStorage();
    this.notifyListeners();
    
    // Async server sync in background (fire and forget)
    this.syncToServer();
  }

  getAll(): WorkoutSettings {
    return { ...this.settings };
  }

  setAll(newSettings: Partial<WorkoutSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveToStorage();
    this.notifyListeners();
    this.syncToServer();
  }

  private async syncToServer() {
    try {
      const response = await fetch('/api/workout-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(this.settings),
      });
      
      if (response.ok) {
        console.log('Settings synced to server successfully');
      } else {
        console.warn('Failed to sync settings to server:', response.status);
      }
    } catch (error) {
      console.warn('Server sync failed (continuing with local settings):', error);
    }
  }

  subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback());
  }

  // Server sync without overriding local settings (only if local is empty)
  async syncFromServerIfEmpty() {
    const hasLocalData = localStorage.getItem(STORAGE_KEY);
    if (hasLocalData) {
      console.log('Local settings exist, skipping server sync');
      return;
    }

    try {
      const response = await fetch('/api/workout-settings', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const serverSettings = await response.json();
        this.settings = { ...defaultSettings, ...serverSettings };
        this.saveToStorage();
        this.notifyListeners();
        console.log('Initial settings loaded from server:', this.settings);
      }
    } catch (error) {
      console.warn('Failed to load from server, using defaults:', error);
    }
  }
}

// Global settings manager instance
const settingsManager = new SettingsManager();

// React hook for using settings
export const useWorkoutSetting = (key: keyof WorkoutSettings): [boolean, (value: boolean) => void] => {
  const [value, setValue] = useState(() => settingsManager.get(key));

  useEffect(() => {
    const unsubscribe = settingsManager.subscribe(() => {
      setValue(settingsManager.get(key));
    });
    return unsubscribe;
  }, [key]);

  const updateValue = (newValue: boolean) => {
    settingsManager.set(key, newValue);
  };

  return [value, updateValue];
};

// Hook for getting all settings
export const useWorkoutSettings = (): [WorkoutSettings, (settings: Partial<WorkoutSettings>) => void] => {
  const [settings, setSettings] = useState(() => settingsManager.getAll());

  useEffect(() => {
    const unsubscribe = settingsManager.subscribe(() => {
      setSettings(settingsManager.getAll());
    });
    return unsubscribe;
  }, []);

  const updateSettings = (newSettings: Partial<WorkoutSettings>) => {
    settingsManager.setAll(newSettings);
  };

  return [settings, updateSettings];
};

// Initialize settings (call once when app starts)
export const initializeWorkoutSettings = async () => {
  await settingsManager.syncFromServerIfEmpty();
};

export default settingsManager;