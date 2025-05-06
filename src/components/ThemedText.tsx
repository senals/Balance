import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { colors } from '../theme/colors';

type TextType = 'default' | 'defaultSemiBold' | 'title' | 'titleSemiBold' | 'titleBold';

interface ThemedTextProps extends TextProps {
  type?: TextType;
}

export const ThemedText: React.FC<ThemedTextProps> = ({ 
  type = 'default',
  style,
  ...props 
}) => {
  const textStyles: Record<TextType, TextStyle> = {
    default: {
      fontSize: 16,
      color: colors.text,
    },
    defaultSemiBold: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    title: {
      fontSize: 20,
      color: colors.text,
    },
    titleSemiBold: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    titleBold: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
  };

  return <Text style={[textStyles[type], style]} {...props} />;
}; 