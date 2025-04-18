import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Button, TextInput, Portal, Modal } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../theme/colors';
import { format, isValid } from 'date-fns';

interface DatePickerProps {
  date: Date;
  onDateChange: (date: Date) => void;
  label?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({ 
  date, 
  onDateChange, 
  label = 'Date' 
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(date);
  const [validDate, setValidDate] = useState(isValid(date) ? date : new Date());

  // Update validDate if the date prop changes
  useEffect(() => {
    if (isValid(date)) {
      setValidDate(date);
      setTempDate(date);
    }
  }, [date]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      onDateChange(selectedDate);
    }
  };

  const handleConfirm = () => {
    onDateChange(tempDate);
    setShowPicker(false);
  };

  const handleCancel = () => {
    setTempDate(validDate);
    setShowPicker(false);
  };

  const formattedDate = format(validDate, 'dd-MM-yyyy');

  return (
    <View style={styles.container}>
      <TextInput
        label={label}
        value={formattedDate}
        onPressIn={() => setShowPicker(true)}
        style={styles.input}
        mode="outlined"
        editable={false}
        right={
          <TextInput.Icon 
            icon="calendar" 
            onPress={() => setShowPicker(true)}
          />
        }
        theme={{ 
          colors: { 
            background: colors.input,
            primary: colors.text,
            accent: colors.text,
            text: colors.text,
            placeholder: colors.text
          } 
        }}
      />

      {Platform.OS === 'ios' ? (
        <Portal>
          <Modal
            visible={showPicker}
            onDismiss={() => setShowPicker(false)}
            contentContainerStyle={styles.modalContainer}
          >
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              onChange={(event, date) => {
                if (date) setTempDate(date);
              }}
            />
            <View style={styles.buttonContainer}>
              <Button onPress={handleCancel}>Cancel</Button>
              <Button onPress={handleConfirm}>Confirm</Button>
            </View>
          </Modal>
        </Portal>
      ) : (
        showPicker && (
          <DateTimePicker
            value={validDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: colors.surface,
  },
  modalContainer: {
    backgroundColor: colors.surface,
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
}); 