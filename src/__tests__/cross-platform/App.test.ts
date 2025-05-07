import { render, fireEvent, waitFor } from '@testing-library/react-native';
import App from '../../App';
import { PerformanceMonitor } from 'react-native-performance-monitor';

describe('Cross-Platform App Tests', () => {
  beforeEach(() => {
    PerformanceMonitor.startMonitoring();
  });

  afterEach(() => {
    PerformanceMonitor.stopMonitoring();
  });

  test('App renders correctly on all platforms', async () => {
    const { getByTestId } = render(<App />);
    
    // Test initial render performance
    const metrics = PerformanceMonitor.getMetrics();
    expect(metrics.fps).toBeGreaterThanOrEqual(30);
    expect(metrics.memory.used).toBeLessThan(metrics.memory.total * 0.8);
    
    // Test navigation performance
    measurePerformance.start('navigation');
    fireEvent.press(getByTestId('navigation-button'));
    measurePerformance.end('navigation');
    
    // Test data loading performance
    measurePerformance.start('data-loading');
    await waitFor(() => {
      expect(getByTestId('data-loaded')).toBeTruthy();
    });
    measurePerformance.end('data-loading');
  });

  test('Memory usage during app lifecycle', async () => {
    const { unmount } = render(<App />);
    
    const initialMetrics = PerformanceMonitor.getMetrics();
    
    // Simulate app usage
    for (let i = 0; i < 10; i++) {
      measurePerformance.start(`interaction-${i}`);
      // Simulate user interactions
      await new Promise(resolve => setTimeout(resolve, 100));
      measurePerformance.end(`interaction-${i}`);
    }
    
    const finalMetrics = PerformanceMonitor.getMetrics();
    
    // Check memory growth
    expect(finalMetrics.memory.used - initialMetrics.memory.used).toBeLessThan(50 * 1024 * 1024); // 50MB limit
    
    // Cleanup
    unmount();
  });

  test('Network request performance', async () => {
    const { getByTestId } = render(<App />);
    
    measurePerformance.start('network-request');
    fireEvent.press(getByTestId('refresh-button'));
    
    await waitFor(() => {
      expect(getByTestId('data-updated')).toBeTruthy();
    });
    measurePerformance.end('network-request');
    
    const metrics = PerformanceMonitor.getMetrics();
    expect(metrics.network.latency).toBeLessThan(1000); // 1 second limit
  });

  test('UI responsiveness under load', async () => {
    const { getByTestId } = render(<App />);
    
    // Simulate rapid user interactions
    const interactions = 20;
    const promises = [];
    
    for (let i = 0; i < interactions; i++) {
      measurePerformance.start(`ui-interaction-${i}`);
      promises.push(
        new Promise(resolve => {
          fireEvent.press(getByTestId('action-button'));
          setTimeout(resolve, 50);
        })
      );
      measurePerformance.end(`ui-interaction-${i}`);
    }
    
    await Promise.all(promises);
    
    const metrics = PerformanceMonitor.getMetrics();
    expect(metrics.fps).toBeGreaterThanOrEqual(30);
  });
}); 