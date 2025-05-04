import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card } from 'react-native-paper';

export default function TrackerPage() {
  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Your Trackers</Text>
      
      <Card style={styles.card}>
        <Card.Title title="Alcohol Consumption" />
        <Card.Content>
          <Text variant="bodyMedium">Track your daily alcohol intake and spending</Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Financial Overview" />
        <Card.Content>
          <Text variant="bodyMedium">Monitor your spending patterns and budget</Text>
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
  title: {
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
  },
}); 