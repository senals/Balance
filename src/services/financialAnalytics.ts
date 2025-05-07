import { storage } from './storage';
import { DrinkEntry } from '../types/drink';
import { DateLike } from '../types/date';

interface FinancialMetrics {
  totalSpent: number;
  averageSpentPerDay: number;
  averageSpentPerDrink: number;
  spendingTrend: 'increasing' | 'decreasing' | 'stable';
  projectedMonthlySpend: number;
  budgetVariance: number;
  savingsOpportunities: {
    category: string;
    potentialSavings: number;
    recommendation: string;
  }[];
}

interface BudgetProjection {
  dailyProjection: number;
  weeklyProjection: number;
  monthlyProjection: number;
  confidenceLevel: number;
  factors: {
    historicalSpending: number;
    seasonalAdjustment: number;
    trendAdjustment: number;
  };
}

export const financialAnalyticsService = {
  // Calculate financial metrics
  async calculateFinancialMetrics(userId: string, timeRange: 'week' | 'month' | 'year' = 'month'): Promise<FinancialMetrics> {
    const drinks = await storage.drinks.getAll(userId);
    const now = new Date();
    const startDate = new Date();
    
    // Set start date based on time range
    switch (timeRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Filter drinks within the time range
    const relevantDrinks = drinks.filter(drink => 
      new Date(drink.timestamp) >= startDate
    );

    // Calculate basic metrics
    const totalSpent = relevantDrinks.reduce((sum, drink) => sum + (drink.price || 0), 0);
    const daysInRange = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const averageSpentPerDay = totalSpent / daysInRange;
    const averageSpentPerDrink = totalSpent / relevantDrinks.length;

    // Calculate spending trend
    const spendingTrend = this.calculateSpendingTrend(relevantDrinks);

    // Calculate projected monthly spend
    const projectedMonthlySpend = this.calculateProjectedMonthlySpend(relevantDrinks);

    // Calculate budget variance
    const budget = await storage.budget.get(userId);
    const budgetVariance = budget ? (totalSpent - budget.monthlyBudget) / budget.monthlyBudget : 0;

    // Identify savings opportunities
    const savingsOpportunities = this.identifySavingsOpportunities(relevantDrinks);

    return {
      totalSpent,
      averageSpentPerDay,
      averageSpentPerDrink,
      spendingTrend,
      projectedMonthlySpend,
      budgetVariance,
      savingsOpportunities
    };
  },

  // Calculate budget projections
  async calculateBudgetProjection(userId: string): Promise<BudgetProjection> {
    const drinks = await storage.drinks.getAll(userId);
    const now = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(now.getMonth() - 1);

    // Filter drinks from last month
    const lastMonthDrinks = drinks.filter(drink => 
      new Date(drink.timestamp) >= lastMonth
    );

    // Calculate historical spending
    const historicalSpending = lastMonthDrinks.reduce((sum, drink) => sum + (drink.price || 0), 0);

    // Calculate seasonal adjustment (example: higher spending during holidays)
    const seasonalAdjustment = this.calculateSeasonalAdjustment(now);

    // Calculate trend adjustment
    const trendAdjustment = this.calculateTrendAdjustment(drinks);

    // Calculate projections
    const dailyProjection = (historicalSpending * seasonalAdjustment * trendAdjustment) / 30;
    const weeklyProjection = dailyProjection * 7;
    const monthlyProjection = dailyProjection * 30;

    // Calculate confidence level based on data quality
    const confidenceLevel = this.calculateConfidenceLevel(drinks);

    return {
      dailyProjection,
      weeklyProjection,
      monthlyProjection,
      confidenceLevel,
      factors: {
        historicalSpending,
        seasonalAdjustment,
        trendAdjustment
      }
    };
  },

  // Helper methods
  calculateSpendingTrend(drinks: DrinkEntry[]): 'increasing' | 'decreasing' | 'stable' {
    if (drinks.length < 2) return 'stable';

    const sortedDrinks = [...drinks].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const firstHalf = sortedDrinks.slice(0, Math.floor(sortedDrinks.length / 2));
    const secondHalf = sortedDrinks.slice(Math.floor(sortedDrinks.length / 2));

    const firstHalfSpending = firstHalf.reduce((sum, drink) => sum + (drink.price || 0), 0);
    const secondHalfSpending = secondHalf.reduce((sum, drink) => sum + (drink.price || 0), 0);

    const firstHalfAverage = firstHalfSpending / firstHalf.length;
    const secondHalfAverage = secondHalfSpending / secondHalf.length;

    if (secondHalfAverage > firstHalfAverage * 1.1) return 'increasing';
    if (secondHalfAverage < firstHalfAverage * 0.9) return 'decreasing';
    return 'stable';
  },

  calculateProjectedMonthlySpend(drinks: DrinkEntry[]): number {
    const now = new Date();
    const startDate = new Date();
    startDate.setMonth(now.getMonth() - 1);

    const lastMonthDrinks = drinks.filter(drink => 
      new Date(drink.timestamp) >= startDate
    );

    const lastMonthSpending = lastMonthDrinks.reduce((sum, drink) => sum + (drink.price || 0), 0);
    const trend = this.calculateSpendingTrend(drinks);

    let projection = lastMonthSpending;
    if (trend === 'increasing') {
      projection *= 1.1; // 10% increase
    } else if (trend === 'decreasing') {
      projection *= 0.9; // 10% decrease
    }

    return projection;
  },

  identifySavingsOpportunities(drinks: DrinkEntry[]): FinancialMetrics['savingsOpportunities'] {
    const opportunities: FinancialMetrics['savingsOpportunities'] = [];

    // Group drinks by type
    const drinksByType = drinks.reduce((acc, drink) => {
      if (!acc[drink.type]) {
        acc[drink.type] = [];
      }
      acc[drink.type].push(drink);
      return acc;
    }, {} as Record<string, DrinkEntry[]>);

    // Analyze each drink type
    Object.entries(drinksByType).forEach(([type, typeDrinks]) => {
      const totalSpent = typeDrinks.reduce((sum, drink) => sum + (drink.price || 0), 0);
      const averagePrice = totalSpent / typeDrinks.length;

      // Identify potential savings
      if (averagePrice > 5) { // Example threshold
        opportunities.push({
          category: type,
          potentialSavings: totalSpent * 0.2, // 20% potential savings
          recommendation: `Consider switching to more affordable ${type} options`
        });
      }
    });

    return opportunities;
  },

  calculateSeasonalAdjustment(date: Date): number {
    // Example seasonal adjustments
    const month = date.getMonth();
    const isHolidaySeason = month === 11 || month === 0; // December or January
    const isSummer = month >= 5 && month <= 7; // June to August

    if (isHolidaySeason) return 1.2; // 20% increase during holidays
    if (isSummer) return 1.1; // 10% increase during summer
    return 1.0; // No adjustment
  },

  calculateTrendAdjustment(drinks: DrinkEntry[]): number {
    const trend = this.calculateSpendingTrend(drinks);
    switch (trend) {
      case 'increasing':
        return 1.1; // 10% increase
      case 'decreasing':
        return 0.9; // 10% decrease
      default:
        return 1.0; // No adjustment
    }
  },

  calculateConfidenceLevel(drinks: DrinkEntry[]): number {
    if (drinks.length === 0) return 0.5; // Low confidence with no data

    const now = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(now.getMonth() - 1);

    const recentDrinks = drinks.filter(drink => 
      new Date(drink.timestamp) >= lastMonth
    );

    // Calculate confidence based on data points and recency
    const dataPointsScore = Math.min(recentDrinks.length / 30, 1); // Normalize to 1
    const recencyScore = recentDrinks.length > 0 ? 1 : 0.5;

    return (dataPointsScore + recencyScore) / 2;
  }
}; 