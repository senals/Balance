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
import { API_CONFIG } from '../../config/api.config';

export const BudgetTrackerScreen = ({ navigation }: { navigation: any }) => {
  const { drinks, budget, error, currentUser, updateBudget, setDrinks } = useApp();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [testTransaction, setTestTransaction] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);

  // Debug logging function
  const addDebugLog = (message: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString();
    let logMessage = `[${timestamp}] ${message}`;
    
    if (data) {
      try {
        const dataString = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
        logMessage += `\nData: ${dataString}`;
      } catch (e) {
        logMessage += `\nData: [Unable to stringify]`;
      }
    }
    
    console.log(logMessage);
    setDebugInfo(prev => [logMessage, ...prev].slice(-20));
  };

  // Calculate daily spending
  const today = new Date().toISOString().split('T')[0];
  
  // Get expenses from both drinks and budget.expenses
  const dailyDrinks = drinks.filter(drink => {
    const drinkDate = new Date(drink.timestamp).toISOString().split('T')[0];
    return drinkDate === today;
  });
  const dailyDrinksSpent = dailyDrinks.reduce((sum, drink) => sum + (drink.price || 0), 0);
  
  const dailyExpenses = budget?.expenses?.filter(expense => {
    const expenseDate = new Date(expense.date).toISOString().split('T')[0];
    return expenseDate === today;
  }) || [];
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

  const progressPercentage = dailyBudget > 0 ? dailySpent / dailyBudget : 0;

  // Enhanced debug information
  const debugBudgetInfo = {
    budget: {
      dailyBudget: budget?.dailyBudget,
      weeklyBudget: budget?.weeklyBudget,
      monthlyBudget: budget?.monthlyBudget,
      expensesCount: budget?.expenses?.length || 0,
      expenses: budget?.expenses?.slice(0, 3) // Show first 3 expenses
    },
    drinks: {
      totalCount: drinks.length,
      withPrice: drinks.filter(d => d.price > 0).length,
      totalSpent: drinks.reduce((sum, d) => sum + (d.price || 0), 0),
      recentDrinks: drinks.slice(0, 3) // Show first 3 drinks
    },
    calculations: {
      dailySpent,
      weeklySpent,
      monthlySpent,
      dailyBudget,
      weeklyBudget,
      monthlyBudget,
      progressPercentage
    },
    state: {
      loading,
      refreshing,
      apiAvailable,
      currentUser: currentUser?.id,
      error
    }
  };

  // Log debug info on mount and when data changes
  useEffect(() => {
    addDebugLog('Budget Tracker State Updated', debugBudgetInfo);
  }, [budget, drinks, loading, refreshing, apiAvailable, currentUser, error]);

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
      // Always try local storage first to ensure we have some data
      const [localDrinks, localBudget] = await Promise.all([
        storage.drinks.getAll(currentUser.id),
        storage.budget.get(currentUser.id)
      ]);
      
      // Set state with local data immediately
      if (localDrinks?.length > 0) {
        setDrinks(localDrinks);
        addDebugLog(`Loaded ${localDrinks.length} drinks from local storage`);
      }
      
      if (localBudget) {
        updateBudget(localBudget);
        addDebugLog(`Loaded budget from local storage`);
      }
      
      // Check API availability with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HEALTH}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        const isApiAvailable = response.ok;
        setApiAvailable(isApiAvailable);
        addDebugLog(`API Check: ${isApiAvailable}`);
        
        if (isApiAvailable) {
          try {
            // Get drinks from API
            const apiDrinks = await drinkApi.getAll(currentUser.id);
            if (Array.isArray(apiDrinks) && apiDrinks.length > 0) {
              setDrinks(apiDrinks);
              addDebugLog(`Updated with ${apiDrinks.length} drinks from API`);
            }
            
            // Get budget from API
            const apiBudget = await dataService.budget.get(currentUser.id);
            if (apiBudget) {
              const budgetData = {
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
              updateBudget(budgetData);
              addDebugLog(`Updated budget from API`);
            }
          } catch (apiError: any) {
            addDebugLog(`API operations failed: ${apiError.message}`);
            // Continue with local data, don't reset app state
          }
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          addDebugLog('API check timed out');
        } else {
          addDebugLog(`API check failed: ${error.message}`);
        }
        setApiAvailable(false);
      }
    } catch (error: any) {
      addDebugLog(`Error fetching data: ${error.message}`);
      // Don't throw - use whatever data we have
    } finally {
      setLoading(false);
      addDebugLog('Data fetch completed');
    }
  };

  // Initial data fetch
  useEffect(() => {
    const initialize = async () => {
      if (!currentUser?.id) return;
      
      try {
        // First sync data between local storage and API
        await dataService.syncLocalAndRemoteData(currentUser.id);
        
        // Then fetch the latest data
        await fetchData();
      } catch (error: any) {
        addDebugLog(`Error during initialization: ${error.message}`);
      }
    };
    
    initialize();
  }, [currentUser?.id]);

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

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
          <View style={styles.debugHeader}>
            <Text style={styles.debugTitle}>Debug Information</Text>
            <Button 
              mode="text"
              onPress={() => setShowDebug(!showDebug)}
              icon={showDebug ? "chevron-up" : "chevron-down"}
            >
              {showDebug ? "Hide" : "Show"}
            </Button>
          </View>
          {showDebug && (
            <>
              <View style={styles.debugSection}>
                <Text style={styles.debugSubtitle}>Current State</Text>
                <Text style={styles.debugText}>
                  User ID: {currentUser?.id || 'Not available'}{'\n'}
                  API Available: {apiAvailable ? 'Yes' : 'No'}{'\n'}
                  Loading: {loading ? 'Yes' : 'No'}{'\n'}
                  Refreshing: {refreshing ? 'Yes' : 'No'}{'\n'}
                  Error: {error || 'None'}{'\n'}
                  Drinks Count: {drinks.length}{'\n'}
                  Budget Expenses Count: {budget?.expenses?.length || 0}{'\n'}
                  Daily Budget: £{dailyBudget}{'\n'}
                  Daily Spent: £{dailySpent}{'\n'}
                  Weekly Budget: £{weeklyBudget}{'\n'}
                  Weekly Spent: £{weeklySpent}{'\n'}
                  Monthly Budget: £{monthlyBudget}{'\n'}
                  Monthly Spent: £{monthlySpent}
                </Text>
              </View>
              <View style={styles.debugSection}>
                <Text style={styles.debugSubtitle}>Recent Logs</Text>
                {debugInfo.map((log, index) => (
                  <Text key={`debug-${index}-${Date.now()}`} style={styles.debugText}>
                    {log}
                  </Text>
                ))}
              </View>
            </>
          )}
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
    backgroundColor: '#fff7e9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff7e9',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.text,
  },
  apiStatusCard: {
    margin: 10,
    backgroundColor: '#fff0d4',
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
    backgroundColor: '#fff0d4',
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
    backgroundColor: '#fff0d4',
    borderRadius: 12,
    elevation: 2,
  },
  recentCard: {
    flex: 1,
    marginLeft: 6,
    backgroundColor: '#fff0d4',
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
    backgroundColor: '#fff0d4',
  },
  debugHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#666',
  },
  debugSection: {
    marginBottom: 10,
  },
  debugSubtitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
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