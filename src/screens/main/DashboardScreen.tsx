import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Button, ProgressBar } from 'react-native-paper';
import { colors } from '../../theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Mock data for demonstration
const MOCK_WEEKS_COMPLETED = 3;
const MOCK_TOTAL_WEEKS = 12;
const MOCK_DAILY_BUDGET = 15;
const MOCK_DAILY_SPENT = 10;
const MOCK_WEEKLY_BUDGET = 105;
const MOCK_WEEKLY_SPENT = 75;
const MOCK_MONTHLY_BUDGET = 450;
const MOCK_MONTHLY_SPENT = 320;

export const DashboardScreen = ({ navigation }: { navigation: any }) => {
  const [weeksCompleted, setWeeksCompleted] = useState(MOCK_WEEKS_COMPLETED);
  const [totalWeeks, setTotalWeeks] = useState(MOCK_TOTAL_WEEKS);
  const [dailyBudget, setDailyBudget] = useState(MOCK_DAILY_BUDGET);
  const [dailySpent, setDailySpent] = useState(MOCK_DAILY_SPENT);
  const [weeklyBudget, setWeeklyBudget] = useState(MOCK_WEEKLY_BUDGET);
  const [weeklySpent, setWeeklySpent] = useState(MOCK_WEEKLY_SPENT);
  const [monthlyBudget, setMonthlyBudget] = useState(MOCK_MONTHLY_BUDGET);
  const [monthlySpent, setMonthlySpent] = useState(MOCK_MONTHLY_SPENT);
  
  const progressPercentage = weeksCompleted / totalWeeks;
  const dailyProgressPercentage = dailySpent / dailyBudget;
  const weeklyProgressPercentage = weeklySpent / weeklyBudget;
  const monthlyProgressPercentage = monthlySpent / monthlyBudget;
  
  const handleViewDrinkTracker = () => {
    navigation.navigate('DrinkTracker');
  };
  
  const handleViewBudgetTracker = () => {
    navigation.navigate('BudgetTracker');
  };
  
  const handleViewProfile = () => {
    navigation.navigate('Profile');
  };

  // Function to determine tree growth stage based on weeks completed
  const getTreeGrowthStage = () => {
    if (weeksCompleted === 0) return 'sprout';
    if (weeksCompleted <= 3) return 'seedling';
    if (weeksCompleted <= 6) return 'sapling';
    if (weeksCompleted <= 9) return 'young-tree';
    return 'mature-tree';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Track your progress</Text>
      </View>
      
      <View style={styles.content}>
        {/* Tree Growth Visual */}
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
                    { width: `${progressPercentage * 100}%` }
                  ]} 
                />
              </View>
            </View>
            <View style={styles.progressInfo}>
              <Text style={styles.progressAmount}>{weeksCompleted}/{totalWeeks}</Text>
              <Text style={styles.progressLabel}>Weeks Completed</Text>
              <ProgressBar 
                progress={progressPercentage} 
                color={colors.primary} 
                style={styles.progressBar} 
              />
              <Text style={styles.remainingAmount}>{totalWeeks - weeksCompleted} weeks remaining</Text>
            </View>
          </Card.Content>
        </Card>
        
        {/* Budget Summary and Quick Actions in a row */}
        <View style={styles.bottomRow}>
          {/* Budget Summary */}
          <Card style={styles.summaryCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Budget</Text>
              <View style={styles.summaryContent}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Daily</Text>
                  <Text style={styles.summaryValue}>${dailySpent}/${dailyBudget}</Text>
                  <ProgressBar 
                    progress={dailyProgressPercentage} 
                    color={dailyProgressPercentage > 0.8 ? colors.error : colors.primary} 
                    style={styles.miniProgressBar} 
                  />
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Weekly</Text>
                  <Text style={styles.summaryValue}>${weeklySpent}/${weeklyBudget}</Text>
                  <ProgressBar 
                    progress={weeklyProgressPercentage} 
                    color={weeklyProgressPercentage > 0.8 ? colors.error : colors.primary} 
                    style={styles.miniProgressBar} 
                  />
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Monthly</Text>
                  <Text style={styles.summaryValue}>${monthlySpent}/${monthlyBudget}</Text>
                  <ProgressBar 
                    progress={monthlyProgressPercentage} 
                    color={monthlyProgressPercentage > 0.8 ? colors.error : colors.primary} 
                    style={styles.miniProgressBar} 
                  />
                </View>
              </View>
              <Button 
                mode="outlined" 
                onPress={handleViewBudgetTracker}
                style={styles.detailsButton}
                compact
              >
                Details
              </Button>
            </Card.Content>
          </Card>
          
          {/* Quick Actions */}
          <Card style={styles.actionsCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionsContent}>
                <Button 
                  mode="contained" 
                  onPress={handleViewDrinkTracker}
                  style={styles.actionButton}
                  icon="glass-cocktail"
                  compact
                >
                  Drink Tracker
                </Button>
                <Button 
                  mode="contained" 
                  onPress={handleViewBudgetTracker}
                  style={styles.actionButton}
                  icon="piggy-bank"
                  compact
                >
                  Budget Tracker
                </Button>
                <Button 
                  mode="contained" 
                  onPress={handleViewProfile}
                  style={styles.actionButton}
                  icon="account"
                  compact
                >
                  Profile
                </Button>
              </View>
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
  actionsCard: {
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
  miniProgressBar: {
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  detailsButton: {
    marginTop: 4,
  },
  actionsContent: {
    marginBottom: 8,
  },
  actionButton: {
    marginBottom: 6,
  },
}); 