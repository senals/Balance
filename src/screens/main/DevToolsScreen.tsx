import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, IconButton, DataTable, Snackbar } from 'react-native-paper';
import { colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DevToolsScreen = ({ navigation }: { navigation: any }) => {
  const { 
    drinks, 
    preGamePlans, 
    settings, 
    budget, 
    userProfile,
    logout,
    setDrinks,
    setPreGamePlans
  } = useApp();

  const [metrics, setMetrics] = useState({
    drinksCount: 0,
    plansCount: 0,
    totalStorageSize: 0,
    lastSyncTime: new Date().toISOString(),
  });
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    updateMetrics();
  }, [drinks, preGamePlans]);

  const updateMetrics = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;
      
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }

      setMetrics({
        drinksCount: drinks.length,
        plansCount: preGamePlans.length,
        totalStorageSize: totalSize,
        lastSyncTime: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating metrics:', error);
    }
  };

  const handleResetData = async () => {
    Alert.alert(
      'Reset All Data',
      'Are you sure you want to reset ALL data? This will delete all users, drinks, and other data from the database. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear AsyncStorage
              const keys = await AsyncStorage.getAllKeys();
              await AsyncStorage.multiRemove(keys);
              
              // Reset app state
              setDrinks([]);
              setPreGamePlans([]);
              setMetrics({
                drinksCount: 0,
                plansCount: 0,
                totalStorageSize: 0,
                lastSyncTime: new Date().toISOString(),
              });
              
              setSnackbarMessage('All data reset successfully');
              setSnackbarVisible(true);
              
              // Log out after reset
              setTimeout(async () => {
                await logout();
              }, 2000);
            } catch (error) {
              console.error('Error resetting data:', error);
              setSnackbarMessage('Failed to reset data');
              setSnackbarVisible(true);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
        <Text style={styles.title}>Development Tools</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <Card style={styles.metricsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>App Metrics</Text>
            <DataTable>
              <DataTable.Row>
                <DataTable.Cell>Drinks Count</DataTable.Cell>
                <DataTable.Cell numeric>{metrics.drinksCount}</DataTable.Cell>
              </DataTable.Row>
              <DataTable.Row>
                <DataTable.Cell>Plans Count</DataTable.Cell>
                <DataTable.Cell numeric>{metrics.plansCount}</DataTable.Cell>
              </DataTable.Row>
              <DataTable.Row>
                <DataTable.Cell>Storage Size</DataTable.Cell>
                <DataTable.Cell numeric>{(metrics.totalStorageSize / 1024).toFixed(2)} KB</DataTable.Cell>
              </DataTable.Row>
              <DataTable.Row>
                <DataTable.Cell>Last Sync</DataTable.Cell>
                <DataTable.Cell numeric>{new Date(metrics.lastSyncTime).toLocaleTimeString()}</DataTable.Cell>
              </DataTable.Row>
            </DataTable>
          </Card.Content>
        </Card>

        <Card style={styles.actionsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Data Management</Text>
            <Button 
              mode="outlined" 
              onPress={handleResetData}
              style={styles.resetButton}
              icon="delete"
              textColor={colors.error}
            >
              Reset All Data
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 40,
  },
  backButton: {
    marginRight: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  metricsCard: {
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 2,
  },
  actionsCard: {
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  resetButton: {
    borderColor: colors.error,
  },
  snackbar: {
    backgroundColor: colors.primary,
  },
}); 