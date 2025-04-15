import React from 'react';
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Button as PaperButton, useTheme } from 'react-native-paper';
import { colors } from '../../theme/colors';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text';

interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  children,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const theme = useTheme();

  const getButtonMode = () => {
    switch (variant) {
      case 'outline':
        return 'outlined';
      case 'text':
        return 'text';
      default:
        return 'contained';
    }
  };

  const getButtonStyle = () => {
    const baseStyle = [styles.button];
    
    if (fullWidth) {
      baseStyle.push(styles.fullWidth);
    }
    
    if (variant === 'primary') {
      baseStyle.push(styles.primaryButton);
    } else if (variant === 'secondary') {
      baseStyle.push(styles.secondaryButton);
    } else if (variant === 'outline') {
      baseStyle.push(styles.outlineButton);
    }
    
    return [...baseStyle, style];
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text];
    
    if (variant === 'outline' || variant === 'text') {
      baseStyle.push(styles.outlineText);
    }
    
    return [...baseStyle, textStyle];
  };

  return (
    <PaperButton
      mode={getButtonMode()}
      onPress={onPress}
      disabled={disabled}
      loading={loading}
      icon={icon}
      style={getButtonStyle()}
      labelStyle={getTextStyle()}
      contentStyle={styles.content}
    >
      {children}
    </PaperButton>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    marginVertical: 8,
  },
  fullWidth: {
    width: '100%',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
  },
  outlineButton: {
    borderColor: colors.primary,
  },
  content: {
    height: 48,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.surface,
  },
  outlineText: {
    color: colors.primary,
  },
}); 