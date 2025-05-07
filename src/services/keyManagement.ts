import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Keychain from 'react-native-keychain';

const KEYCHAIN_SERVICE = 'com.balance.app';
const KEYCHAIN_ACCOUNT = 'encryption_key';

export class KeyManagementError extends Error {
  constructor(message: string, operation: string) {
    super(`Key management ${operation} error: ${message}`);
    this.name = 'KeyManagementError';
  }
}

export const keyManagementService = {
  /**
   * Generates a secure random key
   * @returns A secure random key as a string
   */
  generateKey: (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Stores the encryption key securely
   * @param key The encryption key to store
   */
  storeKey: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await Keychain.setGenericPassword(
          KEYCHAIN_ACCOUNT,
          key,
          {
            service: KEYCHAIN_SERVICE,
            accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY
          }
        );
      } else {
        // Fallback to AsyncStorage for web/desktop
        await AsyncStorage.setItem('encryption_key', key);
      }
    } catch (error) {
      throw new KeyManagementError(
        error instanceof Error ? error.message : 'Unknown error',
        'store'
      );
    }
  },

  /**
   * Retrieves the encryption key
   * @returns The encryption key
   */
  getKey: async (): Promise<string> => {
    try {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        const credentials = await Keychain.getGenericPassword({
          service: KEYCHAIN_SERVICE
        });
        
        if (!credentials || !credentials.password) {
          throw new Error('No encryption key found');
        }
        
        return credentials.password;
      } else {
        // Fallback to AsyncStorage for web/desktop
        const key = await AsyncStorage.getItem('encryption_key');
        if (!key) {
          throw new Error('No encryption key found');
        }
        return key;
      }
    } catch (error) {
      throw new KeyManagementError(
        error instanceof Error ? error.message : 'Unknown error',
        'retrieve'
      );
    }
  },

  /**
   * Checks if an encryption key exists
   * @returns boolean indicating if a key exists
   */
  hasKey: async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        const credentials = await Keychain.getGenericPassword({
          service: KEYCHAIN_SERVICE
        });
        return !!credentials && !!credentials.password;
      } else {
        const key = await AsyncStorage.getItem('encryption_key');
        return !!key;
      }
    } catch {
      return false;
    }
  },

  /**
   * Removes the encryption key
   */
  removeKey: async (): Promise<void> => {
    try {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await Keychain.resetGenericPassword({
          service: KEYCHAIN_SERVICE
        });
      } else {
        await AsyncStorage.removeItem('encryption_key');
      }
    } catch (error) {
      throw new KeyManagementError(
        error instanceof Error ? error.message : 'Unknown error',
        'remove'
      );
    }
  }
}; 