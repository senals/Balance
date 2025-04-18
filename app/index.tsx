import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function HomePage() {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Welcome to Balance</Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Track your alcohol consumption and manage your finances
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
});
