import AsyncStorage from '@react-native-async-storage/async-storage';
import {useCallback} from 'react';

export function useStorage() {
  const getItem = useCallback(async (key: string) => {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  }, []);

  const setItem = useCallback(async (key: string, value: unknown) => {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  }, []);

  const removeItem = useCallback(async (key: string) => {
    await AsyncStorage.removeItem(key);
  }, []);

  return {getItem, setItem, removeItem};
}
