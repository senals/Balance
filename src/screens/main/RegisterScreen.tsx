import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { useApp } from '../../context/AppContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

export const RegisterScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { register, isLoading, error, clearError } = useApp();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const validateForm = () => {
    if (!name || !email || !password || !confirmPassword) {
      setFormError('Please fill in all required fields');
      return false;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long');
      return false;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return false;
    }
    if (!email.includes('@')) {
      setFormError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    try {
      setFormError(null); // Clear any previous form errors
      console.log('Starting registration process...'); // Debug log
      await register(email, password, name);
      console.log('Registration successful, navigating to readiness assessment...'); // Debug log
      navigation.replace('ReadinessAssessment');
    } catch (error) {
      console.error('Registration error:', error); // Debug log
      // Show error message to user
      setFormError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formContainer}>
          <Image source={require('../../assets/images/logo.png')} style={styles.logo} />
          <Text variant="headlineMedium" style={styles.title}>
            Create Account
          </Text>
          
          {(error || formError) && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {formError || error}
            </Text>
          )}

          <TextInput
            label="Name"
            value={name}
            onChangeText={setName}
            style={styles.input}
            autoCapitalize="words"
            disabled={isLoading}
          />

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            disabled={isLoading}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
            disabled={isLoading}
          />

          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={styles.input}
            secureTextEntry
            disabled={isLoading}
          />

          <Button
            mode="contained"
            onPress={handleRegister}
            style={styles.button}
            loading={isLoading}
            disabled={isLoading}
          >
            Register
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate('Login')}
            style={styles.switchButton}
            disabled={isLoading}
          >
            Already have an account? Login
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff7e9',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  formContainer: {
    padding: 20,
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    backgroundColor: '#fff0d4',
  },
  button: {
    marginTop: 8,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  switchButton: {
    marginTop: 16,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 16,
  },
}); 