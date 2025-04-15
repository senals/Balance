import React, { useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Text, Button, TextInput, IconButton, Portal, Dialog, Snackbar } from 'react-native-paper';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Common drink presets for quick selection
const DRINK_PRESETS = [
  { name: 'Beer', category: 'Beer', type: 'Lager', brand: 'Generic', alcoholContent: 5 },
  { name: 'Wine', category: 'Wine', type: 'Red', brand: 'Generic', alcoholContent: 12 },
  { name: 'Spirit', category: 'Spirit', type: 'Vodka', brand: 'Generic', alcoholContent: 40 },
  { name: 'Cocktail', category: 'Cocktail', type: 'Mixed', brand: 'Generic', alcoholContent: 15 },
];

export const QuickInputWidget = () => {
  const { addDrink } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [inputMode, setInputMode] = useState<'drink' | 'expense'>('drink');
  const [selectedPreset, setSelectedPreset] = useState<typeof DRINK_PRESETS[0] | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleQuickAdd = async () => {
    if (!selectedPreset && inputMode === 'drink') {
      setSnackbarMessage('Please select a drink type');
      setSnackbarVisible(true);
      return;
    }

    try {
      if (inputMode === 'drink') {
        await addDrink({
          ...selectedPreset!,
          quantity: parseInt(quantity),
          price: parseFloat(price) || 0,
          timestamp: new Date().toISOString(),
        });
        setSnackbarMessage('Drink added successfully!');
      } else {
        // For expenses, we're just tracking the price
        await addDrink({
          category: 'Expense',
          type: 'Other',
          brand: 'Expense',
          alcoholContent: 0,
          quantity: 1,
          price: parseFloat(price) || 0,
          timestamp: new Date().toISOString(),
        });
        setSnackbarMessage('Expense added successfully!');
      }
      
      setSnackbarVisible(true);
      resetForm();
      setModalVisible(false);
    } catch (error) {
      setSnackbarMessage(error instanceof Error ? error.message : 'Failed to add entry');
      setSnackbarVisible(true);
    }
  };

  const resetForm = () => {
    setSelectedPreset(null);
    setQuantity('1');
    setPrice('');
  };

  const openModal = (mode: 'drink' | 'expense') => {
    setInputMode(mode);
    setModalVisible(true);
  };

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.title}>Quick Add</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.quickButton, { backgroundColor: colors.primary }]}
            onPress={() => openModal('drink')}
          >
            <MaterialCommunityIcons name="glass-cocktail" size={24} color={colors.surface} />
            <Text style={styles.buttonText}>Drink</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.quickButton, { backgroundColor: colors.secondary }]}
            onPress={() => openModal('expense')}
          >
            <MaterialCommunityIcons name="cash" size={24} color={colors.surface} />
            <Text style={styles.buttonText}>Expense</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Portal>
        <Dialog visible={modalVisible} onDismiss={() => setModalVisible(false)}>
          <Dialog.Title>{inputMode === 'drink' ? 'Quick Add Drink' : 'Quick Add Expense'}</Dialog.Title>
          <Dialog.Content>
            {inputMode === 'drink' ? (
              <>
                <Text style={styles.presetTitle}>Select Drink Type:</Text>
                <View style={styles.presetContainer}>
                  {DRINK_PRESETS.map((preset, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.presetButton,
                        selectedPreset?.name === preset.name && styles.selectedPreset
                      ]}
                      onPress={() => setSelectedPreset(preset)}
                    >
                      <Text style={styles.presetText}>{preset.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <TextInput
                  label="Quantity"
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  style={styles.input}
                  mode="outlined"
                />
              </>
            ) : null}
            
            <TextInput
              label={`Price (£)`}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setModalVisible(false)}>Cancel</Button>
            <Button onPress={handleQuickAdd}>Add</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  buttonText: {
    color: colors.surface,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  presetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  presetButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: 8,
    margin: 4,
    minWidth: 80,
    alignItems: 'center',
  },
  selectedPreset: {
    backgroundColor: colors.primary,
  },
  presetText: {
    color: colors.text,
  },
  input: {
    marginBottom: 16,
    backgroundColor: colors.surface,
  },
  snackbar: {
    backgroundColor: colors.primary,
  },
}); 