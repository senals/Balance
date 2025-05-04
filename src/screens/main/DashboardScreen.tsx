import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Card, Button, ProgressBar } from 'react-native-paper';
import { colors } from '../../theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { format } from 'date-fns';

// Import plant growth images
const PlantGrowth1 = require('../../assets/images/Plantgrowth1.png');
const PlantGrowth2 = require('../../assets/images/Plantgrowth2.png');
const PlantGrowth3 = require('../../assets/images/Plantgrowth3.png');
const PlantGrowth4 = require('../../assets/images/Plantgrowth4.png');
const PlantGrowth5 = require('../../assets/images/Plantgrowth5.png');

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
    drink.timestamp.startsWith(today)
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

  return (
    <ScrollView 
      style={styles.container}
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
          <View style={styles.debugContainer}>
            <TouchableOpacity 
              style={styles.debugHeader}
              onPress={() => setShowDevTools(!showDevTools)}
            >
              <View style={styles.debugHeaderContent}>
                <MaterialCommunityIcons 
                  name={showDevTools ? "chevron-up" : "chevron-down"} 
                  size={24} 
                  color={colors.text} 
                />
                <Text style={styles.debugTitle}>Debug Information</Text>
                <View style={styles.debugStatus}>
                  <View style={[
                    styles.debugStatusDot, 
                    { backgroundColor: apiAvailable ? colors.success : colors.error }
                  ]} />
                  <Text style={styles.debugStatusText}>
                    {apiAvailable ? 'API Connected' : 'API Disconnected'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
            
            {showDevTools && (
              <View style={styles.debugContent}>
                <View style={styles.debugSection}>
                  <Text style={styles.debugSubtitle}>Current State</Text>
                  <View style={styles.debugGrid}>
                    <View style={styles.debugGridItem}>
                      <Text style={styles.debugLabel}>User ID</Text>
                      <Text style={styles.debugValue}>{currentUser?.id || 'Not available'}</Text>
                    </View>
                    <View style={styles.debugGridItem}>
                      <Text style={styles.debugLabel}>Drinks Count</Text>
                      <Text style={styles.debugValue}>{drinks.length}</Text>
                    </View>
                    <View style={styles.debugGridItem}>
                      <Text style={styles.debugLabel}>Loading</Text>
                      <Text style={styles.debugValue}>{loading ? 'Yes' : 'No'}</Text>
                    </View>
                    <View style={styles.debugGridItem}>
                      <Text style={styles.debugLabel}>Refreshing</Text>
                      <Text style={styles.debugValue}>{refreshing ? 'Yes' : 'No'}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.debugSection}>
                  <Text style={styles.debugSubtitle}>Recent Logs</Text>
                  <ScrollView style={styles.debugLogs} nestedScrollEnabled>
                    {debugInfo.map((log, index) => (
                      <Text key={`debug-${index}-${Date.now()}`} style={styles.debugLog}>
                        {log}
                      </Text>
                    ))}
                  </ScrollView>
                </View>
              </View>
            )}
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>Welcome back, {(currentUser as UserAccount)?.name || 'User'}</Text>
          </View>
          
          <View style={styles.content}>
            {/* Stage-specific content */}
            {getStageContent()}

            {/* Long-term Progress Plant */}
            <Card style={styles.treeCard}>
              <Card.Content style={styles.treeContent}>
                <View style={styles.treeContainer}>
                  <Image 
                    source={getPlantGrowthImage()} 
                    style={styles.plantImage}
                    resizeMode="contain"
                  />
                  <View style={styles.groundContainer}>
                    <View 
                      style={[
                        styles.groundFill, 
                        { width: `${successRate * 100}%` }
                      ]} 
                    />
                  </View>
                </View>
                <View style={styles.progressInfo}>
                  <Text style={styles.progressAmount}>{weeksCompleted}/{totalWeeks}</Text>
                  <Text style={styles.progressLabel}>Weeks Completed</Text>
                  <ProgressBar 
                    progress={weeksCompleted / totalWeeks} 
                    color={colors.primary} 
                    style={styles.progressBar} 
                  />
                  <Text style={styles.successRate}>Success Rate: {Math.round(successRate * 100)}%</Text>
                  <Text style={styles.remainingAmount}>{totalWeeks - weeksCompleted} weeks remaining</Text>
                </View>
              </Card.Content>
            </Card>
            
            {/* Daily Overview */}
            <Card style={styles.overviewCard}>
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
              <Card style={styles.summaryCard}>
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
              
              <Card style={styles.summaryCard}>
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
            <Card style={styles.recentCard}>
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
  );
};

// Helper function to calculate success rate based on budget adherence
const calculateSuccessRate = (drinks: any[], budget: any) => {
  // If no drinks yet, return 0 for a new user
  if (!drinks || drinks.length === 0) {
    return 0;
  }

  // Get the user's start date (first drink)
  const startDate = new Date(Math.min(...drinks.map(d => new Date(d.timestamp).getTime())));
  const currentDate = new Date();
  
  // Group drinks by week from start date to current date
  const drinksByWeek: { [key: string]: any[] } = {};
  
  drinks.forEach(drink => {
    const date = new Date(drink.timestamp);
    const weekNumber = getWeekNumber(date);
    const weekKey = `${date.getFullYear()}-${weekNumber}`;
    
    if (!drinksByWeek[weekKey]) {
      drinksByWeek[weekKey] = [];
    }
    
    drinksByWeek[weekKey].push(drink);
  });
  
  // Calculate success for each week in the current 4-week period
  let successfulWeeks = 0;
  let weeksInPeriod = 0;
  
  // Get the start of the current 4-week period
  const currentWeekStart = new Date(currentDate);
  currentWeekStart.setDate(currentDate.getDate() - (currentDate.getDay() + 6) % 7); // Start of current week
  currentWeekStart.setDate(currentWeekStart.getDate() - (3 * 7)); // Go back 3 weeks to get start of 4-week period
  
  // Iterate through weeks in the current 4-week period
  let currentWeek = new Date(currentWeekStart);
  while (currentWeek <= currentDate) {
    const weekNumber = getWeekNumber(currentWeek);
    const weekKey = `${currentWeek.getFullYear()}-${weekNumber}`;
    const weekDrinks = drinksByWeek[weekKey] || [];
    const weekSpent = weekDrinks.reduce((sum, drink) => sum + (drink.price || 0), 0);
    
    // Consider a week successful if spending is within budget
    if (weekSpent <= budget.weeklyBudget) {
      successfulWeeks++;
    }
    
    weeksInPeriod++;
    currentWeek.setDate(currentWeek.getDate() + 7); // Move to next week
  }
  
  // If no weeks have passed yet, return 0
  if (weeksInPeriod === 0) {
    return 0;
  }
  
  return successfulWeeks / weeksInPeriod;
};

// Helper function to get week number
const getWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
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
    paddingBottom: 24,
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
  plantImage: {
    width: 100,
    height: 100,
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
  successRate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 4,
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
  overviewCard: {
    marginBottom: 12,
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
    backgroundColor: colors.surface,
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
    backgroundColor: colors.surface,
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
    backgroundColor: colors.surface,
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
    backgroundColor: colors.surface,
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
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 2,
    overflow: 'hidden',
  },
  debugHeader: {
    padding: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
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
    borderBottomColor: colors.background,
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