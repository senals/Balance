import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, ProgressBar } from 'react-native-paper';
import { colors } from '../../theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';

export const DashboardScreen = ({ navigation }: { navigation: any }) => {
  const { drinks, settings, budget, userProfile, error } = useApp();

  // Calculate daily consumption
  const today = new Date().toISOString().split('T')[0];
  const dailyDrinks = drinks.filter(drink => 
    drink.timestamp.startsWith(today)
  );
  const dailyConsumption = dailyDrinks.reduce((sum, drink) => sum + drink.quantity, 0);
  const dailyLimit = settings.dailyLimit;
  const dailyProgressPercentage = dailyConsumption / dailyLimit;

  // Calculate daily spending
  const dailySpent = dailyDrinks.reduce((sum, drink) => sum + (drink.price || 0), 0);
  const dailyBudget = budget.dailyBudget;
  const dailyBudgetPercentage = dailySpent / dailyBudget;

  // Calculate weekly consumption
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weeklyDrinks = drinks.filter(drink => 
    new Date(drink.timestamp) >= weekStart
  );
  const weeklyConsumption = weeklyDrinks.reduce((sum, drink) => sum + drink.quantity, 0);

  // Calculate weekly spending
  const weeklySpent = weeklyDrinks.reduce((sum, drink) => sum + (drink.price || 0), 0);
  const weeklyBudget = budget.weeklyBudget;
  const weeklyBudgetPercentage = weeklySpent / weeklyBudget;

  // Calculate monthly consumption
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthlyDrinks = drinks.filter(drink => 
    new Date(drink.timestamp) >= monthStart
  );
  const monthlyConsumption = monthlyDrinks.reduce((sum, drink) => sum + drink.quantity, 0);

  // Calculate monthly spending
  const monthlySpent = monthlyDrinks.reduce((sum, drink) => sum + (drink.price || 0), 0);
  const monthlyBudget = budget.monthlyBudget;
  const monthlyBudgetPercentage = monthlySpent / monthlyBudget;

  // Get recent drinks
  const recentDrinks = [...drinks]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 3)
    .map(drink => ({
      id: drink.id,
      drink: `${drink.brand} (${drink.quantity}x)`,
      date: new Date(drink.timestamp).toLocaleDateString(),
      time: new Date(drink.timestamp).toLocaleTimeString(),
    }));

  // Calculate long-term progress
  const totalMonths = 12; // Assuming a 12-month goal period
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const monthsCompleted = currentMonth - 1; // 0-11
  
  // Calculate success rate (percentage of months where user stayed within budget)
  const successRate = calculateSuccessRate(drinks, budget);
  
  // Determine tree growth stage based on success rate
  const getTreeGrowthStage = () => {
    if (successRate < 0.2) return 'sprout';
    if (successRate < 0.4) return 'seedling';
    if (successRate < 0.6) return 'sapling';
    if (successRate < 0.8) return 'young-tree';
    return 'mature-tree';
  };

  const handleViewDrinkTracker = () => {
    navigation.navigate('DrinkTracker');
  };

  const handleViewBudgetTracker = () => {
    navigation.navigate('BudgetTracker');
  };

  const handleViewProfile = () => {
    navigation.navigate('Profile');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Welcome back, {userProfile?.name || 'User'}</Text>
      </View>
      
      <View style={styles.content}>
        {/* Long-term Progress Tree */}
        <Card style={styles.treeCard}>
          <Card.Content style={styles.treeContent}>
            <View style={styles.treeContainer}>
              <MaterialCommunityIcons 
                name={getTreeGrowthStage() as any} 
                size={120} 
                color={colors.primary} 
              />
              <View style={styles.groundContainer}>
                <View 
                  style={[
                    styles.groundFill, 
                    { width: `${successRate * 100}%` }
                  ]} 
                />
              </View>
            </View>
            <View style={styles.progressInfo}>
              <Text style={styles.progressAmount}>{monthsCompleted}/{totalMonths}</Text>
              <Text style={styles.progressLabel}>Months Completed</Text>
              <ProgressBar 
                progress={monthsCompleted / totalMonths} 
                color={colors.primary} 
                style={styles.progressBar} 
              />
              <Text style={styles.successRate}>Success Rate: {Math.round(successRate * 100)}%</Text>
              <Text style={styles.remainingAmount}>{totalMonths - monthsCompleted} months remaining</Text>
            </View>
          </Card.Content>
        </Card>
        
        {/* Daily Overview */}
        <Card style={styles.overviewCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Today's Overview</Text>
            <View style={styles.overviewContent}>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewLabel}>Drinks</Text>
                <Text style={styles.overviewValue}>{dailyConsumption}/{dailyLimit}</Text>
                <ProgressBar 
                  progress={dailyProgressPercentage} 
                  color={dailyProgressPercentage > 0.8 ? colors.error : colors.primary} 
                  style={styles.progressBar} 
                />
              </View>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewLabel}>Spending</Text>
                <Text style={styles.overviewValue}>${dailySpent.toFixed(2)}/${dailyBudget.toFixed(2)}</Text>
                <ProgressBar 
                  progress={dailyBudgetPercentage} 
                  color={dailyBudgetPercentage > 0.8 ? colors.error : colors.primary} 
                  style={styles.progressBar} 
                />
              </View>
            </View>
          </Card.Content>
        </Card>
        
        {/* Weekly and Monthly Summary */}
        <View style={styles.summaryRow}>
          <Card style={styles.summaryCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Weekly</Text>
              <View style={styles.summaryContent}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Drinks</Text>
                  <Text style={styles.summaryValue}>{weeklyConsumption}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Spending</Text>
                  <Text style={styles.summaryValue}>${weeklySpent.toFixed(2)}</Text>
                </View>
                <ProgressBar 
                  progress={weeklyBudgetPercentage} 
                  color={weeklyBudgetPercentage > 0.8 ? colors.error : colors.primary} 
                  style={styles.progressBar} 
                />
              </View>
            </Card.Content>
          </Card>
          
          <Card style={styles.summaryCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Monthly</Text>
              <View style={styles.summaryContent}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Drinks</Text>
                  <Text style={styles.summaryValue}>{monthlyConsumption}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Spending</Text>
                  <Text style={styles.summaryValue}>${monthlySpent.toFixed(2)}</Text>
                </View>
                <ProgressBar 
                  progress={monthlyBudgetPercentage} 
                  color={monthlyBudgetPercentage > 0.8 ? colors.error : colors.primary} 
                  style={styles.progressBar} 
                />
              </View>
            </Card.Content>
          </Card>
        </View>
        
        {/* Recent Activity */}
        <Card style={styles.recentCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {recentDrinks.length > 0 ? (
              recentDrinks.map(drink => (
                <View key={drink.id} style={styles.activityItem}>
                  <MaterialCommunityIcons 
                    name="glass-cocktail" 
                    size={24} 
                    color={colors.primary} 
                  />
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityText}>{drink.drink}</Text>
                    <Text style={styles.activityDateTime}>{drink.date} {drink.time}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyMessage}>No recent activity</Text>
            )}
          </Card.Content>
        </Card>
        
        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <Button 
            mode="contained" 
            onPress={handleViewDrinkTracker}
            style={styles.actionButton}
            icon="glass-cocktail"
          >
            Drink Tracker
          </Button>
          <Button 
            mode="contained" 
            onPress={handleViewBudgetTracker}
            style={styles.actionButton}
            icon="cash"
          >
            Budget Tracker
          </Button>
        </View>
      </View>
    </ScrollView>
  );
};

// Helper function to calculate success rate based on budget adherence
const calculateSuccessRate = (drinks: any[], budget: any) => {
  // Group drinks by month
  const drinksByMonth: { [key: string]: any[] } = {};
  
  drinks.forEach(drink => {
    const date = new Date(drink.timestamp);
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    
    if (!drinksByMonth[monthKey]) {
      drinksByMonth[monthKey] = [];
    }
    
    drinksByMonth[monthKey].push(drink);
  });
  
  // Calculate success for each month
  let successfulMonths = 0;
  let totalMonths = 0;
  
  Object.keys(drinksByMonth).forEach(monthKey => {
    const monthDrinks = drinksByMonth[monthKey];
    const monthSpent = monthDrinks.reduce((sum, drink) => sum + (drink.price || 0), 0);
    
    // Consider a month successful if spending is within budget
    if (monthSpent <= budget.monthlyBudget) {
      successfulMonths++;
    }
    
    totalMonths++;
  });
  
  // If no months have passed yet, return a default value
  if (totalMonths === 0) {
    return 0.1; // Start with a small sprout
  }
  
  return successfulMonths / totalMonths;
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
    paddingBottom: 24,
  },
  treeCard: {
    marginBottom: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 2,
  },
  treeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  treeContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groundContainer: {
    position: 'absolute',
    bottom: 0,
    width: 120,
    height: 10,
    backgroundColor: colors.background,
    borderRadius: 5,
    overflow: 'hidden',
  },
  groundFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressInfo: {
    flex: 1,
    marginLeft: 12,
  },
  progressAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
    marginBottom: 6,
  },
  successRate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 4,
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
  overviewCard: {
    marginBottom: 12,
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
  overviewContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewItem: {
    flex: 1,
    marginHorizontal: 8,
  },
  overviewLabel: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 2,
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
  recentCard: {
    marginBottom: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  activityInfo: {
    marginLeft: 12,
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  activityDateTime: {
    fontSize: 10,
    color: colors.text,
    opacity: 0.7,
  },
  emptyMessage: {
    textAlign: 'center',
    color: colors.text,
    opacity: 0.7,
    marginVertical: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 6,
  },
}); 