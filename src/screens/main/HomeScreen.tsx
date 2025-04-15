import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { colors } from '../../theme/colors';

export const HomeScreen = ({ navigation }: { navigation: any }) => {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text variant="headlineMedium" style={styles.title}>Welcome to Balance</Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Track your alcohol consumption and manage your finances
      </Text>
      <Button 
        mode="contained" 
        onPress={() => navigation.navigate('Login')}
        style={styles.button}
        labelStyle={styles.buttonLabel}
      >
        Get Started
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  title: {
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
    color: colors.primary,
  },
  subtitle: {
    textAlign: 'center',
    color: colors.text,
    marginBottom: 30,
  },
  button: {
    marginTop: 20,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
  },
  buttonLabel: {
    color: colors.surface,
    fontWeight: 'bold',
  },
}); 