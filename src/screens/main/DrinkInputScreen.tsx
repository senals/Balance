import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, Card, IconButton, SegmentedButtons, Snackbar } from 'react-native-paper';
import { colors } from '../../theme/colors';
import { DrinkHierarchySelector } from '../../components/DrinkHierarchySelector';
import { useApp } from '../../context/AppContext';
import { drinkApi } from '../../services/drinkApi';
import { storage } from '../../services/storage';

export const DrinkInputScreen = ({ navigation }: { navigation: any }) => {
  const { addDrink, addExpense, drinks, error, currentUser } = useApp();
  const [selectedDrink, setSelectedDrink] = useState<{
    category: string;
    type: string;
    brand: string;
    alcoholContent: number;
  } | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [inputMode, setInputMode] = useState('drink');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(true);

  // Reset form when mode changes
  useEffect(() => {
    if (inputMode === 'expense') {
      setSelectedDrink(null);
      setQuantity('1');
    }
  }, [inputMode]);

  const handleSaveDrink = async () => {
    if (!currentUser?.id) {
      console.error('No current user ID available');
      setSnackbarMessage('Please ensure you are logged in');
      setSnackbarVisible(true);
      return;
    }
    
    if (isSubmitting) {
      console.log('Already submitting, preventing duplicate submission');
      return; // Prevent multiple submissions
    }
    
    setIsSubmitting(true);
    
    try {
      if (inputMode === 'drink') {
        // Validate required fields for drink
        if (!selectedDrink || !selectedDrink.category || !selectedDrink.type || !selectedDrink.brand) {
          console.error('Missing required drink fields:', selectedDrink);
          setSnackbarMessage('Please select a complete drink');
          setSnackbarVisible(true);
          setIsSubmitting(false);
          return;
        }

        if (!price || parseFloat(price) <= 0) {
          console.error('Invalid price:', price);
          setSnackbarMessage('Please enter a valid price');
          setSnackbarVisible(true);
          setIsSubmitting(false);
          return;
        }

        const newDrink = {
          ...selectedDrink,
          quantity: parseInt(quantity) || 1,
          price: parseFloat(price) || 0,
          location: location.trim(),
          notes: notes.trim(),
          timestamp: new Date().toISOString(),
          userId: currentUser.id // Ensure userId is included
        };

        console.log('Saving drink:', newDrink);

        try {
          // First try to save to API if available
          if (apiAvailable) {
            console.log('Saving drink to API...');
            const savedDrink = await drinkApi.create(newDrink, currentUser.id);
            console.log('Drink saved to API successfully:', savedDrink);
            
            // Update local storage with the API response
            await storage.drinks.add(savedDrink);
          } else {
            // If API is not available, save to local storage only
            console.log('Saving drink to local storage...');
            const savedDrink = await storage.drinks.add(newDrink);
            console.log('Drink saved to local storage successfully:', savedDrink);
          }

          // Update the app context with the new drink
          await addDrink(newDrink);
          
          setSnackbarMessage('Drink saved successfully!');
        } catch (apiError) {
          console.error('Error saving drink:', apiError);
          throw apiError;
        }
      } else {
        // Handle expense mode
        if (!price || parseFloat(price) <= 0) {
          setSnackbarMessage('Please enter a valid price');
          setSnackbarVisible(true);
          setIsSubmitting(false);
          return;
        }

        const newExpense = {
          amount: parseFloat(price),
          category: selectedDrink?.category || 'Other',
          date: new Date().toISOString(),
          notes: notes.trim() || `${selectedDrink?.brand || 'Expense'} at ${location.trim() || 'Unknown location'}`
        };

        console.log('Saving expense:', newExpense);

        // Use AppContext's addExpense
        await addExpense(newExpense);
        console.log('Expense saved successfully');

        setSnackbarMessage('Expense saved successfully!');
      }
      
      setSnackbarVisible(true);
      
      // Reset form
      setPrice('');
      setLocation('');
      setNotes('');
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigation.navigate('BudgetTracker');
      }, 1500);
    } catch (error) {
      console.error('Error saving drink:', error);
      setSnackbarMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestStorage = () => {
    setSnackbarMessage(`Current number of drinks stored: ${drinks.length}`);
    setSnackbarVisible(true);
    console.log('All stored drinks:', drinks);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          role="button"
          aria-label="Go back"
        />
        <Text style={styles.title}>Add {inputMode === 'drink' ? 'Drink' : 'Expense'}</Text>
      </View>
      
      <View style={styles.content}>
        <SegmentedButtons
          value={inputMode}
          onValueChange={setInputMode}
          buttons={[
            { value: 'drink', label: 'Drink' },
            { value: 'expense', label: 'Expense' },
          ]}
          style={styles.segmentedButtons}
        />
        
        {inputMode === 'drink' && (
          <DrinkHierarchySelector onSelectDrink={setSelectedDrink} />
        )}
        
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Details</Text>
            {inputMode === 'drink' && (
              <TextInput
                label="Quantity"
                value={quantity}
                onChangeText={setQuantity}
                inputMode="numeric"
                style={styles.input}
                mode="outlined"
                theme={{ 
                  colors: { 
                    background: colors.input,
                    primary: colors.text,
                    accent: colors.text,
                    text: colors.text,
                    placeholder: colors.text
                  } 
                }}
              />
            )}
            <TextInput
              label="Price (£)"
              value={price}
              onChangeText={setPrice}
              inputMode="numeric"
              style={styles.input}
              mode="outlined"
              theme={{ 
                colors: { 
                  background: colors.input,
                  primary: colors.text,
                  accent: colors.text,
                  text: colors.text,
                  placeholder: colors.text
                } 
              }}
            />
            <TextInput
              label="Location (optional)"
              value={location}
              onChangeText={setLocation}
              style={styles.input}
              mode="outlined"
              placeholder="e.g., Student Union, Friend's House"
              theme={{ 
                colors: { 
                  background: colors.input,
                  primary: colors.text,
                  accent: colors.text,
                  text: colors.text,
                  placeholder: colors.text
                } 
              }}
            />
            <TextInput
              label="Notes (optional)"
              value={notes}
              onChangeText={setNotes}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
              placeholder={inputMode === 'drink' ? "Add any notes about this drink" : "Add any notes about this expense"}
              theme={{ 
                colors: { 
                  background: colors.input,
                  primary: colors.text,
                  accent: colors.text,
                  text: colors.text,
                  placeholder: colors.text
                } 
              }}
            />
          </Card.Content>
        </Card>
        
        <Button
          mode="contained"
          onPress={handleSaveDrink}
          style={styles.saveButton}
          disabled={isSubmitting || (inputMode === 'drink' && !selectedDrink)}
          loading={isSubmitting}
          role="button"
          aria-label={isSubmitting ? 'Saving...' : `Save ${inputMode === 'drink' ? 'Drink' : 'Expense'}`}
        >
          {isSubmitting ? 'Saving...' : `Save ${inputMode === 'drink' ? 'Drink' : 'Expense'}`}
        </Button>

        <Button
          mode="outlined"
          onPress={handleTestStorage}
          style={styles.testButton}
          disabled={isSubmitting}
          role="button"
          aria-label="Test Storage"
        >
          Test Storage
        </Button>
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
        role="alert"
        aria-live="polite"
      >
        {snackbarMessage}
      </Snackbar>
    </ScrollView>
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
  segmentedButtons: {
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#fff0d4',
    borderRadius: 12,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff7e9',
  },
  saveButton: {
    marginTop: 8,
    marginBottom: 12,
    paddingVertical: 8,
  },
  testButton: {
    marginBottom: 24,
  },
  snackbar: {
    backgroundColor: colors.primary,
  },
}); 