import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, ProgressBar, SegmentedButtons } from 'react-native-paper';
import { colors } from '../../theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { QuickInputWidget } from '../../components/QuickInputWidget';

export const DashboardScreen = ({ navigation }: { navigation: any }) => {
  const { 
    drinks, 
    settings, 
    budget, 
    userProfile, 
    error, 
    preGamePlans,
    dailyTracker,
    monthlyTracker,
    historicalData
  } = useApp();

  const [timeRange, setTimeRange] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Use the daily tracker data if available
  const dailyConsumption = dailyTracker?.drinks || 0;
  const dailySpent = dailyTracker?.spending || 0;
  const dailyLimit = settings.dailyLimit;
  const dailyProgressPercentage = dailyConsumption / dailyLimit;

  // Use the monthly tracker data if available
  const monthlyConsumption = monthlyTracker?.drinks || 0;
  const monthlySpent = monthlyTracker?.spending || 0;
  const monthlyBudget = budget.monthlyBudget;
  const monthlyBudgetPercentage = monthlySpent / monthlyBudget;
  
  // Calculate days within limit for the month
  const daysWithinLimit = monthlyTracker?.daysWithinLimit || 0;
  const totalDaysInMonth = monthlyTracker?.totalDays || 30;
  const daysWithinLimitPercentage = daysWithinLimit / totalDaysInMonth;

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
  const successRate = calculateSuccessRate(historicalData.monthlyRecords, budget);
  
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

  const handleViewPreGamePlanner = () => {
    navigation.navigate('PreGamePlanner');
  };

  // Get upcoming pre-game plans (sorted by date)
  const upcomingPlans = preGamePlans
    .filter(plan => !plan.completed && new Date(plan.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3); // Show only the next 3 upcoming plans

  // Get historical data for the selected time range
  const getHistoricalData = () => {
    if (timeRange === 'daily') {
      // Get the last 7 days of data
      const last7Days = historicalData.dailyRecords
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 7);
      
      return last7Days.map(day => ({
        label: format(new Date(day.date), 'dd/MM'),
        drinks: day.drinks,
        spending: day.spending,
        withinLimit: day.drinks <= settings.dailyLimit ? 1 : 0,
      }));
    } else if (timeRange === 'weekly') {
      // Get the last 4 weeks of data
      const last4Weeks = historicalData.dailyRecords
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 28);
      
      // Group by week
      const weeks: { [key: string]: { drinks: number, spending: number, days: number, withinLimit: number } } = {};
      
      last4Weeks.forEach(day => {
        const date = new Date(day.date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = format(weekStart, 'yyyy-MM-dd');
        
        if (!weeks[weekKey]) {
          weeks[weekKey] = { drinks: 0, spending: 0, days: 0, withinLimit: 0 };
        }
        
        weeks[weekKey].drinks += day.drinks;
        weeks[weekKey].spending += day.spending;
        weeks[weekKey].days += 1;
        if (day.drinks <= settings.dailyLimit) {
          weeks[weekKey].withinLimit += 1;
        }
      });
      
      return Object.entries(weeks)
        .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
        .slice(0, 4)
        .map(([weekStart, data]) => ({
          label: `Week ${format(new Date(weekStart), 'dd/MM')}`,
          drinks: data.drinks,
          spending: data.spending,
          withinLimit: data.days > 0 ? data.withinLimit / data.days : 0,
        }));
    } else {
      // Get the last 6 months of data
      const last6Months = historicalData.monthlyRecords
        .sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month))
        .slice(0, 6);
      
      return last6Months.map(month => ({
        label: format(new Date(month.year, month.month - 1), 'MMM yyyy'),
        drinks: month.drinks,
        spending: month.spending,
        withinLimit: month.daysWithinLimit / month.totalDays,
      }));
    }
  };

  const historicalDataPoints = getHistoricalData();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Welcome back, {userProfile?.name || 'User'}</Text>
      </View>
      
      <View style={styles.content}>
        {/* Quick Input Widget */}
        <QuickInputWidget />
        
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
                <Text style={styles.overviewValue}>£{dailySpent.toFixed(2)}/{budget.dailyBudget.toFixed(2)}</Text>
                <ProgressBar 
                  progress={dailySpent / budget.dailyBudget} 
                  color={(dailySpent / budget.dailyBudget) > 0.8 ? colors.error : colors.primary} 
                  style={styles.progressBar} 
                />
              </View>
            </View>
          </Card.Content>
        </Card>
        
        {/* Historical Data */}
        <Card style={styles.historicalCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Historical Data</Text>
              <SegmentedButtons
                value={timeRange}
                onValueChange={setTimeRange}
                buttons={[
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'monthly', label: 'Monthly' },
                ]}
              />
            </View>
            
            {historicalDataPoints.length > 0 ? (
              <View style={styles.historicalDataContainer}>
                {historicalDataPoints.map((point, index) => (
                  <View key={index} style={styles.historicalDataPoint}>
                    <Text style={styles.historicalLabel}>{point.label}</Text>
                    <View style={styles.historicalDataRow}>
                      <Text style={styles.historicalValue}>Drinks: {point.drinks}</Text>
                      <Text style={styles.historicalValue}>£{point.spending.toFixed(2)}</Text>
                    </View>
                    <View style={styles.historicalProgressContainer}>
                      <ProgressBar 
                        progress={point.withinLimit} 
                        color={point.withinLimit > 0.7 ? colors.primary : colors.error} 
                        style={styles.historicalProgressBar} 
                      />
                      <Text style={styles.historicalProgressText}>
                        {Math.round(point.withinLimit * 100)}% within limit
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyHistoricalContainer}>
                <Text style={styles.emptyMessage}>No historical data available yet</Text>
              </View>
            )}
          </Card.Content>
        </Card>
        
        {/* Monthly Summary */}
        <Card style={styles.monthlyCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Monthly Summary</Text>
            <View style={styles.monthlyContent}>
              <View style={styles.monthlyItem}>
                <Text style={styles.monthlyLabel}>Total Drinks</Text>
                <Text style={styles.monthlyValue}>{monthlyConsumption}</Text>
              </View>
              <View style={styles.monthlyItem}>
                <Text style={styles.monthlyLabel}>Total Spending</Text>
                <Text style={styles.monthlyValue}>£{monthlySpent.toFixed(2)}</Text>
              </View>
              <View style={styles.monthlyItem}>
                <Text style={styles.monthlyLabel}>Days Within Limit</Text>
                <Text style={styles.monthlyValue}>{daysWithinLimit}/{totalDaysInMonth}</Text>
                <ProgressBar 
                  progress={daysWithinLimitPercentage} 
                  color={daysWithinLimitPercentage > 0.7 ? colors.primary : colors.error} 
                  style={styles.progressBar} 
                />
              </View>
            </View>
          </Card.Content>
        </Card>
        
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
                      {format(new Date(plan.date), 'dd-MM-yyyy')}
                    </Text>
                  </View>
                  <Text style={styles.planLocation}>{plan.location}</Text>
                  <View style={styles.planLimits}>
                    <Text style={styles.planLimit}>Max Drinks: {plan.maxDrinks}</Text>
                    <Text style={styles.planLimit}>Max Spending: £{plan.maxSpending.toFixed(2)}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyPreGameContainer}>
                <Text style={styles.emptyPreGameText}>No upcoming pre-game plans</Text>
                <Button 
                  mode="contained" 
                  onPress={handleViewPreGamePlanner}
                  style={styles.emptyButton}
                >
                  Create a Plan
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
};

// Helper function to calculate success rate
const calculateSuccessRate = (drinks: any[], budget: any) => {
  // This is a simplified calculation - in a real app, you'd want to
  // calculate this based on actual monthly data and budget adherence
  const totalDrinks = drinks.length;
  if (totalDrinks === 0) return 0.5; // Default to middle ground if no data
  
  // For demo purposes, we'll use a random value between 0.3 and 0.9
  // In a real app, this would be calculated based on actual data
  return 0.3 + Math.random() * 0.6;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    paddingTop: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  content: {
    padding: 16,
  },
  treeCard: {
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 2,
  },
  treeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  treeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '40%',
  },
  groundContainer: {
    width: '100%',
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
  },
  groundFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressInfo: {
    flex: 1,
    marginLeft: 16,
  },
  progressAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  progressLabel: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  successRate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  remainingAmount: {
    fontSize: 14,
    color: colors.text,
  },
  overviewCard: {
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
  overviewContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewItem: {
    flex: 1,
    marginHorizontal: 8,
  },
  overviewLabel: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  historicalCard: {
    margin: 16,
    borderRadius: 12,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historicalDataContainer: {
    marginTop: 16,
  },
  historicalDataPoint: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  historicalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: colors.text,
  },
  historicalDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historicalValue: {
    fontSize: 14,
    color: colors.text,
  },
  historicalProgressContainer: {
    marginTop: 8,
  },
  historicalProgressBar: {
    height: 8,
    borderRadius: 4,
  },
  historicalProgressText: {
    fontSize: 12,
    color: colors.text,
    marginTop: 4,
    textAlign: 'right',
  },
  emptyHistoricalContainer: {
    alignItems: 'center',
    padding: 24,
  },
  emptyMessage: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: colors.primary,
  },
  preGameCard: {
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 2,
  },
  planItem: {
    marginBottom: 12,
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
    marginBottom: 4,
  },
  planDate: {
    fontSize: 14,
    color: colors.text,
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
    fontSize: 14,
    color: colors.text,
  },
  monthlyCard: {
    margin: 16,
    borderRadius: 12,
    elevation: 2,
  },
  monthlyContent: {
    marginTop: 16,
  },
  monthlyItem: {
    marginBottom: 16,
  },
  monthlyLabel: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  monthlyValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  emptyPreGameContainer: {
    alignItems: 'center',
    padding: 24,
  },
  emptyPreGameText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
}); 