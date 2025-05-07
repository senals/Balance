import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, List, Switch, Button, Divider, useTheme, TextInput, Portal, Dialog } from 'react-native-paper';
import { useApp } from '../../context/AppContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const SettingsScreen = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const theme = useTheme();
  const { settings, updateSettings, budget, updateBudget, deleteAccount, logout } = useApp();
  const [loading, setLoading] = useState(false);
  const [showDrinkLimitDialog, setShowDrinkLimitDialog] = useState(false);
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [newDrinkLimit, setNewDrinkLimit] = useState(settings.dailyLimit.toString());
  const [newDailyBudget, setNewDailyBudget] = useState(budget.dailyBudget.toString());
  const [newWeeklyBudget, setNewWeeklyBudget] = useState(budget.weeklyBudget.toString());
  const [newMonthlyBudget, setNewMonthlyBudget] = useState(budget.monthlyBudget.toString());

  const handleToggleSetting = async (key: keyof typeof settings) => {
    try {
      await updateSettings({ [key]: !settings[key] });
    } catch (error) {
      console.error('Error updating setting:', error);
    }
  };

  const handleUpdateDrinkLimit = async () => {
    try {
      const limit = parseInt(newDrinkLimit);
      if (isNaN(limit) || limit < 0) {
        Alert.alert('Invalid Input', 'Please enter a valid number');
        return;
      }
      await updateSettings({ dailyLimit: limit });
      setShowDrinkLimitDialog(false);
    } catch (error) {
      console.error('Error updating drink limit:', error);
      Alert.alert('Error', 'Failed to update drink limit');
    }
  };

  const handleUpdateBudget = async () => {
    try {
      const daily = parseFloat(newDailyBudget);
      const weekly = parseFloat(newWeeklyBudget);
      const monthly = parseFloat(newMonthlyBudget);

      if (isNaN(daily) || isNaN(weekly) || isNaN(monthly) || 
          daily < 0 || weekly < 0 || monthly < 0) {
        Alert.alert('Invalid Input', 'Please enter valid numbers');
        return;
      }

      await updateBudget({
        dailyBudget: daily,
        weeklyBudget: weekly,
        monthlyBudget: monthly,
      });
      setShowBudgetDialog(false);
    } catch (error) {
      console.error('Error updating budget:', error);
      Alert.alert('Error', 'Failed to update budget limits');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteAccount();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <List.Section>
        <List.Subheader>App Settings</List.Subheader>
        <List.Item
          title="Dark Mode"
          description="Switch between light and dark theme"
          left={props => <List.Icon {...props} icon="theme-light-dark" />}
          right={() => (
            <Switch
              value={settings.darkModeEnabled}
              onValueChange={() => handleToggleSetting('darkModeEnabled')}
            />
          )}
        />
        <Divider />
        <List.Item
          title="Privacy Mode"
          description="Hide sensitive information from notifications"
          left={props => <List.Icon {...props} icon="shield-lock" />}
          right={() => (
            <Switch
              value={settings.privacyModeEnabled}
              onValueChange={() => handleToggleSetting('privacyModeEnabled')}
            />
          )}
        />
      </List.Section>

      <List.Section>
        <List.Subheader>Notifications</List.Subheader>
        <List.Item
          title="Enable Notifications"
          description="Receive reminders and updates"
          left={props => <List.Icon {...props} icon="bell" />}
          right={() => (
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={() => handleToggleSetting('notificationsEnabled')}
            />
          )}
        />
      </List.Section>

      <List.Section>
        <List.Subheader>Limits & Budget</List.Subheader>
        <List.Item
          title="Daily Drink Limit"
          description={`Set to ${settings.dailyLimit} drinks per day`}
          left={props => <List.Icon {...props} icon="glass-cocktail" />}
          onPress={() => setShowDrinkLimitDialog(true)}
        />
        <Divider />
        <List.Item
          title="Budget Limits"
          description={`Daily: $${budget.dailyBudget} | Weekly: $${budget.weeklyBudget} | Monthly: $${budget.monthlyBudget}`}
          left={props => <List.Icon {...props} icon="wallet" />}
          onPress={() => setShowBudgetDialog(true)}
        />
      </List.Section>

      <List.Section>
        <List.Subheader>Account Settings</List.Subheader>
        <List.Item
          title="Edit Profile"
          description="Update your personal information"
          left={props => <List.Icon {...props} icon="account-edit" />}
          onPress={() => navigation.navigate('EditProfile')}
        />
      </List.Section>

      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={handleLogout}
          loading={loading}
          style={styles.button}
        >
          Logout
        </Button>
        <Button
          mode="contained"
          onPress={handleDeleteAccount}
          loading={loading}
          style={[styles.button, styles.deleteButton]}
          buttonColor={theme.colors.error}
        >
          Delete Account
        </Button>
      </View>

      <Portal>
        <Dialog visible={showDrinkLimitDialog} onDismiss={() => setShowDrinkLimitDialog(false)}>
          <Dialog.Title>Set Daily Drink Limit</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Number of drinks per day"
              value={newDrinkLimit}
              onChangeText={setNewDrinkLimit}
              keyboardType="numeric"
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDrinkLimitDialog(false)}>Cancel</Button>
            <Button onPress={handleUpdateDrinkLimit}>Save</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showBudgetDialog} onDismiss={() => setShowBudgetDialog(false)}>
          <Dialog.Title>Set Budget Limits</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Daily Budget ($)"
              value={newDailyBudget}
              onChangeText={setNewDailyBudget}
              keyboardType="numeric"
              mode="outlined"
              style={styles.budgetInput}
            />
            <TextInput
              label="Weekly Budget ($)"
              value={newWeeklyBudget}
              onChangeText={setNewWeeklyBudget}
              keyboardType="numeric"
              mode="outlined"
              style={styles.budgetInput}
            />
            <TextInput
              label="Monthly Budget ($)"
              value={newMonthlyBudget}
              onChangeText={setNewMonthlyBudget}
              keyboardType="numeric"
              mode="outlined"
              style={styles.budgetInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowBudgetDialog(false)}>Cancel</Button>
            <Button onPress={handleUpdateBudget}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
  button: {
    marginBottom: 12,
  },
  deleteButton: {
    marginTop: 8,
  },
  budgetInput: {
    marginBottom: 12,
  },
}); 