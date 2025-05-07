import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Text, List, Switch, Button, Divider, useTheme, TextInput, Portal, Dialog, IconButton, ActivityIndicator } from 'react-native-paper';
import { useApp } from '../../context/AppContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNewDrinkLimit(settings.dailyLimit.toString());
  }, [settings.dailyLimit]);

  useEffect(() => {
    setNewDailyBudget(budget.dailyBudget.toString());
    setNewWeeklyBudget(budget.weeklyBudget.toString());
    setNewMonthlyBudget(budget.monthlyBudget.toString());
  }, [budget.dailyBudget, budget.weeklyBudget, budget.monthlyBudget]);

  const handleToggleSetting = async (key: keyof typeof settings) => {
    try {
      setLoading(true);
      setError(null);
      await updateSettings({ [key]: !settings[key] });
    } catch (error) {
      console.error('Error updating setting:', error);
      setError('Failed to update setting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDrinkLimit = async () => {
    try {
      setLoading(true);
      setError(null);
      const limit = parseInt(newDrinkLimit);
      if (isNaN(limit) || limit < 0) {
        setError('Please enter a valid number');
        return;
      }
      await updateSettings({ dailyLimit: limit });
      setShowDrinkLimitDialog(false);
    } catch (error) {
      console.error('Error updating drink limit:', error);
      setError('Failed to update drink limit');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBudget = async () => {
    try {
      setLoading(true);
      setError(null);
      const daily = parseFloat(newDailyBudget);
      const weekly = parseFloat(newWeeklyBudget);
      const monthly = parseFloat(newMonthlyBudget);

      if (isNaN(daily) || isNaN(weekly) || isNaN(monthly) || 
          daily < 0 || weekly < 0 || monthly < 0) {
        setError('Please enter valid numbers');
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
      setError('Failed to update budget limits');
    } finally {
      setLoading(false);
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
              setError('Failed to delete account. Please try again.');
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
      setError('Failed to logout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
        <Text style={styles.title}>Settings</Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <List.Section>
          <List.Subheader style={styles.sectionTitle}>App Settings</List.Subheader>
          <List.Item
            title="Dark Mode"
            description="Switch between light and dark theme"
            left={props => <List.Icon {...props} icon="theme-light-dark" color={colors.primary} />}
            right={() => (
              <Switch
                value={settings.darkModeEnabled}
                onValueChange={() => handleToggleSetting('darkModeEnabled')}
                color={colors.primary}
              />
            )}
            style={styles.listItem}
          />
          <Divider style={styles.divider} />
          <List.Item
            title="Privacy Mode"
            description="Hide sensitive information from notifications"
            left={props => <List.Icon {...props} icon="shield-lock" color={colors.primary} />}
            right={() => (
              <Switch
                value={settings.privacyModeEnabled}
                onValueChange={() => handleToggleSetting('privacyModeEnabled')}
                color={colors.primary}
              />
            )}
            style={styles.listItem}
          />
        </List.Section>

        <List.Section>
          <List.Subheader style={styles.sectionTitle}>Notifications</List.Subheader>
          <List.Item
            title="Enable Notifications"
            description="Receive reminders and updates"
            left={props => <List.Icon {...props} icon="bell" color={colors.primary} />}
            right={() => (
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={() => handleToggleSetting('notificationsEnabled')}
                color={colors.primary}
              />
            )}
            style={styles.listItem}
          />
        </List.Section>

        <List.Section>
          <List.Subheader style={styles.sectionTitle}>Limits & Budget</List.Subheader>
          <List.Item
            title="Daily Drink Limit"
            description={`Set to ${newDrinkLimit} drinks per day`}
            left={props => <List.Icon {...props} icon="glass-cocktail" color={colors.primary} />}
            onPress={() => setShowDrinkLimitDialog(true)}
            style={styles.listItem}
          />
          <Divider style={styles.divider} />
          <List.Item
            title="Budget Limits"
            description={`Daily: $${newDailyBudget} | Weekly: $${newWeeklyBudget} | Monthly: $${newMonthlyBudget}`}
            left={props => <List.Icon {...props} icon="wallet" color={colors.primary} />}
            onPress={() => setShowBudgetDialog(true)}
            style={styles.listItem}
          />
        </List.Section>

        <List.Section>
          <List.Subheader style={styles.sectionTitle}>Account Settings</List.Subheader>
          <List.Item
            title="Edit Profile"
            description="Update your personal information"
            left={props => <List.Icon {...props} icon="account-edit" color={colors.primary} />}
            onPress={() => navigation.navigate('EditProfile')}
            style={styles.listItem}
          />
          <Divider style={styles.divider} />
          <List.Item
            title="Logout"
            description="Sign out of your account"
            left={props => <List.Icon {...props} icon="logout" color={colors.primary} />}
            onPress={handleLogout}
            style={styles.listItem}
          />
        </List.Section>

        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={handleLogout}
            loading={loading}
            style={styles.button}
            textColor={colors.primary}
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
      </ScrollView>

      <Portal>
        <Dialog 
          visible={showDrinkLimitDialog} 
          onDismiss={() => setShowDrinkLimitDialog(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>Set Daily Drink Limit</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Number of drinks per day"
              value={newDrinkLimit}
              onChangeText={setNewDrinkLimit}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
              error={!!error}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDrinkLimitDialog(false)}>Cancel</Button>
            <Button onPress={handleUpdateDrinkLimit} loading={loading}>Save</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog 
          visible={showBudgetDialog} 
          onDismiss={() => setShowBudgetDialog(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>Set Budget Limits</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Daily Budget ($)"
              value={newDailyBudget}
              onChangeText={setNewDailyBudget}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
              error={!!error}
            />
            <TextInput
              label="Weekly Budget ($)"
              value={newWeeklyBudget}
              onChangeText={setNewWeeklyBudget}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
              error={!!error}
            />
            <TextInput
              label="Monthly Budget ($)"
              value={newMonthlyBudget}
              onChangeText={setNewMonthlyBudget}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
              error={!!error}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowBudgetDialog(false)}>Cancel</Button>
            <Button onPress={handleUpdateBudget} loading={loading}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff7e9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff7e9',
  },
  loadingText: {
    marginTop: 12,
    color: colors.text,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 40,
    backgroundColor: '#fff0d4',
    elevation: 2,
  },
  backButton: {
    marginRight: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  listItem: {
    backgroundColor: '#fff0d4',
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
  },
  divider: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginVertical: 8,
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
  button: {
    marginBottom: 12,
    borderRadius: 8,
  },
  deleteButton: {
    marginTop: 8,
  },
  errorContainer: {
    backgroundColor: colors.error + '20',
    padding: 12,
    margin: 16,
    borderRadius: 8,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
  },
  dialog: {
    backgroundColor: '#fff7e9',
  },
  dialogTitle: {
    color: colors.primary,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff0d4',
  },
}); 