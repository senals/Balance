import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DashboardScreen } from '../screens/main/DashboardScreen';
import { DrinkTrackerScreen } from '../screens/main/DrinkTrackerScreen';
import { colors } from '../theme/colors';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BudgetTrackerScreen } from '../screens/main/BudgetTrackerScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { PreGamePlannerScreen } from '../screens/main/PreGamePlannerScreen';
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.primary,
          paddingBottom: 5,
          paddingTop: 5,
          elevation: 8,
          shadowColor: colors.text,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="view-dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="DrinkTracker"
        component={DrinkTrackerScreen}
        options={{
          tabBarLabel: 'Drink Tracker',
          tabBarIcon: ({ color, size }) => (
            <Icon name="glass-cocktail" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="BudgetTracker"
        component={BudgetTrackerScreen}
        options={{
          tabBarLabel: 'Budget',
          tabBarIcon: ({ color, size }) => (
            <Icon name="cash" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="PreGamePlanner"
        component={PreGamePlannerScreen}
        options={{
          tabBarLabel: 'Pre-Game',
          tabBarIcon: ({ color, size }) => (
            <Icon name="calendar-check" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="account" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}; 