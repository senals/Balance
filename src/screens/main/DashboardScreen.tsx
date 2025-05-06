import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, ActivityIndicator, RefreshControl, TouchableOpacity, Animated } from 'react-native';
import { Text, Card, Button, ProgressBar, Surface, useTheme } from 'react-native-paper';
import { colors } from '../../theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

// Import plant growth images
const PlantGrowth1 = require('../../assets/images/Plantgrowth1.png');
const PlantGrowth2 = require('../../assets/images/Plantgrowth2.png');
const PlantGrowth3 = require('../../assets/images/Plantgrowth3.png');
const PlantGrowth4 = require('../../assets/images/Plantgrowth4.png');
const PlantGrowth5 = require('../../assets/images/Plantgrowth5.png');

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

interface PreGamePlan {
  id?: string;
  date: string;
  location?: string;
  notes?: string;
}

interface ProcessedPreGamePlan extends PreGamePlan {
  time: string;
}

interface UserSettings {
  preGamePlans?: PreGamePlan[];
  dailyBudget?: number;
  weeklyBudget?: number;
  monthlyBudget?: number;
  dailyLimit?: number;
  readinessAssessment?: {
    primaryStage: string;
    recommendations: string[];
  };
}

interface UserAccount {
  id: string;
  name?: string;
  email: string;
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
  const progressAnim = new Animated.Value(0);

  // Helper function to get current time in local timezone
  const getCurrentTime = () => {
    const now = new Date();
    return {
      iso: now.toISOString(),
      local: now.toLocaleString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  };

  // Enhanced debug logging function
  const addDebugLog = (message: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString();
    let logMessage = `[${timestamp}] ${message}`;
    
    if (data) {
      try {
        // Convert any Date objects to local timezone strings
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

  // Validate and analyze settings
  const analyzeSettings = (settings: any) => {
    const analysis = {
      hasSettings: !!settings,
      hasBudgets: {
        daily: !!settings?.dailyBudget,
        weekly: !!settings?.weeklyBudget,
        monthly: !!settings?.monthlyBudget
      },
      hasLimits: {
        daily: !!settings?.dailyLimit
      },
      hasPlans: {
        hasPreGamePlans: Array.isArray(settings?.preGamePlans),
        planCount: settings?.preGamePlans?.length || 0
      },
      hasReadinessAssessment: {
        hasAssessment: !!settings?.readinessAssessment,
        hasStage: !!settings?.readinessAssessment?.primaryStage,
        hasRecommendations: Array.isArray(settings?.readinessAssessment?.recommendations)
      }
    };
    return analysis;
  };

  // Analyze drinks data
  const analyzeDrinks = (drinks: any[], settings: UserSettings) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const dailyDrinks = drinks.filter(drink => {
      const drinkDate = new Date(drink.timestamp);
      return drinkDate >= today;
    });

    const weeklyDrinks = drinks.filter(drink => {
      const drinkDate = new Date(drink.timestamp);
      return drinkDate >= weekStart;
    });

    const monthlyDrinks = drinks.filter(drink => {
      const drinkDate = new Date(drink.timestamp);
      return drinkDate >= monthStart;
    });

    const analysis = {
      totalDrinks: drinks.length,
      daily: {
        count: dailyDrinks.length,
        consumption: dailyDrinks.reduce((sum, drink) => sum + drink.quantity, 0),
        limit: settings?.dailyLimit || 3,
        percentage: dailyProgressPercentage
      },
      weekly: {
        count: weeklyDrinks.length,
        consumption: weeklyDrinks.reduce((sum, drink) => sum + drink.quantity, 0),
        budget: settings?.weeklyBudget || 105,
        percentage: weeklyBudgetPercentage
      },
      monthly: {
        count: monthlyDrinks.length,
        consumption: monthlyDrinks.reduce((sum, drink) => sum + drink.quantity, 0),
        budget: settings?.monthlyBudget || 450,
        percentage: monthlyBudgetPercentage
      },
      timeRange: drinks.length > 0 ? {
        start: new Date(Math.min(...drinks.map(d => new Date(d.timestamp).getTime()))),
        end: new Date(Math.max(...drinks.map(d => new Date(d.timestamp).getTime())))
      } : null
    };
    return analysis;
  };

  // Initialize component
  useEffect(() => {
    const initialize = async () => {
      try {
        const currentTime = getCurrentTime();
        addDebugLog('Initializing dashboard...', {
          currentUser: currentUser?.id,
          drinksCount: drinks.length,
          settings: settings ? 'Available' : 'Not available',
          currentTime
        });
        
        setLoading(true);

        // Check API availability
        const response = await fetch('http://localhost:5000/api/health');
        const isApiAvailable = response.status === 200;
        setApiAvailable(isApiAvailable);
        addDebugLog('API health check', {
          status: response.status,
          available: isApiAvailable,
          url: 'http://localhost:5000/api/health',
          responseTime: getCurrentTime()
        });

        // Analyze settings
        const settingsAnalysis = analyzeSettings(settings);
        addDebugLog('Settings analysis', settingsAnalysis);

        // Analyze drinks data
        const drinksAnalysis = analyzeDrinks(drinks, settings);
        addDebugLog('Drinks analysis', drinksAnalysis);

        // Analyze recent drinks
        const validRecentDrinks = recentDrinks.filter(drink => drink && drink.id);
        addDebugLog('Recent drinks analysis', {
          count: validRecentDrinks.length,
          drinks: validRecentDrinks.map(drink => ({
            id: drink.id,
            name: drink.drink,
            date: drink.date,
            time: drink.time
          }))
        });

        // Analyze upcoming plans
        const validPlans = upcomingPlans.filter(plan => plan && plan.id);
        addDebugLog('Upcoming plans analysis', {
          count: validPlans.length,
          plans: validPlans.map(plan => ({
            id: plan.id,
            date: plan.date,
            time: plan.time,
            location: plan.location
          }))
        });

        // Analyze success rate
        addDebugLog('Success rate analysis', {
          weeksCompleted,
          totalWeeks,
          successRate,
          plantGrowthStage: getPlantGrowthImage()
        });

        // Initialize achievements
        initializeAchievements();

        setLoading(false);
        addDebugLog('Dashboard initialized successfully');
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        addDebugLog('Initialization error', {
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
          currentState: {
            loading,
            apiAvailable,
            drinksCount: drinks.length,
            userId: currentUser?.id,
            currentTime: getCurrentTime()
          }
        });
        
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // Handle refresh
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      addDebugLog('Refreshing dashboard data...', {
        currentState: {
          drinksCount: drinks.length,
          settings: settings ? 'Available' : 'Not available',
          currentTime: getCurrentTime()
        }
      });

      // Add any refresh logic here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate refresh

      // Re-analyze data after refresh
      const settingsAnalysis = analyzeSettings(settings);
      const drinksAnalysis = analyzeDrinks(drinks, settings);
      
      addDebugLog('Refresh complete', {
        settings: settingsAnalysis,
        drinks: drinksAnalysis,
        currentTime: getCurrentTime()
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addDebugLog(`Error refreshing dashboard: ${errorMessage}`, {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Calculate daily consumption
  const today = new Date().toISOString().split('T')[0];
  const dailyDrinks = drinks.filter(drink => 
    new Date(drink.timestamp).toISOString().split('T')[0] === today
  );
  const dailyConsumption = dailyDrinks.reduce((sum, drink) => sum + drink.quantity, 0);
  const dailyLimit = (settings as UserSettings)?.dailyLimit || 3;
  const dailyProgressPercentage = dailyConsumption / dailyLimit;

  // Calculate daily spending
  const dailySpent = dailyDrinks.reduce((sum, drink) => sum + (drink.price || 0), 0);
  const dailyBudget = (settings as UserSettings)?.dailyBudget || 15;
  const dailyBudgetPercentage = dailySpent / dailyBudget;

  // Calculate weekly consumption
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weeklyDrinks = drinks.filter(drink => 
    new Date(drink.timestamp) >= weekStart
  );
  const weeklyConsumption = weeklyDrinks.reduce((sum, drink) => sum + drink.quantity, 0);

  // Calculate weekly spending
  const weeklySpent = weeklyDrinks.reduce((sum, drink) => sum + (drink.price || 0), 0);
  const weeklyBudget = (settings as UserSettings)?.weeklyBudget || 105;
  const weeklyBudgetPercentage = weeklySpent / weeklyBudget;

  // Calculate monthly consumption
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthlyDrinks = drinks.filter(drink => 
    new Date(drink.timestamp) >= monthStart
  );
  const monthlyConsumption = monthlyDrinks.reduce((sum, drink) => sum + drink.quantity, 0);

  // Calculate monthly spending
  const monthlySpent = monthlyDrinks.reduce((sum, drink) => sum + (drink.price || 0), 0);
  const monthlyBudget = (settings as UserSettings)?.monthlyBudget || 450;
  const monthlyBudgetPercentage = monthlySpent / monthlyBudget;

  // Validate and prepare recent drinks data
  const recentDrinks = React.useMemo(() => {
    if (!drinks || !Array.isArray(drinks)) {
      addDebugLog('Invalid drinks data');
      return [];
    }

    const validDrinks = drinks
      .filter(drink => {
        const isValid = drink && 
          (drink.id || drink.timestamp) && 
          drink.brand && 
          typeof drink.quantity === 'number';
        if (!isValid) {
          addDebugLog(`Invalid drink entry: ${JSON.stringify(drink)}`);
        }
        return isValid;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 3)
      .map((drink, index) => ({
        id: generateUniqueKey(drink, 'drink', index),
        drink: `${drink.brand} (${drink.quantity}x)`,
        date: new Date(drink.timestamp).toLocaleDateString(),
        time: new Date(drink.timestamp).toLocaleTimeString(),
      }));

    addDebugLog(`Processed ${validDrinks.length} recent drinks`);
    return validDrinks;
  }, [drinks]);

  // Validate and prepare upcoming plans
  const upcomingPlans = React.useMemo(() => {
    const userSettings = settings as UserSettings;
    if (!userSettings?.preGamePlans) {
      addDebugLog('No pre-game plans found in settings');
      return [];
    }

    if (!Array.isArray(userSettings.preGamePlans)) {
      addDebugLog('Pre-game plans is not an array');
      return [];
    }

    const validPlans = userSettings.preGamePlans
      .filter((plan: PreGamePlan) => {
        const isValid = plan && 
          (plan.id || plan.date) && 
          typeof plan.date === 'string' &&
          new Date(plan.date).toString() !== 'Invalid Date';
        if (!isValid) {
          addDebugLog(`Invalid plan entry: ${JSON.stringify(plan)}`);
        }
        return isValid;
      })
      .sort((a: PreGamePlan, b: PreGamePlan) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )
      .slice(0, 2)
      .map((plan: PreGamePlan, index: number) => ({
        id: generateUniqueKey(plan, 'plan', index),
        date: new Date(plan.date).toLocaleDateString(),
        time: new Date(plan.date).toLocaleTimeString(),
        location: plan.location || 'Unknown location',
        notes: plan.notes || 'No notes',
      })) as ProcessedPreGamePlan[];

    addDebugLog(`Processed ${validPlans.length} upcoming plans`);
    return validPlans;
  }, [settings]);

  // Calculate long-term progress
  const totalWeeks = 4; // 4-week goal period
  
  // Calculate weeks completed based on actual user data
  const weeksCompleted = drinks.length > 0 
    ? Math.min(
        Math.floor(
          (new Date().getTime() - new Date(Math.min(...drinks.map(d => new Date(d.timestamp).getTime()))).getTime()) 
          / (1000 * 60 * 60 * 24 * 7) // Convert to weeks
        ) % 4, // Use modulo 4 to cycle through 4-week periods
        totalWeeks
      )
    : 0;
  
  // Calculate success rate (percentage of weeks where user stayed within budget)
  const successRate = calculateSuccessRate(drinks, settings);
  
  // Determine plant growth stage based on success rate
  const getPlantGrowthImage = () => {
    if (successRate < 0.2) return PlantGrowth1;
    if (successRate < 0.4) return PlantGrowth2;
    if (successRate < 0.6) return PlantGrowth3;
    if (successRate < 0.8) return PlantGrowth4;
    return PlantGrowth5;
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

  // Animate progress bars
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false
    }).start();
  }, [dailyProgressPercentage, weeklyBudgetPercentage, monthlyBudgetPercentage]);

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

  // Get stage-specific content
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

  return (
    <LinearGradient
      colors={['#fff7e9', '#fff7e9']}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading dashboard...</Text>
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Dashboard</Text>
              <Text style={styles.subtitle}>Welcome back, {(currentUser as UserAccount)?.name || 'User'}</Text>
            </View>
            
            <View style={styles.content}>
              {/* Stage-specific content */}
              {getStageContent()}

              {/* Achievements */}
              {renderAchievements()}

              {/* Long-term Progress Plant */}
              <Card style={[styles.treeCard, { backgroundColor: '#fff0d4' }]}>
                <Card.Content style={styles.treeContent}>
                  <View style={styles.treeContainer}>
                    <Image 
                      source={getPlantGrowthImage()} 
                      style={styles.plantImage}
                      resizeMode="contain"
                    />
                    <View style={[styles.groundContainer, { backgroundColor: '#fff0d4' }]}>
                      <Animated.View 
                        style={[
                          styles.groundFill, 
                          { 
                            backgroundColor: colors.primary,
                            width: progressAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0%', `${successRate * 100}%`]
                            })
                          }
                        ]} 
                      />
                    </View>
                  </View>
                  <View style={styles.progressInfo}>
                    <Text style={styles.progressAmount}>{weeksCompleted}/{totalWeeks}</Text>
                    <Text style={styles.progressLabel}>Weeks Completed</Text>
                    <Animated.View style={styles.progressBarContainer}>
                      <ProgressBar 
                        progress={weeksCompleted / totalWeeks}
                        color={colors.primary} 
                        style={styles.progressBar} 
                      />
                    </Animated.View>
                    <Text style={styles.successRate}>Success Rate: {Math.round(successRate * 100)}%</Text>
                    <Text style={styles.remainingAmount}>{totalWeeks - weeksCompleted} weeks remaining</Text>
                  </View>
                </Card.Content>
              </Card>
              
              {/* Daily Overview */}
              <Card style={[styles.overviewCard, { backgroundColor: '#fff0d4' }]}>
                <Card.Content>
                  <Text style={styles.sectionTitle}>Today's Overview</Text>
                  <View style={styles.overviewContent}>
                    <View style={styles.overviewItem}>
                      <Text style={styles.overviewLabel}>Drinks</Text>
                      <Text style={styles.overviewValue}>{dailyConsumption}/{dailyLimit}</Text>
                      <ProgressBar 
                        progress={dailyProgressPercentage} 
                        color={dailyProgressPercentage > 0.8 ? colors.error : colors.primary} 
                        style={styles.progressBar} 
                      />
                    </View>
                    <View style={styles.overviewItem}>
                      <Text style={styles.overviewLabel}>Spending</Text>
                      <Text style={styles.overviewValue}>${dailySpent.toFixed(2)}/${dailyBudget.toFixed(2)}</Text>
                      <ProgressBar 
                        progress={dailyBudgetPercentage} 
                        color={dailyBudgetPercentage > 0.8 ? colors.error : colors.primary} 
                        style={styles.progressBar} 
                      />
                    </View>
                  </View>
                </Card.Content>
              </Card>
              
              {/* Weekly and Monthly Summary */}
              <View style={styles.summaryRow}>
                <Card style={[styles.summaryCard, { backgroundColor: '#fff0d4' }]}>
                  <Card.Content>
                    <Text style={styles.sectionTitle}>Weekly</Text>
                    <View style={styles.summaryContent}>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Drinks</Text>
                        <Text style={styles.summaryValue}>{weeklyConsumption}</Text>
                      </View>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Spending</Text>
                        <Text style={styles.summaryValue}>£{weeklySpent.toFixed(2)}</Text>
                      </View>
                      <ProgressBar 
                        progress={weeklyBudgetPercentage} 
                        color={weeklyBudgetPercentage > 0.8 ? colors.error : colors.primary} 
                        style={styles.progressBar} 
                      />
                    </View>
                  </Card.Content>
                </Card>
                
                <Card style={[styles.summaryCard, { backgroundColor: '#fff0d4' }]}>
                  <Card.Content>
                    <Text style={styles.sectionTitle}>Monthly</Text>
                    <View style={styles.summaryContent}>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Drinks</Text>
                        <Text style={styles.summaryValue}>{monthlyConsumption}</Text>
                      </View>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Spending</Text>
                        <Text style={styles.summaryValue}>£{monthlySpent.toFixed(2)}</Text>
                      </View>
                      <ProgressBar 
                        progress={monthlyBudgetPercentage} 
                        color={monthlyBudgetPercentage > 0.8 ? colors.error : colors.primary} 
                        style={styles.progressBar} 
                      />
                    </View>
                  </Card.Content>
                </Card>
              </View>
              
              {/* Pre-Game Plans */}
              <Card style={[styles.preGameCard, { backgroundColor: '#fff0d4' }]}>
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
                    upcomingPlans.map((plan: ProcessedPreGamePlan) => (
                      <View key={plan.id} style={styles.planItem}>
                        <MaterialCommunityIcons
                          name="calendar-clock"
                          size={24}
                          color={colors.primary}
                        />
                        <View style={styles.planInfo}>
                          <Text style={styles.planDateTime}>
                            {plan.date} at {plan.time}
                          </Text>
                          <Text style={styles.planLocation}>{plan.location}</Text>
                          <Text style={styles.planNotes}>{plan.notes}</Text>
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
                        Create a Plan
                      </Button>
                    </View>
                  )}
                </Card.Content>
              </Card>
              
              {/* Recent Activity */}
              <Card style={[styles.recentCard, { backgroundColor: '#fff0d4' }]}>
                <Card.Content>
                  <Text style={styles.sectionTitle}>Recent Activity</Text>
                  {recentDrinks.length > 0 ? (
                    recentDrinks.map((drink) => (
                      <View key={drink.id} style={styles.activityItem}>
                        <MaterialCommunityIcons
                          name="glass-cocktail" 
                          size={24} 
                          color={colors.primary} 
                        />
                        <View style={styles.activityInfo}>
                          <Text style={styles.activityText}>{drink.drink}</Text>
                          <Text style={styles.activityDateTime}>
                            {drink.date} {drink.time}
                          </Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyMessage}>No recent activity</Text>
                  )}
                </Card.Content>
              </Card>
              
              {/* Quick Actions */}
              <View style={styles.actionsRow}>
                <Button 
                  mode="contained" 
                  onPress={handleViewDrinkTracker}
                  style={styles.actionButton}
                  icon="glass-cocktail"
                >
                  Drink Tracker
                </Button>
                <Button 
                  mode="contained" 
                  onPress={handleViewBudgetTracker}
                  style={styles.actionButton}
                  icon="cash"
                >
                  Budget Tracker
                </Button>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

// Helper function to calculate success rate
const calculateSuccessRate = (drinks: any[], settings: UserSettings) => {
  if (!drinks || drinks.length === 0) return 0;
  
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  
  const weeklyDrinks = drinks.filter(drink => {
    const drinkDate = new Date(drink.timestamp);
    return drinkDate >= weekStart;
  });
  
  const weeklySpent = weeklyDrinks.reduce((sum, drink) => sum + (drink.price || 0), 0);
  const weeklyBudget = settings?.weeklyBudget || 100;
  
  return Math.min(weeklySpent / weeklyBudget, 1);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
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
    fontSize: 14,
    color: colors.text,
    marginTop: 12,
  },
}); 