import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Text, TextInput, Button, Card, IconButton, Snackbar, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
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
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const validateForm = () => {
    if (!profile.name?.trim()) {
      setFormError('Name is required');
      return false;
    }
    if (!profile.email?.trim()) {
      setFormError('Email is required');
      return false;
    }
    if (!profile.email.includes('@')) {
      setFormError('Please enter a valid email address');
      return false;
    }
    if (profile.age && (profile.age < 18 || profile.age > 100)) {
      setFormError('Please enter a valid age (18-100)');
      return false;
    }
    if (profile.weight && (profile.weight < 30 || profile.weight > 300)) {
      setFormError('Please enter a valid weight (30-300 kg)');
      return false;
    }
    if (profile.height && (profile.height < 100 || profile.height > 250)) {
      setFormError('Please enter a valid height (100-250 cm)');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setFormError(null);
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
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Updating profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
        <Text style={styles.title}>Edit Profile</Text>
      </View>

      {formError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{formError}</Text>
        </View>
      )}
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <TextInput
              label="Name"
              value={profile.name}
              onChangeText={(text) => setProfile({ ...profile, name: text })}
              style={[styles.input, { backgroundColor: '#fff0d4' }]}
              mode="outlined"
              error={!!formError && !profile.name?.trim()}
            />
            <TextInput
              label="Email"
              value={profile.email}
              onChangeText={(text) => setProfile({ ...profile, email: text })}
              style={[styles.input, { backgroundColor: '#fff0d4' }]}
              mode="outlined"
              keyboardType="email-address"
              error={!!formError && (!profile.email?.trim() || !profile.email.includes('@'))}
            />
            <TextInput
              label="University"
              value={profile.university}
              onChangeText={(text) => setProfile({ ...profile, university: text })}
              style={[styles.input, { backgroundColor: '#fff0d4' }]}
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
              style={[styles.input, { backgroundColor: '#fff0d4' }]}
              mode="outlined"
              keyboardType="numeric"
              error={Boolean(formError && profile.age && (profile.age < 18 || profile.age > 100))}
            />
            <TextInput
              label="Weight (kg)"
              value={profile.weight?.toString()}
              onChangeText={(text) => setProfile({ ...profile, weight: parseInt(text) || 70 })}
              style={[styles.input, { backgroundColor: '#fff0d4' }]}
              mode="outlined"
              keyboardType="numeric"
              error={Boolean(formError && profile.weight && (profile.weight < 30 || profile.weight > 300))}
            />
            <TextInput
              label="Height (cm)"
              value={profile.height?.toString()}
              onChangeText={(text) => setProfile({ ...profile, height: parseInt(text) || 175 })}
              style={[styles.input, { backgroundColor: '#fff0d4' }]}
              mode="outlined"
              keyboardType="numeric"
              error={Boolean(formError && profile.height && (profile.height < 100 || profile.height > 250))}
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
              style={[styles.input, { backgroundColor: '#fff0d4' }]}
              mode="outlined"
              placeholder="e.g., Beer, Wine, Cocktails"
            />
            <TextInput
              label="Favorite Venues"
              value={profile.favoriteVenues?.join(', ')}
              onChangeText={(text) => setProfile({ ...profile, favoriteVenues: text.split(',').map(s => s.trim()) })}
              style={[styles.input, { backgroundColor: '#fff0d4' }]}
              mode="outlined"
              placeholder="e.g., Pub Name, Bar Name"
            />
            <TextInput
              label="Drinking Goals"
              value={profile.drinkingGoals}
              onChangeText={(text) => setProfile({ ...profile, drinkingGoals: text })}
              style={[styles.input, { backgroundColor: '#fff0d4' }]}
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
            loading={loading}
            disabled={loading}
          >
            Save Changes
          </Button>
        </View>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff7e9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff7e9',
  },
  loadingText: {
    marginTop: 12,
    color: colors.text,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 40,
    backgroundColor: '#fff0d4',
    elevation: 2,
  },
  backButton: {
    marginRight: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#fff0d4',
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
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
    borderRadius: 8,
  },
  snackbar: {
    backgroundColor: colors.primary,
  },
  errorContainer: {
    backgroundColor: colors.error + '20',
    padding: 12,
    margin: 16,
    borderRadius: 8,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
  },
}); 