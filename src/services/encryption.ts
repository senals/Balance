import CryptoJS from 'crypto-js';
import { keyManagementService } from './keyManagement';

export class EncryptionError extends Error {
  constructor(message: string, operation: string) {
    super(`Encryption ${operation} error: ${message}`);
    this.name = 'EncryptionError';
  }
}

export const encryptionService = {
  /**
   * Initializes the encryption service by ensuring a key exists
   */
  initialize: async (): Promise<void> => {
    try {
      const hasKey = await keyManagementService.hasKey();
      if (!hasKey) {
        const newKey = keyManagementService.generateKey();
        await keyManagementService.storeKey(newKey);
      }
    } catch (error) {
      throw new EncryptionError(
        error instanceof Error ? error.message : 'Unknown error',
        'initialization'
      );
    }
  },

  /**
   * Encrypts data using AES-256
   * @param data The data to encrypt
   * @returns Encrypted data as a string
   */
  encrypt: async (data: any): Promise<string> => {
    try {
      const key = await keyManagementService.getKey();
      const dataString = JSON.stringify(data);
      return CryptoJS.AES.encrypt(dataString, key).toString();
    } catch (error) {
      throw new EncryptionError(
        error instanceof Error ? error.message : 'Unknown error',
        'encryption'
      );
    }
  },

  /**
   * Decrypts data that was encrypted using AES-256
   * @param encryptedData The encrypted data string
   * @returns Decrypted data
   */
  decrypt: async (encryptedData: string): Promise<any> => {
    try {
      const key = await keyManagementService.getKey();
      const bytes = CryptoJS.AES.decrypt(encryptedData, key);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedString);
    } catch (error) {
      throw new EncryptionError(
        error instanceof Error ? error.message : 'Unknown error',
        'decryption'
      );
    }
  },

  /**
   * Checks if a string is encrypted
   * @param data The data to check
   * @returns boolean indicating if the data appears to be encrypted
   */
  isEncrypted: (data: string): boolean => {
    try {
      // Check if the string is a valid base64 format
      if (!/^[A-Za-z0-9+/=]+$/.test(data)) {
        return false;
      }
      
      // Try to decrypt (but don't use the result)
      CryptoJS.AES.decrypt(data, 'dummy-key');
      return true;
    } catch {
      return false;
    }
  }
}; 