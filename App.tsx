import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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
import { EditProfileScreen } from './src/screens/main/EditProfileScreen';
import { StatisticsScreen } from './src/screens/main/StatisticsScreen';
import { SettingsScreen } from './src/screens/main/SettingsScreen';
import { ReadinessAssessmentScreen } from './src/screens/onboarding/ReadinessAssessmentScreen';
import { DevelopmentScreen } from './src/screens/main/DevelopmentScreen';

// Import navigation types
import { RootStackParamList } from './src/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppContent = () => {
  const { isAuthenticated, theme, currentUser } = useApp();

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          {!isAuthenticated ? (
            <>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen name="ReadinessAssessment" component={ReadinessAssessmentScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="Main" component={MainTabNavigator} />
              <Stack.Screen name="DrinkInput" component={DrinkInputScreen} />
              <Stack.Screen name="EditDrink" component={EditDrinkScreen} />
              <Stack.Screen name="EditProfile" component={EditProfileScreen} />
              <Stack.Screen name="Statistics" component={StatisticsScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
              <Stack.Screen name="Development" component={DevelopmentScreen} />
            </>
          )}
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