import { storage } from './storage';
import { DrinkEntry } from '../types/drink';
import { DateLike } from '../types/date';

// Standard drink unit calculations
const STANDARD_DRINK_UNITS = {
  BEER: 0.5, // 0.5 units per standard beer (330ml, 4% ABV)
  WINE: 1.5, // 1.5 units per standard glass (175ml, 12% ABV)
  SPIRIT: 1.0, // 1 unit per standard measure (25ml, 40% ABV)
  CIDER: 0.5, // 0.5 units per standard cider (330ml, 4% ABV)
  COCKTAIL: 2.0, // 2 units per standard cocktail (varies by type)
};

interface PatternAnalysisResult {
  dailyPatterns: {
    dayOfWeek: string;
    averageUnits: number;
    peakHours: number[];
  }[];
  weeklyPatterns: {
    weekNumber: number;
    totalUnits: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }[];
  monthlyPatterns: {
    month: string;
    totalUnits: number;
    averageUnitsPerDay: number;
  }[];
  riskFactors: {
    bingeDrinking: boolean;
    regularExcess: boolean;
    increasingTrend: boolean;
  };
}

export const patternAnalysisService = {
  // Calculate standard units for a drink
  calculateStandardUnits(drink: DrinkEntry): number {
    const baseUnits = STANDARD_DRINK_UNITS[drink.type.toUpperCase() as keyof typeof STANDARD_DRINK_UNITS] || 1.0;
    return (drink.quantity * drink.alcoholContent * baseUnits) / 100;
  },

  // Analyze drinking patterns over time
  async analyzePatterns(userId: string, timeRange: 'week' | 'month' | 'year' = 'month'): Promise<PatternAnalysisResult> {
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

    // Calculate daily patterns
    const dailyPatterns = this.calculateDailyPatterns(relevantDrinks);

    // Calculate weekly patterns
    const weeklyPatterns = this.calculateWeeklyPatterns(relevantDrinks);

    // Calculate monthly patterns
    const monthlyPatterns = this.calculateMonthlyPatterns(relevantDrinks);

    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(dailyPatterns, weeklyPatterns, monthlyPatterns);

    return {
      dailyPatterns,
      weeklyPatterns,
      monthlyPatterns,
      riskFactors
    };
  },

  // Calculate daily patterns
  calculateDailyPatterns(drinks: DrinkEntry[]): PatternAnalysisResult['dailyPatterns'] {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dailyData = daysOfWeek.map(day => ({
      dayOfWeek: day,
      drinks: [] as DrinkEntry[],
      hours: new Array(24).fill(0)
    }));

    drinks.forEach(drink => {
      const date = new Date(drink.timestamp);
      const dayIndex = date.getDay();
      const hour = date.getHours();
      const units = this.calculateStandardUnits(drink);

      dailyData[dayIndex].drinks.push(drink);
      dailyData[dayIndex].hours[hour] += units;
    });

    return dailyData.map(day => ({
      dayOfWeek: day.dayOfWeek,
      averageUnits: day.drinks.reduce((sum, drink) => 
        sum + this.calculateStandardUnits(drink), 0) / (day.drinks.length || 1),
      peakHours: this.findPeakHours(day.hours)
    }));
  },

  // Calculate weekly patterns
  calculateWeeklyPatterns(drinks: DrinkEntry[]): PatternAnalysisResult['weeklyPatterns'] {
    const weeklyData: { [key: number]: { totalUnits: number; drinks: DrinkEntry[] } } = {};

    drinks.forEach(drink => {
      const date = new Date(drink.timestamp);
      const weekNumber = this.getWeekNumber(date);
      const units = this.calculateStandardUnits(drink);

      if (!weeklyData[weekNumber]) {
        weeklyData[weekNumber] = { totalUnits: 0, drinks: [] };
      }

      weeklyData[weekNumber].totalUnits += units;
      weeklyData[weekNumber].drinks.push(drink);
    });

    return Object.entries(weeklyData).map(([week, data]) => ({
      weekNumber: parseInt(week),
      totalUnits: data.totalUnits,
      trend: this.calculateTrend(data.drinks)
    }));
  },

  // Calculate monthly patterns
  calculateMonthlyPatterns(drinks: DrinkEntry[]): PatternAnalysisResult['monthlyPatterns'] {
    const monthlyData: { [key: string]: { totalUnits: number; days: Set<string> } } = {};

    drinks.forEach(drink => {
      const date = new Date(drink.timestamp);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const units = this.calculateStandardUnits(drink);

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { totalUnits: 0, days: new Set() };
      }

      monthlyData[monthKey].totalUnits += units;
      monthlyData[monthKey].days.add(date.toDateString());
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month: new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' }),
      totalUnits: data.totalUnits,
      averageUnitsPerDay: data.totalUnits / data.days.size
    }));
  },

  // Identify risk factors
  identifyRiskFactors(
    dailyPatterns: PatternAnalysisResult['dailyPatterns'],
    weeklyPatterns: PatternAnalysisResult['weeklyPatterns'],
    monthlyPatterns: PatternAnalysisResult['monthlyPatterns']
  ): PatternAnalysisResult['riskFactors'] {
    // Check for binge drinking (more than 6 units in a single session)
    const bingeDrinking = dailyPatterns.some(day => 
      day.averageUnits > 6
    );

    // Check for regular excess (more than 14 units per week)
    const regularExcess = weeklyPatterns.some(week => 
      week.totalUnits > 14
    );

    // Check for increasing trend
    const increasingTrend = weeklyPatterns.length >= 2 && 
      weeklyPatterns[weeklyPatterns.length - 1].totalUnits > 
      weeklyPatterns[weeklyPatterns.length - 2].totalUnits;

    return {
      bingeDrinking,
      regularExcess,
      increasingTrend
    };
  },

  // Helper methods
  findPeakHours(hourlyData: number[]): number[] {
    const threshold = Math.max(...hourlyData) * 0.7; // 70% of max
    return hourlyData
      .map((units, hour) => ({ hour, units }))
      .filter(data => data.units >= threshold)
      .map(data => data.hour);
  },

  getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  },

  calculateTrend(drinks: DrinkEntry[]): 'increasing' | 'decreasing' | 'stable' {
    if (drinks.length < 2) return 'stable';

    const sortedDrinks = [...drinks].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const firstHalf = sortedDrinks.slice(0, Math.floor(sortedDrinks.length / 2));
    const secondHalf = sortedDrinks.slice(Math.floor(sortedDrinks.length / 2));

    const firstHalfUnits = firstHalf.reduce((sum, drink) => 
      sum + this.calculateStandardUnits(drink), 0);
    const secondHalfUnits = secondHalf.reduce((sum, drink) => 
      sum + this.calculateStandardUnits(drink), 0);

    const firstHalfAverage = firstHalfUnits / firstHalf.length;
    const secondHalfAverage = secondHalfUnits / secondHalf.length;

    if (secondHalfAverage > firstHalfAverage * 1.1) return 'increasing';
    if (secondHalfAverage < firstHalfAverage * 0.9) return 'decreasing';
    return 'stable';
  }
}; 