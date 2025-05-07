import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Text as RNText, Platform } from 'react-native';
import { Text, Card, Button, List, Divider, useTheme } from 'react-native-paper';
import { useApp } from '../../context/AppContext';

export const DevelopmentScreen = () => {
  const theme = useTheme();
  const { userProfile, resetAllData, appState } = useApp();
  const [loading, setLoading] = useState(false);

  const handleResetData = async () => {
    console.log('Reset button clicked');
    try {
      const isWeb = Platform.OS === 'web';
      const confirmMessage = 'Are you sure you want to reset all your data? This action cannot be undone.';
      
      const shouldReset = isWeb 
        ? window.confirm(confirmMessage)
        : await new Promise((resolve) => {
            Alert.alert(
              'Reset All Data',
              confirmMessage,
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                  onPress: () => resolve(false),
                },
                {
                  text: 'Reset',
                  style: 'destructive',
                  onPress: () => resolve(true),
                },
              ]
            );
          });

      if (shouldReset) {
        console.log('Starting reset process');
        setLoading(true);
        try {
          console.log('Calling resetAllData');
          await resetAllData();
          console.log('Reset completed successfully');
          if (isWeb) {
            window.alert('All data has been reset successfully.');
          } else {
            Alert.alert('Success', 'All data has been reset successfully.');
          }
        } catch (error) {
          console.error('Error during reset:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          if (isWeb) {
            window.alert(`Failed to reset data: ${errorMessage}. Please try again.`);
          } else {
            Alert.alert('Error', `Failed to reset data: ${errorMessage}. Please try again.`);
          }
        } finally {
          setLoading(false);
        }
      } else {
        console.log('Reset cancelled');
      }
    } catch (error) {
      console.error('Error in handleResetData:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (Platform.OS === 'web') {
        window.alert(`Failed to show reset dialog: ${errorMessage}`);
      } else {
        Alert.alert('Error', `Failed to show reset dialog: ${errorMessage}`);
      }
    }
  };

  const DebugText = ({ title, data }: { title: string; data: any }) => (
    <View style={styles.debugContainer}>
      <Text variant="titleMedium" style={styles.debugTitle}>{title}</Text>
      <ScrollView horizontal style={styles.debugScroll}>
        <RNText style={styles.debugText}>
          {JSON.stringify(data, null, 2)}
        </RNText>
      </ScrollView>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Debug Information" />
        <Card.Content>
          <DebugText title="User Profile" data={userProfile} />
          <Divider style={styles.divider} />
          <DebugText title="App State" data={appState} />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Data Management" />
        <Card.Content>
          <Button
            mode="contained"
            onPress={() => {
              console.log('Button pressed');
              handleResetData();
            }}
            loading={loading}
            icon="delete"
            style={styles.resetButton}
            disabled={loading}
          >
            Reset All Data
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Screen Information" />
        <Card.Content>
          <List.Item
            title="Current Screen"
            description="Development Screen"
            left={props => <List.Icon {...props} icon="monitor" />}
          />
          <Divider style={styles.divider} />
          <DebugText title="Theme" data={theme} />
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
  card: {
    marginBottom: 16,
  },
  divider: {
    marginVertical: 8,
  },
  debugContainer: {
    marginBottom: 8,
  },
  debugTitle: {
    marginBottom: 4,
    fontWeight: 'bold',
  },
  debugScroll: {
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    padding: 8,
  },
  debugText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    color: '#333',
  },
  resetButton: {
    marginTop: 8,
  },
}); 