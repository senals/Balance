import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { useApp } from '../src/context/AppContext';
import { useRouter } from 'expo-router';

export default function TrackerPage() {
  const { 
    isLoading, 
    dailyTracker, 
    monthlyTracker, 
    loadTrackerData,
    loadHistoricalData
  } = useApp();
  const router = useRouter();

  // Ensure tracker data is loaded
  useEffect(() => {
    if (!dailyTracker || !monthlyTracker) {
      loadTrackerData();
    }
  }, [dailyTracker, monthlyTracker]);

  // Load historical data if needed
  useEffect(() => {
    loadHistoricalData();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading tracker data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Your Trackers</Text>
      
      <Card style={styles.card}>
        <Card.Title title="Alcohol Consumption" />
        <Card.Content>
          <Text variant="bodyMedium">Track your daily alcohol intake and spending</Text>
          {dailyTracker && (
            <View style={styles.trackerInfo}>
              <Text>Today's drinks: {dailyTracker.drinks}</Text>
              <Text>Today's spending: £{dailyTracker.spending.toFixed(2)}</Text>
            </View>
          )}
          <Button 
            mode="contained" 
            onPress={() => router.push('/drink-input')}
            style={styles.button}
          >
            Add Drink
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Financial Overview" />
        <Card.Content>
          <Text variant="bodyMedium">Monitor your spending patterns and budget</Text>
          {monthlyTracker && (
            <View style={styles.trackerInfo}>
              <Text>Monthly drinks: {monthlyTracker.drinks}</Text>
              <Text>Monthly spending: £{monthlyTracker.spending.toFixed(2)}</Text>
              <Text>Days within limit: {monthlyTracker.daysWithinLimit}/{monthlyTracker.totalDays}</Text>
            </View>
          )}
          <Button 
            mode="contained" 
            onPress={() => router.push('/budget-tracker')}
            style={styles.button}
          >
            View Budget
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  title: {
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
  },
  trackerInfo: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  button: {
    marginTop: 10,
  },
}); 