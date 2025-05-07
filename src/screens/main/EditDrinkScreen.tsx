import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Card, IconButton, Snackbar } from 'react-native-paper';
import { colors } from '../../theme/colors';
import { DrinkHierarchySelector } from '../../components/DrinkHierarchySelector';
import { useApp } from '../../context/AppContext';
import { DrinkEntry } from '../../services/storage';
import { DatePicker } from '../../components/DatePicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Define the root stack param list type
type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
  Main: undefined;
  DrinkInput: undefined;
  EditDrink: { drinkId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'EditDrink'>;

export const EditDrinkScreen: React.FC<Props> = ({ route, navigation }) => {
  const { drinkId } = route.params;
  const { drinks, updateDrink, removeDrink, error } = useApp();
  const drink = drinks.find(d => d.id === drinkId);

  const [quantity, setQuantity] = useState(drink?.quantity || 1);
  const [timestamp, setTimestamp] = useState(drink?.timestamp || new Date().toISOString());
  const [notes, setNotes] = useState(drink?.notes || '');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (drink) {
      setQuantity(drink.quantity);
      setTimestamp(drink.timestamp);
      setNotes(drink.notes || '');
      setIsLoading(false);
    } else {
      setSnackbarMessage('Drink not found');
      setSnackbarVisible(true);
      setTimeout(() => navigation.goBack(), 1500);
    }
  }, [drink, navigation]);

  const handleSave = async () => {
    if (!drink) return;
    
    try {
      await updateDrink(drinkId, {
        ...drink,
        quantity,
        timestamp,
        notes,
      });

      setSnackbarMessage('Drink updated successfully!');
      setSnackbarVisible(true);
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigation.navigate('Main');
      }, 1500);
    } catch (error) {
      setSnackbarMessage(error instanceof Error ? error.message : 'Failed to update drink');
      setSnackbarVisible(true);
    }
  };

  const handleDeleteDrink = () => {
    if (!drink) return;
    
    Alert.alert(
      'Delete Drink',
      'Are you sure you want to delete this drink?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeDrink(drink.id);
              setSnackbarMessage('Drink deleted successfully!');
              setSnackbarVisible(true);
              
              // Navigate back after a short delay
              setTimeout(() => {
                navigation.navigate('Main');
              }, 1500);
            } catch (error) {
              setSnackbarMessage(error instanceof Error ? error.message : 'Failed to delete drink');
              setSnackbarVisible(true);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!drink) {
    return (
      <View style={styles.container}>
        <Text>Drink not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
        <Text style={styles.title}>Edit Drink</Text>
      </View>
      
      <View style={styles.content}>
        <DrinkHierarchySelector
          initialSelection={{
            category: drink.category,
            type: drink.type,
            brand: drink.brand,
          }}
          onSelectDrink={(drinkData) => {
            // Update the drink with new selection
            updateDrink(drinkId, {
              ...drink,
              ...drinkData,
            });
          }}
        />
        
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Details</Text>
            <TextInput
              label="Quantity"
              value={quantity.toString()}
              onChangeText={(text) => setQuantity(parseInt(text) || 1)}
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
            <DatePicker
              date={new Date(timestamp)}
              onDateChange={(date) => setTimestamp(date.toISOString())}
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
        
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.saveButton}
          >
            Save Changes
          </Button>

          <Button
            mode="outlined"
            onPress={handleDeleteDrink}
            style={styles.deleteButton}
            textColor={colors.error}
          >
            Delete Drink
          </Button>
        </View>
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </ScrollView>
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
  buttonContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  saveButton: {
    marginBottom: 12,
    paddingVertical: 8,
  },
  deleteButton: {
    paddingVertical: 8,
  },
  snackbar: {
    backgroundColor: colors.primary,
  },
}); 