import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface ThemedViewProps extends ViewProps {
  type?: 'default' | 'card' | 'surface';
}

export const ThemedView: React.FC<ThemedViewProps> = ({ 
  type = 'default',
  style,
  ...props 
}) => {
  const viewStyle = {
    default: {
      backgroundColor: colors.background,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 16,
      marginVertical: 8,
    },
    surface: {
      backgroundColor: colors.surface,
    },
  }[type];

  return <View style={[viewStyle, style]} {...props} />;
}; 