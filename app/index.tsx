import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useApp } from '../src/context/AppContext';
import { useRouter } from 'expo-router';

export default function HomePage() {
  const { 
    isLoading, 
    isInitialized, 
    error, 
    loadUserData, 
    loadTrackerData, 
    loadHistoricalData 
  } = useApp();
  const router = useRouter();

  // Load data in stages after initial render
  useEffect(() => {
    if (isInitialized && !isLoading) {
      // Load user data first
      loadUserData().then(() => {
        // Then load tracker data
        loadTrackerData().then(() => {
          // Finally load historical data
          loadHistoricalData();
        });
      });
    }
  }, [isInitialized, isLoading]);

  const handleViewTracker = () => {
    router.push('/tracker');
  };

  const handleViewSettings = () => {
    router.push('/settings');
  };

  if (!isInitialized || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading Balance...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text variant="headlineMedium" style={styles.title}>Welcome to Balance</Text>
        <Text variant="bodyLarge" style={styles.errorText}>
          {error}
        </Text>
        <Button 
          mode="contained" 
          onPress={loadInitialData}
          style={styles.button}
        >
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Welcome to Balance</Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Track your alcohol consumption and manage your finances
      </Text>
      
      <View style={styles.buttonContainer}>
        <Button 
          mode="contained" 
          onPress={handleViewTracker}
          style={styles.button}
        >
          View Tracker
        </Button>
        
        <Button 
          mode="outlined" 
          onPress={handleViewSettings}
          style={styles.button}
        >
          Settings
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
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
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
  },
  errorText: {
    textAlign: 'center',
    color: 'red',
    marginBottom: 20,
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    marginVertical: 10,
  },
});
