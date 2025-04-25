import React, { useEffect, useState } from 'react';
import { View, StyleSheet, RefreshControl, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, IconButton, ProgressBar, ActivityIndicator, Divider } from 'react-native-paper';
import { colors } from '../../theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { drinkApi } from '../../services/drinkApi';

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
            <Text style={styles.title}>Drink Tracker</Text>
            <Text style={styles.subtitle}>Monitor your consumption</Text>
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
                      <Text style={styles.summaryLabel}>Daily Avg</Text>
                      <Text style={styles.summaryValue}>
                        {(monthlyConsumption / (new Date().getDate())).toFixed(1)}
                      </Text>
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
    padding: 12,
    paddingTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  devToolsButton: {
    marginLeft: 'auto',
  },
  devToolsCard: {
    margin: 12,
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
    marginBottom: 12,
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  detailsButton: {
    marginTop: 8,
  },
  drinkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
    marginBottom: 12,
  },
  addButton: {
    marginTop: 8,
  },
}); 