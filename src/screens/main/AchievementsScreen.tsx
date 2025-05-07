import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, IconButton, ProgressBar } from 'react-native-paper';
import { colors } from '../../theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';

type AchievementIcon = 'trophy' | 'cash' | 'calendar-check';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: AchievementIcon;
  progress: number;
  total: number;
  unlocked: boolean;
}

export const AchievementsScreen = ({ navigation }: { navigation: any }) => {
  const { settings, drinks } = useApp();

  // Calculate achievements
  const achievements: Achievement[] = [
    {
      id: 'streak-7',
      title: '7-Day Streak',
      description: 'Stay within your daily limit for 7 consecutive days',
      icon: 'trophy',
      progress: Math.min(drinks.length, 7),
      total: 7,
      unlocked: drinks.length >= 7
    },
    {
      id: 'budget-master',
      title: 'Budget Master',
      description: 'Stay within your weekly budget for 4 weeks',
      icon: 'cash',
      progress: Math.min(Math.floor(drinks.length / 7), 4),
      total: 4,
      unlocked: Math.floor(drinks.length / 7) >= 4
    },
    {
      id: 'social-planner',
      title: 'Social Planner',
      description: 'Create and follow 5 pre-game plans',
      icon: 'calendar-check',
      progress: Math.min((settings?.preGamePlans?.length || 0), 5),
      total: 5,
      unlocked: (settings?.preGamePlans?.length || 0) >= 5
    },
    {
      id: 'moderation-master',
      title: 'Moderation Master',
      description: 'Stay under your daily limit for 30 days',
      icon: 'trophy',
      progress: Math.min(drinks.length, 30),
      total: 30,
      unlocked: drinks.length >= 30
    },
    {
      id: 'savings-champion',
      title: 'Savings Champion',
      description: 'Save £100 in a month',
      icon: 'cash',
      progress: Math.min((settings?.monthlyBudget || 0) - (drinks.reduce((sum, drink) => sum + (drink.price || 0), 0)), 100),
      total: 100,
      unlocked: (settings?.monthlyBudget || 0) - (drinks.reduce((sum, drink) => sum + (drink.price || 0), 0)) >= 100
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
        <Text style={styles.title}>Achievements</Text>
      </View>

      <View style={styles.content}>
        {achievements.map((achievement) => (
          <Card 
            key={achievement.id} 
            style={[
              styles.achievementCard,
              { backgroundColor: '#fff0d4' }
            ]}
          >
            <Card.Content>
              <View style={styles.achievementHeader}>
                <MaterialCommunityIcons
                  name={achievement.icon}
                  size={32}
                  color={achievement.unlocked ? colors.primary : colors.text}
                  style={styles.achievementIcon}
                />
                <View style={styles.achievementInfo}>
                  <Text style={styles.achievementTitle}>{achievement.title}</Text>
                  <Text style={styles.achievementDescription}>{achievement.description}</Text>
                </View>
              </View>
              <View style={styles.progressContainer}>
                <ProgressBar
                  progress={achievement.progress / achievement.total}
                  color={achievement.unlocked ? colors.primary : colors.text}
                  style={styles.progressBar}
                />
                <Text style={styles.progressText}>
                  {achievement.progress}/{achievement.total}
                </Text>
              </View>
              {achievement.unlocked && (
                <View style={styles.unlockedContainer}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={styles.unlockedText}>Achievement Unlocked!</Text>
                </View>
              )}
            </Card.Content>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff7e9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 40,
  },
  backButton: {
    marginRight: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  achievementCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  achievementIcon: {
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
    textAlign: 'right',
  },
  unlockedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  unlockedText: {
    fontSize: 14,
    color: colors.primary,
    marginLeft: 8,
    fontWeight: 'bold',
  },
}); 