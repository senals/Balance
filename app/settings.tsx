import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, List, Switch } from 'react-native-paper';

export default function SettingsPage() {
  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);

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
              value={notifications}
              onValueChange={setNotifications}
            />
          )}
        />
        <List.Item
          title="Dark Mode"
          description="Switch between light and dark theme"
          right={() => (
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
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
  title: {
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
}); 