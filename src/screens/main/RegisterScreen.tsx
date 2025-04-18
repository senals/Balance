import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Card, HelperText } from 'react-native-paper';
import { colors } from '../../theme/colors';

export const RegisterScreen = ({ navigation }: { navigation: any }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    general: ''
  });

  const validateForm = useCallback(() => {
    const newErrors = {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      general: ''
    };
    
    let isValid = true;
    
    // Name validation
    if (!name) {
      newErrors.name = 'Name is required';
      isValid = false;
    }
    
    // Email validation
    if (!email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }
    
    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }
    
    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  }, [name, email, password, confirmPassword]);

  const handleRegister = useCallback(() => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors(prev => ({ ...prev, general: '' }));
    
    // Simulate registration process
    setTimeout(() => {
      setIsLoading(false);
      navigation.navigate('Main');
    }, 1000);
  }, [validateForm, navigation]);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            {errors.general ? (
              <HelperText type="error" visible={true}>
                {errors.general}
              </HelperText>
            ) : null}
            
            <TextInput
              label="Full Name"
              value={name}
              onChangeText={(text) => {
                setName(text);
                setErrors(prev => ({ ...prev, name: '' }));
              }}
              style={styles.input}
              mode="outlined"
              error={!!errors.name}
              disabled={isLoading}
            />
            {errors.name ? (
              <HelperText type="error" visible={true}>
                {errors.name}
              </HelperText>
            ) : null}
            
            <TextInput
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrors(prev => ({ ...prev, email: '' }));
              }}
              style={styles.input}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              error={!!errors.email}
              disabled={isLoading}
            />
            {errors.email ? (
              <HelperText type="error" visible={true}>
                {errors.email}
              </HelperText>
            ) : null}
            
            <TextInput
              label="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrors(prev => ({ ...prev, password: '' }));
              }}
              secureTextEntry
              style={styles.input}
              mode="outlined"
              error={!!errors.password}
              disabled={isLoading}
            />
            {errors.password ? (
              <HelperText type="error" visible={true}>
                {errors.password}
              </HelperText>
            ) : null}
            
            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setErrors(prev => ({ ...prev, confirmPassword: '' }));
              }}
              secureTextEntry
              style={styles.input}
              mode="outlined"
              error={!!errors.confirmPassword}
              disabled={isLoading}
            />
            {errors.confirmPassword ? (
              <HelperText type="error" visible={true}>
                {errors.confirmPassword}
              </HelperText>
            ) : null}
            
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
              style={styles.linkButton}
              disabled={isLoading}
            >
              Already have an account? Login
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
    marginTop: 5,
  },
  card: {
    margin: 20,
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 2,
  },
  input: {
    marginBottom: 4,
  },
  button: {
    marginTop: 16,
    paddingVertical: 6,
  },
  linkButton: {
    marginTop: 16,
  },
}); 