import { financialAnalyticsService } from '../../services/financialAnalytics';
import { DrinkEntry } from '../../types/drink';

describe('Financial Analytics Performance Tests', () => {
  const generateTestData = (count: number): DrinkEntry[] => {
    const drinks: DrinkEntry[] = [];
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
      drinks.push({
        id: `drink-${i}`,
        userId: 'test-user',
        type: 'beer',
        price: Math.random() * 10,
        timestamp: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        volume: 500,
        alcoholContent: 5,
      });
    }
    
    return drinks;
  };

  test('Performance of calculateFinancialMetrics with large dataset', () => {
    const testData = generateTestData(1000);
    
    measurePerformance.start('calculateFinancialMetrics');
    const result = financialAnalyticsService.calculateFinancialMetrics('test-user', 'month');
    measurePerformance.end('calculateFinancialMetrics');
    
    expect(result).toBeDefined();
    expect(result.totalSpent).toBeGreaterThanOrEqual(0);
  });

  test('Performance of calculateSpendingTrend with varying dataset sizes', () => {
    const datasetSizes = [100, 1000, 10000];
    
    datasetSizes.forEach(size => {
      const testData = generateTestData(size);
      
      measurePerformance.start(`calculateSpendingTrend-${size}`);
      const trend = financialAnalyticsService.calculateSpendingTrend(testData);
      measurePerformance.end(`calculateSpendingTrend-${size}`);
      
      expect(['increasing', 'decreasing', 'stable']).toContain(trend);
    });
  });

  test('Memory usage during financial calculations', () => {
    const testData = generateTestData(5000);
    
    measurePerformance.start('memory');
    const memoryBefore = measurePerformance.measureMemory();
    
    financialAnalyticsService.calculateFinancialMetrics('test-user', 'year');
    
    const memoryAfter = measurePerformance.measureMemory();
    measurePerformance.end('memory');
    
    // Check that memory usage didn't increase by more than 50MB
    expect(memoryAfter.heapUsed - memoryBefore.heapUsed).toBeLessThan(50 * 1024 * 1024);
  });

  test('Performance of identifySavingsOpportunities', () => {
    const testData = generateTestData(2000);
    
    measurePerformance.start('identifySavingsOpportunities');
    const opportunities = financialAnalyticsService.identifySavingsOpportunities(testData);
    measurePerformance.end('identifySavingsOpportunities');
    
    expect(Array.isArray(opportunities)).toBe(true);
  });

  test('Performance under concurrent operations', async () => {
    const testData = generateTestData(1000);
    const operations = 10;
    
    measurePerformance.start('concurrentOperations');
    
    const promises = Array(operations).fill(null).map(() => 
      financialAnalyticsService.calculateFinancialMetrics('test-user', 'month')
    );
    
    await Promise.all(promises);
    measurePerformance.end('concurrentOperations');
  });
}); 