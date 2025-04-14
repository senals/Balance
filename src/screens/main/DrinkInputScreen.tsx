import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button, Card, IconButton, SegmentedButtons } from 'react-native-paper';
import { colors } from '../../theme/colors';
import { DrinkHierarchySelector } from '../../components/DrinkHierarchySelector';

export const DrinkInputScreen = ({ navigation }: { navigation: any }) => {
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

  const handleSaveDrink = () => {
    if (!selectedDrink) return;
    
    // Log the drink data (would be saved to database in a real app)
    console.log('Drink saved:', {
      ...selectedDrink,
      quantity: parseInt(quantity),
      price: parseFloat(price) || 0,
      location,
      notes,
      timestamp: new Date().toISOString(),
    });
    
    // Navigate back to the appropriate screen based on input mode
    if (inputMode === 'drink') {
      navigation.navigate('DrinkTracker');
    } else {
      navigation.navigate('BudgetTracker');
    }
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
        
        <DrinkHierarchySelector onSelectDrink={setSelectedDrink} />
        
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Details</Text>
            <TextInput
              label="Quantity"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
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
              label="Price ($)"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
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
              placeholder="Add any notes about this drink"
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
          disabled={!selectedDrink}
        >
          Save {inputMode === 'drink' ? 'Drink' : 'Expense'}
        </Button>
      </View>
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
  segmentedButtons: {
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
    backgroundColor: colors.surface,
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
    backgroundColor: colors.surface,
  },
  saveButton: {
    marginTop: 8,
    marginBottom: 24,
    paddingVertical: 8,
  },
}); 