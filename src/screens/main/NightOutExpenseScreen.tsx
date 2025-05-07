import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, Card, IconButton, SegmentedButtons, Snackbar, Chip } from 'react-native-paper';
import { colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type IconName = 'ticket' | 'car' | 'food' | 'dots-horizontal';

interface ExpenseCategory {
  id: string;
  label: string;
  icon: IconName;
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: 'entry', label: 'Entry Fee', icon: 'ticket' },
  { id: 'transport', label: 'Transport', icon: 'car' },
  { id: 'food', label: 'Food', icon: 'food' },
  { id: 'other', label: 'Other', icon: 'dots-horizontal' },
];

export const NightOutExpenseScreen = ({ navigation }: { navigation: any }) => {
  const { addExpense, currentUser } = useApp();
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveExpense = async () => {
    if (!currentUser?.id) {
      setSnackbarMessage('Please ensure you are logged in');
      setSnackbarVisible(true);
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (!amount || parseFloat(amount) <= 0) {
        setSnackbarMessage('Please enter a valid amount');
        setSnackbarVisible(true);
        setIsSubmitting(false);
        return;
      }

      if (!selectedCategory) {
        setSnackbarMessage('Please select a category');
        setSnackbarVisible(true);
        setIsSubmitting(false);
        return;
      }

      const newExpense = {
        amount: parseFloat(amount),
        category: selectedCategory,
        date: new Date().toISOString(),
        notes: notes.trim() || `${EXPENSE_CATEGORIES.find(c => c.id === selectedCategory)?.label} at ${location.trim() || 'Unknown location'}`,
        type: 'night_out'
      };

      await addExpense(newExpense);
      setSnackbarMessage('Expense saved successfully!');
      setSnackbarVisible(true);

      // Reset form
      setAmount('');
      setLocation('');
      setNotes('');
      setSelectedCategory('');

      // Navigate back after a short delay
      setTimeout(() => {
        navigation.navigate('BudgetTracker');
      }, 1500);
    } catch (error) {
      console.error('Error saving expense:', error);
      setSnackbarMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
        <Text style={styles.title}>Add Night Out Expense</Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Category</Text>
            <View style={styles.categoryContainer}>
              {EXPENSE_CATEGORIES.map((category) => (
                <Chip
                  key={category.id}
                  selected={selectedCategory === category.id}
                  onPress={() => setSelectedCategory(category.id)}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category.id && styles.selectedChip
                  ]}
                  icon={({ size, color }) => (
                    <MaterialCommunityIcons
                      name={category.icon}
                      size={size}
                      color={color}
                    />
                  )}
                >
                  {category.label}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Details</Text>
            <TextInput
              label="Amount (£)"
              value={amount}
              onChangeText={setAmount}
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
              placeholder="e.g., Club Name, Venue"
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
              placeholder="Add any additional details about this expense"
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
          onPress={handleSaveExpense}
          style={styles.saveButton}
          disabled={isSubmitting || !selectedCategory || !amount}
          loading={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Expense'}
        </Button>
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
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  categoryChip: {
    marginBottom: 8,
    backgroundColor: '#fff7e9',
  },
  selectedChip: {
    backgroundColor: colors.primary,
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
  snackbar: {
    backgroundColor: colors.primary,
  },
}); 