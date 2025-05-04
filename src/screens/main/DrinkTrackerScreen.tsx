import React, { useEffect, useState } from 'react';
import { View, StyleSheet, RefreshControl, ScrollView, Alert, Dimensions } from 'react-native';
import { Text, Card, Button, IconButton, ProgressBar, ActivityIndicator, Divider } from 'react-native-paper';
import { colors } from '../../theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { drinkApi } from '../../services/drinkApi';
import { LineChart } from 'react-native-chart-kit';
import { DrinkEntry } from '../../services/storage';
import { storage } from '../../services/storage';

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>{this.state.error?.message}</Text>
          <Button mode="contained" onPress={() => this.setState({ hasError: false, error: null })}>
            Try Again
          </Button>
        </View>
      );
    }

    return this.props.children;
  }
}

// Helper function for generating unique keys
const generateUniqueKey = (item: any, type: string, index: number): string => {
  if (item?.id) return `item-${item.id}`;
  
  const timestamp = item?.timestamp || item?.date || Date.now();
  const itemType = item?.type || type || 'unknown';
  const uniqueId = `${itemType}-${timestamp}-${index}`;
  
  return uniqueId;
};

export const DrinkTrackerScreen = ({ navigation }: { navigation: any }) => {
  const { drinks = [], settings, error, currentUser, addDrink, updateDrink, removeDrink, setDrinks } = useApp();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [errorState, setErrorState] = useState<string | null>(null);

  // Enhanced debug logging function
  const addDebugLog = (message: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString();
    let logMessage = `[${timestamp}] ${message}`;
    
    if (data) {
      try {
        const dataString = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
        logMessage += `\nData: ${dataString}`;
      } catch (e) {
        logMessage += `\nData: [Unable to stringify]`;
      }
    }
    
    console.log(logMessage);
    setDebugInfo(prev => [logMessage, ...prev].slice(0, 20));
  };

  // Validate drink data
  const validateDrink = (drink: any) => {
    const requiredFields = ['category', 'type', 'brand', 'alcoholContent', 'quantity', 'timestamp'];
    const missingFields = requiredFields.filter(field => !drink[field]);
    const invalidFields = [];
    
    if (typeof drink.alcoholContent !== 'number' || drink.alcoholContent < 0 || drink.alcoholContent > 100) {
      invalidFields.push('alcoholContent');
    }
    if (typeof drink.quantity !== 'number' || drink.quantity <= 0) {
      invalidFields.push('quantity');
    }
    if (drink.price && (typeof drink.price !== 'number' || drink.price < 0)) {
      invalidFields.push('price');
    }
    
    const timestamp = new Date(drink.timestamp);
    if (isNaN(timestamp.getTime())) {
      invalidFields.push('timestamp');
    }
    
    return {
      isValid: missingFields.length === 0 && invalidFields.length === 0,
      missingFields,
      invalidFields,
      timestamp: timestamp.toISOString()
    };
  };

  // Analyze drinks data
  const analyzeDrinks = (drinks: any[]) => {
    const analysis = {
      totalDrinks: drinks.length,
      totalQuantity: drinks.reduce((sum, drink) => sum + drink.quantity, 0),
      categories: {} as Record<string, number>,
      types: {} as Record<string, number>,
      brands: {} as Record<string, number>,
      timeRange: {
        start: new Date(Math.min(...drinks.map(d => new Date(d.timestamp).getTime()))),
        end: new Date(Math.max(...drinks.map(d => new Date(d.timestamp).getTime())))
      },
      validation: drinks.map(validateDrink)
    };

    drinks.forEach(drink => {
      analysis.categories[drink.category] = (analysis.categories[drink.category] || 0) + drink.quantity;
      analysis.types[drink.type] = (analysis.types[drink.type] || 0) + drink.quantity;
      analysis.brands[drink.brand] = (analysis.brands[drink.brand] || 0) + drink.quantity;
    });

    return analysis;
  };

  // Initialize component
  useEffect(() => {
    const initialize = async () => {
      try {
        addDebugLog('Initializing drink tracker...', {
          currentUser: currentUser?.id,
          drinksCount: drinks.length,
          settings: settings ? 'Available' : 'Not available',
          currentTime: new Date().toISOString()
        });
        
        setLoading(true);
        setErrorState(null);

        // Check API availability
        const response = await fetch('http://localhost:5000/api/health');
        const isApiAvailable = response.status === 200;
        setApiAvailable(isApiAvailable);
        addDebugLog('API health check', {
          status: response.status,
          available: isApiAvailable,
          url: 'http://localhost:5000/api/health',
          responseTime: new Date().toISOString()
        });

        // Load initial data
        if (isApiAvailable && currentUser?.id) {
          addDebugLog(`Fetching drinks for user ${currentUser.id}`);
          const apiDrinks = await drinkApi.getAll(currentUser.id);
          
          if (Array.isArray(apiDrinks)) {
            const analysis = analyzeDrinks(apiDrinks);
            addDebugLog('API drinks analysis', {
              totalDrinks: analysis.totalDrinks,
              totalQuantity: analysis.totalQuantity,
              categories: analysis.categories,
              types: analysis.types,
              brands: analysis.brands,
              timeRange: {
                start: analysis.timeRange.start.toISOString(),
                end: analysis.timeRange.end.toISOString(),
                duration: `${Math.round((analysis.timeRange.end.getTime() - analysis.timeRange.start.getTime()) / (1000 * 60 * 60 * 24))} days`
              },
              validation: {
                valid: analysis.validation.filter(v => v.isValid).length,
                invalid: analysis.validation.filter(v => !v.isValid).length,
                issues: analysis.validation
                  .filter(v => !v.isValid)
                  .map(v => ({
                    missingFields: v.missingFields,
                    invalidFields: v.invalidFields
                  }))
              }
            });
            
            setDrinks(apiDrinks);
            addDebugLog(`Loaded ${apiDrinks.length} drinks from API`);
          } else {
            throw new Error('Invalid response format from API');
          }
        } else {
          addDebugLog('Using local storage for drinks', {
            reason: !isApiAvailable ? 'API unavailable' : 'No user ID',
            userId: currentUser?.id,
            currentTime: new Date().toISOString()
          });
          
          const localDrinks = await storage.drinks.getAll(currentUser?.id || '');
          const analysis = analyzeDrinks(localDrinks);
          addDebugLog('Local storage drinks analysis', {
            totalDrinks: analysis.totalDrinks,
            totalQuantity: analysis.totalQuantity,
            categories: analysis.categories,
            types: analysis.types,
            brands: analysis.brands,
            timeRange: {
              start: analysis.timeRange.start.toISOString(),
              end: analysis.timeRange.end.toISOString(),
              duration: `${Math.round((analysis.timeRange.end.getTime() - analysis.timeRange.start.getTime()) / (1000 * 60 * 60 * 24))} days`
            },
            validation: {
              valid: analysis.validation.filter(v => v.isValid).length,
              invalid: analysis.validation.filter(v => !v.isValid).length,
              issues: analysis.validation
                .filter(v => !v.isValid)
                .map(v => ({
                  missingFields: v.missingFields,
                  invalidFields: v.invalidFields
                }))
            }
          });
          
          setDrinks(localDrinks);
          addDebugLog(`Loaded ${localDrinks.length} drinks from local storage`);
        }

        setLoading(false);
        addDebugLog('Drink tracker initialized successfully');
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
            currentTime: new Date().toISOString()
          }
        });
        
        setErrorState('Failed to load drinks. Please try again.');
        setLoading(false);
      }
    };

    initialize();
  }, [currentUser?.id]);

  // Handle refresh
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    setErrorState(null);
    try {
      addDebugLog('Refreshing drinks data...');
      
      if (apiAvailable && currentUser?.id) {
        const apiDrinks = await drinkApi.getAll(currentUser.id);
        if (Array.isArray(apiDrinks)) {
          setDrinks(apiDrinks);
          addDebugLog(`Refreshed ${apiDrinks.length} drinks from API`);
        } else {
          throw new Error('Invalid response format from API');
        }
      } else {
        const localDrinks = await storage.drinks.getAll(currentUser?.id || '');
        setDrinks(localDrinks);
        addDebugLog(`Refreshed ${localDrinks.length} drinks from local storage`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addDebugLog(`Refresh error: ${errorMessage}`);
      setErrorState('Failed to refresh drinks. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [apiAvailable, currentUser?.id]);

  // Calculate daily consumption
  const today = new Date().toISOString().split('T')[0];
  const dailyDrinks = drinks.filter(drink => 
    drink.timestamp.startsWith(today)
  );
  const dailyConsumption = dailyDrinks.reduce((sum, drink) => sum + drink.quantity, 0);
  const dailyLimit = settings.dailyLimit;

  // Calculate weekly consumption
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weeklyDrinks = drinks.filter(drink => 
    new Date(drink.timestamp) >= weekStart
  );
  const weeklyConsumption = weeklyDrinks.reduce((sum, drink) => sum + drink.quantity, 0);

  // Calculate monthly consumption
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthlyDrinks = drinks.filter(drink => 
    new Date(drink.timestamp) >= monthStart
  );
  const monthlyConsumption = monthlyDrinks.reduce((sum, drink) => sum + drink.quantity, 0);

  // Get recent drinks with proper key generation
  const recentDrinks = React.useMemo(() => {
    const validDrinks = drinks
      .filter(drink => drink && (drink.id || drink.timestamp))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 3)
      .map((drink, index) => ({
        id: generateUniqueKey(drink, 'drink', index),
        drink: `${drink.brand} (${drink.quantity}x)`,
        date: new Date(drink.timestamp).toLocaleDateString(),
        time: new Date(drink.timestamp).toLocaleTimeString(),
      }));
    
    return validDrinks;
  }, [drinks]);
  
  const progressPercentage = dailyConsumption / dailyLimit;
  
  const handleAddDrink = () => {
    navigation.navigate('DrinkInput');
  };
  
  const handleViewDetails = () => {
    console.log('View drink details');
  };

  const handleEditDrink = (drinkId: string) => {
    console.log('Editing drink with ID:', drinkId);
    
    // Check if the drink exists
    const drinkExists = drinks.some(drink => drink.id === drinkId);
    if (!drinkExists) {
      console.error('Drink not found with ID:', drinkId);
      return;
    }
    
    navigation.navigate('EditDrink', { drinkId });
  };

  // Calculate weekly consumption data for chart
  const getWeeklyData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = days.map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const dayStart = new Date(date.setHours(0, 0, 0, 0)).toISOString();
      const dayEnd = new Date(date.setHours(23, 59, 59, 999)).toISOString();
      
      const dayDrinks = drinks.filter(drink => 
        drink.timestamp >= dayStart && drink.timestamp <= dayEnd
      );
      
      return dayDrinks.reduce((sum, drink) => sum + drink.quantity, 0);
    });
    
    return {
      labels: days,
      datasets: [{
        data: weeklyData,
        color: (opacity = 1) => colors.primary,
        strokeWidth: 2
      }]
    };
  };

  // Calculate trend indicators
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const weeklyTrend = calculateTrend(
    weeklyConsumption,
    drinks.filter(drink => {
      const date = new Date(drink.timestamp);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date < weekAgo;
    }).reduce((sum, drink) => sum + drink.quantity, 0)
  );

  const monthlyTrend = calculateTrend(
    monthlyConsumption,
    drinks.filter(drink => {
      const date = new Date(drink.timestamp);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return date < monthAgo;
    }).reduce((sum, drink) => sum + drink.quantity, 0)
  );

  return (
    <ErrorBoundary>
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
        {errorState && (
          <Card style={styles.errorCard}>
            <Card.Content>
              <Text style={styles.errorText}>{errorState}</Text>
            </Card.Content>
          </Card>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading drinks...</Text>
          </View>
        ) : (
          <>
            <Card style={styles.debugCard}>
              <Card.Content>
                <View style={styles.debugHeader}>
                  <Text style={styles.debugTitle}>Debug Information</Text>
                  <Button 
                    mode="text"
                    onPress={() => setShowDebug(!showDebug)}
                    icon={showDebug ? "chevron-up" : "chevron-down"}
                  >
                    {showDebug ? "Hide" : "Show"}
                  </Button>
                </View>
                {showDebug && (
                  <>
                    <View style={styles.debugSection}>
                      <Text style={styles.debugSubtitle}>Current State</Text>
                      <Text style={styles.debugText}>
                        User ID: {currentUser?.id || 'Not available'}{'\n'}
                        API Available: {apiAvailable ? 'Yes' : 'No'}{'\n'}
                        Drinks Count: {drinks.length}{'\n'}
                        Loading: {loading ? 'Yes' : 'No'}{'\n'}
                        Refreshing: {refreshing ? 'Yes' : 'No'}{'\n'}
                        Error: {errorState || 'None'}
                      </Text>
                    </View>
                    <View style={styles.debugSection}>
                      <Text style={styles.debugSubtitle}>Recent Logs</Text>
                      {debugInfo.map((log, index) => (
                        <Text key={`debug-${index}-${Date.now()}`} style={styles.debugText}>
                          {log}
                        </Text>
                      ))}
                    </View>
                  </>
                )}
              </Card.Content>
            </Card>

            <View style={styles.header}>
              <Text style={styles.title}>Drink Tracker</Text>
              <Button
                mode="contained"
                icon="plus"
                onPress={() => navigation.navigate('DrinkInput')}
                style={styles.addButton}
              >
                Add Drink
              </Button>
            </View>

            <Card style={styles.progressCard}>
              <Card.Content>
                <Text style={styles.progressTitle}>Daily Progress</Text>
                <ProgressBar
                  progress={progressPercentage}
                  color={progressPercentage >= 1 ? colors.error : colors.primary}
                  style={styles.progressBar}
                />
                <Text style={styles.progressText}>
                  {dailyConsumption} / {dailyLimit} drinks today
                </Text>
              </Card.Content>
            </Card>

            <View style={styles.statsContainer}>
              <Card style={styles.statCard}>
                <Card.Content>
                  <Text style={styles.statTitle}>Weekly</Text>
                  <Text style={styles.statValue}>{weeklyConsumption}</Text>
                  <Text style={styles.statLabel}>drinks this week</Text>
                  <Text style={styles.trendText}>
                    {weeklyTrend > 0 ? '↑' : weeklyTrend < 0 ? '↓' : '→'} {Math.abs(weeklyTrend).toFixed(1)}%
                  </Text>
                </Card.Content>
              </Card>

              <Card style={styles.statCard}>
                <Card.Content>
                  <Text style={styles.statTitle}>Monthly</Text>
                  <Text style={styles.statValue}>{monthlyConsumption}</Text>
                  <Text style={styles.statLabel}>drinks this month</Text>
                  <Text style={styles.trendText}>
                    {monthlyTrend > 0 ? '↑' : monthlyTrend < 0 ? '↓' : '→'} {Math.abs(monthlyTrend).toFixed(1)}%
                  </Text>
                </Card.Content>
              </Card>
            </View>

            <Card style={styles.chartCard}>
              <Card.Content>
                <Text style={styles.chartTitle}>Weekly Consumption</Text>
                <LineChart
                  data={getWeeklyData()}
                  width={Dimensions.get('window').width - 48}
                  height={220}
                  chartConfig={{
                    backgroundColor: colors.surface,
                    backgroundGradientFrom: colors.surface,
                    backgroundGradientTo: colors.surface,
                    decimalPlaces: 0,
                    color: (opacity = 1) => colors.primary,
                    labelColor: (opacity = 1) => colors.text,
                    style: {
                      borderRadius: 16,
                    },
                    propsForDots: {
                      r: "6",
                      strokeWidth: "2",
                      stroke: colors.primary
                    }
                  }}
                  bezier
                  style={styles.chart}
                />
              </Card.Content>
            </Card>

            <Card style={styles.recentDrinksCard}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Recent Drinks</Text>
                {recentDrinks.length > 0 ? (
                  recentDrinks.map((drink) => (
                    <View key={drink.id} style={styles.recentDrinkItem}>
                      <View style={styles.recentDrinkInfo}>
                        <Text style={styles.recentDrinkName}>{drink.drink}</Text>
                        <Text style={styles.recentDrinkTime}>
                          {drink.date} at {drink.time}
                        </Text>
                      </View>
                      <IconButton
                        icon="pencil"
                        size={20}
                        onPress={() => handleEditDrink(drink.id)}
                        style={styles.editButton}
                      />
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No drinks recorded yet</Text>
                )}
              </Card.Content>
            </Card>
          </>
        )}
      </ScrollView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  addButton: {
    marginLeft: 8,
  },
  progressCard: {
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 2,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 6,
  },
  progressText: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  statTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
  },
  trendText: {
    fontSize: 12,
    color: colors.text,
    marginTop: 4,
  },
  chartCard: {
    marginBottom: 16,
    marginHorizontal: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  recentDrinksCard: {
    marginBottom: 16,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  recentDrinkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  recentDrinkInfo: {
    flex: 1,
  },
  recentDrinkName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  recentDrinkTime: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
    marginTop: 4,
  },
  editButton: {
    margin: 0,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.text,
    opacity: 0.7,
    marginVertical: 16,
  },
  errorCard: {
    margin: 16,
    backgroundColor: colors.error + '20',
    borderRadius: 12,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
  },
  debugCard: {
    margin: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  debugSubtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  debugSection: {
    marginBottom: 12,
  },
  debugText: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.8,
    fontFamily: 'monospace',
  },
  loadingText: {
    marginTop: 10,
    color: colors.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.error,
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
}); 