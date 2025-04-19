import React from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, Card, Button, ProgressBar } from 'react-native-paper';
import { colors } from '../../theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { format } from 'date-fns';

// Import plant growth images
const PlantGrowth1 = require('../../assets/images/Plantgrowth1.png');
const PlantGrowth2 = require('../../assets/images/Plantgrowth2.png');
const PlantGrowth3 = require('../../assets/images/Plantgrowth3.png');
const PlantGrowth4 = require('../../assets/images/Plantgrowth4.png');
const PlantGrowth5 = require('../../assets/images/Plantgrowth5.png');

export const DashboardScreen = ({ navigation }: { navigation: any }) => {
  const { drinks, settings, budget, userProfile, error, preGamePlans } = useApp();

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
  const totalWeeks = 4; // 4-week goal period
  
  // Calculate weeks completed based on actual user data
  const weeksCompleted = drinks.length > 0 
    ? Math.min(
        Math.floor(
          (new Date().getTime() - new Date(Math.min(...drinks.map(d => new Date(d.timestamp).getTime()))).getTime()) 
          / (1000 * 60 * 60 * 24 * 7) // Convert to weeks
        ) % 4, // Use modulo 4 to cycle through 4-week periods
        totalWeeks
      )
    : 0;
  
  // Calculate success rate (percentage of weeks where user stayed within budget)
  const successRate = calculateSuccessRate(drinks, budget);
  
  // Determine plant growth stage based on success rate
  const getPlantGrowthImage = () => {
    if (successRate < 0.2) return PlantGrowth1;
    if (successRate < 0.4) return PlantGrowth2;
    if (successRate < 0.6) return PlantGrowth3;
    if (successRate < 0.8) return PlantGrowth4;
    return PlantGrowth5;
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

  const handleViewPreGamePlanner = () => {
    navigation.navigate('PreGamePlanner');
  };

  // Get upcoming pre-game plans (sorted by date)
  const upcomingPlans = preGamePlans
    .filter(plan => !plan.completed && new Date(plan.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3); // Show only the next 3 upcoming plans

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Welcome back, {userProfile?.name || 'User'}</Text>
      </View>
      
      <View style={styles.content}>
        {/* Long-term Progress Plant */}
        <Card style={styles.treeCard}>
          <Card.Content style={styles.treeContent}>
            <View style={styles.treeContainer}>
              <Image 
                source={getPlantGrowthImage()} 
                style={styles.plantImage}
                resizeMode="contain"
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
              <Text style={styles.progressAmount}>{weeksCompleted}/{totalWeeks}</Text>
              <Text style={styles.progressLabel}>Weeks Completed</Text>
              <ProgressBar 
                progress={weeksCompleted / totalWeeks} 
                color={colors.primary} 
                style={styles.progressBar} 
              />
              <Text style={styles.successRate}>Success Rate: {Math.round(successRate * 100)}%</Text>
              <Text style={styles.remainingAmount}>{totalWeeks - weeksCompleted} weeks remaining</Text>
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
                  <Text style={styles.summaryValue}>£{weeklySpent.toFixed(2)}</Text>
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
                  <Text style={styles.summaryValue}>£{monthlySpent.toFixed(2)}</Text>
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
        
        {/* Pre-Game Plans */}
        <Card style={styles.preGameCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Pre-Game Plans</Text>
              <Button 
                mode="text" 
                onPress={handleViewPreGamePlanner}
                textColor={colors.primary}
              >
                View All
              </Button>
            </View>
            {upcomingPlans.length > 0 ? (
              upcomingPlans.map(plan => (
                <View key={plan.id} style={styles.planItem}>
                  <View style={styles.planHeader}>
                    <Text style={styles.planTitle}>{plan.title}</Text>
                    <Text style={styles.planDate}>
                      {format(new Date(plan.date), 'MMM dd')}
                    </Text>
                  </View>
                  <Text style={styles.planLocation}>{plan.location}</Text>
                  <View style={styles.planLimits}>
                    <Text style={styles.planLimit}>Max Drinks: {plan.maxDrinks}</Text>
                    <Text style={styles.planLimit}>Max Spending: ${plan.maxSpending.toFixed(2)}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyPreGameContainer}>
                <Text style={styles.emptyMessage}>No upcoming pre-game plans</Text>
                <Button 
                  mode="contained" 
                  onPress={handleViewPreGamePlanner}
                  style={styles.createPlanButton}
                >
                  Create a Plan
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>
        
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
  // If no drinks yet, return 0 for a new user
  if (!drinks || drinks.length === 0) {
    return 0;
  }

  // Get the user's start date (first drink)
  const startDate = new Date(Math.min(...drinks.map(d => new Date(d.timestamp).getTime())));
  const currentDate = new Date();
  
  // Group drinks by week from start date to current date
  const drinksByWeek: { [key: string]: any[] } = {};
  
  drinks.forEach(drink => {
    const date = new Date(drink.timestamp);
    const weekNumber = getWeekNumber(date);
    const weekKey = `${date.getFullYear()}-${weekNumber}`;
    
    if (!drinksByWeek[weekKey]) {
      drinksByWeek[weekKey] = [];
    }
    
    drinksByWeek[weekKey].push(drink);
  });
  
  // Calculate success for each week in the current 4-week period
  let successfulWeeks = 0;
  let weeksInPeriod = 0;
  
  // Get the start of the current 4-week period
  const currentWeekStart = new Date(currentDate);
  currentWeekStart.setDate(currentDate.getDate() - (currentDate.getDay() + 6) % 7); // Start of current week
  currentWeekStart.setDate(currentWeekStart.getDate() - (3 * 7)); // Go back 3 weeks to get start of 4-week period
  
  // Iterate through weeks in the current 4-week period
  let currentWeek = new Date(currentWeekStart);
  while (currentWeek <= currentDate) {
    const weekNumber = getWeekNumber(currentWeek);
    const weekKey = `${currentWeek.getFullYear()}-${weekNumber}`;
    const weekDrinks = drinksByWeek[weekKey] || [];
    const weekSpent = weekDrinks.reduce((sum, drink) => sum + (drink.price || 0), 0);
    
    // Consider a week successful if spending is within budget
    if (weekSpent <= budget.weeklyBudget) {
      successfulWeeks++;
    }
    
    weeksInPeriod++;
    currentWeek.setDate(currentWeek.getDate() + 7); // Move to next week
  }
  
  // If no weeks have passed yet, return 0
  if (weeksInPeriod === 0) {
    return 0;
  }
  
  return successfulWeeks / weeksInPeriod;
};

// Helper function to get week number
const getWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
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
  plantImage: {
    width: 100,
    height: 100,
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
  preGameCard: {
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  planDate: {
    fontSize: 14,
    color: colors.primary,
  },
  planLocation: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  planLimits: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  planLimit: {
    fontSize: 12,
    color: colors.text,
  },
  emptyPreGameContainer: {
    alignItems: 'center',
    padding: 16,
  },
  createPlanButton: {
    marginTop: 8,
  },
}); 