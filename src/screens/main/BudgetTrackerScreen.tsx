import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Button, IconButton, ProgressBar } from 'react-native-paper';
import { colors } from '../../theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';

export const BudgetTrackerScreen = ({ navigation }: { navigation: any }) => {
  const { drinks, budget, error } = useApp();

  // Calculate daily spending
  const today = new Date().toISOString().split('T')[0];
  const dailyDrinks = drinks.filter(drink => 
    drink.timestamp.startsWith(today)
  );
  const dailySpent = dailyDrinks.reduce((sum, drink) => sum + (drink.price || 0), 0);
  const dailyBudget = budget.dailyBudget;

  // Calculate weekly spending
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weeklyDrinks = drinks.filter(drink => 
    new Date(drink.timestamp) >= weekStart
  );
  const weeklySpent = weeklyDrinks.reduce((sum, drink) => sum + (drink.price || 0), 0);
  const weeklyBudget = budget.weeklyBudget;

  // Calculate monthly spending
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthlyDrinks = drinks.filter(drink => 
    new Date(drink.timestamp) >= monthStart
  );
  const monthlySpent = monthlyDrinks.reduce((sum, drink) => sum + (drink.price || 0), 0);
  const monthlyBudget = budget.monthlyBudget;

  // Get recent expenses
  const recentExpenses = [...drinks]
    .filter(drink => drink.price > 0)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 3)
    .map(drink => ({
      id: drink.id,
      description: `${drink.brand} (${drink.quantity}x)`,
      amount: drink.price,
      date: new Date(drink.timestamp).toLocaleDateString(),
      time: new Date(drink.timestamp).toLocaleTimeString(),
    }));
  
  const progressPercentage = dailySpent / dailyBudget;
  
  const handleAddExpense = () => {
    navigation.navigate('DrinkInput');
  };
  
  const handleViewDetails = () => {
    console.log('View budget details');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Budget Tracker</Text>
        <Text style={styles.subtitle}>Monitor your spending</Text>
      </View>
      
      <View style={styles.content}>
        {/* Monthly Budget Visual */}
        <Card style={styles.budgetCard}>
          <Card.Content style={styles.budgetContent}>
            <View style={styles.budgetContainer}>
              <MaterialCommunityIcons 
                name="piggy-bank" 
                size={100} 
                color={colors.primary} 
              />
              <View style={styles.budgetFillContainer}>
                <View 
                  style={[
                    styles.budgetFill, 
                    { height: `${progressPercentage * 100}%` }
                  ]} 
                />
              </View>
            </View>
            <View style={styles.budgetInfo}>
              <Text style={styles.budgetAmount}>${dailySpent.toFixed(2)}/${dailyBudget.toFixed(2)}</Text>
              <Text style={styles.budgetLabel}>Daily Budget</Text>
              <ProgressBar 
                progress={progressPercentage} 
                color={progressPercentage > 0.8 ? colors.error : colors.primary} 
                style={styles.progressBar} 
              />
              <Text style={styles.remainingAmount}>${(dailyBudget - dailySpent).toFixed(2)} remaining</Text>
            </View>
          </Card.Content>
        </Card>
        
        {/* Budget Summary and Recent Expenses in a row */}
        <View style={styles.bottomRow}>
          {/* Budget Summary */}
          <Card style={styles.summaryCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Summary</Text>
              <View style={styles.summaryContent}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Weekly</Text>
                  <Text style={styles.summaryValue}>${weeklySpent.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Monthly</Text>
                  <Text style={styles.summaryValue}>${monthlySpent.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Daily Avg</Text>
                  <Text style={styles.summaryValue}>
                    ${(monthlySpent / (new Date().getDate())).toFixed(2)}
                  </Text>
                </View>
              </View>
              <Button 
                mode="outlined" 
                onPress={handleViewDetails}
                style={styles.detailsButton}
                compact
              >
                Details
              </Button>
            </Card.Content>
          </Card>
          
          {/* Recent Expenses */}
          <Card style={styles.recentCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Recent</Text>
              {recentExpenses.length > 0 ? (
                recentExpenses.map(expense => (
                  <View key={expense.id} style={styles.expenseItem}>
                    <View style={styles.expenseInfo}>
                      <Text style={styles.expenseDescription}>{expense.description}</Text>
                      <Text style={styles.expenseDateTime}>{expense.date} {expense.time}</Text>
                    </View>
                    <Text style={styles.expenseAmount}>${expense.amount.toFixed(2)}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyMessage}>No expenses recorded yet</Text>
              )}
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
  budgetCard: {
    marginBottom: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 2,
  },
  budgetContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  budgetContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetFillContainer: {
    position: 'absolute',
    bottom: 0,
    width: 80,
    height: 80,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  budgetFill: {
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
  remainingAmount: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
  },
  bottomRow: {
    flexDirection: 'row',
    flex: 1,
  },
  summaryCard: {
    flex: 1,
    marginRight: 6,
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 2,
  },
  recentCard: {
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
  summaryContent: {
    marginBottom: 8,
  },
  summaryItem: {
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 10,
    color: colors.text,
    opacity: 0.7,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  detailsButton: {
    marginTop: 4,
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
  expenseDescription: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  expenseDateTime: {
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
  emptyMessage: {
    textAlign: 'center',
    color: colors.text,
    opacity: 0.7,
    marginBottom: 8,
  },
}); 