import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Text, List, Switch, Button } from 'react-native-paper';
import { useApp } from '../src/context/AppContext';

export default function SettingsPage() {
  const { 
    isLoading, 
    settings, 
    updateSettings,
    loadUserData
  } = useApp();
  
  const [localSettings, setLocalSettings] = useState({
    notifications: settings.notificationsEnabled,
    darkMode: settings.darkModeEnabled,
  });

  // Update local settings when context settings change
  useEffect(() => {
    setLocalSettings({
      notifications: settings.notificationsEnabled,
      darkMode: settings.darkModeEnabled,
    });
  }, [settings]);

  // Load user data if needed
  useEffect(() => {
    loadUserData();
  }, []);

  const handleToggleNotifications = async (value: boolean) => {
    setLocalSettings(prev => ({ ...prev, notifications: value }));
    try {
      await updateSettings({ notificationsEnabled: value });
    } catch (error) {
      // Revert on error
      setLocalSettings(prev => ({ ...prev, notifications: !value }));
    }
  };

  const handleToggleDarkMode = async (value: boolean) => {
    setLocalSettings(prev => ({ ...prev, darkMode: value }));
    try {
      await updateSettings({ darkModeEnabled: value });
    } catch (error) {
      // Revert on error
      setLocalSettings(prev => ({ ...prev, darkMode: !value }));
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Settings</Text>
      
      <List.Section>
        <List.Subheader>Preferences</List.Subheader>
        <List.Item
          title="Notifications"
          description="Receive reminders and updates"
          right={() => (
            <Switch
              value={localSettings.notifications}
              onValueChange={handleToggleNotifications}
            />
          )}
        />
        <List.Item
          title="Dark Mode"
          description="Switch between light and dark theme"
          right={() => (
            <Switch
              value={localSettings.darkMode}
              onValueChange={handleToggleDarkMode}
            />
          )}
        />
      </List.Section>

      <List.Section>
        <List.Subheader>About</List.Subheader>
        <List.Item
          title="Version"
          description="1.0.0"
        />
        <List.Item
          title="Terms of Service"
          description="Read our terms and conditions"
        />
        <List.Item
          title="Privacy Policy"
          description="Learn about our data practices"
        />
      </List.Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  title: {
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
}); 