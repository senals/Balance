import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { colors } from '../../theme/colors';

export const RegisterScreen = ({ navigation }: { navigation: any }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [university, setUniversity] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');

  const handleRegister = () => {
    // TODO: Implement actual registration logic
    console.log('Registration attempt with:', { name, email, university, yearOfStudy });
    // Navigate to login after successful registration
    navigation.navigate('Login');
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Create Account</Text>
        <TextInput
          label="Full Name"
          value={name}
          onChangeText={setName}
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
        <TextInput
          label="University"
          value={university}
          onChangeText={setUniversity}
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
        <TextInput
          label="Year of Study"
          value={yearOfStudy}
          onChangeText={setYearOfStudy}
          style={styles.input}
          mode="outlined"
          keyboardType="numeric"
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
          onPress={handleRegister}
          style={styles.button}
        >
          Register
        </Button>
        <Button 
          mode="text" 
          onPress={() => navigation.navigate('Login')}
          style={styles.button}
          labelStyle={{ color: colors.text }}
        >
          Already have an account? Login
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
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
    backgroundColor: colors.button,
  },
}); 