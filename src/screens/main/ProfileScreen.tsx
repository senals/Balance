import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Avatar, List, Divider, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../../context/AppContext';
import { RootStackParamList } from '../../navigation/types';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ProfileScreen = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const theme = useTheme();
  const { userProfile: user, logout } = useApp();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleViewStatistics = () => {
    navigation.navigate('Statistics');
  };

  const handleViewSettings = () => {
    navigation.navigate('Settings');
  };

  const handleOpenDevTools = () => {
    navigation.navigate('DevTools');
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Please log in to view your profile.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.profileCard}>
        <Card.Content style={styles.profileContent}>
          <Avatar.Text 
            size={80} 
            label={user.name.split(' ').map((n: string) => n[0]).join('')} 
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <Text variant="headlineSmall">{user.name}</Text>
            <Text variant="bodyMedium">{user.email}</Text>
            {user.university && (
              <Text variant="bodyMedium" style={styles.university}>
                {user.university}
              </Text>
            )}
          </View>
        </Card.Content>
        <Card.Actions>
          <Button 
            mode="contained" 
            onPress={handleEditProfile}
            style={styles.editButton}
          >
            Edit Profile
          </Button>
        </Card.Actions>
      </Card>

      <Card style={styles.infoCard}>
        <Card.Title title="Personal Information" />
        <Card.Content>
          <List.Item
            title="Age"
            description={user.age ? `${user.age} years` : 'Not set'}
            left={props => <List.Icon {...props} icon="account" />}
          />
          <Divider />
          <List.Item
            title="Gender"
            description={user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : 'Not set'}
            left={props => <List.Icon {...props} icon="account-multiple" />}
          />
          <Divider />
          <List.Item
            title="Physical Stats"
            description={
              user.height && user.weight
                ? `${user.height}cm, ${user.weight}kg`
                : 'Not set'
            }
            left={props => <List.Icon {...props} icon="human-male-height" />}
          />
        </Card.Content>
      </Card>

      <Card style={styles.infoCard}>
        <Card.Title title="Preferences" />
        <Card.Content>
          <List.Item
            title="Preferred Drinks"
            description={user.preferredDrinks?.join(', ') || 'Not set'}
            left={props => <List.Icon {...props} icon="glass-cocktail" />}
          />
          <Divider />
          <List.Item
            title="Favorite Venues"
            description={user.favoriteVenues?.join(', ') || 'Not set'}
            left={props => <List.Icon {...props} icon="store" />}
          />
          <Divider />
          <List.Item
            title="Drinking Goals"
            description={user.drinkingGoals || 'Not set'}
            left={props => <List.Icon {...props} icon="target" />}
          />
        </Card.Content>
      </Card>

      <Card style={styles.settingsCard}>
        <Card.Title title="Settings" />
        <Card.Content>
          <List.Item
            title="Statistics"
            description="View your drinking statistics and progress"
            left={props => <List.Icon {...props} icon="chart-bar" />}
            onPress={handleViewStatistics}
          />
          <Divider />
          <List.Item
            title="Settings"
            description="Manage your app preferences"
            left={props => <List.Icon {...props} icon="cog" />}
            onPress={handleViewSettings}
          />
          <Divider />
          <List.Item
            title="Development Tools"
            description="Access development and debugging tools"
            left={props => <List.Icon {...props} icon="tools" />}
            onPress={handleOpenDevTools}
          />
        </Card.Content>
      </Card>

      <Button
        mode="outlined"
        onPress={handleLogout}
        loading={loading}
        style={styles.logoutButton}
      >
        Logout
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    marginBottom: 16,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  university: {
    marginTop: 4,
    opacity: 0.7,
  },
  editButton: {
    marginTop: 8,
  },
  infoCard: {
    marginBottom: 16,
  },
  settingsCard: {
    marginBottom: 16,
  },
  logoutButton: {
    marginBottom: 32,
  },
}); 