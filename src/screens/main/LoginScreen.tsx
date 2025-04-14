import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { colors } from '../../theme/colors';

export const LoginScreen = ({ navigation }: { navigation: any }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // TODO: Implement actual login logic
    console.log('Login attempt with:', email, password);
    // Navigate to Main tab navigator after successful login
    navigation.navigate('Main');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        mode="outlined"
        keyboardType="email-address"
        autoCapitalize="none"
        theme={{ 
          colors: { 
            background: colors.input,
            primary: colors.text,
            accent: colors.text
          } 
        }}
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        mode="outlined"
        theme={{ 
          colors: { 
            background: colors.input,
            primary: colors.text,
            accent: colors.text
          } 
        }}
      />
      <Button 
        mode="contained" 
        onPress={handleLogin}
        style={styles.button}
      >
        Login
      </Button>
      <Button 
        mode="text" 
        onPress={() => navigation.navigate('Register')}
        style={styles.button}
        labelStyle={{ color: colors.text }}
      >
        Don't have an account? Register
      </Button>
      <Button 
        mode="text" 
        onPress={() => navigation.navigate('Home')}
        style={styles.button}
        labelStyle={{ color: colors.text }}
      >
        Back to Home
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
    backgroundColor: colors.input,
  },
  button: {
    marginTop: 10,
    paddingHorizontal: 20,
  },
});
