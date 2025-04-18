import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { Text, Button, Card, IconButton, TextInput, SegmentedButtons, Divider, List, Snackbar, Portal, Dialog, Switch, DataTable, ProgressBar } from 'react-native-paper';
import { colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { format, parseISO } from 'date-fns';
import { DrinkEntry, UserProfile, UserSettings, BudgetData, PreGamePlan } from '../../services/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DevToolsScreen = ({ navigation }: { navigation: any }) => {
  const { 
    drinks, 
    preGamePlans, 
    settings, 
    budget, 
    userProfile,
    addDrink,
    updateDrink,
    removeDrink,
    addPreGamePlan,
    updatePreGamePlan,
    removePreGamePlan,
    updateSettings,
    updateBudget,
    updateProfile,
    isLoading,
    error
  } = useApp();

  const [activeTab, setActiveTab] = useState('drinks');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState('');
  const [performanceMetrics, setPerformanceMetrics] = useState({
    drinksCount: 0,
    plansCount: 0,
    totalStorageSize: 0,
    lastSyncTime: new Date().toISOString(),
  });

  // Reset state when tab changes
  useEffect(() => {
    setSelectedItem(null);
    setEditMode(false);
    setJsonInput('');
  }, [activeTab]);

  // Update performance metrics
  useEffect(() => {
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

        setPerformanceMetrics({
          drinksCount: drinks.length,
          plansCount: preGamePlans.length,
          totalStorageSize: totalSize,
          lastSyncTime: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error updating metrics:', error);
      }
    };

    updateMetrics();
  }, [drinks, preGamePlans]);

  const handleViewItem = (item: any) => {
    setSelectedItem(item);
    setJsonInput(JSON.stringify(item, null, 2));
    setEditMode(false);
  };

  const handleEditItem = () => {
    setEditMode(true);
  };

  const handleSaveItem = async () => {
    try {
      const updatedItem = JSON.parse(jsonInput);
      
      if (activeTab === 'drinks') {
        await updateDrink(updatedItem.id, updatedItem);
        setSnackbarMessage('Drink updated successfully');
      } else if (activeTab === 'plans') {
        await updatePreGamePlan(updatedItem.id, updatedItem);
        setSnackbarMessage('Pre-game plan updated successfully');
      } else if (activeTab === 'settings') {
        await updateSettings(updatedItem);
        setSnackbarMessage('Settings updated successfully');
      } else if (activeTab === 'budget') {
        await updateBudget(updatedItem);
        setSnackbarMessage('Budget updated successfully');
      } else if (activeTab === 'profile') {
        await updateProfile(updatedItem);
        setSnackbarMessage('User profile updated successfully');
      }
      
      setEditMode(false);
      setSnackbarVisible(true);
    } catch (error) {
      setSnackbarMessage('Error updating item: ' + (error instanceof Error ? error.message : String(error)));
      setSnackbarVisible(true);
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;

    try {
      if (activeTab === 'drinks') {
        await removeDrink(selectedItem.id);
        setSnackbarMessage('Drink deleted successfully');
      } else if (activeTab === 'plans') {
        await removePreGamePlan(selectedItem.id);
        setSnackbarMessage('Pre-game plan deleted successfully');
      }
      
      setSelectedItem(null);
      setJsonInput('');
      setShowDeleteDialog(false);
      setSnackbarVisible(true);
    } catch (error) {
      setSnackbarMessage('Error deleting item: ' + (error instanceof Error ? error.message : String(error)));
      setSnackbarVisible(true);
    }
  };

  const handleAddItem = async () => {
    try {
      const newItem = JSON.parse(jsonInput);
      
      if (activeTab === 'drinks') {
        await addDrink(newItem);
        setSnackbarMessage('Drink added successfully');
      } else if (activeTab === 'plans') {
        await addPreGamePlan(newItem);
        setSnackbarMessage('Pre-game plan added successfully');
      }
      
      setJsonInput('');
      setSnackbarVisible(true);
    } catch (error) {
      setSnackbarMessage('Error adding item: ' + (error instanceof Error ? error.message : String(error)));
      setSnackbarVisible(true);
    }
  };

  const handleResetData = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      await AsyncStorage.multiRemove(keys);
      setSnackbarMessage('All data reset successfully');
      setShowResetDialog(false);
      setSnackbarVisible(true);
    } catch (error) {
      setSnackbarMessage('Error resetting data: ' + (error instanceof Error ? error.message : String(error)));
      setSnackbarVisible(true);
    }
  };

  const handleExportData = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const data: { [key: string]: any } = {};
      
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          data[key] = JSON.parse(value);
        }
      }
      
      const exportString = JSON.stringify(data, null, 2);
      // In a real app, you would use a proper sharing mechanism
      console.log('Export data:', exportString);
      setSnackbarMessage('Data exported successfully');
      setShowExportDialog(false);
      setSnackbarVisible(true);
    } catch (error) {
      setSnackbarMessage('Error exporting data: ' + (error instanceof Error ? error.message : String(error)));
      setSnackbarVisible(true);
    }
  };

  const handleImportData = async () => {
    try {
      const data = JSON.parse(importData);
      const entries = Object.entries(data);
      
      for (const [key, value] of entries) {
        await AsyncStorage.setItem(key, JSON.stringify(value));
      }
      
      setImportData('');
      setShowImportDialog(false);
      setSnackbarMessage('Data imported successfully');
      setSnackbarVisible(true);
    } catch (error) {
      setSnackbarMessage('Error importing data: ' + (error instanceof Error ? error.message : String(error)));
      setSnackbarVisible(true);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // In a real app, you would refresh the data from the server
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const renderItemList = () => {
    let items: any[] = [];
    let title = '';
    
    switch (activeTab) {
      case 'drinks':
        items = drinks;
        title = 'Drinks';
        break;
      case 'plans':
        items = preGamePlans;
        title = 'Pre-Game Plans';
        break;
      case 'settings':
        items = [settings];
        title = 'Settings';
        break;
      case 'budget':
        items = [budget];
        title = 'Budget';
        break;
      case 'profile':
        items = [userProfile];
        title = 'User Profile';
        break;
    }
    
    return (
      <Card style={styles.listCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>{title}</Text>
          {items.length > 0 ? (
            items.map((item, index) => (
              <List.Item
                key={item.id || index}
                title={item.title || item.brand || 'Item ' + (index + 1)}
                description={item.date ? format(parseISO(item.date), 'dd MMM yyyy') : ''}
                left={props => <List.Icon {...props} icon={activeTab === 'drinks' ? 'glass-cocktail' : 'calendar'} />}
                right={props => (
                  <IconButton
                    {...props}
                    icon="eye"
                    onPress={() => handleViewItem(item)}
                  />
                )}
                style={styles.listItem}
              />
            ))
          ) : (
            <Text style={styles.emptyMessage}>No items found</Text>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderItemDetails = () => {
    if (!selectedItem && !editMode) return null;
    
    return (
      <Card style={styles.detailsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>
            {editMode ? 'Edit Item' : 'Item Details'}
          </Text>
          <TextInput
            label="JSON Data"
            value={jsonInput}
            onChangeText={setJsonInput}
            multiline
            numberOfLines={10}
            style={styles.jsonInput}
            editable={editMode}
          />
          <View style={styles.buttonRow}>
            {!editMode ? (
              <>
                <Button 
                  mode="contained" 
                  onPress={handleEditItem}
                  style={styles.button}
                >
                  Edit
                </Button>
                {(activeTab === 'drinks' || activeTab === 'plans') && (
                  <Button 
                    mode="contained" 
                    onPress={() => setShowDeleteDialog(true)}
                    style={[styles.button, styles.deleteButton]}
                    buttonColor={colors.error}
                  >
                    Delete
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button 
                  mode="contained" 
                  onPress={handleSaveItem}
                  style={styles.button}
                >
                  Save
                </Button>
                <Button 
                  mode="outlined" 
                  onPress={() => setEditMode(false)}
                  style={styles.button}
                >
                  Cancel
                </Button>
              </>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderAddItem = () => {
    if (activeTab !== 'drinks' && activeTab !== 'plans') return null;
    
    return (
      <Card style={styles.addCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Add New Item</Text>
          <TextInput
            label="JSON Data"
            value={jsonInput}
            onChangeText={setJsonInput}
            multiline
            numberOfLines={10}
            style={styles.jsonInput}
            placeholder={activeTab === 'drinks' 
              ? '{"category": "Beer", "type": "Lager", "brand": "Example Beer", "alcoholContent": 5, "quantity": 1, "price": 5.99, "timestamp": "2023-04-15T12:00:00Z"}'
              : '{"title": "Friday Night", "date": "2023-04-15", "location": "Local Bar", "maxDrinks": 5, "maxSpending": 50, "notes": "Pre-game plan"}'
            }
          />
          <Button 
            mode="contained" 
            onPress={handleAddItem}
            style={styles.addButton}
          >
            Add Item
          </Button>
        </Card.Content>
      </Card>
    );
  };

  const renderPerformanceMetrics = () => {
    return (
      <Card style={styles.metricsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          <DataTable>
            <DataTable.Row>
              <DataTable.Cell>Drinks Count</DataTable.Cell>
              <DataTable.Cell numeric>{performanceMetrics.drinksCount}</DataTable.Cell>
            </DataTable.Row>
            <DataTable.Row>
              <DataTable.Cell>Plans Count</DataTable.Cell>
              <DataTable.Cell numeric>{performanceMetrics.plansCount}</DataTable.Cell>
            </DataTable.Row>
            <DataTable.Row>
              <DataTable.Cell>Storage Size</DataTable.Cell>
              <DataTable.Cell numeric>{(performanceMetrics.totalStorageSize / 1024).toFixed(2)} KB</DataTable.Cell>
            </DataTable.Row>
            <DataTable.Row>
              <DataTable.Cell>Last Sync</DataTable.Cell>
              <DataTable.Cell numeric>{format(parseISO(performanceMetrics.lastSyncTime), 'HH:mm:ss')}</DataTable.Cell>
            </DataTable.Row>
          </DataTable>
        </Card.Content>
      </Card>
    );
  };

  const renderDataManagement = () => {
    return (
      <Card style={styles.managementCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <Button 
            mode="outlined" 
            onPress={() => setShowExportDialog(true)}
            style={styles.managementButton}
            icon="export"
          >
            Export Data
          </Button>
          <Button 
            mode="outlined" 
            onPress={() => setShowImportDialog(true)}
            style={styles.managementButton}
            icon="import"
          >
            Import Data
          </Button>
          <Button 
            mode="outlined" 
            onPress={() => setShowResetDialog(true)}
            style={[styles.managementButton, styles.resetButton]}
            icon="delete"
            textColor={colors.error}
          >
            Reset All Data
          </Button>
        </Card.Content>
      </Card>
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
      
      <SegmentedButtons
        value={activeTab}
        onValueChange={setActiveTab}
        buttons={[
          { value: 'drinks', label: 'Drinks' },
          { value: 'plans', label: 'Plans' },
          { value: 'settings', label: 'Settings' },
          { value: 'budget', label: 'Budget' },
          { value: 'profile', label: 'Profile' },
        ]}
        style={styles.segmentedButtons}
      />
      
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {renderPerformanceMetrics()}
        {renderDataManagement()}
        {renderItemList()}
        {renderItemDetails()}
        {renderAddItem()}
      </ScrollView>
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>

      <Portal>
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>Delete Item</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to delete this item? This action cannot be undone.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button onPress={handleDeleteItem} textColor={colors.error}>Delete</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showResetDialog} onDismiss={() => setShowResetDialog(false)}>
          <Dialog.Title>Reset All Data</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to reset all data? This will delete all drinks, plans, settings, and user data. This action cannot be undone.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowResetDialog(false)}>Cancel</Button>
            <Button onPress={handleResetData} textColor={colors.error}>Reset</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showExportDialog} onDismiss={() => setShowExportDialog(false)}>
          <Dialog.Title>Export Data</Dialog.Title>
          <Dialog.Content>
            <Text>Click the button below to export all data. The data will be logged to the console.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowExportDialog(false)}>Cancel</Button>
            <Button onPress={handleExportData}>Export</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showImportDialog} onDismiss={() => setShowImportDialog(false)}>
          <Dialog.Title>Import Data</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Paste JSON data here"
              value={importData}
              onChangeText={setImportData}
              multiline
              numberOfLines={10}
              style={styles.importInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowImportDialog(false)}>Cancel</Button>
            <Button onPress={handleImportData}>Import</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  segmentedButtons: {
    margin: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  listCard: {
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 2,
  },
  detailsCard: {
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 2,
  },
  addCard: {
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 2,
  },
  metricsCard: {
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 2,
  },
  managementCard: {
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  listItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  emptyMessage: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
    marginBottom: 12,
  },
  jsonInput: {
    backgroundColor: colors.background,
    marginBottom: 16,
  },
  importInput: {
    backgroundColor: colors.background,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  addButton: {
    marginTop: 8,
  },
  managementButton: {
    marginBottom: 8,
  },
  resetButton: {
    borderColor: colors.error,
  },
  snackbar: {
    backgroundColor: colors.primary,
  },
}); 