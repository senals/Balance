import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, Avatar, List, Switch, Divider } from 'react-native-paper';
import { colors } from '../../theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Mock user data
const MOCK_USER = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  university: 'University of Example',
  yearOfStudy: '3rd Year',
  joinDate: 'January 2023',
  totalDrinks: 42,
  totalSpent: 320,
  weeklyAverage: 3.5,
  monthlyAverage: 14,
};

export const ProfileScreen = ({ navigation }: { navigation: any }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [privacyModeEnabled, setPrivacyModeEnabled] = useState(false);
  
  const handleLogout = () => {
    // TODO: Implement actual logout logic
    console.log('Logging out');
    navigation.navigate('Login');
  };
  
  const handleEditProfile = () => {
    // TODO: Navigate to edit profile screen
    console.log('Edit profile');
  };
  
  const handleViewStatistics = () => {
    // TODO: Navigate to statistics screen
    console.log('View statistics');
  };
  
  const handleViewSettings = () => {
    // TODO: Navigate to settings screen
    console.log('View settings');
  };
  
  const handleViewHelp = () => {
    // TODO: Navigate to help screen
    console.log('View help');
  };
  
  const handleOpenDevTools = () => {
    navigation.navigate('DevTools');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Manage your account</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {/* User Profile Card */}
        <Card style={styles.card}>
          <Card.Content style={styles.profileCard}>
            <Avatar.Text 
              size={80} 
              label={MOCK_USER.name.split(' ').map(n => n[0]).join('')} 
              style={{ backgroundColor: colors.primary }}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{MOCK_USER.name}</Text>
              <Text style={styles.profileEmail}>{MOCK_USER.email}</Text>
              <Text style={styles.profileUniversity}>{MOCK_USER.university} - {MOCK_USER.yearOfStudy}</Text>
              <Text style={styles.profileJoinDate}>Member since {MOCK_USER.joinDate}</Text>
            </View>
          </Card.Content>
          <Card.Actions>
            <Button 
              mode="outlined" 
              onPress={handleEditProfile}
              style={styles.editButton}
            >
              Edit Profile
            </Button>
          </Card.Actions>
        </Card>
        
        {/* Statistics Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Statistics</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{MOCK_USER.totalDrinks}</Text>
                <Text style={styles.statLabel}>Total Drinks</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>${MOCK_USER.totalSpent}</Text>
                <Text style={styles.statLabel}>Total Spent</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{MOCK_USER.weeklyAverage}</Text>
                <Text style={styles.statLabel}>Weekly Avg</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{MOCK_USER.monthlyAverage}</Text>
                <Text style={styles.statLabel}>Monthly Avg</Text>
              </View>
            </View>
            <Button 
              mode="outlined" 
              onPress={handleViewStatistics}
              style={styles.viewButton}
            >
              View Detailed Statistics
            </Button>
          </Card.Content>
        </Card>
        
        {/* Settings Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Settings</Text>
            <List.Section>
              <List.Item
                title="Notifications"
                description="Receive alerts and reminders"
                left={props => <List.Icon {...props} icon="bell" color={colors.primary} />}
                right={() => (
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                    color={colors.primary}
                  />
                )}
              />
              <Divider />
              <List.Item
                title="Dark Mode"
                description="Use dark theme"
                left={props => <List.Icon {...props} icon="theme-light-dark" color={colors.primary} />}
                right={() => (
                  <Switch
                    value={darkModeEnabled}
                    onValueChange={setDarkModeEnabled}
                    color={colors.primary}
                  />
                )}
              />
              <Divider />
              <List.Item
                title="Privacy Mode"
                description="Hide sensitive information"
                left={props => <List.Icon {...props} icon="shield-lock" color={colors.primary} />}
                right={() => (
                  <Switch
                    value={privacyModeEnabled}
                    onValueChange={setPrivacyModeEnabled}
                    color={colors.primary}
                  />
                )}
              />
              <Divider />
              <List.Item
                title="Development Tools"
                description="Access development and debugging tools"
                left={props => <List.Icon {...props} icon="tools" color={colors.primary} />}
                onPress={handleOpenDevTools}
              />
            </List.Section>
            <Button 
              mode="outlined" 
              onPress={handleViewSettings}
              style={styles.viewButton}
            >
              More Settings
            </Button>
          </Card.Content>
        </Card>
        
        {/* Help & Support Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Help & Support</Text>
            <List.Section>
              <List.Item
                title="FAQ"
                description="Frequently asked questions"
                left={props => <List.Icon {...props} icon="frequently-asked-questions" color={colors.primary} />}
                onPress={() => console.log('FAQ')}
              />
              <Divider />
              <List.Item
                title="Contact Support"
                description="Get help from our team"
                left={props => <List.Icon {...props} icon="email" color={colors.primary} />}
                onPress={() => console.log('Contact Support')}
              />
              <Divider />
              <List.Item
                title="Privacy Policy"
                description="Read our privacy policy"
                left={props => <List.Icon {...props} icon="file-document" color={colors.primary} />}
                onPress={() => console.log('Privacy Policy')}
              />
            </List.Section>
            <Button 
              mode="outlined" 
              onPress={handleViewHelp}
              style={styles.viewButton}
            >
              More Help
            </Button>
          </Card.Content>
        </Card>
        
        {/* Logout Button */}
        <Button 
          mode="contained" 
          onPress={handleLogout}
          style={styles.logoutButton}
          icon="logout"
        >
          Logout
        </Button>
      </ScrollView>
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
  card: {
    marginBottom: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 2,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
  },
  profileUniversity: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
    marginTop: 2,
  },
  profileJoinDate: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.5,
    marginTop: 2,
  },
  editButton: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
    marginTop: 2,
  },
  viewButton: {
    marginTop: 4,
  },
  logoutButton: {
    marginTop: 12,
    marginBottom: 24,
    backgroundColor: colors.error,
  },
}); 