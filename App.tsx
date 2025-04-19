import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { AppProvider } from './src/context/AppContext';
import { colors } from './src/theme/colors';

// Import screens
import { HomeScreen } from './src/screens/main/HomeScreen';
import { LoginScreen } from './src/screens/main/LoginScreen';
import { RegisterScreen } from './src/screens/main/RegisterScreen';
import { MainTabNavigator } from './src/navigation/MainTabNavigator';
import { DrinkInputScreen } from './src/screens/main/DrinkInputScreen';
import { EditDrinkScreen } from './src/screens/main/EditDrinkScreen';
import { DevToolsScreen } from './src/screens/main/DevToolsScreen';
import { PreGamePlannerScreen } from './src/screens/main/PreGamePlannerScreen';

// Import navigation types
import { RootStackParamList } from './src/navigation/types';

const Stack = createStackNavigator<RootStackParamList>();

// Create theme object from colors
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    error: colors.error,
    background: colors.background,
    surface: colors.surface,
    text: colors.text,
  },
};

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <AppProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerStyle: {
                backgroundColor: colors.primary,
              },
              headerTintColor: colors.button,
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen 
              name="Main" 
              component={MainTabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="DrinkInput" component={DrinkInputScreen} />
            <Stack.Screen name="EditDrink" component={EditDrinkScreen} />
            <Stack.Screen name="DevTools" component={DevToolsScreen} />
            <Stack.Screen name="PreGamePlanner" component={PreGamePlannerScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </AppProvider>
    </PaperProvider>
  );
} 