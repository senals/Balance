import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { ProgressBar } from './ProgressBar';

interface BudgetDisplayProps {
  spent: number;
  budget: number;
  period: 'daily' | 'weekly' | 'monthly';
  style?: ViewStyle;
}

export const BudgetDisplay: React.FC<BudgetDisplayProps> = ({
  spent,
  budget,
  period,
  style,
}) => {
  const theme = useTheme();
  const progress = budget > 0 ? spent / budget : 0;
  const remaining = Math.max(0, budget - spent);
  const isOverBudget = spent > budget;

  const getPeriodLabel = () => {
    switch (period) {
      case 'daily':
        return 'Today';
      case 'weekly':
        return 'This Week';
      case 'monthly':
        return 'This Month';
      default:
        return '';
    }
  };

  const getPeriodIcon = () => {
    switch (period) {
      case 'daily':
        return 'calendar-today';
      case 'weekly':
        return 'calendar-week';
      case 'monthly':
        return 'calendar-month';
      default:
        return 'calendar';
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons
            name={getPeriodIcon()}
            size={20}
            color={colors.primary}
            style={styles.icon}
          />
          <Text style={styles.title}>{getPeriodLabel()}</Text>
        </View>
        <Text style={[styles.amount, isOverBudget && styles.overBudget]}>
          £{spent.toFixed(2)} / £{budget.toFixed(2)}
        </Text>
      </View>
      
      <ProgressBar
        progress={progress}
        color={isOverBudget ? colors.error : colors.primary}
        height={8}
      />
      
      <View style={styles.footer}>
        <Text style={styles.remaining}>
          {isOverBudget ? 'Over budget by ' : 'Remaining: '}
          <Text style={[styles.remainingAmount, isOverBudget && styles.overBudget]}>
            £{Math.abs(remaining).toFixed(2)}
          </Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  overBudget: {
    color: colors.error,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  remaining: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  remainingAmount: {
    fontWeight: 'bold',
    color: colors.primary,
  },
}); 