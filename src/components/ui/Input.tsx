import React from 'react';
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { TextInput, HelperText, useTheme } from 'react-native-paper';
import { colors } from '../../theme/colors';

interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  multiline?: boolean;
  numberOfLines?: number;
  disabled?: boolean;
  left?: React.ReactNode;
  right?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  maxLength?: number;
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  error,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  disabled = false,
  left,
  right,
  style,
  textStyle,
  maxLength,
}) => {
  const theme = useTheme();

  return (
    <>
      <TextInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        disabled={disabled}
        left={left}
        right={right}
        style={[styles.input, style]}
        mode="outlined"
        outlineColor={error ? colors.error : colors.border}
        activeOutlineColor={colors.primary}
        maxLength={maxLength}
        theme={{
          colors: {
            primary: colors.primary,
            text: colors.text,
            placeholder: colors.textSecondary,
            background: colors.surface,
          },
        }}
      />
      {(error || maxLength) && (
        <HelperText
          type={error ? 'error' : 'info'}
          visible={true}
          style={styles.helperText}
        >
          {error || `${value.length}/${maxLength}`}
        </HelperText>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  helperText: {
    marginTop: -4,
    marginBottom: 8,
  },
}); 