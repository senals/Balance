import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, Avatar } from 'react-native-paper';
import { colors } from '../../theme/colors';

export const ProfileScreen = ({ navigation }: { navigation: any }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Manage your account</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content style={styles.profileCard}>
            <Avatar.Text 
              size={80} 
              label="JD" 
              style={{ backgroundColor: colors.primary }}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>John Doe</Text>
              <Text style={styles.profileEmail}>john.doe@example.com</Text>
              <Text style={styles.profileUniversity}>University of Example</Text>
            </View>
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Settings</Text>
            <Button 
              mode="outlined" 
              onPress={() => console.log('Edit profile')}
              style={styles.settingButton}
            >
              Edit Profile
            </Button>
            <Button 
              mode="outlined" 
              onPress={() => console.log('Notifications')}
              style={styles.settingButton}
            >
              Notifications
            </Button>
            <Button 
              mode="outlined" 
              onPress={() => console.log('Privacy')}
              style={styles.settingButton}
            >
              Privacy
            </Button>
            <Button 
              mode="outlined" 
              onPress={() => console.log('Help')}
              style={styles.settingButton}
            >
              Help & Support
            </Button>
          </Card.Content>
        </Card>
        
        <Button 
          mode="outlined" 
          onPress={() => navigation.navigate('Login')}
          style={styles.logoutButton}
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
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: colors.text,
    marginBottom: 20,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    marginBottom: 20,
    backgroundColor: colors.surface,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 20,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  profileEmail: {
    fontSize: 16,
    color: colors.text,
    marginTop: 5,
  },
  profileUniversity: {
    fontSize: 16,
    color: colors.text,
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  settingButton: {
    marginBottom: 10,
  },
  logoutButton: {
    marginTop: 10,
    marginBottom: 30,
  },
}); 