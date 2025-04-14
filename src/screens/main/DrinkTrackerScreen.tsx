import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Button, IconButton, ProgressBar } from 'react-native-paper';
import { colors } from '../../theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Mock data for demonstration
const MOCK_DAILY_LIMIT = 3;
const MOCK_DAILY_CONSUMPTION = 1;
const MOCK_WEEKLY_CONSUMPTION = 8;
const MOCK_MONTHLY_CONSUMPTION = 32;
const MOCK_RECENT_DRINKS = [
  { id: '1', drink: 'Heineken', date: '2023-06-15', time: '20:30' },
  { id: '2', drink: 'Wine', date: '2023-06-14', time: '19:45' },
  { id: '3', drink: 'Cocktail', date: '2023-06-13', time: '21:15' },
];

export const DrinkTrackerScreen = ({ navigation }: { navigation: any }) => {
  const [dailyLimit, setDailyLimit] = useState(MOCK_DAILY_LIMIT);
  const [dailyConsumption, setDailyConsumption] = useState(MOCK_DAILY_CONSUMPTION);
  const [weeklyConsumption, setWeeklyConsumption] = useState(MOCK_WEEKLY_CONSUMPTION);
  const [monthlyConsumption, setMonthlyConsumption] = useState(MOCK_MONTHLY_CONSUMPTION);
  const [recentDrinks, setRecentDrinks] = useState(MOCK_RECENT_DRINKS);
  
  const progressPercentage = dailyConsumption / dailyLimit;
  
  const handleAddDrink = () => {
    navigation.navigate('DrinkInput');
  };
  
  const handleViewDetails = () => {
    // This would navigate to a detailed analysis screen in a real app
    console.log('View drink details');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Drink Tracker</Text>
        <Text style={styles.subtitle}>Monitor your consumption</Text>
      </View>
      
      <View style={styles.content}>
        {/* Daily Consumption Visual */}
        <Card style={styles.glassCard}>
          <Card.Content style={styles.glassContent}>
            <View style={styles.glassContainer}>
              <MaterialCommunityIcons 
                name="glass-cocktail" 
                size={100} 
                color={colors.primary} 
              />
              <View style={styles.glassFillContainer}>
                <View 
                  style={[
                    styles.glassFill, 
                    { height: `${progressPercentage * 100}%` }
                  ]} 
                />
              </View>
            </View>
            <View style={styles.consumptionInfo}>
              <Text style={styles.consumptionAmount}>{dailyConsumption}/{dailyLimit}</Text>
              <Text style={styles.consumptionLabel}>Daily Drinks</Text>
              <ProgressBar 
                progress={progressPercentage} 
                color={progressPercentage > 0.8 ? colors.error : colors.primary} 
                style={styles.progressBar} 
              />
              <Text style={styles.remainingAmount}>{dailyLimit - dailyConsumption} remaining</Text>
            </View>
          </Card.Content>
        </Card>
        
        {/* Consumption Summary and Recent Drinks in a row */}
        <View style={styles.bottomRow}>
          {/* Consumption Summary */}
          <Card style={styles.summaryCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Summary</Text>
              <View style={styles.summaryContent}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Weekly</Text>
                  <Text style={styles.summaryValue}>{weeklyConsumption}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Monthly</Text>
                  <Text style={styles.summaryValue}>{monthlyConsumption}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Avg/Day</Text>
                  <Text style={styles.summaryValue}>{(monthlyConsumption / 30).toFixed(1)}</Text>
                </View>
              </View>
              <Button 
                mode="outlined" 
                onPress={handleViewDetails}
                style={styles.detailsButton}
                compact
              >
                Details
              </Button>
            </Card.Content>
          </Card>
          
          {/* Recent Drinks */}
          <Card style={styles.recentCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Recent</Text>
              {recentDrinks.map(drink => (
                <View key={drink.id} style={styles.drinkItem}>
                  <View style={styles.drinkInfo}>
                    <Text style={styles.drinkName}>{drink.drink}</Text>
                    <Text style={styles.drinkDateTime}>{drink.date} {drink.time}</Text>
                  </View>
                </View>
              ))}
              <Button 
                mode="contained" 
                onPress={handleAddDrink}
                style={styles.addButton}
                compact
              >
                Add Drink
              </Button>
            </Card.Content>
          </Card>
        </View>
      </View>
    </View>
  );
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
  },
  glassCard: {
    marginBottom: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 2,
  },
  glassContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  glassContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassFillContainer: {
    position: 'absolute',
    bottom: 0,
    width: 80,
    height: 80,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  glassFill: {
    width: '100%',
    backgroundColor: colors.primary + '40', // 40% opacity
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  consumptionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  consumptionAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  consumptionLabel: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
    marginBottom: 6,
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
  bottomRow: {
    flexDirection: 'row',
    flex: 1,
  },
  summaryCard: {
    flex: 1,
    marginRight: 6,
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 2,
  },
  recentCard: {
    flex: 1,
    marginLeft: 6,
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
  detailsButton: {
    marginTop: 4,
  },
  drinkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  drinkInfo: {
    flex: 1,
  },
  drinkName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  drinkDateTime: {
    fontSize: 10,
    color: colors.text,
    opacity: 0.7,
  },
  addButton: {
    marginTop: 8,
  },
}); 