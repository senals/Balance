import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList, Alert } from 'react-native';
import { Text, Button, Card, IconButton, TextInput, FAB, Portal, Dialog, Snackbar, Divider } from 'react-native-paper';
import { colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { PreGamePlan } from '../../services/storage';
import { format, parse } from 'date-fns';

export const PreGamePlannerScreen = ({ navigation }: { navigation: any }) => {
  const { preGamePlans, addPreGamePlan, updatePreGamePlan, removePreGamePlan, drinks } = useApp();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PreGamePlan | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [maxDrinks, setMaxDrinks] = useState('');
  const [maxSpending, setMaxSpending] = useState('');
  const [notes, setNotes] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showTrackingInfo, setShowTrackingInfo] = useState<string | null>(null);

  // Reset form when dialog is closed
  useEffect(() => {
    if (!dialogVisible) {
      resetForm();
    }
  }, [dialogVisible]);

  const resetForm = () => {
    setTitle('');
    setDate('');
    setLocation('');
    setMaxDrinks('');
    setMaxSpending('');
    setNotes('');
    setCurrentPlan(null);
    setEditMode(false);
  };

  const openAddDialog = () => {
    setEditMode(false);
    setDialogVisible(true);
  };

  const openEditDialog = (plan: PreGamePlan) => {
    setCurrentPlan(plan);
    setTitle(plan.title);
    setDate(plan.date);
    setLocation(plan.location);
    setMaxDrinks(plan.maxDrinks.toString());
    setMaxSpending(plan.maxSpending.toString());
    setNotes(plan.notes || '');
    setEditMode(true);
    setDialogVisible(true);
  };

  const handleSave = async () => {
    if (!title || !date || !location || !maxDrinks || !maxSpending) {
      setSnackbarMessage('Please fill in all required fields');
      setSnackbarVisible(true);
      return;
    }

    try {
      // Validate date format (DD-MM-YYYY)
      const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
      if (!dateRegex.test(date)) {
        setSnackbarMessage('Date must be in DD-MM-YYYY format');
        setSnackbarVisible(true);
        return;
      }

      // Convert date to ISO format for storage
      const [day, month, year] = date.split('-');
      const isoDate = `${year}-${month}-${day}`;

      const planData = {
        title,
        date: isoDate,
        location,
        maxDrinks: parseInt(maxDrinks),
        maxSpending: parseFloat(maxSpending),
        notes: notes || undefined,
        completed: currentPlan?.completed || false,
        actualDrinks: currentPlan?.actualDrinks || 0,
        actualSpending: currentPlan?.actualSpending || 0,
        adherencePercentage: currentPlan?.adherencePercentage || 0,
        drinksAdherencePercentage: currentPlan?.drinksAdherencePercentage || 0,
        spendingAdherencePercentage: currentPlan?.spendingAdherencePercentage || 0,
        trackedDrinks: currentPlan?.trackedDrinks || [],
      };

      if (editMode && currentPlan) {
        await updatePreGamePlan(currentPlan.id, planData);
        setSnackbarMessage('Pre-game plan updated successfully');
      } else {
        await addPreGamePlan(planData);
        setSnackbarMessage('Pre-game plan created successfully');
      }

      setDialogVisible(false);
      setSnackbarVisible(true);
    } catch (error) {
      setSnackbarMessage('Failed to save pre-game plan');
      setSnackbarVisible(true);
    }
  };

  const handleDelete = async () => {
    if (!currentPlan) return;

    Alert.alert(
      'Delete Pre-Game Plan',
      'Are you sure you want to delete this pre-game plan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await removePreGamePlan(currentPlan.id);
              setDialogVisible(false);
              setSnackbarMessage('Pre-game plan deleted successfully');
              setSnackbarVisible(true);
            } catch (error) {
              setSnackbarMessage('Failed to delete pre-game plan');
              setSnackbarVisible(true);
            }
          },
        },
      ]
    );
  };

  const handleToggleComplete = async (plan: PreGamePlan) => {
    try {
      // If marking as completed, calculate adherence
      if (!plan.completed) {
        const updatedPlan = await calculateAdherence(plan);
        await updatePreGamePlan(plan.id, { completed: true, ...updatedPlan });
      } else {
        await updatePreGamePlan(plan.id, { completed: false });
      }
    } catch (error) {
      setSnackbarMessage('Failed to update pre-game plan');
      setSnackbarVisible(true);
    }
  };

  const calculateAdherence = async (plan: PreGamePlan) => {
    // Get drinks from the day of the plan
    const planDate = new Date(plan.date);
    const planDateStr = planDate.toISOString().split('T')[0];
    
    const planDrinks = drinks.filter(drink => 
      drink.timestamp.startsWith(planDateStr)
    );
    
    // Calculate actual drinks and spending
    const actualDrinks = planDrinks.reduce((sum, drink) => sum + drink.quantity, 0);
    const actualSpending = planDrinks.reduce((sum, drink) => sum + (drink.price || 0), 0);
    
    // Calculate adherence percentages
    const drinksAdherencePercentage = Math.min(100, (plan.maxDrinks / actualDrinks) * 100);
    const spendingAdherencePercentage = Math.min(100, (plan.maxSpending / actualSpending) * 100);
    
    // Overall adherence is the average of both percentages
    const adherencePercentage = (drinksAdherencePercentage + spendingAdherencePercentage) / 2;
    
    // Get drink IDs for tracking
    const trackedDrinks = planDrinks.map(drink => drink.id);
    
    return {
      actualDrinks,
      actualSpending,
      adherencePercentage,
      drinksAdherencePercentage,
      spendingAdherencePercentage,
      trackedDrinks,
    };
  };

  const toggleTrackingInfo = (planId: string) => {
    if (showTrackingInfo === planId) {
      setShowTrackingInfo(null);
    } else {
      setShowTrackingInfo(planId);
    }
  };

  const formatDate = (isoDate: string) => {
    try {
      const date = new Date(isoDate);
      return format(date, 'dd-MM-yyyy');
    } catch (error) {
      return isoDate;
    }
  };

  const renderPlanItem = ({ item }: { item: PreGamePlan }) => {
    const isTrackingVisible = showTrackingInfo === item.id;
    
    return (
      <Card style={styles.planCard} onPress={() => openEditDialog(item)}>
        <Card.Content>
          <View style={styles.planHeader}>
            <Text style={styles.planTitle}>{item.title}</Text>
            <IconButton
              icon={item.completed ? 'check-circle' : 'circle-outline'}
              size={24}
              onPress={() => handleToggleComplete(item)}
              iconColor={item.completed ? colors.primary : colors.text}
            />
          </View>
          <Text style={styles.planDate}>Date: {formatDate(item.date)}</Text>
          <Text style={styles.planLocation}>Location: {item.location}</Text>
          <View style={styles.planLimits}>
            <Text style={styles.planLimit}>Max Drinks: {item.maxDrinks}</Text>
            <Text style={styles.planLimit}>Max Spending: £{item.maxSpending.toFixed(2)}</Text>
          </View>
          {item.notes && <Text style={styles.planNotes}>Notes: {item.notes}</Text>}
          
          {item.completed && (
            <View style={styles.trackingContainer}>
              <Button 
                mode="text" 
                onPress={() => toggleTrackingInfo(item.id)}
                style={styles.trackingButton}
              >
                {isTrackingVisible ? 'Hide Tracking' : 'Show Tracking'}
              </Button>
              
              {isTrackingVisible && (
                <View style={styles.trackingInfo}>
                  <Divider style={styles.divider} />
                  <Text style={styles.trackingTitle}>Tracking Results</Text>
                  <View style={styles.trackingRow}>
                    <Text style={styles.trackingLabel}>Actual Drinks:</Text>
                    <Text style={[
                      styles.trackingValue,
                      item.actualDrinks && item.actualDrinks > item.maxDrinks ? styles.overLimit : null
                    ]}>
                      {item.actualDrinks || 0} / {item.maxDrinks}
                    </Text>
                  </View>
                  <View style={styles.trackingRow}>
                    <Text style={styles.trackingLabel}>Actual Spending:</Text>
                    <Text style={[
                      styles.trackingValue,
                      item.actualSpending && item.actualSpending > item.maxSpending ? styles.overLimit : null
                    ]}>
                      £{(item.actualSpending || 0).toFixed(2)} / £{item.maxSpending.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.trackingRow}>
                    <Text style={styles.trackingLabel}>Drinks Adherence:</Text>
                    <Text style={[
                      styles.trackingValue,
                      item.drinksAdherencePercentage && item.drinksAdherencePercentage < 100 ? styles.overLimit : null
                    ]}>
                      {item.drinksAdherencePercentage ? item.drinksAdherencePercentage.toFixed(1) : 0}%
                    </Text>
                  </View>
                  <View style={styles.trackingRow}>
                    <Text style={styles.trackingLabel}>Spending Adherence:</Text>
                    <Text style={[
                      styles.trackingValue,
                      item.spendingAdherencePercentage && item.spendingAdherencePercentage < 100 ? styles.overLimit : null
                    ]}>
                      {item.spendingAdherencePercentage ? item.spendingAdherencePercentage.toFixed(1) : 0}%
                    </Text>
                  </View>
                  <View style={styles.trackingRow}>
                    <Text style={styles.trackingLabel}>Overall Adherence:</Text>
                    <Text style={[
                      styles.trackingValue,
                      item.adherencePercentage && item.adherencePercentage < 100 ? styles.overLimit : null
                    ]}>
                      {item.adherencePercentage ? item.adherencePercentage.toFixed(1) : 0}%
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}
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
        <Text style={styles.title}>Pre-Game Planner</Text>
      </View>

      <FlatList
        data={preGamePlans.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
        renderItem={renderPlanItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No pre-game plans yet</Text>
            <Text style={styles.emptySubtext}>Create a plan to set your limits before social events</Text>
          </View>
        }
      />

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>{editMode ? 'Edit Pre-Game Plan' : 'Create Pre-Game Plan'}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Title"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
              mode="outlined"
            />
            <TextInput
              label="Date (DD-MM-YYYY)"
              value={date}
              onChangeText={setDate}
              style={styles.input}
              mode="outlined"
              placeholder="15-04-2023"
            />
            <TextInput
              label="Location"
              value={location}
              onChangeText={setLocation}
              style={styles.input}
              mode="outlined"
            />
            <TextInput
              label="Maximum Drinks"
              value={maxDrinks}
              onChangeText={setMaxDrinks}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
            />
            <TextInput
              label="Maximum Spending (£)"
              value={maxSpending}
              onChangeText={setMaxSpending}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
            />
            <TextInput
              label="Notes (optional)"
              value={notes}
              onChangeText={setNotes}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
            />
          </Dialog.Content>
          <Dialog.Actions>
            {editMode && (
              <Button onPress={handleDelete} textColor={colors.error}>
                Delete
              </Button>
            )}
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleSave}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={openAddDialog}
        color={colors.surface}
      />

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
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  planCard: {
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 2,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  planDate: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  planLocation: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  planLimits: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  planLimit: {
    fontSize: 14,
    color: colors.text,
  },
  planNotes: {
    fontSize: 14,
    color: colors.text,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
  input: {
    marginBottom: 16,
    backgroundColor: colors.surface,
  },
  snackbar: {
    backgroundColor: colors.primary,
  },
  trackingContainer: {
    marginTop: 8,
  },
  trackingButton: {
    alignSelf: 'flex-start',
  },
  trackingInfo: {
    marginTop: 8,
  },
  divider: {
    marginVertical: 8,
  },
  trackingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  trackingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  trackingLabel: {
    fontSize: 14,
    color: colors.text,
  },
  trackingValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  overLimit: {
    color: colors.error,
  },
}); 