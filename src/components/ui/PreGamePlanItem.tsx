import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Text, IconButton, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { colors } from '../../theme/colors';

interface PreGamePlanItemProps {
  plan: {
    id: string;
    title: string;
    date: string;
    location: string;
    maxDrinks: number;
    maxSpending: number;
    notes?: string;
    completed?: boolean;
    actualDrinks?: number;
    actualSpending?: number;
    adherencePercentage?: number;
  };
  onPress?: () => void;
  onComplete?: () => void;
  onDelete?: () => void;
  style?: ViewStyle;
}

export const PreGamePlanItem: React.FC<PreGamePlanItemProps> = ({
  plan,
  onPress,
  onComplete,
  onDelete,
  style,
}) => {
  const theme = useTheme();
  const formattedDate = format(new Date(plan.date), 'dd-MM-yyyy');
  const isCompleted = plan.completed;
  const hasAdherenceData = plan.actualDrinks !== undefined && plan.actualSpending !== undefined;

  const getAdherenceColor = () => {
    if (!plan.adherencePercentage) return colors.textSecondary;
    
    if (plan.adherencePercentage >= 80) {
      return colors.success;
    } else if (plan.adherencePercentage >= 50) {
      return colors.warning;
    } else {
      return colors.error;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isCompleted && styles.completedContainer,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{plan.title}</Text>
        {isCompleted && (
          <MaterialCommunityIcons
            name="check-circle"
            size={20}
            color={colors.success}
          />
        )}
      </View>
      
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <MaterialCommunityIcons
            name="calendar"
            size={16}
            color={colors.textSecondary}
            style={styles.icon}
          />
          <Text style={styles.detailText}>{formattedDate}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <MaterialCommunityIcons
            name="map-marker"
            size={16}
            color={colors.textSecondary}
            style={styles.icon}
          />
          <Text style={styles.detailText}>{plan.location}</Text>
        </View>
      </View>
      
      <View style={styles.limits}>
        <View style={styles.limitItem}>
          <Text style={styles.limitLabel}>Max Drinks:</Text>
          <Text style={styles.limitValue}>{plan.maxDrinks}</Text>
          {hasAdherenceData && (
            <Text style={[styles.actualValue, { color: getAdherenceColor() }]}>
              ({plan.actualDrinks})
            </Text>
          )}
        </View>
        
        <View style={styles.limitItem}>
          <Text style={styles.limitLabel}>Max Spending:</Text>
          <Text style={styles.limitValue}>£{plan.maxSpending.toFixed(2)}</Text>
          {hasAdherenceData && (
            <Text style={[styles.actualValue, { color: getAdherenceColor() }]}>
              (£{plan.actualSpending?.toFixed(2)})
            </Text>
          )}
        </View>
      </View>
      
      {hasAdherenceData && (
        <View style={styles.adherenceContainer}>
          <Text style={styles.adherenceLabel}>Adherence:</Text>
          <Text style={[styles.adherenceValue, { color: getAdherenceColor() }]}>
            {plan.adherencePercentage?.toFixed(0)}%
          </Text>
        </View>
      )}
      
      <View style={styles.actions}>
        {!isCompleted && onComplete && (
          <IconButton
            icon="check"
            size={20}
            onPress={onComplete}
            style={styles.actionButton}
          />
        )}
        {onDelete && (
          <IconButton
            icon="delete"
            size={20}
            onPress={onDelete}
            style={styles.actionButton}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
  },
  completedContainer: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  details: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  icon: {
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  limits: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  limitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  limitLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 4,
  },
  limitValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  actualValue: {
    fontSize: 14,
    marginLeft: 4,
  },
  adherenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  adherenceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 4,
  },
  adherenceValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    margin: 0,
    padding: 0,
    marginLeft: 8,
  },
}); 