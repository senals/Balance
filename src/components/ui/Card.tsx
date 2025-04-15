import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Card as PaperCard, Text, useTheme } from 'react-native-paper';
import { colors } from '../../theme/colors';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  rightAction?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  title,
  children,
  style,
  onPress,
  rightAction,
}) => {
  const theme = useTheme();

  return (
    <PaperCard
      style={[styles.card, style]}
      onPress={onPress}
      mode="elevated"
      elevation={2}
    >
      {title && (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {rightAction}
        </View>
      )}
      <PaperCard.Content style={styles.content}>
        {children}
      </PaperCard.Content>
    </PaperCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  content: {
    paddingTop: 8,
  },
}); 