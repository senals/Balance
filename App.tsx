import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { AppProvider, useApp } from './src/context/AppContext';
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
import { EditProfileScreen } from './src/screens/main/EditProfileScreen';
import { SettingsScreen } from './src/screens/main/SettingsScreen';

// Import navigation types
import { RootStackParamList } from './src/navigation/types';

const Stack = createStackNavigator<RootStackParamList>();

const AppContent = () => {
  const { theme } = useApp();

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.primary,
            },
            headerTintColor: theme.colors.onPrimary,
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
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
} 