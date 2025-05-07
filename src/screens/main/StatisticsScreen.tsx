import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { Text, Card, Button, useTheme, ActivityIndicator, Divider, IconButton } from 'react-native-paper';
import { useApp } from '../../context/AppContext';
import { DrinkEntry } from '../../services/storage';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

type StatisticsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Statistics'>;

export const StatisticsScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<StatisticsScreenNavigationProp>();
  const { drinks, isLoading, error } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalDrinks: 0,
    totalSpent: 0,
    weeklyAverage: 0,
    monthlyAverage: 0,
    mostCommonDrink: '',
    mostCommonLocation: '',
    averageDrinksPerDay: 0,
    averageSpendingPerDay: 0,
    successRate: 0,
    monthlyTrend: [] as { month: string; drinks: number; spent: number }[],
    categoryDistribution: [] as { name: string; count: number; color: string; legendFontColor: string; legendFontSize: number }[],
  });

  const calculateStats = () => {
    if (!drinks || drinks.length === 0) {
      setStats({
        totalDrinks: 0,
        totalSpent: 0,
        weeklyAverage: 0,
        monthlyAverage: 0,
        mostCommonDrink: 'No data',
        mostCommonLocation: 'No data',
        averageDrinksPerDay: 0,
        averageSpendingPerDay: 0,
        successRate: 0,
        monthlyTrend: [],
        categoryDistribution: [],
      });
      return;
    }

    // Calculate total drinks and spending
    const totalDrinks = drinks.length;
    const totalSpent = drinks.reduce((sum, drink) => sum + drink.price, 0);

    // Calculate weekly and monthly averages
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const weeklyDrinks = drinks.filter(
      drink => new Date(drink.timestamp) >= weekStart && new Date(drink.timestamp) <= weekEnd
    );
    const monthlyDrinks = drinks.filter(
      drink => new Date(drink.timestamp) >= monthStart && new Date(drink.timestamp) <= monthEnd
    );

    const weeklyAverage = weeklyDrinks.length;
    const monthlyAverage = monthlyDrinks.length;

    // Find most common drink and location
    const drinkCounts: Record<string, number> = {};
    const locationCounts: Record<string, number> = {};

    drinks.forEach(drink => {
      const drinkKey = `${drink.category} - ${drink.type} - ${drink.brand}`;
      drinkCounts[drinkKey] = (drinkCounts[drinkKey] || 0) + 1;
      
      if (drink.location) {
        locationCounts[drink.location] = (locationCounts[drink.location] || 0) + 1;
      }
    });

    let mostCommonDrink = 'No data';
    let mostCommonLocation = 'No data';
    let maxDrinkCount = 0;
    let maxLocationCount = 0;

    Object.entries(drinkCounts).forEach(([drink, count]) => {
      if (count > maxDrinkCount) {
        maxDrinkCount = count;
        mostCommonDrink = drink;
      }
    });

    Object.entries(locationCounts).forEach(([location, count]) => {
      if (count > maxLocationCount) {
        maxLocationCount = count;
        mostCommonLocation = location;
      }
    });

    // Calculate average drinks and spending per day
    const firstDrinkDate = new Date(Math.min(...drinks.map(d => new Date(d.timestamp).getTime())));
    const daysDiff = Math.max(1, Math.ceil((now.getTime() - firstDrinkDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    const averageDrinksPerDay = totalDrinks / daysDiff;
    const averageSpendingPerDay = totalSpent / daysDiff;

    // Calculate success rate (percentage of days within budget)
    const successRate = calculateSuccessRate(drinks);

    // Calculate monthly trend
    const monthlyTrend = calculateMonthlyTrend(drinks);

    // Calculate category distribution for pie chart
    const categoryDistribution = calculateCategoryDistribution(drinks);

    setStats({
      totalDrinks,
      totalSpent,
      weeklyAverage,
      monthlyAverage,
      mostCommonDrink,
      mostCommonLocation,
      averageDrinksPerDay,
      averageSpendingPerDay,
      successRate,
      monthlyTrend,
      categoryDistribution,
    });
  };

  const calculateSuccessRate = (drinks: DrinkEntry[]): number => {
    if (!drinks || drinks.length === 0) return 0;

    // Group drinks by month
    const drinksByMonth: Record<string, DrinkEntry[]> = {};
    
    drinks.forEach(drink => {
      const date = new Date(drink.timestamp);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      if (!drinksByMonth[monthKey]) {
        drinksByMonth[monthKey] = [];
      }
      
      drinksByMonth[monthKey].push(drink);
    });

    // Calculate success rate based on budget adherence
    let successfulMonths = 0;
    let totalMonths = Object.keys(drinksByMonth).length;

    Object.values(drinksByMonth).forEach(monthDrinks => {
      // If no drinks in a month, consider it successful
      if (monthDrinks.length === 0) {
        successfulMonths++;
        return;
      }

      // Calculate total spending for the month
      const totalSpent = monthDrinks.reduce((sum, drink) => sum + drink.price, 0);
      
      // For now, we'll consider a month successful if spending is reasonable
      // In a real app, this would compare against the user's budget
      if (totalSpent <= 500) {
        successfulMonths++;
      }
    });

    return totalMonths > 0 ? (successfulMonths / totalMonths) * 100 : 0;
  };

  const calculateMonthlyTrend = (drinks: DrinkEntry[]): { month: string; drinks: number; spent: number }[] => {
    if (!drinks || drinks.length === 0) return [];

    // Get the last 6 months
    const now = new Date();
    const months = [];
    
    for (let i = 0; i < 6; i++) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const monthDrinks = drinks.filter(
        drink => new Date(drink.timestamp) >= monthStart && new Date(drink.timestamp) <= monthEnd
      );
      
      const monthSpent = monthDrinks.reduce((sum, drink) => sum + drink.price, 0);
      
      months.push({
        month: format(monthDate, 'MMM yyyy'),
        drinks: monthDrinks.length,
        spent: monthSpent,
      });
    }
    
    return months.reverse();
  };

  const calculateCategoryDistribution = (drinks: DrinkEntry[]) => {
    const distribution: Record<string, number> = {};
    
    drinks.forEach(drink => {
      distribution[drink.category] = (distribution[drink.category] || 0) + 1;
    });

    return Object.entries(distribution).map(([category, count]) => ({
      name: category,
      count,
      color: getRandomColor(category),
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    }));
  };

  const getRandomColor = (seed: string) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
      '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71'
    ];
    const index = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  useEffect(() => {
    calculateStats();
  }, [drinks]);

  const onRefresh = () => {
    setRefreshing(true);
    calculateStats();
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading statistics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
        <Text variant="headlineMedium" style={styles.title}>Your Statistics</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {error && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
        )}
        
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>Overview</Text>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text variant="headlineMedium">{stats.totalDrinks}</Text>
                <Text variant="bodyMedium">Total Drinks</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineMedium">${stats.totalSpent.toFixed(2)}</Text>
                <Text variant="bodyMedium">Total Spent</Text>
              </View>
            </View>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text variant="headlineMedium">{stats.weeklyAverage}</Text>
                <Text variant="bodyMedium">This Week</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineMedium">{stats.monthlyAverage}</Text>
                <Text variant="bodyMedium">This Month</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>Averages</Text>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text variant="headlineMedium">{stats.averageDrinksPerDay.toFixed(1)}</Text>
                <Text variant="bodyMedium">Drinks/Day</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineMedium">${stats.averageSpendingPerDay.toFixed(2)}</Text>
                <Text variant="bodyMedium">Spent/Day</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>Preferences</Text>
            <View style={styles.preferenceItem}>
              <Text variant="bodyMedium">Most Common Drink:</Text>
              <Text variant="bodyLarge">{stats.mostCommonDrink}</Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.preferenceItem}>
              <Text variant="bodyMedium">Most Common Location:</Text>
              <Text variant="bodyLarge">{stats.mostCommonLocation}</Text>
            </View>
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>Success Rate</Text>
            <View style={styles.successContainer}>
              <Text variant="displaySmall">{stats.successRate.toFixed(0)}%</Text>
              <Text variant="bodyMedium">of months within budget</Text>
            </View>
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>Monthly Trend</Text>
            {stats.monthlyTrend.length > 0 && (
              <BarChart
                data={{
                  labels: stats.monthlyTrend.map(month => month.month),
                  datasets: [{
                    data: stats.monthlyTrend.map(month => month.drinks)
                  }]
                }}
                width={Dimensions.get('window').width - 64}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: '#fff0d4',
                  backgroundGradientFrom: '#fff0d4',
                  backgroundGradientTo: '#fff0d4',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  barPercentage: 0.5,
                }}
                style={styles.chart}
                showValuesOnTopOfBars
                fromZero
                segments={5}
              />
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>Drink Categories</Text>
            {stats.categoryDistribution && stats.categoryDistribution.length > 0 && (
              <View style={styles.pieChartContainer}>
                <PieChart
                  data={stats.categoryDistribution}
                  width={Dimensions.get('window').width - 64}
                  height={220}
                  chartConfig={{
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  }}
                  accessor="count"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  style={styles.chart}
                  absolute
                  hasLegend
                  center={[(Dimensions.get('window').width - 64) / 2, 0]}
                />
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
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
    backgroundColor: '#fff0d4',
    elevation: 2,
  },
  backButton: {
    marginRight: 8,
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff7e9',
  },
  loadingText: {
    marginTop: 16,
  },
  errorText: {
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#fff0d4',
    elevation: 2,
  },
  cardTitle: {
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  preferenceItem: {
    marginBottom: 8,
  },
  divider: {
    marginVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  successContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  pieChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 