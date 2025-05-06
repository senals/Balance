const { PerformanceObserver, performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

// Create a directory for performance logs if it doesn't exist
const logsDir = path.join(__dirname, 'performance-logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Performance metrics collector
const metrics = {
  memory: [],
  render: [],
  network: [],
  algorithm: [],
};

// Set up performance observer
const observer = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach((entry) => {
    if (entry.name.startsWith('memory')) {
      metrics.memory.push(entry);
    } else if (entry.name.startsWith('render')) {
      metrics.render.push(entry);
    } else if (entry.name.startsWith('network')) {
      metrics.network.push(entry);
    } else if (entry.name.startsWith('algorithm')) {
      metrics.algorithm.push(entry);
    }
  });
});

observer.observe({ entryTypes: ['measure'] });

// Save metrics after all tests
afterAll(() => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logFile = path.join(logsDir, `performance-${timestamp}.json`);
  
  fs.writeFileSync(logFile, JSON.stringify(metrics, null, 2));
});

// Performance measurement utilities
global.measurePerformance = {
  start: (name) => {
    performance.mark(`${name}-start`);
  },
  end: (name) => {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
  },
  measureMemory: () => {
    const memoryUsage = process.memoryUsage();
    performance.mark('memory-end');
    performance.measure('memory', 'memory-start', 'memory-end');
    return memoryUsage;
  },
};

// Mock React Native Performance Monitor
jest.mock('react-native-performance-monitor', () => ({
  startMonitoring: jest.fn(),
  stopMonitoring: jest.fn(),
  getMetrics: jest.fn(() => ({
    fps: 60,
    memory: {
      used: 100,
      total: 1000,
    },
    cpu: {
      usage: 20,
    },
  })),
})); 