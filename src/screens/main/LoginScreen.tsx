import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { useApp } from '../../context/AppContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { ErrorBoundary } from '../../components/ErrorBoundary';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreenContent: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login, isLoading, error, clearError, getReadinessAssessment } = useApp();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const validateForm = () => {
    if (!email || !password) {
      setFormError('Please fill in all required fields');
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

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    try {
      setFormError(null);
      await login(email, password);
      
      // Check if user has completed the readiness assessment
      const assessment = await getReadinessAssessment();
      
      if (!assessment) {
        // If no assessment exists, navigate to the readiness assessment
        navigation.replace('ReadinessAssessment');
      } else {
        // If assessment exists, navigate to the main app
        navigation.replace('Main');
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Login failed. Please try again.');
      console.error('Login error:', error);
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
            Welcome Back
          </Text>
          
          {(error || formError) && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {formError || error}
            </Text>
          )}

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            disabled={isLoading}
            accessibilityRole="text"
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
            disabled={isLoading}
            accessibilityRole="text"
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.button}
            loading={isLoading}
            disabled={isLoading}
            accessibilityRole="button"
          >
            Login
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate('Register')}
            style={styles.switchButton}
            disabled={isLoading}
            accessibilityRole="button"
          >
            Don't have an account? Register
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export const LoginScreen: React.FC = () => {
  return (
    <ErrorBoundary>
      <LoginScreenContent />
    </ErrorBoundary>
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
    width: 160,
    height: 160,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
    verticalAlign: 'middle',
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
    userSelect: 'none',
  },
}); 