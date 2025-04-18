import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { HomeScreen } from './src/screens/main/HomeScreen';
import { LoginScreen } from './src/screens/main/LoginScreen';
import { RegisterScreen } from './src/screens/main/RegisterScreen';
import { MainTabNavigator } from './src/navigation/MainTabNavigator';
import { DrinkInputScreen } from './src/screens/main/DrinkInputScreen';
import { EditDrinkScreen } from './src/screens/main/EditDrinkScreen';
import { DevToolsScreen } from './src/screens/main/DevToolsScreen';
import { colors } from './src/theme/colors';
import { AppProvider } from './src/context/AppContext';
import { LoadingOverlay } from './src/components/LoadingOverlay';
import { useApp } from './src/context/AppContext';

// Navigation types
type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
  Main: undefined;
  DrinkInput: undefined;
  EditDrink: { drinkId: string };
  DevTools: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Create a proper theme object
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    tertiary: colors.tertiary,
    background: colors.background,
    surface: colors.surface,
    error: colors.error,
    onPrimary: colors.surface,
    onSecondary: colors.surface,
    onTertiary: colors.surface,
    onBackground: colors.text,
    onSurface: colors.text,
    onError: colors.surface,
  },
};

// Navigation component
const Navigation = () => {
  const { isLoading, error } = useApp();

  return (
    <>
      <NavigationContainer
        fallback={<LoadingOverlay visible={true} message="Loading navigation..." />}
        onStateChange={(state) => {
          console.log('Navigation state changed:', state);
        }}
      >
        <Stack.Navigator 
          screenOptions={{
            headerShown: false
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen name="DrinkInput" component={DrinkInputScreen} />
          <Stack.Screen 
            name="EditDrink" 
            component={EditDrinkScreen}
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen name="DevTools" component={DevToolsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <LoadingOverlay visible={isLoading} message={error || 'Loading...'} />
    </>
  );
};

// Main App component
export default function App() {
  return (
    <PaperProvider theme={theme}>
      <AppProvider>
        <Navigation />
      </AppProvider>
    </PaperProvider>
  );
} 