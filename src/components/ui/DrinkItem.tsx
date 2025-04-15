import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Text, IconButton, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { colors } from '../../theme/colors';

interface DrinkItemProps {
  drink: {
    id: string;
    category: string;
    type: string;
    brand: string;
    alcoholContent: number;
    quantity: number;
    price: number;
    location: string;
    timestamp: string;
    notes?: string;
  };
  onPress?: () => void;
  onDelete?: () => void;
  style?: ViewStyle;
}

export const DrinkItem: React.FC<DrinkItemProps> = ({
  drink,
  onPress,
  onDelete,
  style,
}) => {
  const theme = useTheme();
  const formattedDate = format(new Date(drink.timestamp), 'dd-MM-yyyy');
  const formattedTime = format(new Date(drink.timestamp), 'HH:mm');

  const getDrinkIcon = () => {
    switch (drink.category.toLowerCase()) {
      case 'beer':
        return 'beer';
      case 'wine':
        return 'glass-wine';
      case 'spirit':
        return 'glass-whiskey';
      case 'cocktail':
        return 'glass-cocktail';
      case 'cider':
        return 'glass-mug-variant';
      default:
        return 'glass';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name={getDrinkIcon()}
          size={24}
          color={colors.primary}
        />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.brand}>{drink.brand}</Text>
          <Text style={styles.price}>£{drink.price.toFixed(2)}</Text>
        </View>
        <View style={styles.details}>
          <Text style={styles.detail}>
            {drink.quantity}x • {drink.alcoholContent}% ABV • {drink.type}
          </Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.location}>{drink.location}</Text>
          <Text style={styles.timestamp}>
            {formattedDate} at {formattedTime}
          </Text>
        </View>
      </View>
      {onDelete && (
        <IconButton
          icon="delete"
          size={20}
          onPress={onDelete}
          style={styles.deleteButton}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  brand: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  details: {
    marginBottom: 4,
  },
  detail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  location: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  deleteButton: {
    margin: 0,
    padding: 0,
  },
}); 