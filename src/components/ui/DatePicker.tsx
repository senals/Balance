import React, { useState } from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format, parse } from 'date-fns';
import { colors } from '../../theme/colors';

interface DatePickerProps {
  label: string;
  value: string;
  onChange: (date: string) => void;
  error?: string;
  style?: ViewStyle;
  minimumDate?: Date;
  maximumDate?: Date;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  error,
  style,
  minimumDate,
  maximumDate,
}) => {
  const theme = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  
  // Parse the date string in DD-MM-YYYY format
  const parsedDate = value ? parse(value, 'dd-MM-yyyy', new Date()) : new Date();
  
  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    
    if (selectedDate) {
      // Format the date as DD-MM-YYYY
      const formattedDate = format(selectedDate, 'dd-MM-yyyy');
      onChange(formattedDate);
    }
  };
  
  const formattedDisplayDate = value || 'Select date';
  
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <Button
        mode="outlined"
        onPress={() => setShowPicker(true)}
        style={[
          styles.button,
          error && styles.errorButton,
        ]}
        contentStyle={styles.buttonContent}
      >
        {formattedDisplayDate}
      </Button>
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      {showPicker && (
        <DateTimePicker
          value={parsedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: colors.text,
  },
  button: {
    borderColor: colors.border,
  },
  errorButton: {
    borderColor: colors.error,
  },
  buttonContent: {
    height: 48,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  },
}); 