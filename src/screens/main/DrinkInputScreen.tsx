import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, Card, IconButton, SegmentedButtons, Snackbar, Chip } from 'react-native-paper';
import { colors } from '../../theme/colors';
import { DrinkHierarchySelector } from '../../components/DrinkHierarchySelector';
import { useApp } from '../../context/AppContext';
import { drinkApi } from '../../services/drinkApi';
import { storage } from '../../services/storage';

// Common locations for quick selection
const COMMON_LOCATIONS = ['Home', 'Bar', 'Restaurant', 'Friend\'s House', 'Student Union'];

// Common quantities for quick selection
const QUANTITY_PRESETS = ['1', '2', '3', '4', '6'];

// Common price presets
const PRICE_PRESETS = ['3.50', '4.50', '5.50', '6.50', '7.50'];

export const DrinkInputScreen = ({ navigation }: { navigation: any }) => {
  const { addDrink, addExpense, drinks, error, currentUser, settings, budget } = useApp();
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
  const [recentDrinks, setRecentDrinks] = useState<any[]>([]);

  // Load recent drinks on component mount
  useEffect(() => {
    const loadRecentDrinks = async () => {
      const recent = await storage.drinks.getRecent(5);
      setRecentDrinks(recent);
    };
    loadRecentDrinks();
  }, []);

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
      return;
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
          userId: currentUser.id
        };

        console.log('Saving drink:', newDrink);

        try {
          let savedDrink;
          
          // Try to save to API first if available
          if (apiAvailable) {
            try {
              console.log('Saving drink to API...');
              savedDrink = await drinkApi.create(newDrink, currentUser.id);
              console.log('Drink saved to API successfully:', savedDrink);
            } catch (apiError) {
              console.warn('Failed to save to API, falling back to local storage:', apiError);
              // If API fails, save to local storage
              console.log('Saving drink to local storage...');
              savedDrink = await storage.drinks.add(newDrink);
              console.log('Drink saved to local storage successfully:', savedDrink);
            }
          } else {
            // If API is not available, save to local storage
            console.log('API not available, saving to local storage...');
            savedDrink = await storage.drinks.add(newDrink);
            console.log('Drink saved to local storage successfully:', savedDrink);
          }

          // Update the app context with the new drink
          if (savedDrink) {
            await addDrink(savedDrink);
            console.log('Drink added to app context:', savedDrink);
          }
          
          setSnackbarMessage('Drink saved successfully!');
          setSnackbarVisible(true);
          
          // Reset form
          setSelectedDrink(null);
          setPrice('');
          setLocation('');
          setNotes('');
          setQuantity('1');
          
          // Navigate back after a short delay
          setTimeout(() => {
            navigation.navigate('DrinkTracker');
          }, 1500);
        } catch (error) {
          if (error instanceof Error && error.message.includes('Duplicate drink entry')) {
            setSnackbarMessage('This drink has already been recorded');
          } else {
            setSnackbarMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
          setSnackbarVisible(true);
          throw error;
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
        setSnackbarVisible(true);
        
        // Reset form
        setPrice('');
        setLocation('');
        setNotes('');
        
        // Navigate back after a short delay
        setTimeout(() => {
          navigation.navigate('BudgetTracker');
        }, 1500);
      }
    } catch (error) {
      console.error('Error saving:', error);
      setSnackbarMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setSnackbarVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestStorage = () => {
    setSnackbarMessage(`Current number of drinks stored: ${drinks.length}`);
    setSnackbarVisible(true);
    console.log('All stored drinks:', drinks);
  };

  const handleQuickSelect = (drink: any) => {
    setSelectedDrink({
      category: drink.category,
      type: drink.type,
      brand: drink.brand,
      alcoholContent: drink.alcoholContent
    });
    setPrice(drink.price.toString());
    setLocation(drink.location);
    setNotes(drink.notes);
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
          <>
            <Card style={styles.limitsCard}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Current Limits</Text>
                <View style={styles.limitsContainer}>
                  <View style={styles.limitItem}>
                    <Text style={styles.limitLabel}>Daily Limit</Text>
                    <Text style={styles.limitValue}>{settings.dailyLimit} drinks</Text>
                  </View>
                  <View style={styles.limitItem}>
                    <Text style={styles.limitLabel}>Daily Budget</Text>
                    <Text style={styles.limitValue}>£{budget.dailyBudget}</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>

            {recentDrinks.length > 0 && (
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={styles.sectionTitle}>Recent Drinks</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentDrinksContainer}>
                    {recentDrinks.map((drink, index) => (
                      <Chip
                        key={index}
                        style={styles.recentDrinkChip}
                        onPress={() => handleQuickSelect(drink)}
                        mode="outlined"
                        selectedColor={colors.primary}
                        textStyle={{ color: colors.text }}
                      >
                        {drink.brand}
                      </Chip>
                    ))}
                  </ScrollView>
                </Card.Content>
              </Card>
            )}
            
            <DrinkHierarchySelector onSelectDrink={setSelectedDrink} />
          </>
        )}
        
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Details</Text>
            {inputMode === 'drink' && (
              <>
                <Text style={styles.presetLabel}>Quantity:</Text>
                <View style={styles.presetContainer}>
                  {QUANTITY_PRESETS.map((preset) => (
                    <Chip
                      key={preset}
                      selected={quantity === preset}
                      onPress={() => setQuantity(preset)}
                      style={styles.presetChip}
                      mode="outlined"
                      selectedColor={colors.primary}
                      textStyle={{ color: colors.text }}
                    >
                      {preset}
                    </Chip>
                  ))}
                </View>
              </>
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
            
            {inputMode === 'drink' && (
              <>
                <Text style={styles.presetLabel}>Quick Price:</Text>
                <View style={styles.presetContainer}>
                  {PRICE_PRESETS.map((preset) => (
                    <Chip
                      key={preset}
                      selected={price === preset}
                      onPress={() => setPrice(preset)}
                      style={styles.presetChip}
                      mode="outlined"
                      selectedColor={colors.primary}
                      textStyle={{ color: colors.text }}
                    >
                      £{preset}
                    </Chip>
                  ))}
                </View>
              </>
            )}
            
            <Text style={styles.presetLabel}>Location:</Text>
            <View style={styles.presetContainer}>
              {COMMON_LOCATIONS.map((loc) => (
                <Chip
                  key={loc}
                  selected={location === loc}
                  onPress={() => setLocation(loc)}
                  style={styles.presetChip}
                  mode="outlined"
                  selectedColor={colors.primary}
                  textStyle={{ color: colors.text }}
                >
                  {loc}
                </Chip>
              ))}
            </View>
            
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
          theme={{
            colors: {
              primary: colors.primary,
              onPrimary: '#ffffff',
            }
          }}
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
          theme={{
            colors: {
              primary: colors.primary,
            }
          }}
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
    backgroundColor: '#fff0d4',
    borderRadius: 8,
    padding: 4,
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#fff0d4',
    borderRadius: 12,
    elevation: 2,
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
  presetLabel: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    marginTop: 8,
  },
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  presetChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#fff7e9',
    borderColor: colors.primary,
  },
  recentDrinksContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  recentDrinkChip: {
    marginRight: 8,
    backgroundColor: '#fff7e9',
    borderColor: colors.primary,
  },
  limitsCard: {
    marginBottom: 16,
    backgroundColor: '#fff0d4',
    borderRadius: 12,
    elevation: 2,
  },
  limitsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  limitItem: {
    alignItems: 'center',
  },
  limitLabel: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
    marginBottom: 4,
  },
  limitValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
}); 