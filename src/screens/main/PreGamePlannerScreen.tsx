import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList, Alert, Dimensions } from 'react-native';
import { Text, Button, Card, IconButton, TextInput, FAB, Portal, Dialog, Snackbar, SegmentedButtons, HelperText, Surface, Chip } from 'react-native-paper';
import { colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { PreGamePlan } from '../../services/storage';
import { format, parse } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // New state for adherence tracking
  const [trackingMode, setTrackingMode] = useState<'plan' | 'track'>('plan');
  const [actualDrinks, setActualDrinks] = useState('');
  const [actualSpending, setActualSpending] = useState('');
  const [adherenceNotes, setAdherenceNotes] = useState('');
  const [adherenceStatus, setAdherenceStatus] = useState<'pending' | 'success' | 'exceeded'>('pending');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Quick templates for common scenarios
  const quickTemplates = [
    {
      id: 'casual',
      title: 'Casual Night Out',
      maxDrinks: '4',
      maxSpending: '50',
      description: 'A relaxed evening with friends'
    },
    {
      id: 'party',
      title: 'Party Night',
      maxDrinks: '6',
      maxSpending: '80',
      description: 'Big night out with friends'
    },
    {
      id: 'dinner',
      title: 'Dinner & Drinks',
      maxDrinks: '3',
      maxSpending: '70',
      description: 'Nice dinner with a few drinks'
    }
  ];

  // Preset spending amounts
  const presetSpending = ['20', '30', '50', '80', '100'];

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
    setSelectedTemplate(null);
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

  // Apply template
  const applyTemplate = (template: typeof quickTemplates[0]) => {
    setTitle(template.title);
    setMaxDrinks(template.maxDrinks);
    setMaxSpending(template.maxSpending);
    setNotes(template.description);
    setSelectedTemplate(template.id);
  };

  const renderPlanItem = ({ item }: { item: PreGamePlan }) => (
    <Card style={styles.planCard} onPress={() => openEditDialog(item)}>
      <Card.Content>
        <View style={styles.planHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.planTitle}>{item.title}</Text>
            <Text style={styles.planDate}>{format(new Date(item.date), 'dd MMM yyyy')}</Text>
          </View>
          <IconButton
            icon={item.completed ? 'check-circle' : 'circle-outline'}
            size={24}
            onPress={() => handleToggleComplete(item)}
            iconColor={item.completed ? colors.primary : colors.text}
          />
        </View>
        
        <View style={styles.locationContainer}>
          <MaterialCommunityIcons name="map-marker" size={16} color={colors.primary} />
          <Text style={styles.planLocation}>{item.location}</Text>
        </View>

        <View style={styles.limitsContainer}>
          <View style={styles.limitItem}>
            <MaterialCommunityIcons name="glass-wine" size={20} color={colors.primary} />
            <Text style={styles.planLimit}>Max {item.maxDrinks} drinks</Text>
          </View>
          <View style={styles.limitItem}>
            <MaterialCommunityIcons name="currency-gbp" size={20} color={colors.primary} />
            <Text style={styles.planLimit}>£{item.maxSpending.toFixed(2)}</Text>
          </View>
        </View>

        {item.notes && (
          <View style={styles.notesContainer}>
            <MaterialCommunityIcons name="note-text" size={16} color={colors.primary} />
            <Text style={styles.planNotes}>{item.notes}</Text>
          </View>
        )}
        
        {item.completed && (
          <Surface style={styles.adherenceContainer}>
            <View style={styles.adherenceHeader}>
              <Text style={styles.adherenceTitle}>Results</Text>
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
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Drinks</Text>
                <Text style={styles.resultValue}>{item.actualDrinks || 0}/{item.maxDrinks}</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Spent</Text>
                <Text style={styles.resultValue}>£{(item.actualSpending || 0).toFixed(2)}/£{item.maxSpending.toFixed(2)}</Text>
              </View>
            </View>
            {item.adherenceNotes && (
              <Text style={styles.adherenceNotes}>{item.adherenceNotes}</Text>
            )}
          </Surface>
        )}
        
        {!item.completed && new Date(item.date) <= new Date() && (
          <Button 
            mode="contained" 
            onPress={() => openTrackDialog(item)}
            style={styles.trackButton}
            icon="chart-line"
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
          iconColor={colors.primary}
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
            <MaterialCommunityIcons name="calendar-plus" size={64} color={colors.primary} />
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
              <ScrollView>
                {!editMode && (
                  <View style={styles.templatesContainer}>
                    <Text style={styles.sectionTitle}>Quick Templates</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templatesScroll}>
                      {quickTemplates.map((template) => (
                        <Card
                          key={template.id}
                          style={[
                            styles.templateCard,
                            selectedTemplate === template.id && styles.selectedTemplate
                          ]}
                          onPress={() => applyTemplate(template)}
                        >
                          <Card.Content>
                            <Text style={styles.templateTitle}>{template.title}</Text>
                            <Text style={styles.templateDescription}>{template.description}</Text>
                            <View style={styles.templateDetails}>
                              <Text style={styles.templateDetail}>🍺 {template.maxDrinks} drinks</Text>
                              <Text style={styles.templateDetail}>£{template.maxSpending}</Text>
                            </View>
                          </Card.Content>
                        </Card>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <TextInput
                  label="Title"
                  value={title}
                  onChangeText={(text) => {
                    setTitle(text);
                    setSelectedTemplate(null);
                  }}
                  style={styles.input}
                  mode="outlined"
                  placeholder="e.g., Friday Night Out"
                  left={<TextInput.Icon icon="format-title" />}
                />

                <View style={styles.dateContainer}>
                  <TextInput
                    label="Date"
                    value={date}
                    onPressIn={() => setShowDatePicker(true)}
                    style={[styles.input, styles.dateInput]}
                    mode="outlined"
                    left={<TextInput.Icon icon="calendar" />}
                    right={<TextInput.Icon icon="calendar" onPress={() => setShowDatePicker(true)} />}
                  />
                  {!date && (
                    <Button
                      mode="outlined"
                      onPress={() => {
                        const today = new Date();
                        setDate(format(today, 'dd-MM-yyyy'));
                      }}
                      style={styles.todayButton}
                    >
                      Today
                    </Button>
                  )}
                </View>

                {showDatePicker && (
                  <DateTimePicker
                    value={date ? parse(date, 'dd-MM-yyyy', new Date()) : new Date()}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setDate(format(selectedDate, 'dd-MM-yyyy'));
                      }
                    }}
                  />
                )}

                <TextInput
                  label="Location"
                  value={location}
                  onChangeText={setLocation}
                  style={styles.input}
                  mode="outlined"
                  placeholder="e.g., The Local Pub"
                  left={<TextInput.Icon icon="map-marker" />}
                />

                <View style={styles.limitsContainer}>
                  <Text style={styles.sectionTitle}>Drink Limit</Text>
                  <View style={styles.drinkButtons}>
                    {['2', '4', '6', '8'].map((num) => (
                      <Chip
                        key={num}
                        selected={maxDrinks === num}
                        onPress={() => setMaxDrinks(num)}
                        style={styles.drinkChip}
                      >
                        {num} drinks
                      </Chip>
                    ))}
                  </View>
                  <TextInput
                    label="Custom Drinks"
                    value={maxDrinks}
                    onChangeText={(text) => {
                      setMaxDrinks(text);
                      setSelectedTemplate(null);
                    }}
                    keyboardType="numeric"
                    style={styles.input}
                    mode="outlined"
                    left={<TextInput.Icon icon="glass-wine" />}
                  />
                </View>

                <View style={styles.limitsContainer}>
                  <Text style={styles.sectionTitle}>Spending Limit</Text>
                  <View style={styles.spendingButtons}>
                    {presetSpending.map((amount) => (
                      <Chip
                        key={amount}
                        selected={maxSpending === amount}
                        onPress={() => setMaxSpending(amount)}
                        style={styles.spendingChip}
                      >
                        £{amount}
                      </Chip>
                    ))}
                  </View>
                  <TextInput
                    label="Custom Amount (£)"
                    value={maxSpending}
                    onChangeText={(text) => {
                      setMaxSpending(text);
                      setSelectedTemplate(null);
                    }}
                    keyboardType="numeric"
                    style={styles.input}
                    mode="outlined"
                    left={<TextInput.Icon icon="currency-gbp" />}
                  />
                </View>

                <TextInput
                  label="Notes (optional)"
                  value={notes}
                  onChangeText={setNotes}
                  style={styles.input}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  left={<TextInput.Icon icon="note-text" />}
                />
              </ScrollView>
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
              <Button onPress={handleDelete} textColor={colors.error} icon="delete">
                Delete
              </Button>
            )}
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleSave} mode="contained">Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={openAddDialog}
        color={colors.surface}
        label="New Plan"
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff7e9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 40,
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
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  planCard: {
    marginBottom: 16,
    backgroundColor: '#fff0d4',
    borderRadius: 12,
    elevation: 2,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  planDate: {
    fontSize: 14,
    color: colors.text + '80',
    marginTop: 2,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  planLocation: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 4,
  },
  limitsContainer: {
    marginBottom: 16,
  },
  limitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planLimit: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 8,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  planNotes: {
    fontSize: 14,
    color: colors.text,
    fontStyle: 'italic',
    marginLeft: 4,
    flex: 1,
  },
  adherenceContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    elevation: 1,
    backgroundColor: colors.surface,
  },
  adherenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  adherenceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  adherenceStatus: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  actualResults: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultItem: {
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 14,
    color: colors.text + '80',
  },
  resultValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  adherenceNotes: {
    fontSize: 14,
    color: colors.text,
    fontStyle: 'italic',
    marginTop: 8,
  },
  trackButton: {
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: colors.text + '80',
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
    marginBottom: 8,
    backgroundColor: colors.surface,
  },
  snackbar: {
    backgroundColor: colors.primary,
  },
  dialogCloseButton: {
    margin: 0,
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
  templatesContainer: {
    marginBottom: 16,
  },
  templatesScroll: {
    marginTop: 8,
  },
  templateCard: {
    width: 200,
    marginRight: 12,
    backgroundColor: colors.surface,
  },
  selectedTemplate: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  templateDescription: {
    fontSize: 12,
    color: colors.text + '80',
    marginTop: 4,
  },
  templateDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  templateDetail: {
    fontSize: 12,
    color: colors.primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateInput: {
    flex: 1,
  },
  todayButton: {
    marginLeft: 8,
  },
  drinkButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  drinkChip: {
    margin: 4,
  },
  spendingButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  spendingChip: {
    margin: 4,
  },
}); 