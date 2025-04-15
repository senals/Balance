import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, BackHandler, Alert } from 'react-native';
import { Text, TextInput, Button, Card, IconButton, SegmentedButtons, Snackbar, Divider, Appbar } from 'react-native-paper';
import { colors } from '../../theme/colors';
import { DrinkHierarchySelector } from '../../components/DrinkHierarchySelector';
import { useApp } from '../../context/AppContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Input } from '../../components/ui/Input';
import { useNavigation } from '@react-navigation/native';

// Common drink presets for quick selection
const DRINK_PRESETS = [
  { category: 'beer', type: 'lager', brand: 'Heineken', alcoholContent: 5 },
  { category: 'wine', type: 'red', brand: 'Cabernet Sauvignon', alcoholContent: 12 },
  { category: 'spirit', type: 'vodka', brand: 'Smirnoff', alcoholContent: 40 },
  { category: 'cocktail', type: 'classic', brand: 'Mojito', alcoholContent: 15 },
];

// Common locations for quick selection
const LOCATION_PRESETS = [
  'Home',
  'Bar',
  'Restaurant',
  'Club',
  'Friend\'s House',
  'Pub',
  'Party',
];

interface DrinkInputScreenProps {
  selectedDrink: {
    category: string;
    type: string;
    brand: string;
    alcoholContent: number;
  } | null;
  quantity: string;
  price: string;
  location: string;
  notes: string;
  snackbarVisible: boolean;
  snackbarMessage: string;
  onQuantityChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onSnackbarDismiss: () => void;
  onSaveDrink: () => void;
  onDrinkSelect: (drinkData: {
    category: string;
    type: string;
    brand: string;
    alcoholContent: number;
  }) => void;
  onLocationSelect: (location: string) => void;
  onResetForm: () => void;
}

export const DrinkInputScreen: React.FC<DrinkInputScreenProps> = ({
  selectedDrink,
  quantity,
  price,
  location,
  notes,
  snackbarVisible,
  snackbarMessage,
  onQuantityChange,
  onPriceChange,
  onLocationChange,
  onNotesChange,
  onSnackbarDismiss,
  onSaveDrink,
  onDrinkSelect,
  onLocationSelect,
  onResetForm,
}) => {
  const [showDrinkSelector, setShowDrinkSelector] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const navigation = useNavigation();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Track changes to detect unsaved data
  React.useEffect(() => {
    if (selectedDrink || quantity || price || location || notes) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [selectedDrink, quantity, price, location, notes]);

  const handleBackNavigation = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => {} },
          { 
            text: 'Go Back', 
            style: 'destructive',
            onPress: () => {
              onResetForm();
              navigation.goBack();
            }
          },
        ]
      );
      return true;
    }
    navigation.goBack();
    return true;
  };

  // Handle hardware back button press
  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackNavigation);
    return () => backHandler.remove();
  }, [hasUnsavedChanges, navigation, onResetForm]);

  const handlePresetSelect = (preset: typeof DRINK_PRESETS[0]) => {
    onDrinkSelect(preset);
    setShowDrinkSelector(false);
  };

  const handleSaveAndGoBack = () => {
    onSaveDrink();
    setHasUnsavedChanges(false);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={handleBackNavigation} />
        <Appbar.Content title="Add Drink" />
      </Appbar.Header>
      
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Content>
            {/* Drink Selection */}
            <View style={styles.section}>
              <Text style={styles.label}>Drink</Text>
              {selectedDrink ? (
                <TouchableOpacity
                  style={styles.selectedItem}
                  onPress={() => setShowDrinkSelector(true)}
                >
                  <Text style={styles.selectedItemText}>
                    {selectedDrink.brand} ({selectedDrink.type})
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={24} color={colors.primary} />
                </TouchableOpacity>
              ) : (
                <View style={styles.presetsContainer}>
                  {DRINK_PRESETS.map((preset, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.presetButton}
                      onPress={() => handlePresetSelect(preset)}
                    >
                      <Text style={styles.presetButtonText}>
                        {preset.brand}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={styles.customButton}
                    onPress={() => setShowDrinkSelector(true)}
                  >
                    <Text style={styles.customButtonText}>Custom</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Quantity Input */}
            <View style={styles.section}>
              <Input
                label="Quantity"
                value={quantity}
                onChangeText={onQuantityChange}
                keyboardType="numeric"
                error={quantity && isNaN(Number(quantity)) ? "Please enter a valid number" : undefined}
              />
            </View>

            {/* Price Input */}
            <View style={styles.section}>
              <Input
                label="Price (£)"
                value={price}
                onChangeText={onPriceChange}
                keyboardType="numeric"
                left={<Text>£</Text>}
                error={price && isNaN(Number(price)) ? "Please enter a valid amount" : undefined}
              />
            </View>

            {/* Location Selection */}
            <View style={styles.section}>
              <Text style={styles.label}>Location</Text>
              {location ? (
                <TouchableOpacity
                  style={styles.selectedItem}
                  onPress={() => setShowLocationSelector(true)}
                >
                  <Text style={styles.selectedItemText}>{location}</Text>
                  <MaterialCommunityIcons name="chevron-down" size={24} color={colors.primary} />
                </TouchableOpacity>
              ) : (
                <View style={styles.presetsContainer}>
                  {LOCATION_PRESETS.map((preset, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.presetButton}
                      onPress={() => onLocationSelect(preset)}
                    >
                      <Text style={styles.presetButtonText}>{preset}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={styles.customButton}
                    onPress={() => setShowLocationSelector(true)}
                  >
                    <Text style={styles.customButtonText}>Custom</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Notes Input */}
            <View style={styles.section}>
              <Input
                label="Notes (optional)"
                value={notes}
                onChangeText={onNotesChange}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={handleBackNavigation}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSaveAndGoBack}
                style={styles.saveButton}
                disabled={!selectedDrink || !quantity || !price || 
                  isNaN(Number(quantity)) || isNaN(Number(price))}
              >
                Save Drink
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Drink Selector Modal */}
      {showDrinkSelector && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Drink</Text>
              <IconButton
                icon="close"
                size={24}
                onPress={() => setShowDrinkSelector(false)}
              />
            </View>
            <DrinkHierarchySelector onSelectDrink={(drink) => {
              onDrinkSelect(drink);
              setShowDrinkSelector(false);
            }} />
          </View>
        </View>
      )}

      {/* Location Input Modal */}
      {showLocationSelector && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enter Location</Text>
              <IconButton
                icon="close"
                size={24}
                onPress={() => setShowLocationSelector(false)}
              />
            </View>
            <Input
              label="Location"
              value={location}
              onChangeText={onLocationChange}
            />
            <Button
              mode="contained"
              onPress={() => setShowLocationSelector(false)}
              style={styles.modalButton}
            >
              Done
            </Button>
          </View>
        </View>
      )}

      <Snackbar
        visible={snackbarVisible}
        onDismiss={onSnackbarDismiss}
        duration={3000}
        action={{
          label: 'Dismiss',
          onPress: onSnackbarDismiss,
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
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    elevation: 2,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    borderRadius: 12,
    elevation: 2,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: colors.text,
  },
  presetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetButton: {
    backgroundColor: colors.surface,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  presetButtonText: {
    color: colors.primary,
  },
  customButton: {
    backgroundColor: colors.primary,
    padding: 8,
    borderRadius: 8,
  },
  customButtonText: {
    color: colors.surface,
  },
  selectedItem: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  selectedItemText: {
    color: colors.text,
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.text,
  },
  modalButton: {
    marginTop: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
}); 