import { ref, type Ref } from 'vue';

/**
 * 性能指标类型
 */
export interface PerformanceMetrics {
  // 页面加载时间
  pageLoadTime: number;
  // DOM 就绪时间
  domReadyTime: number;
  // 首字节时间 (TTFB)
  ttfb: number;
  // 首次内容绘制 (FCP)
  fcp?: number;
  // 最大内容绘制 (LCP)
  lcp?: number;
  // 首次输入延迟 (FID)
  fid?: number;
  // 累积布局偏移 (CLS)
  cls?: number;
  // 交互到下一次绘制 (INP)
  inp?: number;
}

/**
 * API 请求性能数据
 */
export interface ApiPerformanceData {
  url: string;
  method: string;
  duration: number;
  status: number;
  timestamp: number;
  requestSize?: number;
  responseSize?: number;
}

/**
 * 资源加载性能数据
 */
export interface ResourcePerformanceData {
  name: string;
  type: string;
  duration: number;
  size: number;
  timestamp: number;
}

/**
 * 性能监控配置
 */
export interface PerformanceMonitorConfig {
  // 是否启用监控
  enabled: boolean;
  // 采样率 (0-1)
  sampleRate: number;
  // 上报地址
  reportUrl?: string;
  // 上报间隔 (毫秒)
  reportInterval: number;
  // 最大缓存条数
  maxCacheSize: number;
  // 是否监控 API
  monitorApi: boolean;
  // 是否监控资源
  monitorResources: boolean;
  // 是否监控 Web Vitals
  monitorWebVitals: boolean;
}

// 默认配置
const defaultConfig: PerformanceMonitorConfig = {
  enabled: true,
  sampleRate: 1.0,
  reportInterval: 30000,
  maxCacheSize: 100,
  monitorApi: true,
  monitorResources: true,
  monitorWebVitals: true,
};

// API 性能数据缓存
const apiPerformanceCache: ApiPerformanceData[] = [];
// 资源加载性能数据缓存
const resourcePerformanceCache: ResourcePerformanceData[] = [];
// 性能指标
const performanceMetrics: Partial<PerformanceMetrics> = {};

/**
 * 获取页面加载时间
 */
export function getPageLoadTime(): number {
  const navigation = performance.getEntriesByType(
    'navigation'
  )[0] as PerformanceNavigationTiming;
  if (navigation) {
    return navigation.loadEventEnd - navigation.startTime;
  }
  return performance.now();
}

/**
 * 获取 DOM 就绪时间
 */
export function getDomReadyTime(): number {
  const navigation = performance.getEntriesByType(
    'navigation'
  )[0] as PerformanceNavigationTiming;
  if (navigation) {
    return navigation.domContentLoadedEventEnd - navigation.startTime;
  }
  return 0;
}

/**
 * 获取首字节时间 (TTFB)
 */
export function getTTFB(): number {
  const navigation = performance.getEntriesByType(
    'navigation'
  )[0] as PerformanceNavigationTiming;
  if (navigation) {
    return navigation.responseStart - navigation.startTime;
  }
  return 0;
}

/**
 * 获取首次内容绘制 (FCP)
 */
export function getFCP(): Promise<number | undefined> {
  return new Promise((resolve) => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        if (entry.name === 'first-contentful-paint') {
          observer.disconnect();
          resolve(entry.startTime);
          return;
        }
      }
    });

    observer.observe({ entryTypes: ['paint'] });

    // 超时处理
    setTimeout(() => {
      observer.disconnect();
      resolve(undefined);
    }, 10000);
  });
}

/**
 * 监控最大内容绘制 (LCP)
 */
export function observeLCP(callback?: (value: number) => void): () => void {
  if (!('PerformanceObserver' in window)) {
    return () => {};
  }

  let lcpValue = 0;

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1] as LargestContentfulPaint;
    lcpValue = lastEntry.startTime;
    performanceMetrics.lcp = lcpValue;
    callback?.(lcpValue);
  });

  try {
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    console.warn('LCP observation not supported');
  }

  return () => observer.disconnect();
}

/**
 * 监控首次输入延迟 (FID)
 */
export function observeFID(callback?: (value: number) => void): () => void {
  if (!('PerformanceObserver' in window)) {
    return () => {};
  }

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    for (const entry of entries) {
      const fidEntry = entry as PerformanceEventTiming;
      const fid = fidEntry.processingStart - fidEntry.startTime;
      performanceMetrics.fid = fid;
      callback?.(fid);
    }
  });

  try {
    observer.observe({ entryTypes: ['first-input'] });
  } catch (e) {
    console.warn('FID observation not supported');
  }

  return () => observer.disconnect();
}

/**
 * 监控累积布局偏移 (CLS)
 */
export function observeCLS(callback?: (value: number) => void): () => void {
  if (!('PerformanceObserver' in window)) {
    return () => {};
  }

  let clsValue = 0;

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    for (const entry of entries) {
      if (!(entry as LayoutShift).hadRecentInput) {
        clsValue += (entry as LayoutShift).value;
        performanceMetrics.cls = clsValue;
        callback?.(clsValue);
      }
    }
  });

  try {
    observer.observe({ entryTypes: ['layout-shift'] });
  } catch (e) {
    console.warn('CLS observation not supported');
  }

  return () => observer.disconnect();
}

/**
 * 监控交互到下一次绘制 (INP)
 */
export function observeINP(callback?: (value: number) => void): () => void {
  if (!('PerformanceObserver' in window)) {
    return () => {};
  }

  let inpValue = 0;

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries() as PerformanceEventTiming[];
    for (const entry of entries) {
      const duration = entry.processingEnd - entry.startTime;
      if (duration > inpValue) {
        inpValue = duration;
        performanceMetrics.inp = inpValue;
        callback?.(inpValue);
      }
    }
  });

  try {
    observer.observe({ entryTypes: ['event'] });
  } catch (e) {
    console.warn('INP observation not supported');
  }

  return () => observer.disconnect();
}

/**
 * 获取所有性能指标
 */
export async function getAllPerformanceMetrics(): Promise<PerformanceMetrics> {
  const navigation = performance.getEntriesByType(
    'navigation'
  )[0] as PerformanceNavigationTiming;

  const metrics: PerformanceMetrics = {
    pageLoadTime: navigation
      ? navigation.loadEventEnd - navigation.startTime
      : performance.now(),
    domReadyTime: navigation
      ? navigation.domContentLoadedEventEnd - navigation.startTime
      : 0,
    ttfb: navigation ? navigation.responseStart - navigation.startTime : 0,
    ...performanceMetrics,
  };

  // 尝试获取 FCP
  try {
    const fcp = await getFCP();
    if (fcp) {
      metrics.fcp = fcp;
    }
  } catch (e) {
    // 忽略错误
  }

  return metrics;
}

/**
 * 监控 API 请求性能
 */
export function monitorApiPerformance(
  config: Partial<PerformanceMonitorConfig> = {}
): {
  record: (data: ApiPerformanceData) => void;
  getCache: () => ApiPerformanceData[];
  clearCache: () => void;
} {
  const mergedConfig = { ...defaultConfig, ...config };

  const record = (data: ApiPerformanceData) => {
    if (!mergedConfig.enabled || Math.random() > mergedConfig.sampleRate) {
      return;
    }

    apiPerformanceCache.push(data);

    // 限制缓存大小
    if (apiPerformanceCache.length > mergedConfig.maxCacheSize) {
      apiPerformanceCache.shift();
    }
  };

  const getCache = () => [...apiPerformanceCache];

  const clearCache = () => {
    apiPerformanceCache.length = 0;
  };

  return { record, getCache, clearCache };
}

/**
 * 监控资源加载性能
 */
export function monitorResourcePerformance(
  config: Partial<PerformanceMonitorConfig> = {}
): {
  start: () => void;
  stop: () => void;
  getCache: () => ResourcePerformanceData[];
  clearCache: () => void;
} {
  const mergedConfig = { ...defaultConfig, ...config };
  let observer: PerformanceObserver | null = null;

  const start = () => {
    if (!mergedConfig.enabled || !('PerformanceObserver' in window)) {
      return;
    }

    observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceResourceTiming[];

      for (const entry of entries) {
        // 只监控关键资源
        if (
          entry.initiatorType === 'script' ||
          entry.initiatorType === 'link' ||
          entry.initiatorType === 'img' ||
          entry.initiatorType === 'fetch' ||
          entry.initiatorType === 'xmlhttprequest'
        ) {
          const data: ResourcePerformanceData = {
            name: entry.name,
            type: entry.initiatorType,
            duration: entry.duration,
            size: entry.transferSize,
            timestamp: Date.now(),
          };

          resourcePerformanceCache.push(data);

          if (resourcePerformanceCache.length > mergedConfig.maxCacheSize) {
            resourcePerformanceCache.shift();
          }
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
  };

  const stop = () => {
    observer?.disconnect();
    observer = null;
  };

  const getCache = () => [...resourcePerformanceCache];

  const clearCache = () => {
    resourcePerformanceCache.length = 0;
  };

  return { start, stop, getCache, clearCache };
}

/**
 * 上报性能数据
 */
export function reportPerformanceData(
  url: string,
  data: Record<string, unknown>
): Promise<void> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      ...data,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    });

    // 使用 sendBeacon 如果可用，否则使用 fetch
    if (navigator.sendBeacon) {
      const success = navigator.sendBeacon(url, payload);
      if (success) {
        resolve();
      } else {
        reject(new Error('sendBeacon failed'));
      }
    } else {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      })
        .then(() => resolve())
        .catch(reject);
    }
  });
}

/**
 * 设置 Web Vitals 监控
 * @param metrics - 响应式指标对象
 * @returns 清理函数数组
 */
function setupWebVitalsMonitoring(
  metrics: Ref<Partial<PerformanceMetrics>>
): Array<() => void> {
  const cleanupFns: Array<() => void> = [];

  // 监控 LCP (最大内容绘制)
  cleanupFns.push(
    observeLCP((value) => {
      metrics.value.lcp = value;
    })
  );

  // 监控 FID (首次输入延迟)
  cleanupFns.push(
    observeFID((value) => {
      metrics.value.fid = value;
    })
  );

  // 监控 CLS (累积布局偏移)
  cleanupFns.push(
    observeCLS((value) => {
      metrics.value.cls = value;
    })
  );

  // 监控 INP (交互到下一次绘制)
  cleanupFns.push(
    observeINP((value) => {
      metrics.value.inp = value;
    })
  );

  return cleanupFns;
}

/**
 * 设置定时上报
 * @param reportUrl - 上报地址
 * @param reportInterval - 上报间隔
 * @param reportFn - 上报函数
 * @returns 定时器 ID
 */
function setupPeriodicReporting(
  reportUrl: string,
  reportInterval: number,
  reportFn: () => Promise<void>
): ReturnType<typeof setInterval> | null {
  if (!reportUrl) {
    return null;
  }

  return setInterval(() => {
    reportFn().catch((error) => {
      console.error('Periodic report failed:', error);
    });
  }, reportInterval);
}

/**
 * 清理监控资源
 * @param cleanupFns - 清理函数数组
 * @param reportTimer - 定时器 ID
 */
function cleanupMonitoring(
  cleanupFns: Array<() => void>,
  reportTimer: ReturnType<typeof setInterval> | null
): void {
  // 执行所有清理函数
  cleanupFns.forEach((fn) => fn());
  cleanupFns.length = 0;

  // 清理定时器
  if (reportTimer) {
    clearInterval(reportTimer);
  }
}

/**
 * 执行性能数据上报
 * @param reportUrl - 上报地址
 * @returns 是否上报成功
 */
async function executePerformanceReport(reportUrl: string): Promise<boolean> {
  try {
    const currentMetrics = await getAllPerformanceMetrics();
    await reportPerformanceData(reportUrl, {
      type: 'performance',
      metrics: currentMetrics,
      apiPerformance: apiPerformanceCache,
      resourcePerformance: resourcePerformanceCache,
    });

    // 清空缓存
    apiPerformanceCache.length = 0;
    resourcePerformanceCache.length = 0;

    return true;
  } catch (error) {
    console.error('Failed to report performance data:', error);
    return false;
  }
}

/**
 * 性能监控 Hook (Vue)
 * 提供性能指标的监控、收集和上报功能
 */
export function usePerformanceMonitor(
  config: Partial<PerformanceMonitorConfig> = {}
): {
  metrics: Ref<Partial<PerformanceMetrics>>;
  isMonitoring: Ref<boolean>;
  start: () => void;
  stop: () => void;
  report: () => Promise<void>;
} {
  const mergedConfig = { ...defaultConfig, ...config };
  const metrics = ref<Partial<PerformanceMetrics>>({});
  const isMonitoring = ref(false);

  let cleanupFns: Array<() => void> = [];
  let reportTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * 启动性能监控
   */
  const start = () => {
    if (isMonitoring.value || !mergedConfig.enabled) {
      return;
    }

    isMonitoring.value = true;

    // 设置 Web Vitals 监控
    if (mergedConfig.monitorWebVitals) {
      cleanupFns = setupWebVitalsMonitoring(metrics);
    }

    // 获取基础性能指标
    getAllPerformanceMetrics().then((data) => {
      metrics.value = { ...metrics.value, ...data };
    });

    // 设置定时上报
    if (mergedConfig.reportUrl) {
      reportTimer = setupPeriodicReporting(
        mergedConfig.reportUrl,
        mergedConfig.reportInterval,
        report
      );
    }
  };

  /**
   * 停止性能监控
   */
  const stop = () => {
    isMonitoring.value = false;
    cleanupMonitoring(cleanupFns, reportTimer);
    reportTimer = null;
  };

  /**
   * 手动触发性能数据上报
   */
  const report = async (): Promise<void> => {
    if (!mergedConfig.reportUrl) {
      console.warn('No report URL configured');
      return;
    }

    await executePerformanceReport(mergedConfig.reportUrl);
  };

  return {
    metrics,
    isMonitoring,
    start,
    stop,
    report,
  };
}

/**
 * 测量函数执行时间
 */
export function measureExecutionTime<T>(
  fn: () => T,
  label: string
): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`);
  return result;
}

/**
 * 异步函数执行时间测量
 */
export async function measureAsyncExecutionTime<T>(
  fn: () => Promise<T>,
  label: string
): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  console.log(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`);
  return result;
}

/**
 * 创建性能标记
 */
export function markPerformance(label: string): void {
  if ('mark' in performance) {
    performance.mark(label);
  }
}

/**
 * 测量性能标记之间的时间
 */
export function measurePerformance(
  name: string,
  startLabel: string,
  endLabel?: string
): number | undefined {
  if (!('measure' in performance)) {
    return undefined;
  }

  try {
    performance.measure(name, startLabel, endLabel);
    const entries = performance.getEntriesByName(name);
    const lastEntry = entries[entries.length - 1] as PerformanceMeasure;
    return lastEntry?.duration;
  } catch (e) {
    console.warn('Failed to measure performance:', e);
    return undefined;
  }
}

/**
 * 清理所有性能标记
 */
export function clearPerformanceMarks(): void {
  if ('clearMarks' in performance) {
    performance.clearMarks();
  }
  if ('clearMeasures' in performance) {
    performance.clearMeasures();
  }
}

// 类型声明
interface LargestContentfulPaint extends PerformanceEntry {
  startTime: number;
}

interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}
