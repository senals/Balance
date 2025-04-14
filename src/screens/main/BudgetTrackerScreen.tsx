import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Card, Button, IconButton, ProgressBar } from 'react-native-paper';
import { colors } from '../../theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Mock data for demonstration
const MOCK_BUDGET = 200;
const MOCK_SPENT = 75;
const MOCK_RECENT_EXPENSES = [
  { id: '1', drink: 'Heineken', amount: 5.99, date: '2023-06-15' },
  { id: '2', drink: 'Wine', amount: 8.50, date: '2023-06-14' },
  { id: '3', drink: 'Cocktail', amount: 12.00, date: '2023-06-13' },
];

export const BudgetTrackerScreen = ({ navigation }: { navigation: any }) => {
  const [budget, setBudget] = useState(MOCK_BUDGET);
  const [spent, setSpent] = useState(MOCK_SPENT);
  const [recentExpenses, setRecentExpenses] = useState(MOCK_RECENT_EXPENSES);
  
  const progressPercentage = spent / budget;
  const remaining = budget - spent;
  
  const handleAddExpense = () => {
    navigation.navigate('DrinkInput');
  };
  
  const handleViewAnalysis = () => {
    // This would navigate to a detailed analysis screen in a real app
    console.log('View spending analysis');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Budget Tracker</Text>
        <Text style={styles.subtitle}>Monitor your spending</Text>
      </View>
      
      <View style={styles.content}>
        {/* Piggy Bank Visual */}
        <Card style={styles.piggyBankCard}>
          <Card.Content style={styles.piggyBankContent}>
            <View style={styles.piggyBankContainer}>
              <MaterialCommunityIcons 
                name="piggy-bank" 
                size={100} 
                color={colors.primary} 
              />
              <View style={styles.piggyBankFillContainer}>
                <View 
                  style={[
                    styles.piggyBankFill, 
                    { height: `${progressPercentage * 100}%` }
                  ]} 
                />
              </View>
            </View>
            <View style={styles.budgetInfo}>
              <Text style={styles.budgetAmount}>${budget}</Text>
              <Text style={styles.budgetLabel}>Monthly Budget</Text>
              <ProgressBar 
                progress={progressPercentage} 
                color={progressPercentage > 0.8 ? colors.error : colors.primary} 
                style={styles.progressBar} 
              />
              <Text style={styles.spentAmount}>${spent} spent</Text>
              <Text style={styles.remainingAmount}>${remaining} remaining</Text>
            </View>
          </Card.Content>
        </Card>
        
        {/* Recent Expenses and Analysis in a row */}
        <View style={styles.bottomRow}>
          {/* Recent Expenses */}
          <Card style={styles.expensesCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Recent Expenses</Text>
              {recentExpenses.map(expense => (
                <View key={expense.id} style={styles.expenseItem}>
                  <View style={styles.expenseInfo}>
                    <Text style={styles.expenseDrink}>{expense.drink}</Text>
                    <Text style={styles.expenseDate}>{expense.date}</Text>
                  </View>
                  <Text style={styles.expenseAmount}>${expense.amount}</Text>
                </View>
              ))}
              <Button 
                mode="contained" 
                onPress={handleAddExpense}
                style={styles.addButton}
                compact
              >
                Add Expense
              </Button>
            </Card.Content>
          </Card>
          
          {/* Spending Analysis */}
          <Card style={styles.analysisCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Analysis</Text>
              <View style={styles.analysisContent}>
                <View style={styles.analysisItem}>
                  <Text style={styles.analysisLabel}>Daily Avg</Text>
                  <Text style={styles.analysisValue}>${(spent / 15).toFixed(2)}</Text>
                </View>
                <View style={styles.analysisItem}>
                  <Text style={styles.analysisLabel}>Weekly Avg</Text>
                  <Text style={styles.analysisValue}>${(spent / 2).toFixed(2)}</Text>
                </View>
                <View style={styles.analysisItem}>
                  <Text style={styles.analysisLabel}>Monthly</Text>
                  <Text style={styles.analysisValue}>${(spent * 2).toFixed(2)}</Text>
                </View>
              </View>
              <Button 
                mode="outlined" 
                onPress={handleViewAnalysis}
                style={styles.analysisButton}
                compact
              >
                Details
              </Button>
            </Card.Content>
          </Card>
        </View>
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
    padding: 12,
    paddingTop: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  piggyBankCard: {
    marginBottom: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 2,
  },
  piggyBankContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  piggyBankContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  piggyBankFillContainer: {
    position: 'absolute',
    bottom: 0,
    width: 80,
    height: 80,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  piggyBankFill: {
    width: '100%',
    backgroundColor: colors.primary + '40', // 40% opacity
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  budgetInfo: {
    flex: 1,
    marginLeft: 12,
  },
  budgetAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  budgetLabel: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 6,
  },
  spentAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  remainingAmount: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
  },
  bottomRow: {
    flexDirection: 'row',
    flex: 1,
  },
  expensesCard: {
    flex: 1,
    marginRight: 6,
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 2,
  },
  analysisCard: {
    flex: 1,
    marginLeft: 6,
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDrink: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  expenseDate: {
    fontSize: 10,
    color: colors.text,
    opacity: 0.7,
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  addButton: {
    marginTop: 8,
  },
  analysisContent: {
    marginBottom: 8,
  },
  analysisItem: {
    marginBottom: 6,
  },
  analysisLabel: {
    fontSize: 10,
    color: colors.text,
    opacity: 0.7,
  },
  analysisValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  analysisButton: {
    marginTop: 4,
  },
}); 