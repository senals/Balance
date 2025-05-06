import React, { useState, useCallback } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image, Alert } from 'react-native';
import { TextInput, Button, Text, useTheme, ActivityIndicator, IconButton } from 'react-native-paper';
import { useApp } from '../../context/AppContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { debounce } from 'lodash';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

// Password validation regex
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const RegisterScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { register, isLoading, error, clearError } = useApp();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [registrationAttempts, setRegistrationAttempts] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Debounced validation functions
  const validateEmail = useCallback(
    debounce((email: string) => {
      if (!EMAIL_REGEX.test(email)) {
        setFormError('Please enter a valid email address');
        return false;
      }
      return true;
    }, 500),
    []
  );

  const validatePassword = useCallback(
    debounce((password: string) => {
      if (!PASSWORD_REGEX.test(password)) {
        setFormError(
          'Password must be at least 8 characters long and contain uppercase, lowercase, number and special character'
        );
        return false;
      }
      return true;
    }, 500),
    []
  );

  const validateForm = () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setFormError('Please fill in all required fields');
      return false;
    }

    if (!EMAIL_REGEX.test(email)) {
      setFormError('Please enter a valid email address');
      return false;
    }

    if (!PASSWORD_REGEX.test(password)) {
      setFormError(
        'Password must be at least 8 characters long and contain uppercase, lowercase, number and special character'
      );
      return false;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return false;
    }

    if (registrationAttempts >= 3) {
      setFormError('Too many registration attempts. Please try again later.');
      return false;
    }

    return true;
  };

  const sanitizeInput = (input: string) => {
    return input.trim().replace(/[<>]/g, '');
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      setFormError(null);
      clearError();

      // Sanitize inputs
      const sanitizedName = sanitizeInput(name);
      const sanitizedEmail = sanitizeInput(email);

      console.log('Starting registration process...');
      await register(sanitizedEmail, password, sanitizedName);
      console.log('Registration successful, navigating to readiness assessment...');
      
      setRegistrationAttempts(0);
      navigation.replace('ReadinessAssessment');
    } catch (error) {
      console.error('Registration error:', error);
      setRegistrationAttempts(prev => prev + 1);
      setFormError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
      
      if (registrationAttempts >= 2) {
        Alert.alert(
          'Too Many Attempts',
          'You have made too many registration attempts. Please try again later.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    validateEmail(text);
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    validatePassword(text);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <Image 
            source={require('../../assets/images/logo.png')} 
            style={styles.logo}
            accessibilityLabel="App Logo"
          />
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
            disabled={isLoading || isSubmitting}
            maxLength={50}
            accessibilityLabel="Enter your full name"
            accessibilityHint="Enter your full name as it appears on official documents"
          />

          <TextInput
            label="Email"
            value={email}
            onChangeText={handleEmailChange}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            disabled={isLoading || isSubmitting}
            maxLength={100}
            accessibilityLabel="Enter your email address"
            accessibilityHint="Enter a valid email address that you have access to"
          />

          <View style={styles.passwordContainer}>
            <TextInput
              label="Password"
              value={password}
              onChangeText={handlePasswordChange}
              style={[styles.input, styles.passwordInput]}
              secureTextEntry={!showPassword}
              disabled={isLoading || isSubmitting}
              maxLength={50}
              accessibilityLabel="Enter your password"
              accessibilityHint="Password must be at least 8 characters with uppercase, lowercase, number and special character"
            />
            <IconButton
              icon={showPassword ? "eye-off" : "eye"}
              size={20}
              onPress={() => setShowPassword(!showPassword)}
              style={styles.passwordIcon}
              accessibilityLabel={showPassword ? "Hide password" : "Show password"}
            />
          </View>

          <View style={styles.passwordContainer}>
            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={[styles.input, styles.passwordInput]}
              secureTextEntry={!showConfirmPassword}
              disabled={isLoading || isSubmitting}
              maxLength={50}
              accessibilityLabel="Confirm your password"
              accessibilityHint="Re-enter your password to confirm"
            />
            <IconButton
              icon={showConfirmPassword ? "eye-off" : "eye"}
              size={20}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.passwordIcon}
              accessibilityLabel={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            />
          </View>

          <Button
            mode="contained"
            onPress={handleRegister}
            style={styles.button}
            loading={isLoading || isSubmitting}
            disabled={isLoading || isSubmitting}
            accessibilityLabel="Register account"
            accessibilityHint="Tap to create your account"
          >
            {isLoading || isSubmitting ? 'Creating Account...' : 'Register'}
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate('Login')}
            style={styles.switchButton}
            disabled={isLoading || isSubmitting}
            accessibilityLabel="Go to login"
            accessibilityHint="Tap if you already have an account"
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    marginBottom: 0,
  },
  passwordIcon: {
    margin: 0,
    position: 'absolute',
    right: 0,
  },
}); 