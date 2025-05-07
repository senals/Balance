import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, ActivityIndicator, RefreshControl, TouchableOpacity, Animated } from 'react-native';
import { Text, Card, Button, ProgressBar, Surface, useTheme } from 'react-native-paper';
import { colors } from '../../theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { UserSettings, PreGamePlan } from '../../services/storage';
import { AnimatedCircularProgress } from 'react-native-circular-progress';

// Import plant growth images
const PlantGrowth1 = require('../../assets/images/Plantgrowth1.png');
const PlantGrowth2 = require('../../assets/images/Plantgrowth2.png');
const PlantGrowth3 = require('../../assets/images/Plantgrowth3.png');
const PlantGrowth4 = require('../../assets/images/Plantgrowth4.png');
const PlantGrowth5 = require('../../assets/images/Plantgrowth5.png');

// Import logo
const Logo = require('../../assets/images/logo.png');

type AchievementIcon = 'trophy' | 'cash' | 'calendar-check';

interface DashboardScreenProps {
  navigation: any;
}

interface StageContent {
  title: string;
  description: string;
  actionText: string;
  actionIcon: string;
  onAction: () => void;
}

interface DisplayDateInfo {
  displayDate: string;
  displayTime: string;
}

interface ProcessedDrink extends DisplayDateInfo {
  id: string;
  drink: string;
}

interface ProcessedPreGamePlan extends Omit<PreGamePlan, 'date'>, DisplayDateInfo {
  date: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: AchievementIcon;
  progress: number;
  total: number;
  unlocked: boolean;
}

// Helper function for generating unique keys
const generateUniqueKey = (item: any, type: string, index: number): string => {
  if (item?.id) return `item-${item.id}`;
  
  const timestamp = item?.timestamp || item?.date || Date.now();
  const itemType = item?.type || type || 'unknown';
  const uniqueId = `${itemType}-${timestamp}-${index}`;
  
  return uniqueId;
};

export const DashboardScreen = ({ navigation }: { navigation: any }) => {
  const { drinks = [], settings, currentUser, error } = useApp();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const theme = useTheme();
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  // Initialize data loading
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        addDebugLog('Initializing dashboard data');
        
        // Check API availability
        const isApiAvailable = await checkApiAvailability();
        setApiAvailable(isApiAvailable);
        
        // Initialize achievements
        initializeAchievements();
        
        // Load initial data
        await loadInitialData();
        
        addDebugLog('Dashboard data initialized successfully');
      } catch (e) {
        addDebugLog('Error initializing dashboard data', { error: e });
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Check API availability
  const checkApiAvailability = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/health');
      return response.ok;
    } catch (e) {
      addDebugLog('API health check failed', { error: e });
      return false;
    }
  };

  // Load initial data
  const loadInitialData = async () => {
    try {
      if (apiAvailable) {
        // Load data from API
        const response = await fetch(`http://localhost:5000/api/drinks/user/${currentUser}`);
        const data = await response.json();
        addDebugLog('Loaded data from API', { data });
      } else {
        // Load data from local storage
        addDebugLog('Using local storage for data');
      }
    } catch (e) {
      addDebugLog('Error loading initial data', { error: e });
    }
  };

  // Handle refresh with proper error handling
  const handleRefresh = React.useCallback(async () => {
    try {
      setRefreshing(true);
      await loadInitialData();
      initializeAchievements();
    } catch (e) {
      addDebugLog('Error refreshing data', { error: e });
    } finally {
      setRefreshing(false);
    }
  }, [apiAvailable, currentUser]);

  // Enhanced debug logging function
  const addDebugLog = (message: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString();
    let logMessage = `[${timestamp}] ${message}`;
    
    if (data) {
      try {
        const processedData = JSON.parse(JSON.stringify(data, (key, value) => {
          if (value instanceof Date) {
            return {
              iso: value.toISOString(),
              local: value.toLocaleString(),
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };
          }
          return value;
        }));
        const dataString = JSON.stringify(processedData, null, 2);
        logMessage += `\nData: ${dataString}`;
      } catch (e) {
        logMessage += `\nData: [Unable to stringify]`;
      }
    }
    
    console.log(logMessage);
    setDebugInfo(prev => [logMessage, ...prev].slice(0, 20));
  };

  // Calculate dates once at the top
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  // Calculate drinks data
  const dailyDrinks = React.useMemo(() => {
    return drinks.filter(drink => {
      try {
        const drinkDate = new Date(drink.timestamp);
        return drinkDate >= today;
      } catch (e) {
        return false;
      }
    });
  }, [drinks, today]);

  const weeklyDrinks = React.useMemo(() => {
    return drinks.filter(drink => {
      try {
        const drinkDate = new Date(drink.timestamp);
        return drinkDate >= weekStart;
      } catch (e) {
        return false;
      }
    });
  }, [drinks, weekStart]);

  const monthlyDrinks = React.useMemo(() => {
    return drinks.filter(drink => {
      try {
        const drinkDate = new Date(drink.timestamp);
        return drinkDate >= monthStart;
      } catch (e) {
        return false;
      }
    });
  }, [drinks, monthStart]);

  // Calculate consumption and budgets
  const dailyConsumption = React.useMemo(() => 
    dailyDrinks.reduce((sum, drink) => sum + (drink.quantity || 0), 0), 
    [dailyDrinks]
  );
  
  const dailyLimit = React.useMemo(() => 
    settings?.dailyLimit || 3,
    [settings]
  );
  
  const dailyProgressPercentage = React.useMemo(() => 
    Math.min(dailyConsumption / dailyLimit, 1),
    [dailyConsumption, dailyLimit]
  );

  const dailySpent = dailyDrinks.reduce((sum, drink) => sum + (drink.price || 0), 0);
  const dailyBudget = settings?.dailyBudget || 15;
  const dailyBudgetPercentage = dailySpent / dailyBudget;

  const weeklySpent = weeklyDrinks.reduce((sum, drink) => sum + (drink.price || 0), 0);
  const weeklyBudget = settings?.weeklyBudget || 105;
  const weeklyBudgetPercentage = weeklySpent / weeklyBudget;

  const monthlySpent = monthlyDrinks.reduce((sum, drink) => sum + (drink.price || 0), 0);
  const monthlyBudget = settings?.monthlyBudget || 450;
  const monthlyBudgetPercentage = monthlySpent / monthlyBudget;

  // Calculate success rate
  const successRate = calculateSuccessRate(drinks, settings);

  // Calculate long-term progress
  const totalWeeks = 4; // 4-week goal period
  const weeksCompleted = React.useMemo(() => {
    if (drinks.length === 0) return 0;
    
    const firstDrinkDate = new Date(Math.min(...drinks.map(d => new Date(d.timestamp).getTime())));
    const weeksSinceStart = Math.floor(
      (new Date().getTime() - firstDrinkDate.getTime()) 
      / (1000 * 60 * 60 * 24 * 7) // Convert to weeks
    );
    
    return Math.min(weeksSinceStart % 4, totalWeeks); // Use modulo 4 to cycle through 4-week periods
  }, [drinks]);

  // Helper function for date processing
  const processDate = (date: Date | string): DisplayDateInfo => {
    const dateObj = new Date(date);
    return {
      displayDate: dateObj.toLocaleDateString(),
      displayTime: dateObj.toLocaleTimeString(),
    };
  };

  // Get recent drinks
  const recentDrinks = React.useMemo(() => {
    return drinks
      .filter(drink => drink && drink.timestamp)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 3)
      .map((drink, index) => ({
        id: generateUniqueKey(drink, 'drink', index),
        drink: `${drink.brand} (${drink.quantity}x)`,
        displayDate: new Date(drink.timestamp).toLocaleDateString(),
        displayTime: new Date(drink.timestamp).toLocaleTimeString(),
      }));
  }, [drinks]);

  // Get upcoming plans
  const upcomingPlans = React.useMemo(() => {
    const userSettings = settings as UserSettings;
    if (!userSettings?.preGamePlans) return [];

    return userSettings.preGamePlans
      .filter(plan => plan && plan.id && plan.date)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 2)
      .map(plan => ({
        ...plan,
        displayDate: new Date(plan.date).toLocaleDateString(),
        displayTime: new Date(plan.date).toLocaleTimeString(),
      }));
  }, [settings]);

  // Get plant growth image based on success rate
  const getPlantGrowthImage = () => {
    if (successRate < 0.2) return PlantGrowth1;
    if (successRate < 0.4) return PlantGrowth2;
    if (successRate < 0.6) return PlantGrowth3;
    if (successRate < 0.8) return PlantGrowth4;
    return PlantGrowth5;
  };

  // Navigation handlers
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

  // Initialize achievements
  const initializeAchievements = () => {
    const userSettings = settings as UserSettings;
    const newAchievements: Achievement[] = [
      {
        id: 'streak-7',
        title: '7-Day Streak',
        description: 'Stay within your daily limit for 7 consecutive days',
        icon: 'trophy',
        progress: Math.min(dailyDrinks.length, 7),
        total: 7,
        unlocked: dailyDrinks.length >= 7
      },
      {
        id: 'budget-master',
        title: 'Budget Master',
        description: 'Stay within your weekly budget for 4 weeks',
        icon: 'cash',
        progress: Math.min(weeksCompleted, 4),
        total: 4,
        unlocked: weeksCompleted >= 4
      },
      {
        id: 'social-planner',
        title: 'Social Planner',
        description: 'Create and follow 5 pre-game plans',
        icon: 'calendar-check',
        progress: Math.min(userSettings?.preGamePlans?.length || 0, 5),
        total: 5,
        unlocked: (userSettings?.preGamePlans?.length || 0) >= 5
      }
    ];
    setAchievements(newAchievements);
  };

  // Get stage content
  const getStageContent = () => {
    const userSettings = settings as UserSettings;
    if (!userSettings?.readinessAssessment) return null;

    const { primaryStage, recommendations } = userSettings.readinessAssessment;
    let content: StageContent = {
      title: '',
      description: '',
      actionText: '',
      actionIcon: '',
      onAction: () => {},
    };

    switch (primaryStage) {
      case 'pre-contemplation':
        content = {
          title: 'Track Your Habits',
          description: 'Understanding your drinking patterns is the first step. Track your drinks without pressure to change.',
          actionText: 'View Drink History',
          actionIcon: 'history',
          onAction: () => navigation.navigate('DrinkTracker'),
        };
        break;
      case 'contemplation':
        content = {
          title: 'Explore Your Options',
          description: 'Consider how reducing your drinking could benefit your health and wallet.',
          actionText: 'View Statistics',
          actionIcon: 'chart-bar',
          onAction: () => navigation.navigate('Statistics'),
        };
        break;
      case 'preparation':
        content = {
          title: 'Plan for Success',
          description: 'Create a plan to manage your drinking in social situations.',
          actionText: 'Create Pre-Game Plan',
          actionIcon: 'calendar-check',
          onAction: () => navigation.navigate('PreGamePlanner'),
        };
        break;
      case 'action':
        content = {
          title: 'Stay on Track',
          description: "You're actively working on your goals. Keep monitoring your progress.",
          actionText: 'View Budget',
          actionIcon: 'cash',
          onAction: () => navigation.navigate('BudgetTracker'),
        };
        break;
      case 'maintenance':
        content = {
          title: 'Maintain Your Progress',
          description: "You've made great progress! Focus on maintaining your healthy habits.",
          actionText: 'View Achievements',
          actionIcon: 'trophy',
          onAction: () => navigation.navigate('Statistics'),
        };
        break;
      default:
        return null;
    }

    return (
      <Card style={styles.stageCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>{content.title}</Text>
          <Text style={styles.stageDescription}>{content.description}</Text>
          {recommendations && recommendations.length > 0 && (
            <View style={styles.recommendationsContainer}>
              <Text style={styles.recommendationsTitle}>Recommendations:</Text>
              {recommendations.map((recommendation: string, index: number) => (
                <View key={`recommendation-${index}`} style={styles.recommendationItem}>
                  <MaterialCommunityIcons name="check-circle" size={16} color={colors.primary} />
                  <Text style={styles.recommendationText}>{recommendation}</Text>
                </View>
              ))}
            </View>
          )}
          <Button
            mode="contained"
            icon={content.actionIcon}
            onPress={content.onAction}
            style={styles.stageActionButton}
          >
            {content.actionText}
          </Button>
        </Card.Content>
      </Card>
    );
  };

  // Render achievements
  const renderAchievements = () => (
    <Card style={[styles.achievementsCard, { backgroundColor: '#fff0d4' }]}>
      <Card.Content>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <Button 
            mode="text" 
            onPress={() => navigation.navigate('Achievements')}
            textColor={colors.primary}
          >
            View All
          </Button>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.achievementsScroll}
        >
          {achievements.map((achievement) => (
            <Surface 
              key={achievement.id} 
              style={[
                styles.achievementItem,
                { 
                  opacity: achievement.unlocked ? 1 : 0.5,
                  backgroundColor: '#fff0d4'
                }
              ]}
              elevation={2}
            >
              <MaterialCommunityIcons
                name={achievement.icon}
                size={48}
                color={achievement.unlocked ? colors.primary : colors.text}
                style={styles.achievementIcon}
              />
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                <Text style={styles.achievementDescription}>{achievement.description}</Text>
                <ProgressBar 
                  progress={achievement.progress / achievement.total}
                  color={colors.primary}
                  style={styles.achievementProgress}
                />
                <Text style={styles.achievementProgressText}>
                  {achievement.progress}/{achievement.total}
                </Text>
              </View>
            </Surface>
          ))}
        </ScrollView>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Image source={Logo} style={styles.logo} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>Welcome back!</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {/* Overview Section */}
        <Card style={styles.overviewCardProminent}>
          <Card.Content>
            <Text style={styles.sectionTitleProminent}>Today's Overview</Text>
            <View style={styles.overviewContent}>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewLabel}>Daily Limit</Text>
                <Text style={styles.overviewValue}>{dailyConsumption}/{dailyLimit}</Text>
                <ProgressBar
                  progress={dailyProgressPercentage}
                  color={colors.primary}
                  style={styles.progressBar}
                />
              </View>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewLabel}>Daily Budget</Text>
                <Text style={styles.overviewValue}>£{dailySpent.toFixed(2)}/{dailyBudget}</Text>
                <ProgressBar
                  progress={dailyBudgetPercentage}
                  color={colors.primary}
                  style={styles.progressBar}
                />
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Tree Progress Section */}
        <Card style={styles.treeCard}>
          <Card.Content>
            <View style={styles.treeContent}>
              <View style={styles.treeContainer}>
                <Image source={getPlantGrowthImage()} style={styles.plantImage} />
                <View style={styles.groundContainer}>
                  <LinearGradient
                    colors={[colors.primary, colors.primary]}
                    style={[styles.groundFill, { width: `${successRate * 100}%` }]}
                  />
                </View>
              </View>
              <View style={styles.progressInfo}>
                <Text style={styles.successRate}>Long Term Progress</Text>
                <Text style={styles.progressAmount}>{Math.round(successRate * 100)}%</Text>
                <Text style={styles.remainingAmount}>
                  {Math.round(successRate * 30)}/30 days completed
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Budget Overview Row */}
        <View style={styles.budgetRow}>
          {/* Weekly Budget Section */}
          <Card style={styles.budgetCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Weekly</Text>
              <View style={styles.circularProgressContainer}>
                <AnimatedCircularProgress
                  size={80}
                  width={8}
                  fill={weeklyBudgetPercentage * 100}
                  tintColor={colors.primary}
                  backgroundColor="#e0e0e0"
                  rotation={0}
                >
                  {() => (
                    <View style={styles.circularProgressInner}>
                      <Text style={styles.circularProgressValue}>
                        £{weeklySpent.toFixed(0)}
                      </Text>
                      <Text style={styles.circularProgressLabel}>
                        of £{weeklyBudget}
                      </Text>
                    </View>
                  )}
                </AnimatedCircularProgress>
              </View>
              <View style={styles.budgetDetails}>
                <Text style={styles.budgetRemaining}>
                  £{(weeklyBudget - weeklySpent).toFixed(2)} remaining
                </Text>
              </View>
            </Card.Content>
          </Card>

          {/* Monthly Budget Section */}
          <Card style={styles.budgetCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Monthly</Text>
              <View style={styles.circularProgressContainer}>
                <AnimatedCircularProgress
                  size={80}
                  width={8}
                  fill={monthlyBudgetPercentage * 100}
                  tintColor={colors.primary}
                  backgroundColor="#e0e0e0"
                  rotation={0}
                >
                  {() => (
                    <View style={styles.circularProgressInner}>
                      <Text style={styles.circularProgressValue}>
                        £{monthlySpent.toFixed(0)}
                      </Text>
                      <Text style={styles.circularProgressLabel}>
                        of £{monthlyBudget}
                      </Text>
                    </View>
                  )}
                </AnimatedCircularProgress>
              </View>
              <View style={styles.budgetDetails}>
                <Text style={styles.budgetRemaining}>
                  £{(monthlyBudget - monthlySpent).toFixed(2)} remaining
                </Text>
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* Recent Activity Section */}
        <Card style={styles.recentCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <Button 
                mode="text" 
                onPress={handleViewDrinkTracker}
                textColor={colors.primary}
              >
                View All
              </Button>
            </View>
            {recentDrinks.length > 0 ? (
              recentDrinks.map((drink) => (
                <View key={drink.id} style={styles.activityItem}>
                  <MaterialCommunityIcons name="glass-wine" size={24} color={colors.primary} />
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityText}>{drink.drink}</Text>
                    <Text style={styles.activityDateTime}>
                      {drink.displayDate} at {drink.displayTime}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyMessage}>No recent activity</Text>
            )}
          </Card.Content>
        </Card>

        {/* Upcoming Plans Section */}
        <Card style={styles.preGameCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Plans</Text>
              <Button 
                mode="text" 
                onPress={handleViewPreGamePlanner}
                textColor={colors.primary}
              >
                View All
              </Button>
            </View>
            {upcomingPlans.length > 0 ? (
              upcomingPlans.map((plan) => (
                <View key={plan.id} style={styles.planItem}>
                  <View style={styles.planInfo}>
                    <Text style={styles.planDateTime}>
                      {plan.displayDate} at {plan.displayTime}
                    </Text>
                    <Text style={styles.planLocation}>{plan.location}</Text>
                    {plan.notes && (
                      <Text style={styles.planNotes}>{plan.notes}</Text>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyPreGameContainer}>
                <Text style={styles.emptyMessage}>No upcoming plans</Text>
                <Button
                  mode="contained"
                  onPress={handleViewPreGamePlanner}
                  style={styles.createPlanButton}
                >
                  Create Plan
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Stage Content Section */}
        {getStageContent()}

        {/* Achievements Section */}
        {renderAchievements()}

        {/* Quick Actions Section */}
        <View style={styles.actionsRow}>
          <Button
            mode="contained"
            icon="chart-bar"
            onPress={handleViewBudgetTracker}
            style={styles.actionButton}
          >
            Budget
          </Button>
          <Button
            mode="contained"
            icon="account"
            onPress={handleViewProfile}
            style={styles.actionButton}
          >
            Profile
          </Button>
        </View>
      </View>
    </ScrollView>
  );
};

// Helper function to calculate success rate
const calculateSuccessRate = (drinks: any[], settings: UserSettings) => {
  if (!drinks || drinks.length === 0) return 0;
  
  // Sort all drinks by date
  const sortedDrinks = [...drinks].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  // Group drinks by day
  const drinksByDay = sortedDrinks.reduce((acc: { [key: string]: any[] }, drink) => {
    const date = new Date(drink.timestamp).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(drink);
    return acc;
  }, {});
  
  // Calculate success rate based on days within limit
  const dailyLimit = settings?.dailyLimit || 3;
  const goalDays = 30; // Goal is to maintain under limit for 30 days
  let successfulDays = 0;
  
  // Count consecutive days under limit
  Object.values(drinksByDay).forEach(dayDrinks => {
    const totalDrinks = dayDrinks.reduce((sum, drink) => sum + (drink.quantity || 1), 0);
    if (totalDrinks <= dailyLimit) {
      successfulDays++;
    } else {
      // Reset count if a day exceeds the limit
      successfulDays = 0;
    }
  });
  
  // Return progress towards the goal (30 days)
  return Math.min(successfulDays / goalDays, 1);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff7e9',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 72,
    height: 72,
    marginRight: 16,
    resizeMode: 'contain',
  },
  headerTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
  },
  content: {
    flex: 1,
    padding: 16,
    paddingBottom: 24,
  },
  achievementsCard: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 4,
  },
  achievementsScroll: {
    marginTop: 8,
  },
  achievementItem: {
    width: 280,
    marginRight: 12,
    padding: 16,
    borderRadius: 12,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    marginBottom: 8,
    textAlign: 'center',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
    marginBottom: 8,
  },
  achievementProgress: {
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  achievementProgressText: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
    textAlign: 'right',
  },
  treeCard: {
    marginBottom: 16,
    backgroundColor: '#fff0d4',
    borderRadius: 16,
    elevation: 4,
  },
  treeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  treeContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plantImage: {
    width: 100,
    height: 100,
  },
  groundContainer: {
    position: 'absolute',
    bottom: 0,
    width: 120,
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  groundFill: {
    height: '100%',
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
    opacity: 0.7,
    marginBottom: 8,
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
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
    opacity: 0.7,
  },
  overviewCard: {
    marginBottom: 12,
    backgroundColor: '#fff0d4',
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
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
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: '#fff0d4',
    borderRadius: 12,
    elevation: 2,
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
  recentCard: {
    marginBottom: 12,
    backgroundColor: '#fff0d4',
    borderRadius: 12,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  activityInfo: {
    marginLeft: 12,
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  activityDateTime: {
    fontSize: 10,
    color: colors.text,
    opacity: 0.7,
  },
  emptyMessage: {
    textAlign: 'center',
    color: colors.text,
    opacity: 0.7,
    marginVertical: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 6,
  },
  preGameCard: {
    marginBottom: 16,
    backgroundColor: '#fff0d4',
    borderRadius: 12,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  planInfo: {
    marginLeft: 12,
    flex: 1,
  },
  planDateTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  planLocation: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  planNotes: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
  },
  emptyPreGameContainer: {
    alignItems: 'center',
    padding: 16,
  },
  createPlanButton: {
    marginTop: 8,
  },
  stageCard: {
    marginBottom: 12,
    backgroundColor: '#fff0d4',
    borderRadius: 12,
    elevation: 2,
  },
  stageDescription: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 12,
  },
  recommendationsContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  recommendationText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  stageActionButton: {
    marginTop: 8,
  },
  debugContainer: {
    margin: 16,
    backgroundColor: '#fff0d4',
    borderRadius: 12,
  },
  debugHeader: {
    padding: 12,
    backgroundColor: '#fff0d4',
    borderBottomWidth: 1,
    borderBottomColor: '#fff7e9',
  },
  debugHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    marginLeft: 8,
  },
  debugStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  debugStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  debugStatusText: {
    fontSize: 12,
    color: colors.text,
  },
  debugContent: {
    maxHeight: 300,
  },
  debugSection: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#fff7e9',
  },
  debugSubtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  debugGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  debugGridItem: {
    width: '50%',
    padding: 4,
  },
  debugLabel: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
  },
  debugValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  debugLogs: {
    maxHeight: 150,
  },
  debugLog: {
    fontSize: 12,
    color: colors.text,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: colors.text,
  },
  overviewCardProminent: {
    marginBottom: 20,
    backgroundColor: '#fff0d4',
    borderRadius: 16,
    elevation: 4,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  sectionTitleProminent: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  circularProgressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  circularProgressInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularProgressValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  circularProgressLabel: {
    fontSize: 10,
    color: colors.text,
    opacity: 0.7,
  },
  summarySubLabel: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 4,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  budgetCard: {
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: '#fff0d4',
    borderRadius: 12,
    elevation: 2,
  },
  budgetDetails: {
    marginTop: 8,
  },
  budgetRemaining: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
    marginBottom: 4,
    textAlign: 'center',
  },
}); 