import { storage } from './storage';
import { DrinkEntry } from '../types/drink';
import { DateLike } from '../types/date';
import { patternAnalysisService } from './patternAnalysis';
import { financialAnalyticsService } from './financialAnalytics';

interface UserEngagementProfile {
  userId: string;
  motivationLevel: 'high' | 'medium' | 'low';
  preferredNotificationTime: string;
  notificationFrequency: 'frequent' | 'moderate' | 'rare';
  lastEngagementTimestamp: DateLike;
  engagementStreak: number;
  achievements: string[];
  goals: {
    type: 'reduction' | 'moderation' | 'savings';
    target: number;
    current: number;
    deadline: DateLike;
  }[];
}

interface Notification {
  id: string;
  userId: string;
  type: 'motivational' | 'reminder' | 'achievement' | 'educational';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: DateLike;
  read: boolean;
  action?: {
    type: string;
    data: any;
  };
}

type EngagementStorage = {
  engagement_profiles: Record<string, UserEngagementProfile>;
  notifications: Record<string, Notification[]>;
};

export const engagementService = {
  // Initialize user engagement profile
  async initializeUserProfile(userId: string): Promise<UserEngagementProfile> {
    const profile: UserEngagementProfile = {
      userId,
      motivationLevel: 'medium',
      preferredNotificationTime: '18:00',
      notificationFrequency: 'moderate',
      lastEngagementTimestamp: new Date().toISOString(),
      engagementStreak: 0,
      achievements: [],
      goals: []
    };

    await storage.settings.update({
      [`engagement_${userId}`]: profile
    } as unknown as Record<string, unknown>);
    return profile;
  },

  // Get user engagement profile
  async getUserProfile(userId: string): Promise<UserEngagementProfile> {
    const profile = await storage.settings.get(`engagement_${userId}`);
    if (!profile) {
      return this.initializeUserProfile(userId);
    }
    return profile as unknown as UserEngagementProfile;
  },

  // Update user engagement profile
  async updateUserProfile(userId: string, updates: Partial<UserEngagementProfile>): Promise<UserEngagementProfile> {
    const profile = await this.getUserProfile(userId);
    const updatedProfile = { ...profile, ...updates };
    await storage.settings.update({
      [`engagement_${userId}`]: updatedProfile
    } as unknown as Record<string, unknown>);
    return updatedProfile;
  },

  // Generate adaptive notifications
  async generateNotifications(userId: string): Promise<Notification[]> {
    const profile = await this.getUserProfile(userId);
    const notifications: Notification[] = [];

    // Check engagement streak
    const streakNotification = await this.checkEngagementStreak(profile);
    if (streakNotification) notifications.push(streakNotification);

    // Check goals progress
    const goalNotifications = await this.checkGoalsProgress(profile);
    notifications.push(...goalNotifications);

    // Generate motivational content
    const motivationalNotification = await this.generateMotivationalContent(profile);
    if (motivationalNotification) notifications.push(motivationalNotification);

    // Generate educational content
    const educationalNotification = await this.generateEducationalContent(profile);
    if (educationalNotification) notifications.push(educationalNotification);

    return notifications;
  },

  // Check engagement streak
  async checkEngagementStreak(profile: UserEngagementProfile): Promise<Notification | null> {
    const now = new Date();
    const lastEngagement = new Date(profile.lastEngagementTimestamp);
    const daysSinceLastEngagement = Math.floor(
      (now.getTime() - lastEngagement.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastEngagement === 0) {
      // User engaged today, update streak
      const newStreak = profile.engagementStreak + 1;
      await this.updateUserProfile(profile.userId, { engagementStreak: newStreak });

      if (newStreak % 7 === 0) {
        // Weekly streak achievement
        return {
          id: `streak_${newStreak}`,
          userId: profile.userId,
          type: 'achievement',
          title: 'Weekly Streak!',
          message: `You've maintained your engagement for ${newStreak} days! Keep it up!`,
          priority: 'high',
          timestamp: now.toISOString(),
          read: false
        };
      }
    } else if (daysSinceLastEngagement > 1) {
      // Streak broken
      await this.updateUserProfile(profile.userId, { engagementStreak: 0 });
      return {
        id: 'streak_reminder',
        userId: profile.userId,
        type: 'reminder',
        title: 'Keep Your Streak Alive',
        message: 'Don\'t break your engagement streak! Log in today to keep it going.',
        priority: 'medium',
        timestamp: now.toISOString(),
        read: false
      };
    }

    return null;
  },

  // Check goals progress
  async checkGoalsProgress(profile: UserEngagementProfile): Promise<Notification[]> {
    const notifications: Notification[] = [];
    const now = new Date();

    for (const goal of profile.goals) {
      const progress = (goal.current / goal.target) * 100;
      const deadline = new Date(goal.deadline);
      const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (progress >= 100) {
        // Goal achieved
        notifications.push({
          id: `goal_achieved_${goal.type}`,
          userId: profile.userId,
          type: 'achievement',
          title: 'Goal Achieved!',
          message: `Congratulations! You've reached your ${goal.type} goal!`,
          priority: 'high',
          timestamp: now.toISOString(),
          read: false
        });
      } else if (daysRemaining <= 7 && progress < 75) {
        // Goal deadline approaching
        notifications.push({
          id: `goal_reminder_${goal.type}`,
          userId: profile.userId,
          type: 'reminder',
          title: 'Goal Deadline Approaching',
          message: `You have ${daysRemaining} days left to reach your ${goal.type} goal. Current progress: ${Math.round(progress)}%`,
          priority: 'medium',
          timestamp: now.toISOString(),
          read: false
        });
      }
    }

    return notifications;
  },

  // Generate motivational content
  async generateMotivationalContent(profile: UserEngagementProfile): Promise<Notification | null> {
    const now = new Date();
    const motivationLevel = profile.motivationLevel;
    const lastNotification = await this.getLastNotification(profile.userId, 'motivational');

    // Check if enough time has passed since last notification
    if (lastNotification) {
      const hoursSinceLastNotification = Math.floor(
        (now.getTime() - new Date(lastNotification.timestamp).getTime()) / (1000 * 60 * 60)
      );
      if (hoursSinceLastNotification < 24) return null;
    }

    // Generate content based on motivation level
    const content = this.getMotivationalContent(motivationLevel);
    if (!content) return null;

    return {
      id: `motivational_${now.getTime()}`,
      userId: profile.userId,
      type: 'motivational',
      title: content.title,
      message: content.message,
      priority: motivationLevel === 'low' ? 'high' : 'medium',
      timestamp: now.toISOString(),
      read: false,
      action: content.action
    };
  },

  // Generate educational content
  async generateEducationalContent(profile: UserEngagementProfile): Promise<Notification | null> {
    const now = new Date();
    const lastNotification = await this.getLastNotification(profile.userId, 'educational');

    // Check if enough time has passed since last notification
    if (lastNotification) {
      const daysSinceLastNotification = Math.floor(
        (now.getTime() - new Date(lastNotification.timestamp).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastNotification < 3) return null;
    }

    // Get educational content based on user's progress and interests
    const content = await this.getEducationalContent(profile);
    if (!content) return null;

    return {
      id: `educational_${now.getTime()}`,
      userId: profile.userId,
      type: 'educational',
      title: content.title,
      message: content.message,
      priority: 'medium',
      timestamp: now.toISOString(),
      read: false,
      action: content.action
    };
  },

  // Helper methods
  async getLastNotification(userId: string, type: Notification['type']): Promise<Notification | null> {
    const notifications = await storage.settings.get(`notifications_${userId}`) as unknown as Notification[];
    if (!notifications) return null;
    
    return notifications
      .filter((n: Notification) => n.type === type)
      .sort((a: Notification, b: Notification) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0] || null;
  },

  getMotivationalContent(motivationLevel: UserEngagementProfile['motivationLevel']): { title: string; message: string; action?: any } | null {
    const content = {
      high: {
        title: 'Keep Up the Great Work!',
        message: 'Your dedication to moderation is inspiring. Remember why you started this journey!',
        action: { type: 'viewProgress', data: {} }
      },
      medium: {
        title: 'You\'re Making Progress',
        message: 'Every small step counts. Keep tracking your drinks and stay mindful of your goals.',
        action: { type: 'setGoal', data: {} }
      },
      low: {
        title: 'We\'re Here to Help',
        message: 'It\'s okay to have setbacks. Let\'s work together to get back on track.',
        action: { type: 'viewResources', data: {} }
      }
    };

    return content[motivationLevel] || null;
  },

  async getEducationalContent(profile: UserEngagementProfile): Promise<{ title: string; message: string; action?: any } | null> {
    // Get user's drinking patterns
    const patternAnalysis = await patternAnalysisService.analyzePatterns(profile.userId);
    const financialMetrics = await financialAnalyticsService.calculateFinancialMetrics(profile.userId);

    // Determine which educational content would be most relevant
    if (patternAnalysis.riskFactors.bingeDrinking) {
      return {
        title: 'Understanding Binge Drinking',
        message: 'Learn about the risks of binge drinking and strategies to avoid it.',
        action: { type: 'viewArticle', data: { topic: 'bingeDrinking' } }
      };
    }

    if (financialMetrics.budgetVariance > 0.1) {
      return {
        title: 'Smart Drinking, Smart Spending',
        message: 'Discover tips for enjoying drinks while staying within your budget.',
        action: { type: 'viewArticle', data: { topic: 'budgeting' } }
      };
    }

    return {
      title: 'The Science of Moderation',
      message: 'Learn how moderate drinking can be part of a balanced lifestyle.',
      action: { type: 'viewArticle', data: { topic: 'moderation' } }
    };
  }
}; 