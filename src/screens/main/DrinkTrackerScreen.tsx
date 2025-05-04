import React, { useEffect, useState } from 'react';
import { View, StyleSheet, RefreshControl, ScrollView, Alert, Dimensions } from 'react-native';
import { Text, Card, Button, IconButton, ProgressBar, ActivityIndicator, Divider } from 'react-native-paper';
import { colors } from '../../theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { drinkApi } from '../../services/drinkApi';
import { LineChart } from 'react-native-chart-kit';

export const DrinkTrackerScreen = ({ navigation }: { navigation: any }) => {
  const { drinks, settings, error, currentUser, addDrink, updateDrink, removeDrink } = useApp();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(false);
  const [localDrinks, setLocalDrinks] = useState(drinks);
  const [showDevTools, setShowDevTools] = useState(false);

  // Check if API is available
  useEffect(() => {
    const checkApi = async () => {
      try {
        console.log('Checking API availability...');
        const response = await fetch('http://localhost:5000/api/health');
        console.log('API health check response:', response.status);
        setApiAvailable(response.ok);
      } catch (error) {
        console.error('API health check failed:', error);
        setApiAvailable(false);
      }
    };
    
    checkApi();
  }, []);

  // Fetch drinks from API
  const fetchDrinks = async () => {
    if (!currentUser?.id) {
      console.log('No current user ID available, skipping drink fetch');
      return;
    }
    
    console.log('Fetching drinks for user:', currentUser.id);
    setLoading(true);
    try {
      // Fetch drinks directly from MongoDB using drinkApi
      console.log('Calling drinkApi.getAll...');
      const userDrinks = await drinkApi.getAll(currentUser.id);
      console.log('Received drinks from API:', userDrinks.length);
      
      // Update local drinks state
      setLocalDrinks(userDrinks);
      console.log('Updated local drinks state');
    } catch (error) {
      console.error('Error fetching drinks:', error);
      Alert.alert(
        'Error Fetching Drinks',
        'There was a problem loading your drink data. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchDrinks();
  }, [currentUser?.id]);

  // Update localDrinks when drinks prop changes
  useEffect(() => {
    setLocalDrinks(drinks);
  }, [drinks]);

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDrinks();
    setRefreshing(false);
  };

  // Calculate daily consumption
  const today = new Date().toISOString().split('T')[0];
  const dailyDrinks = localDrinks.filter(drink => 
    drink.timestamp.startsWith(today)
  );
  const dailyConsumption = dailyDrinks.reduce((sum, drink) => sum + drink.quantity, 0);
  const dailyLimit = settings.dailyLimit;

  // Calculate weekly consumption
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weeklyDrinks = localDrinks.filter(drink => 
    new Date(drink.timestamp) >= weekStart
  );
  const weeklyConsumption = weeklyDrinks.reduce((sum, drink) => sum + drink.quantity, 0);

  // Calculate monthly consumption
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthlyDrinks = localDrinks.filter(drink => 
    new Date(drink.timestamp) >= monthStart
  );
  const monthlyConsumption = monthlyDrinks.reduce((sum, drink) => sum + drink.quantity, 0);

  // Get recent drinks
  const recentDrinks = [...localDrinks]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 3)
    .map(drink => ({
      id: drink.id,
      drink: `${drink.brand} (${drink.quantity}x)`,
      date: new Date(drink.timestamp).toLocaleDateString(),
      time: new Date(drink.timestamp).toLocaleTimeString(),
    }));
  
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
    const drinkExists = localDrinks.some(drink => drink.id === drinkId);
    if (!drinkExists) {
      console.error('Drink not found with ID:', drinkId);
      return;
    }
    
    navigation.navigate('EditDrink', { drinkId });
  };

  // Dev tools functions
  const handleResetDrinks = async () => {
    if (!currentUser?.id) return;
    
    Alert.alert(
      'Reset Drinks Data',
      'Are you sure you want to delete all drinks data? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Delete all drinks from MongoDB
              for (const drink of localDrinks) {
                await drinkApi.delete(drink.id);
              }
              
              // Refresh drinks list
              await fetchDrinks();
              
              Alert.alert('Success', 'All drinks data has been reset.');
            } catch (error) {
              console.error('Error resetting drinks:', error);
              Alert.alert('Error', 'Failed to reset drinks data.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleAddSampleDrinks = async () => {
    if (!currentUser?.id) return;
    
    try {
      setLoading(true);
      
      // Sample drinks data
      const sampleDrinks = [
        {
          category: 'beer',
          type: 'lager',
          brand: 'Heineken',
          alcoholContent: 5,
          quantity: 2,
          price: 4.50,
          location: 'Local Pub',
          notes: 'Sample drink 1',
          timestamp: new Date().toISOString(),
        },
        {
          category: 'spirit',
          type: 'vodka',
          brand: 'Grey Goose',
          alcoholContent: 40,
          quantity: 1,
          price: 8.00,
          location: 'Bar',
          notes: 'Sample drink 2',
          timestamp: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        },
        {
          category: 'cocktail',
          type: 'classic',
          brand: 'Mojito',
          alcoholContent: 15,
          quantity: 1,
          price: 10.00,
          location: 'Cocktail Bar',
          notes: 'Sample drink 3',
          timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        }
      ];
      
      // Add sample drinks to MongoDB
      for (const drink of sampleDrinks) {
        await drinkApi.create(drink, currentUser.id);
      }
      
      // Refresh drinks list
      await fetchDrinks();
      
      Alert.alert('Success', 'Sample drinks have been added.');
    } catch (error) {
      console.error('Error adding sample drinks:', error);
      Alert.alert('Error', 'Failed to add sample drinks.');
    } finally {
      setLoading(false);
    }
  };

  const toggleDevTools = () => {
    setShowDevTools(!showDevTools);
  };

  // Calculate weekly consumption data for chart
  const getWeeklyData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = days.map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const dayStart = new Date(date.setHours(0, 0, 0, 0)).toISOString();
      const dayEnd = new Date(date.setHours(23, 59, 59, 999)).toISOString();
      
      return localDrinks.filter(drink => 
        drink.timestamp >= dayStart && drink.timestamp <= dayEnd
      ).reduce((sum, drink) => sum + drink.quantity, 0);
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
    localDrinks.filter(drink => {
      const date = new Date(drink.timestamp);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date < weekAgo;
    }).reduce((sum, drink) => sum + drink.quantity, 0)
  );

  const monthlyTrend = calculateTrend(
    monthlyConsumption,
    localDrinks.filter(drink => {
      const date = new Date(drink.timestamp);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return date < monthAgo;
    }).reduce((sum, drink) => sum + drink.quantity, 0)
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
        />
      }
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading drinks...</Text>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Drink Tracker</Text>
              <Text style={styles.subtitle}>Monitor your consumption</Text>
            </View>
            <IconButton
              icon="cog"
              size={24}
              onPress={toggleDevTools}
              style={styles.devToolsButton}
            />
          </View>
          
          {showDevTools && (
            <Card style={styles.devToolsCard}>
              <Card.Content>
                <Text style={styles.devToolsTitle}>Developer Tools</Text>
                <View style={styles.devToolsButtons}>
                  <Button 
                    mode="outlined" 
                    onPress={handleResetDrinks}
                    style={styles.devToolButton}
                    textColor={colors.error}
                  >
                    Reset All Drinks
                  </Button>
                  <Button 
                    mode="outlined" 
                    onPress={handleAddSampleDrinks}
                    style={styles.devToolButton}
                  >
                    Add Sample Drinks
                  </Button>
                </View>
                <Text style={styles.devToolsInfo}>
                  API Status: {apiAvailable ? 'Connected' : 'Disconnected'}
                </Text>
                <Text style={styles.devToolsInfo}>
                  Total Drinks: {localDrinks.length}
                </Text>
              </Card.Content>
            </Card>
          )}
          
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
                        { height: `${Math.min(progressPercentage * 100, 100)}%` }
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

            {/* Weekly Trend Chart */}
            <Card style={styles.chartCard}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Weekly Trend</Text>
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
                      borderRadius: 16
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
            
            {/* Consumption Summary */}
            <View style={styles.summaryRow}>
              <Card style={styles.summaryCard}>
                <Card.Content>
                  <Text style={styles.sectionTitle}>Weekly Summary</Text>
                  <View style={styles.summaryContent}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Total</Text>
                      <Text style={styles.summaryValue}>{weeklyConsumption}</Text>
                      <View style={styles.trendContainer}>
                        <MaterialCommunityIcons 
                          name={weeklyTrend >= 0 ? "trending-up" : "trending-down"} 
                          size={16} 
                          color={weeklyTrend >= 0 ? colors.success : colors.error} 
                        />
                        <Text style={[styles.trendText, { color: weeklyTrend >= 0 ? colors.success : colors.error }]}>
                          {Math.abs(weeklyTrend).toFixed(1)}%
                        </Text>
                      </View>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Daily Average</Text>
                      <Text style={styles.summaryValue}>
                        {(weeklyConsumption / 7).toFixed(1)}
                      </Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
              
              <Card style={styles.summaryCard}>
                <Card.Content>
                  <Text style={styles.sectionTitle}>Monthly Summary</Text>
                  <View style={styles.summaryContent}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Total</Text>
                      <Text style={styles.summaryValue}>{monthlyConsumption}</Text>
                      <View style={styles.trendContainer}>
                        <MaterialCommunityIcons 
                          name={monthlyTrend >= 0 ? "trending-up" : "trending-down"} 
                          size={16} 
                          color={monthlyTrend >= 0 ? colors.success : colors.error} 
                        />
                        <Text style={[styles.trendText, { color: monthlyTrend >= 0 ? colors.success : colors.error }]}>
                          {Math.abs(monthlyTrend).toFixed(1)}%
                        </Text>
                      </View>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Daily Average</Text>
                      <Text style={styles.summaryValue}>
                        {(monthlyConsumption / new Date().getDate()).toFixed(1)}
                      </Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            </View>
            
            {/* Recent Drinks */}
            <Card style={styles.recentCard}>
              <Card.Content>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Drinks</Text>
                  <Button 
                    mode="contained" 
                    onPress={handleAddDrink}
                    style={styles.addButton}
                    compact
                  >
                    Add Drink
                  </Button>
                </View>
                {recentDrinks.length > 0 ? (
                  recentDrinks.map(drink => (
                    <View key={drink.id} style={styles.drinkItem}>
                      <View style={styles.drinkInfo}>
                        <Text style={styles.drinkDescription}>{drink.drink}</Text>
                        <Text style={styles.drinkDateTime}>{drink.date} {drink.time}</Text>
                      </View>
                      <View style={styles.drinkActions}>
                        <IconButton
                          icon="pencil"
                          size={20}
                          onPress={() => handleEditDrink(drink.id)}
                          iconColor={colors.primary}
                          style={styles.editButton}
                        />
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyMessage}>No drinks recorded yet</Text>
                )}
              </Card.Content>
            </Card>
          </View>
        </>
      )}
    </ScrollView>
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
  loadingText: {
    marginTop: 10,
    color: colors.text,
  },
  header: {
    padding: 16,
    paddingTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
  },
  devToolsButton: {
    marginLeft: 'auto',
  },
  devToolsCard: {
    margin: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 2,
  },
  devToolsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  devToolsButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  devToolButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  devToolsInfo: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
    marginBottom: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  glassCard: {
    marginBottom: 16,
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
    backgroundColor: colors.primary + '40',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  consumptionInfo: {
    flex: 1,
    marginLeft: 16,
  },
  consumptionAmount: {
    fontSize: 24,
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
  chartCard: {
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 2,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    marginHorizontal: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  summaryContent: {
    marginBottom: 8,
  },
  summaryItem: {
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  trendText: {
    fontSize: 12,
    marginLeft: 4,
  },
  recentCard: {
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
  drinkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  drinkInfo: {
    flex: 1,
  },
  drinkDescription: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  drinkDateTime: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
  },
  drinkActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    margin: 0,
    padding: 0,
  },
  emptyMessage: {
    textAlign: 'center',
    color: colors.text,
    opacity: 0.7,
    marginVertical: 12,
  },
  addButton: {
    marginLeft: 8,
  },
}); 