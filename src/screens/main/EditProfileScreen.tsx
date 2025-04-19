import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Card, IconButton, Snackbar, SegmentedButtons } from 'react-native-paper';
import { colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { UserProfile } from '../../services/storage';
import { DatePicker } from '../../components/DatePicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
  Main: undefined;
  EditProfile: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

export const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { userProfile, updateProfile, error } = useApp();
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    name: userProfile?.name || '',
    email: userProfile?.email || '',
    age: userProfile?.age || 21,
    weight: userProfile?.weight || 70,
    height: userProfile?.height || 175,
    gender: userProfile?.gender || 'other',
    university: userProfile?.university || '',
  });
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleSave = async () => {
    try {
      await updateProfile(profile);
      setSnackbarMessage('Profile updated successfully!');
      setSnackbarVisible(true);
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      setSnackbarMessage(error instanceof Error ? error.message : 'Failed to update profile');
      setSnackbarVisible(true);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
        <Text style={styles.title}>Edit Profile</Text>
      </View>
      
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <TextInput
              label="Name"
              value={profile.name}
              onChangeText={(text) => setProfile({ ...profile, name: text })}
              style={styles.input}
              mode="outlined"
            />
            <TextInput
              label="Email"
              value={profile.email}
              onChangeText={(text) => setProfile({ ...profile, email: text })}
              style={styles.input}
              mode="outlined"
              keyboardType="email-address"
            />
            <TextInput
              label="University"
              value={profile.university}
              onChangeText={(text) => setProfile({ ...profile, university: text })}
              style={styles.input}
              mode="outlined"
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Physical Information</Text>
            <TextInput
              label="Age"
              value={profile.age?.toString()}
              onChangeText={(text) => setProfile({ ...profile, age: parseInt(text) || 21 })}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />
            <TextInput
              label="Weight (kg)"
              value={profile.weight?.toString()}
              onChangeText={(text) => setProfile({ ...profile, weight: parseInt(text) || 70 })}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />
            <TextInput
              label="Height (cm)"
              value={profile.height?.toString()}
              onChangeText={(text) => setProfile({ ...profile, height: parseInt(text) || 175 })}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />
            <Text style={styles.label}>Gender</Text>
            <SegmentedButtons
              value={profile.gender || 'other'}
              onValueChange={(value) => setProfile({ ...profile, gender: value as 'male' | 'female' | 'other' })}
              buttons={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ]}
              style={styles.segmentedButtons}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Preferences</Text>
            <TextInput
              label="Preferred Drink Types"
              value={profile.preferredDrinks?.join(', ')}
              onChangeText={(text) => setProfile({ ...profile, preferredDrinks: text.split(',').map(s => s.trim()) })}
              style={styles.input}
              mode="outlined"
              placeholder="e.g., Beer, Wine, Cocktails"
            />
            <TextInput
              label="Favorite Venues"
              value={profile.favoriteVenues?.join(', ')}
              onChangeText={(text) => setProfile({ ...profile, favoriteVenues: text.split(',').map(s => s.trim()) })}
              style={styles.input}
              mode="outlined"
              placeholder="e.g., Pub Name, Bar Name"
            />
            <TextInput
              label="Drinking Goals"
              value={profile.drinkingGoals}
              onChangeText={(text) => setProfile({ ...profile, drinkingGoals: text })}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
              placeholder="What are your goals for managing your drinking?"
            />
          </Card.Content>
        </Card>
        
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.saveButton}
          >
            Save Changes
          </Button>
        </View>
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 40,
  },
  backButton: {
    marginRight: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: colors.surface,
  },
  label: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  saveButton: {
    marginBottom: 12,
    paddingVertical: 8,
  },
  snackbar: {
    backgroundColor: colors.primary,
  },
}); 