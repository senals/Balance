import { storage } from './storage';
import { DrinkEntry } from '../types/drink';
import { DateLike } from '../types/date';
import { financialAnalyticsService } from './financialAnalytics';
import { patternAnalysisService } from './patternAnalysis';

interface FeedbackMessage {
  type: 'warning' | 'suggestion' | 'achievement';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: DateLike;
  data?: any;
}

interface FeedbackContext {
  currentDrink?: DrinkEntry;
  recentDrinks: DrinkEntry[];
  financialMetrics?: any;
  patternAnalysis?: any;
  userSettings?: any;
}

export const feedbackService = {
  // Generate real-time feedback
  async generateFeedback(userId: string, currentDrink?: DrinkEntry): Promise<FeedbackMessage[]> {
    const feedback: FeedbackMessage[] = [];
    const context = await this.getFeedbackContext(userId, currentDrink);

    // Check budget limits
    if (context.financialMetrics) {
      const budgetFeedback = this.checkBudgetLimits(context);
      if (budgetFeedback) feedback.push(budgetFeedback);
    }

    // Check drinking patterns
    if (context.patternAnalysis) {
      const patternFeedback = this.checkDrinkingPatterns(context);
      if (patternFeedback) feedback.push(patternFeedback);
    }

    // Check current drink
    if (context.currentDrink) {
      const drinkFeedback = this.checkCurrentDrink(context);
      if (drinkFeedback) feedback.push(drinkFeedback);
    }

    // Check achievements
    const achievements = this.checkAchievements(context);
    feedback.push(...achievements);

    return feedback;
  },

  // Get context for feedback generation
  async getFeedbackContext(userId: string, currentDrink?: DrinkEntry): Promise<FeedbackContext> {
    const recentDrinks = await storage.drinks.getAll(userId);
    const userSettings = await storage.settings.get(userId);
    const financialMetrics = await financialAnalyticsService.calculateFinancialMetrics(userId);
    const patternAnalysis = await patternAnalysisService.analyzePatterns(userId);

    return {
      currentDrink,
      recentDrinks,
      financialMetrics,
      patternAnalysis,
      userSettings
    };
  },

  // Check budget limits
  checkBudgetLimits(context: FeedbackContext): FeedbackMessage | null {
    const { financialMetrics, userSettings } = context;
    if (!financialMetrics || !userSettings) return null;

    const { totalSpent, budgetVariance } = financialMetrics;
    const { dailyLimit } = userSettings;

    if (budgetVariance > 0.1) { // 10% over budget
      return {
        type: 'warning',
        title: 'Budget Warning',
        message: `You're ${Math.round(budgetVariance * 100)}% over your monthly budget. Consider reducing your spending.`,
        priority: 'high',
        timestamp: new Date().toISOString(),
        data: { totalSpent, budgetVariance }
      };
    }

    return null;
  },

  // Check drinking patterns
  checkDrinkingPatterns(context: FeedbackContext): FeedbackMessage | null {
    const { patternAnalysis } = context;
    if (!patternAnalysis) return null;

    const { riskFactors } = patternAnalysis;

    if (riskFactors.bingeDrinking) {
      return {
        type: 'warning',
        title: 'Binge Drinking Alert',
        message: 'Your drinking pattern shows signs of binge drinking. Consider spacing out your drinks.',
        priority: 'high',
        timestamp: new Date().toISOString(),
        data: { riskFactors }
      };
    }

    if (riskFactors.increasingTrend) {
      return {
        type: 'suggestion',
        title: 'Increasing Consumption',
        message: 'Your alcohol consumption has been increasing. Consider setting a goal to reduce it.',
        priority: 'medium',
        timestamp: new Date().toISOString(),
        data: { riskFactors }
      };
    }

    return null;
  },

  // Check current drink
  checkCurrentDrink(context: FeedbackContext): FeedbackMessage | null {
    const { currentDrink, recentDrinks } = context;
    if (!currentDrink) return null;

    // Check if this is the first drink of the day
    const today = new Date().toDateString();
    const drinksToday = recentDrinks.filter(drink => 
      new Date(drink.timestamp).toDateString() === today
    );

    if (drinksToday.length === 0) {
      return {
        type: 'suggestion',
        title: 'First Drink of the Day',
        message: 'Remember to pace yourself and stay hydrated.',
        priority: 'low',
        timestamp: new Date().toISOString()
      };
    }

    // Check if this drink would exceed daily limits
    const totalUnitsToday = drinksToday.reduce((sum, drink) => 
      sum + patternAnalysisService.calculateStandardUnits(drink), 0);
    const currentDrinkUnits = patternAnalysisService.calculateStandardUnits(currentDrink);

    if (totalUnitsToday + currentDrinkUnits > 4) { // Example daily limit
      return {
        type: 'warning',
        title: 'Approaching Daily Limit',
        message: `This drink would bring you to ${Math.round(totalUnitsToday + currentDrinkUnits)} units today. Consider stopping.`,
        priority: 'high',
        timestamp: new Date().toISOString(),
        data: { totalUnitsToday, currentDrinkUnits }
      };
    }

    return null;
  },

  // Check achievements
  checkAchievements(context: FeedbackContext): FeedbackMessage[] {
    const { recentDrinks, financialMetrics } = context;
    const achievements: FeedbackMessage[] = [];

    // Check for savings achievement
    if (financialMetrics?.savingsOpportunities?.length > 0) {
      const totalPotentialSavings = financialMetrics.savingsOpportunities.reduce(
        (sum: number, opp: { potentialSavings: number }) => sum + opp.potentialSavings, 0
      );

      if (totalPotentialSavings > 50) { // Example threshold
        achievements.push({
          type: 'achievement',
          title: 'Savings Opportunity',
          message: `You could save $${Math.round(totalPotentialSavings)} per month by following our recommendations!`,
          priority: 'medium',
          timestamp: new Date().toISOString(),
          data: { savingsOpportunities: financialMetrics.savingsOpportunities }
        });
      }
    }

    // Check for moderation achievement
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const drinksLastWeek = recentDrinks.filter(drink => 
      new Date(drink.timestamp) >= lastWeek
    );

    if (drinksLastWeek.length > 0) {
      const averageUnitsPerDay = drinksLastWeek.reduce((sum, drink) => 
        sum + patternAnalysisService.calculateStandardUnits(drink), 0) / 7;

      if (averageUnitsPerDay < 2) { // Example threshold
        achievements.push({
          type: 'achievement',
          title: 'Great Moderation',
          message: 'You\'ve maintained a healthy drinking pattern this week!',
          priority: 'low',
          timestamp: new Date().toISOString(),
          data: { averageUnitsPerDay }
        });
      }
    }

    return achievements;
  }
}; 