import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
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
      await register(email, password, name);
      navigation.replace('Main');
    } catch (error) {
      // Error is already handled by the AppContext
      console.error('Registration error:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formContainer}>
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
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  formContainer: {
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  switchButton: {
    marginTop: 16,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 16,
  },
}); 