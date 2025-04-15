import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ProgressBar as PaperProgressBar, Text, useTheme } from 'react-native-paper';
import { colors } from '../../theme/colors';

interface ProgressBarProps {
  progress: number;
  label?: string;
  showPercentage?: boolean;
  color?: string;
  style?: ViewStyle;
  height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  showPercentage = true,
  color = colors.primary,
  style,
  height = 8,
}) => {
  const theme = useTheme();
  const percentage = Math.round(progress * 100);
  const isOverLimit = progress > 1;

  return (
    <View style={[styles.container, style]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          {showPercentage && (
            <Text style={[styles.percentage, isOverLimit && styles.overLimit]}>
              {percentage}%
            </Text>
          )}
        </View>
      )}
      <PaperProgressBar
        progress={Math.min(progress, 1)}
        color={isOverLimit ? colors.error : color}
        style={[styles.progressBar, { height }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    color: colors.text,
  },
  percentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  overLimit: {
    color: colors.error,
  },
  progressBar: {
    borderRadius: 4,
  },
}); 