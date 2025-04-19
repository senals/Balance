import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { useApp } from '../../context/AppContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login, register, isLoading, error, clearError } = useApp();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const validateForm = () => {
    if (!email || !password) {
      setFormError('Please fill in all required fields');
      return false;
    }
    if (isRegistering && !name) {
      setFormError('Please enter your name');
      return false;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long');
      return false;
    }
    if (!email.includes('@')) {
      setFormError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      if (isRegistering) {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
      navigation.replace('Main');
    } catch (error) {
      // Error is already handled by the AppContext
      console.error('Authentication error:', error);
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setFormError(null);
    clearError();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formContainer}>
          <Text variant="headlineMedium" style={styles.title}>
            {isRegistering ? 'Create Account' : 'Welcome Back'}
          </Text>
          
          {(error || formError) && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {formError || error}
            </Text>
          )}

          {isRegistering && (
            <TextInput
              label="Name"
              value={name}
              onChangeText={setName}
              style={styles.input}
              autoCapitalize="words"
              disabled={isLoading}
            />
          )}

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

          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.button}
            loading={isLoading}
            disabled={isLoading}
          >
            {isRegistering ? 'Register' : 'Login'}
          </Button>

          <Button
            mode="text"
            onPress={toggleMode}
            style={styles.switchButton}
            disabled={isLoading}
          >
            {isRegistering
              ? 'Already have an account? Login'
              : "Don't have an account? Register"}
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