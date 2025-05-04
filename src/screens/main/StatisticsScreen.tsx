import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, useTheme, ActivityIndicator, Divider } from 'react-native-paper';
import { useApp } from '../../context/AppContext';
import { DrinkEntry } from '../../services/storage';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export const StatisticsScreen: React.FC = () => {
  const theme = useTheme();
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
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text variant="headlineMedium" style={styles.title}>Your Statistics</Text>
      
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
          {stats.monthlyTrend.map((month, index) => (
            <View key={index} style={styles.trendItem}>
              <Text variant="bodyMedium">{month.month}</Text>
              <View style={styles.trendDetails}>
                <Text variant="bodyMedium">{month.drinks} drinks</Text>
                <Text variant="bodyMedium">${month.spent.toFixed(2)}</Text>
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
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
  },
  successContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  trendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  trendDetails: {
    flexDirection: 'row',
    gap: 16,
  },
}); 