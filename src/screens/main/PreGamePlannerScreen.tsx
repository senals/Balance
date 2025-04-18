import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList, Alert } from 'react-native';
import { Text, Button, Card, IconButton, TextInput, FAB, Portal, Dialog, Snackbar, SegmentedButtons } from 'react-native-paper';
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
  
  // New state for adherence tracking
  const [trackingMode, setTrackingMode] = useState<'plan' | 'track'>('plan');
  const [actualDrinks, setActualDrinks] = useState('');
  const [actualSpending, setActualSpending] = useState('');
  const [adherenceNotes, setAdherenceNotes] = useState('');
  const [adherenceStatus, setAdherenceStatus] = useState<'pending' | 'success' | 'exceeded'>('pending');

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
    setActualDrinks('');
    setActualSpending('');
    setAdherenceNotes('');
    setAdherenceStatus('pending');
  };

  const openAddDialog = () => {
    setTrackingMode('plan');
    setEditMode(false);
    setDialogVisible(true);
  };

  const openEditDialog = (plan: PreGamePlan) => {
    setCurrentPlan(plan);
    setTitle(plan.title);
    setDate(format(new Date(plan.date), 'dd-MM-yyyy'));
    setLocation(plan.location);
    setMaxDrinks(plan.maxDrinks.toString());
    setMaxSpending(plan.maxSpending.toString());
    setNotes(plan.notes || '');
    setEditMode(true);
    setTrackingMode('plan');
    setDialogVisible(true);
  };

  const openTrackDialog = (plan: PreGamePlan) => {
    setCurrentPlan(plan);
    setTitle(plan.title);
    setDate(format(new Date(plan.date), 'dd-MM-yyyy'));
    setLocation(plan.location);
    setMaxDrinks(plan.maxDrinks.toString());
    setMaxSpending(plan.maxSpending.toString());
    setActualDrinks(plan.actualDrinks?.toString() || '');
    setActualSpending(plan.actualSpending?.toString() || '');
    setAdherenceNotes(plan.adherenceNotes || '');
    setAdherenceStatus(plan.adherenceStatus || 'pending');
    setEditMode(true);
    setTrackingMode('track');
    setDialogVisible(true);
  };

  const handleSave = async () => {
    if (trackingMode === 'plan') {
      if (!title || !date || !location || !maxDrinks || !maxSpending) {
        setSnackbarMessage('Please fill in all required fields');
        setSnackbarVisible(true);
        return;
      }

      try {
        // Convert date from DD-MM-YYYY to YYYY-MM-DD for storage
        const parsedDate = parse(date, 'dd-MM-yyyy', new Date());
        const formattedDate = format(parsedDate, 'yyyy-MM-dd');

        const planData = {
          title,
          date: formattedDate,
          location,
          maxDrinks: parseInt(maxDrinks),
          maxSpending: parseFloat(maxSpending),
          notes: notes || undefined,
          completed: currentPlan?.completed || false,
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
    } else {
      // Tracking mode
      if (!actualDrinks || !actualSpending) {
        setSnackbarMessage('Please fill in actual drinks and spending');
        setSnackbarVisible(true);
        return;
      }

      try {
        const actualDrinksNum = parseInt(actualDrinks);
        const actualSpendingNum = parseFloat(actualSpending);
        const maxDrinksNum = parseInt(maxDrinks);
        const maxSpendingNum = parseFloat(maxSpending);

        // Determine adherence status
        let status: 'pending' | 'success' | 'exceeded' = 'pending';
        if (actualDrinksNum > maxDrinksNum || actualSpendingNum > maxSpendingNum) {
          status = 'exceeded';
        } else {
          status = 'success';
        }

        const planData = {
          actualDrinks: actualDrinksNum,
          actualSpending: actualSpendingNum,
          adherenceStatus: status,
          adherenceNotes: adherenceNotes || undefined,
          completed: true,
        };

        if (currentPlan) {
          await updatePreGamePlan(currentPlan.id, planData);
          setSnackbarMessage('Pre-game plan tracking updated successfully');
          setDialogVisible(false);
          setSnackbarVisible(true);
        }
      } catch (error) {
        setSnackbarMessage('Failed to update pre-game plan tracking');
        setSnackbarVisible(true);
      }
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
      await updatePreGamePlan(plan.id, { completed: !plan.completed });
    } catch (error) {
      setSnackbarMessage('Failed to update pre-game plan');
      setSnackbarVisible(true);
    }
  };

  const getAdherenceStatusColor = (status?: string) => {
    switch (status) {
      case 'success':
        return colors.primary || '#4CAF50';
      case 'exceeded':
        return colors.error || '#F44336';
      default:
        return colors.text;
    }
  };

  const getAdherenceStatusText = (status?: string) => {
    switch (status) {
      case 'success':
        return 'Stuck to Plan';
      case 'exceeded':
        return 'Exceeded Limits';
      default:
        return 'Pending';
    }
  };

  const renderPlanItem = ({ item }: { item: PreGamePlan }) => (
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
        <Text style={styles.planDate}>Date: {format(new Date(item.date), 'dd MMM yyyy')}</Text>
        <Text style={styles.planLocation}>Location: {item.location}</Text>
        <View style={styles.planLimits}>
          <Text style={styles.planLimit}>Drinks: {item.maxDrinks}</Text>
          <Text style={styles.planLimit}>Spending: £{item.maxSpending.toFixed(2)}</Text>
        </View>
        {item.notes && <Text style={styles.planNotes}>Notes: {item.notes}</Text>}
        
        {item.completed && (
          <View style={styles.adherenceContainer}>
            <View style={styles.adherenceHeader}>
              <Text style={styles.adherenceTitle}>Actual Results:</Text>
              <Text 
                style={[
                  styles.adherenceStatus, 
                  { color: getAdherenceStatusColor(item.adherenceStatus) }
                ]}
              >
                {getAdherenceStatusText(item.adherenceStatus)}
              </Text>
            </View>
            <View style={styles.actualResults}>
              <Text style={styles.actualResult}>Drinks: {item.actualDrinks || 0} of {item.maxDrinks}</Text>
              <Text style={styles.actualResult}>Spending: £{(item.actualSpending || 0).toFixed(2)} of £{item.maxSpending.toFixed(2)}</Text>
            </View>
            {item.adherenceNotes && (
              <Text style={styles.adherenceNotes}>Notes: {item.adherenceNotes}</Text>
            )}
          </View>
        )}
        
        {!item.completed && new Date(item.date) <= new Date() && (
          <Button 
            mode="contained" 
            onPress={() => openTrackDialog(item)}
            style={styles.trackButton}
          >
            Track Results
          </Button>
        )}
      </Card.Content>
    </Card>
  );

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
          <Dialog.Title>
            {trackingMode === 'plan' 
              ? (editMode ? 'Edit Pre-Game Plan' : 'Create Pre-Game Plan')
              : 'Track Pre-Game Results'
            }
            <IconButton
              icon="close"
              size={20}
              onPress={() => setDialogVisible(false)}
              style={styles.dialogCloseButton}
            />
          </Dialog.Title>
          <Dialog.Content>
            {trackingMode === 'plan' ? (
              <>
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
              </>
            ) : (
              <>
                <Text style={styles.trackingTitle}>{title}</Text>
                <Text style={styles.trackingDate}>Date: {date}</Text>
                <Text style={styles.trackingLocation}>Location: {location}</Text>
                <View style={styles.trackingLimits}>
                  <Text style={styles.trackingLimit}>Max Drinks: {maxDrinks}</Text>
                  <Text style={styles.trackingLimit}>Max Spending: £{parseFloat(maxSpending).toFixed(2)}</Text>
                </View>
                
                <Text style={styles.trackingSectionTitle}>Actual Results</Text>
                <TextInput
                  label="Actual Drinks"
                  value={actualDrinks}
                  onChangeText={setActualDrinks}
                  keyboardType="numeric"
                  style={styles.input}
                  mode="outlined"
                />
                <TextInput
                  label="Actual Spending (£)"
                  value={actualSpending}
                  onChangeText={setActualSpending}
                  keyboardType="numeric"
                  style={styles.input}
                  mode="outlined"
                />
                
                <Text style={styles.trackingSectionTitle}>Adherence Status</Text>
                <SegmentedButtons
                  value={adherenceStatus}
                  onValueChange={(value) => setAdherenceStatus(value as 'pending' | 'success' | 'exceeded')}
                  buttons={[
                    { value: 'pending', label: 'Pending' },
                    { value: 'success', label: 'Success' },
                    { value: 'exceeded', label: 'Exceeded' },
                  ]}
                  style={styles.segmentedButtons}
                />
                
                <TextInput
                  label="Notes (optional)"
                  value={adherenceNotes}
                  onChangeText={setAdherenceNotes}
                  style={styles.input}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                />
              </>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            {trackingMode === 'plan' && editMode && (
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
  adherenceContainer: {
    marginTop: 8,
  },
  adherenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  adherenceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  adherenceStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  actualResults: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  actualResult: {
    fontSize: 14,
    color: colors.text,
  },
  adherenceNotes: {
    fontSize: 14,
    color: colors.text,
    fontStyle: 'italic',
  },
  trackButton: {
    marginTop: 8,
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
  trackingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  trackingDate: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  trackingLocation: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  trackingLimits: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  trackingLimit: {
    fontSize: 14,
    color: colors.text,
  },
  trackingSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  dialogCloseButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1,
  },
}); 