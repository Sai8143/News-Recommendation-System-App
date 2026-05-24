// hooks/useStorage.js
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useStorage(key, defaultValue) {
  const [value, setValue] = useState(defaultValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(key).then(stored => {
      if (stored !== null) {
        try { setValue(JSON.parse(stored)); } catch { setValue(stored); }
      }
      setLoaded(true);
    });
  }, [key]);

  const save = useCallback(async (newValue) => {
    setValue(newValue);
    await AsyncStorage.setItem(key, JSON.stringify(newValue));
  }, [key]);

  return [value, save, loaded];
}

export function useProfile() {
  return useStorage('userProfile', {
    name: 'News Reader',
    interests: ['technology', 'science'],
    gnewsKey: '',
    scanned: 0,
    fakeDetected: 0,
    theme: 'dark',
  });
}

export function useHistory() {
  return useStorage('analysisHistory', []);
}
