import { Platform } from 'react-native';

interface Config {
  apiUrl: string;
  environment: 'development' | 'production' | 'staging';
  version: string;
  platform: typeof Platform.OS;
  isDevelopment: boolean;
  isProduction: boolean;
  isStaging: boolean;
}

const ENV = {
  development: {
    apiUrl: 'mongodb+srv://senal:uzYKyyjKj9RQVDfw@cluster0.pehwqtc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
    environment: 'development' as const,
  },
  staging: {
    apiUrl: 'https://staging-api.yourapp.com',
    environment: 'staging' as const,
  },
  production: {
    apiUrl: 'https://api.yourapp.com',
    environment: 'production' as const,
  },
};

const getEnvironment = (): 'development' | 'production' | 'staging' => {
  // You can modify this logic based on your needs
  if (__DEV__) return 'development';
  // Add logic for staging if needed
  // For example: if (process.env.ENV === 'staging') return 'staging';
  return 'production';
};

const environment = getEnvironment();
const envConfig = ENV[environment];

const config: Config = {
  ...envConfig,
  version: '1.0.0',
  platform: Platform.OS,
  isDevelopment: environment === 'development',
  isProduction: environment === 'production',
  isStaging: environment === 'staging',
};

export default config; 