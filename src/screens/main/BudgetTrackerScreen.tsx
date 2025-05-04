import React, { useEffect, useState } from 'react';
import { View, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { Text, Card, Button, IconButton, ProgressBar, ActivityIndicator } from 'react-native-paper';
import { colors } from '../../theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { dataService } from '../../services/dataService';
import { DrinkEntry } from '../../services/storage';
import { IBudgetDocument } from '../../models/Budget';
import { storage } from '../../services/storage';
import { drinkApi } from '../../services/drinkApi';

export const BudgetTrackerScreen = ({ navigation }: { navigation: any }) => {
  const { drinks, budget, error, currentUser, updateBudget, setDrinks } = useApp();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [testTransaction, setTestTransaction] = useState<any>(null);

  // Debug logging function
  const addDebugLog = (message: string) => {
    console.log(`[BudgetTracker Debug] ${message}`);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`].slice(-10));
  };

  // Test transaction creation
  const createTestTransaction = async () => {
    if (!currentUser?.id) {
      addDebugLog('Cannot create test transaction: No user ID');
      return;
    }

    addDebugLog('Creating test transaction...');
    const testDrink = {
      category: 'Test',
      type: 'Test Drink',
      brand: 'Test Brand',
      alcoholContent: 5,
      quantity: 1,
      price: 10.99,
      timestamp: new Date().toISOString(),
      userId: currentUser.id
    };

    try {
      if (apiAvailable) {
        addDebugLog('Attempting to save test transaction to API...');
        const result = await dataService.transactions.add({
          amount: testDrink.price,
          type: 'expense',
          category: testDrink.category,
          description: `${testDrink.brand} - ${testDrink.type}`,
          date: testDrink.timestamp,
          userId: testDrink.userId
        }, currentUser.id);
        addDebugLog(`API Save Result: ${JSON.stringify(result)}`);
        setTestTransaction(result);
      } else {
        addDebugLog('Attempting to save test transaction to local storage...');
        const result = await storage.drinks.add(testDrink);
        addDebugLog(`Local Storage Save Result: ${JSON.stringify(result)}`);
        setTestTransaction(result);
      }
      addDebugLog('Test transaction created successfully');
      // Refresh data after creating test transaction
      fetchData();
    } catch (error: any) {
      addDebugLog(`Error creating test transaction: ${error.message}`);
      console.error('Error creating test transaction:', error);
    }
  };

  // Check if API is available
  useEffect(() => {
    const checkApi = async () => {
      const isAvailable = await dataService.isApiAvailable();
      setApiAvailable(isAvailable);
      addDebugLog(`API Available: ${isAvailable}`);
    };
    
    checkApi();
  }, []);

  // Fetch data from API or local storage
  const fetchData = async () => {
    if (!currentUser?.id) {
      addDebugLog('No current user ID available');
      return;
    }
    
    setLoading(true);
    addDebugLog(`Starting data fetch for user: ${currentUser.id}`);
    
    try {
      // Check API availability first
      const isApiAvailable = await dataService.isApiAvailable();
      setApiAvailable(isApiAvailable);
      addDebugLog(`API Check: ${isApiAvailable}`);
      
      if (isApiAvailable) {
        addDebugLog('Fetching from API...');
        try {
          // Get drinks from API
          const apiDrinks = await drinkApi.getAll(currentUser.id);
          addDebugLog(`Raw drinks response: ${JSON.stringify(apiDrinks)}`);
          addDebugLog(`API Drinks: ${apiDrinks?.length || 0} items`);
          
          // Update drinks in context
          setDrinks(apiDrinks);
          
          // Get budget from API
          const apiBudget = await dataService.budget.get(currentUser.id);
          addDebugLog(`Raw budget response: ${JSON.stringify(apiBudget)}`);
          addDebugLog(`API Budget: ${apiBudget ? 'Found' : 'Not found'}`);
          
          if (apiBudget) {
            addDebugLog('Updating budget from API');
            // Convert to plain object before updating
            const plainBudget = {
              dailyBudget: apiBudget.dailyBudget,
              weeklyBudget: apiBudget.weeklyBudget,
              monthlyBudget: apiBudget.monthlyBudget,
              userId: apiBudget.userId,
              expenses: apiBudget.expenses.map(exp => ({
                id: exp.id || String(Math.random()),
                amount: exp.amount,
                category: exp.category,
                date: exp.date instanceof Date ? exp.date.toISOString() : exp.date,
                notes: exp.notes
              }))
            };
            updateBudget(plainBudget);
          }
        } catch (error: any) {
          addDebugLog(`Error in API operations: ${error.message}`);
          console.error('Error in API operations:', error);
        }
      } else {
        addDebugLog('Falling back to local storage');
        try {
          const [localDrinks, localBudget] = await Promise.all([
            storage.drinks.getAll(currentUser.id),
            storage.budget.get(currentUser.id)
          ]);
          
          addDebugLog(`Local drinks: ${localDrinks?.length || 0} items`);
          addDebugLog(`Local budget: ${localBudget ? 'Found' : 'Not found'}`);
          
          if (localDrinks) {
            setDrinks(localDrinks);
          }
          
          if (localBudget) {
            updateBudget(localBudget);
          }
        } catch (error: any) {
          addDebugLog(`Error in local storage operations: ${error.message}`);
          console.error('Error in local storage operations:', error);
        }
      }
    } catch (error: any) {
      addDebugLog(`Error fetching data: ${error.message}`);
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      addDebugLog('Data fetch completed');
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [currentUser?.id]);

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Calculate daily spending
  const today = new Date().toISOString().split('T')[0];
  
  // Get expenses from both drinks and budget.expenses
  const dailyDrinks = drinks.filter(drink => 
    drink.timestamp.startsWith(today)
  );
  const dailyDrinksSpent = dailyDrinks.reduce((sum, drink) => sum + (drink.price || 0), 0);
  
  const dailyExpenses = budget?.expenses?.filter(expense => 
    expense.date.startsWith(today)
  ) || [];
  const dailyExpensesSpent = dailyExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  
  const dailySpent = dailyDrinksSpent + dailyExpensesSpent;
  const dailyBudget = budget?.dailyBudget || 0;

  // Calculate weekly spending
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  
  const weeklyDrinks = drinks.filter(drink => 
    new Date(drink.timestamp) >= weekStart
  );
  const weeklyDrinksSpent = weeklyDrinks.reduce((sum, drink) => sum + (drink.price || 0), 0);
  
  const weeklyExpenses = budget?.expenses?.filter(expense => 
    new Date(expense.date) >= weekStart
  ) || [];
  const weeklyExpensesSpent = weeklyExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  
  const weeklySpent = weeklyDrinksSpent + weeklyExpensesSpent;
  const weeklyBudget = budget?.weeklyBudget || 0;

  // Calculate monthly spending
  const monthStart = new Date();
  monthStart.setDate(1);
  
  const monthlyDrinks = drinks.filter(drink => 
    new Date(drink.timestamp) >= monthStart
  );
  const monthlyDrinksSpent = monthlyDrinks.reduce((sum, drink) => sum + (drink.price || 0), 0);
  
  const monthlyExpenses = budget?.expenses?.filter(expense => 
    new Date(expense.date) >= monthStart
  ) || [];
  const monthlyExpensesSpent = monthlyExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  
  const monthlySpent = monthlyDrinksSpent + monthlyExpensesSpent;
  const monthlyBudget = budget?.monthlyBudget || 0;

  // Get recent expenses from both drinks and budget.expenses
  const recentDrinks = [...drinks]
    .filter(drink => drink.price > 0)
    .map(drink => ({
      id: drink.id,
      description: `${drink.brand || drink.type} (${drink.quantity}x)`,
      amount: drink.price,
      date: new Date(drink.timestamp).toLocaleDateString(),
      time: new Date(drink.timestamp).toLocaleTimeString(),
      type: 'drink'
    }));
  
  const recentBudgetExpenses = [...(budget?.expenses || [])]
    .map(expense => ({
      id: expense.id || String(Math.random()),
      description: expense.notes || 'Expense',
      amount: expense.amount,
      date: new Date(expense.date).toLocaleDateString(),
      time: new Date(expense.date).toLocaleTimeString(),
      type: 'expense'
    }));
  
  const recentExpenses = [...recentDrinks, ...recentBudgetExpenses]
    .sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime())
    .slice(0, 5);
  
  const progressPercentage = dailyBudget > 0 ? dailySpent / dailyBudget : 0;
  
  const handleAddExpense = () => {
    navigation.navigate('DrinkInput');
  };
  
  const handleViewDetails = () => {
    navigation.navigate('DrinkTracker');
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading budget data...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Debug Panel */}
      <Card style={styles.debugCard}>
        <Card.Content>
          <Text style={styles.debugTitle}>Debug Information</Text>
          {debugInfo.map((log, index) => (
            <Text key={index} style={styles.debugText}>{log}</Text>
          ))}
          <Button 
            mode="contained" 
            onPress={createTestTransaction}
            style={styles.testButton}
          >
            Create Test Transaction
          </Button>
        </Card.Content>
      </Card>

      {apiAvailable && (
        <Card style={styles.apiStatusCard}>
          <Card.Content style={styles.apiStatusContent}>
            <MaterialCommunityIcons name="cloud-check" size={24} color={colors.success} />
            <Text style={styles.apiStatusText}>Connected to server</Text>
          </Card.Content>
        </Card>
      )}
      
      {!apiAvailable && (
        <Card style={styles.apiStatusCard}>
          <Card.Content style={styles.apiStatusContent}>
            <MaterialCommunityIcons name="cloud-off-outline" size={24} color={colors.warning} />
            <Text style={styles.apiStatusText}>Using local storage only</Text>
          </Card.Content>
        </Card>
      )}
      
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
                    { height: `${Math.min(progressPercentage * 100, 100)}%` }
                  ]} 
                />
              </View>
            </View>
            <View style={styles.budgetInfo}>
              <Text style={styles.budgetAmount}>£{dailySpent.toFixed(2)}/{dailyBudget.toFixed(2)}</Text>
              <Text style={styles.budgetLabel}>Daily Budget</Text>
              <ProgressBar 
                progress={Math.min(progressPercentage, 1)} 
                color={progressPercentage > 0.8 ? colors.error : colors.primary} 
                style={styles.progressBar} 
              />
              <Text style={styles.remainingAmount}>£{(dailyBudget - dailySpent).toFixed(2)} remaining</Text>
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
                  <Text style={styles.summaryValue}>£{weeklySpent.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Monthly</Text>
                  <Text style={styles.summaryValue}>£{monthlySpent.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Daily Avg</Text>
                  <Text style={styles.summaryValue}>
                    £{(monthlySpent / (new Date().getDate())).toFixed(2)}
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
                recentExpenses.map((expense, index) => (
                  <View 
                    key={expense.id || `expense-${expense.type}-${expense.date}-${expense.time}-${index}`} 
                    style={styles.expenseItem}
                  >
                    <View style={styles.expenseInfo}>
                      <Text style={styles.expenseDescription}>{expense.description}</Text>
                      <Text style={styles.expenseDateTime}>{expense.date} {expense.time}</Text>
                    </View>
                    <Text style={styles.expenseAmount}>£{expense.amount.toFixed(2)}</Text>
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.text,
  },
  apiStatusCard: {
    margin: 10,
    backgroundColor: colors.surface,
  },
  apiStatusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  apiStatusText: {
    marginLeft: 10,
    fontSize: 16,
    color: colors.text,
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
  debugCard: {
    margin: 10,
    backgroundColor: '#f5f5f5',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#666',
  },
  debugText: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  testButton: {
    marginTop: 10,
    backgroundColor: colors.primary,
  },
}); 