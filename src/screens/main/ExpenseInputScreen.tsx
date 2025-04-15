import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, BackHandler, Alert } from 'react-native';
import { Text, Button, Card, IconButton, Snackbar, Appbar } from 'react-native-paper';
import { colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Input } from '../../components/ui/Input';
import { useNavigation } from '@react-navigation/native';

// Common expense categories for quick selection
const EXPENSE_CATEGORIES = [
  'Food',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Other',
];

export const ExpenseInputScreen = () => {
  const navigation = useNavigation();
  const { addExpense } = useApp();
  
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Track changes to detect unsaved data
  useEffect(() => {
    if (amount || category || description) {
      setHasUnsavedChanges(true);
    }
  }, [amount, category, description]);

  // Handle back button press
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (hasUnsavedChanges) {
        Alert.alert(
          'Unsaved Changes',
          'You have unsaved changes. Are you sure you want to go back?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Go Back', 
              style: 'destructive',
              onPress: () => {
                resetForm();
                navigation.goBack();
              }
            },
          ]
        );
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [hasUnsavedChanges, navigation]);

  const handleGoBack = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Go Back', 
            style: 'destructive',
            onPress: () => {
              resetForm();
              navigation.goBack();
            }
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const handleSaveExpense = () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setSnackbarMessage('Please enter a valid amount');
      setSnackbarVisible(true);
      return;
    }

    if (!category) {
      setSnackbarMessage('Please select a category');
      setSnackbarVisible(true);
      return;
    }

    try {
      addExpense({
        amount: Number(amount),
        category,
        description: description || 'No description',
        timestamp: new Date().toISOString(),
      });
      
      setSnackbarMessage('Expense saved successfully');
      setSnackbarVisible(true);
      resetForm();
      navigation.goBack();
    } catch (error) {
      setSnackbarMessage('Failed to save expense');
      setSnackbarVisible(true);
    }
  };

  const resetForm = () => {
    setAmount('');
    setCategory('');
    setDescription('');
    setHasUnsavedChanges(false);
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={handleGoBack} />
        <Appbar.Content title="Add Expense" />
      </Appbar.Header>
      
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Content>
            {/* Amount Input */}
            <View style={styles.section}>
              <Input
                label="Amount (£)"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                left={<Text>£</Text>}
                error={amount && (isNaN(Number(amount)) || Number(amount) <= 0) ? 
                  "Please enter a valid amount" : undefined}
              />
            </View>

            {/* Category Selection */}
            <View style={styles.section}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoriesContainer}>
                {EXPENSE_CATEGORIES.map((cat, index) => (
                  <Button
                    key={index}
                    mode={category === cat ? "contained" : "outlined"}
                    onPress={() => setCategory(cat)}
                    style={styles.categoryButton}
                  >
                    {cat}
                  </Button>
                ))}
              </View>
            </View>

            {/* Description Input */}
            <View style={styles.section}>
              <Input
                label="Description (optional)"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={handleGoBack}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSaveExpense}
                style={styles.saveButton}
                disabled={!amount || !category || isNaN(Number(amount)) || Number(amount) <= 0}
              >
                Save Expense
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
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
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    marginBottom: 8,
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
}); 