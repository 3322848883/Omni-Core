import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getPageLoadTime,
  getDomReadyTime,
  getTTFB,
  measureExecutionTime,
  measureAsyncExecutionTime,
  markPerformance,
  measurePerformance,
  clearPerformanceMarks,
  monitorApiPerformance,
  monitorResourcePerformance,
  usePerformanceMonitor,
} from '../performance';

describe('Performance Utils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Mock performance API
    Object.defineProperty(global, 'performance', {
      value: {
        now: vi.fn(() => Date.now()),
        getEntriesByType: vi.fn(() => []),
        mark: vi.fn(),
        measure: vi.fn(),
        clearMarks: vi.fn(),
        clearMeasures: vi.fn(),
        getEntriesByName: vi.fn(() => [{ duration: 100 }]),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('getPageLoadTime', () => {
    it('should return page load time from navigation timing', () => {
      const mockNavigation = {
        loadEventEnd: 1000,
        startTime: 0,
      };
      (performance.getEntriesByType as ReturnType<typeof vi.fn>).mockReturnValue([
        mockNavigation,
      ]);

      const result = getPageLoadTime();
      expect(result).toBe(1000);
    });

    it('should return performance.now() when navigation timing is not available', () => {
      (performance.getEntriesByType as ReturnType<typeof vi.fn>).mockReturnValue([]);
      (performance.now as ReturnType<typeof vi.fn>).mockReturnValue(500);

      const result = getPageLoadTime();
      expect(result).toBe(500);
    });
  });

  describe('getDomReadyTime', () => {
    it('should return DOM ready time from navigation timing', () => {
      const mockNavigation = {
        domContentLoadedEventEnd: 500,
        startTime: 0,
      };
      (performance.getEntriesByType as ReturnType<typeof vi.fn>).mockReturnValue([
        mockNavigation,
      ]);

      const result = getDomReadyTime();
      expect(result).toBe(500);
    });

    it('should return 0 when navigation timing is not available', () => {
      (performance.getEntriesByType as ReturnType<typeof vi.fn>).mockReturnValue([]);

      const result = getDomReadyTime();
      expect(result).toBe(0);
    });
  });

  describe('getTTFB', () => {
    it('should return TTFB from navigation timing', () => {
      const mockNavigation = {
        responseStart: 200,
        startTime: 0,
      };
      (performance.getEntriesByType as ReturnType<typeof vi.fn>).mockReturnValue([
        mockNavigation,
      ]);

      const result = getTTFB();
      expect(result).toBe(200);
    });

    it('should return 0 when navigation timing is not available', () => {
      (performance.getEntriesByType as ReturnType<typeof vi.fn>).mockReturnValue([]);

      const result = getTTFB();
      expect(result).toBe(0);
    });
  });

  describe('measureExecutionTime', () => {
    it('should measure synchronous function execution time', () => {
      const fn = () => 'result';
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = measureExecutionTime(fn, 'test');

      expect(result).toBe('result');
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[0][0]).toContain('[Performance]');
      expect(consoleSpy.mock.calls[0][0]).toContain('test');

      consoleSpy.mockRestore();
    });
  });

  describe('measureAsyncExecutionTime', () => {
    it('should measure asynchronous function execution time', async () => {
      const fn = async () => 'async result';
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await measureAsyncExecutionTime(fn, 'async test');

      expect(result).toBe('async result');
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[0][0]).toContain('[Performance]');
      expect(consoleSpy.mock.calls[0][0]).toContain('async test');

      consoleSpy.mockRestore();
    });
  });

  describe('markPerformance', () => {
    it('should create a performance mark', () => {
      markPerformance('test-mark');
      expect(performance.mark).toHaveBeenCalledWith('test-mark');
    });
  });

  describe('measurePerformance', () => {
    it('should measure between two marks', () => {
      const result = measurePerformance('test-measure', 'start-mark', 'end-mark');

      expect(performance.measure).toHaveBeenCalledWith(
        'test-measure',
        'start-mark',
        'end-mark'
      );
      expect(result).toBe(100);
    });

    it('should return undefined when measure API is not available', () => {
      Object.defineProperty(performance, 'measure', {
        value: undefined,
        writable: true,
      });

      const result = measurePerformance('test', 'start', 'end');
      expect(result).toBeUndefined();
    });
  });

  describe('clearPerformanceMarks', () => {
    it('should clear all performance marks and measures', () => {
      clearPerformanceMarks();
      expect(performance.clearMarks).toHaveBeenCalled();
      expect(performance.clearMeasures).toHaveBeenCalled();
    });
  });
});

describe('monitorApiPerformance', () => {
  it('should return record, getCache, and clearCache functions', () => {
    const monitor = monitorApiPerformance();

    expect(typeof monitor.record).toBe('function');
    expect(typeof monitor.getCache).toBe('function');
    expect(typeof monitor.clearCache).toBe('function');

    // Clean up
    monitor.clearCache();
  });

  it('should record API performance data', () => {
    const monitor = monitorApiPerformance({ enabled: true, sampleRate: 1 });

    // Clear any existing cache first
    monitor.clearCache();

    monitor.record({
      url: '/api/test',
      method: 'GET',
      duration: 100,
      status: 200,
      timestamp: Date.now(),
    });

    const cache = monitor.getCache();
    expect(cache).toHaveLength(1);
    expect(cache[0].url).toBe('/api/test');
  });

  it('should not record when disabled', () => {
    const monitor = monitorApiPerformance({ enabled: false });

    // Clear any existing cache first
    monitor.clearCache();

    monitor.record({
      url: '/api/test',
      method: 'GET',
      duration: 100,
      status: 200,
      timestamp: Date.now(),
    });

    const cache = monitor.getCache();
    expect(cache).toHaveLength(0);
  });

  it('should limit cache size', () => {
    const monitor = monitorApiPerformance({
      enabled: true,
      sampleRate: 1,
      maxCacheSize: 3,
    });

    for (let i = 0; i < 5; i++) {
      monitor.record({
        url: `/api/test${i}`,
        method: 'GET',
        duration: 100,
        status: 200,
        timestamp: Date.now(),
      });
    }

    const cache = monitor.getCache();
    expect(cache).toHaveLength(3);
    expect(cache[0].url).toBe('/api/test2');
  });

  it('should clear cache', () => {
    const monitor = monitorApiPerformance({ enabled: true, sampleRate: 1 });

    monitor.record({
      url: '/api/test',
      method: 'GET',
      duration: 100,
      status: 200,
      timestamp: Date.now(),
    });

    monitor.clearCache();
    const cache = monitor.getCache();
    expect(cache).toHaveLength(0);
  });
});

describe('monitorResourcePerformance', () => {
  beforeEach(() => {
    // Mock PerformanceObserver
    global.PerformanceObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
    })) as unknown as typeof PerformanceObserver;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return start, stop, getCache, and clearCache functions', () => {
    const monitor = monitorResourcePerformance();

    expect(typeof monitor.start).toBe('function');
    expect(typeof monitor.stop).toBe('function');
    expect(typeof monitor.getCache).toBe('function');
    expect(typeof monitor.clearCache).toBe('function');
  });

  it('should start monitoring when called', () => {
    const monitor = monitorResourcePerformance({ enabled: true });
    monitor.start();

    expect(PerformanceObserver).toHaveBeenCalled();
  });
});

describe('usePerformanceMonitor', () => {
  beforeEach(() => {
    // Mock PerformanceObserver
    global.PerformanceObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
    })) as unknown as typeof PerformanceObserver;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return metrics ref and control functions', () => {
    const monitor = usePerformanceMonitor();

    expect(monitor.metrics).toBeDefined();
    expect(monitor.isMonitoring).toBeDefined();
    expect(typeof monitor.start).toBe('function');
    expect(typeof monitor.stop).toBe('function');
    expect(typeof monitor.report).toBe('function');
  });

  it('should start monitoring when start is called', () => {
    const monitor = usePerformanceMonitor({ enabled: true });

    monitor.start();
    expect(monitor.isMonitoring.value).toBe(true);
  });

  it('should stop monitoring when stop is called', () => {
    const monitor = usePerformanceMonitor({ enabled: true });

    monitor.start();
    expect(monitor.isMonitoring.value).toBe(true);

    monitor.stop();
    expect(monitor.isMonitoring.value).toBe(false);
  });

  it('should not start if already monitoring', () => {
    const monitor = usePerformanceMonitor({ enabled: true });

    monitor.start();
    const firstObserverCallCount = (global.PerformanceObserver as unknown as ReturnType<typeof vi.fn>).mock.calls
      .length;

    monitor.start();
    const secondObserverCallCount = (global.PerformanceObserver as unknown as ReturnType<typeof vi.fn>).mock.calls
      .length;

    expect(firstObserverCallCount).toBe(secondObserverCallCount);
  });
});
