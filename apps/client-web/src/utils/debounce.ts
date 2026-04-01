import { ref, customRef, type Ref } from 'vue';

/**
 * 防抖函数
 * @param fn 需要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @param immediate 是否立即执行
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number = 300,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>): void {
    const callNow = immediate && !timer;

    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      timer = null;
      if (!immediate) {
        fn.apply(this, args);
      }
    }, delay);

    if (callNow) {
      fn.apply(this, args);
    }
  };
}

/**
 * 节流函数
 * @param fn 需要节流的函数
 * @param limit 限制时间（毫秒）
 * @param trailing 是否在节流结束后执行最后一次
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number = 300,
  trailing: boolean = true
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: unknown = null;

  return function (this: unknown, ...args: Parameters<T>): void {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
        if (trailing && lastArgs) {
          fn.apply(lastThis, lastArgs);
          lastArgs = null;
          lastThis = null;
        }
      }, limit);
    } else if (trailing) {
      lastArgs = args;
      lastThis = this;
    }
  };
}

/**
 * 带取消功能的防抖函数
 * @param fn 需要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @param immediate 是否立即执行
 * @returns 包含 cancel 方法的防抖函数
 */
export function debounceWithCancel<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number = 300,
  immediate: boolean = false
): {
  (...args: Parameters<T>): void;
  cancel(): void;
  flush(): void;
} {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: unknown = null;

  const debounced = function (this: unknown, ...args: Parameters<T>): void {
    lastArgs = args;
    lastThis = this;

    const callNow = immediate && !timer;

    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      timer = null;
      if (!immediate && lastArgs) {
        fn.apply(lastThis, lastArgs);
        lastArgs = null;
        lastThis = null;
      }
    }, delay);

    if (callNow) {
      fn.apply(this, args);
      lastArgs = null;
      lastThis = null;
    }
  };

  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    lastArgs = null;
    lastThis = null;
  };

  debounced.flush = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (lastArgs) {
      fn.apply(lastThis, lastArgs);
      lastArgs = null;
      lastThis = null;
    }
  };

  return debounced;
}

/**
 * 带取消功能的节流函数
 * @param fn 需要节流的函数
 * @param limit 限制时间（毫秒）
 * @param trailing 是否在节流结束后执行最后一次
 * @returns 包含 cancel 方法的节流函数
 */
export function throttleWithCancel<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number = 300,
  trailing: boolean = true
): {
  (...args: Parameters<T>): void;
  cancel(): void;
  flush(): void;
} {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: unknown = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const throttled = function (this: unknown, ...args: Parameters<T>): void {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;

      timer = setTimeout(() => {
        inThrottle = false;
        timer = null;
        if (trailing && lastArgs) {
          fn.apply(lastThis, lastArgs);
          lastArgs = null;
          lastThis = null;
        }
      }, limit);
    } else if (trailing) {
      lastArgs = args;
      lastThis = this;
    }
  };

  throttled.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    inThrottle = false;
    lastArgs = null;
    lastThis = null;
  };

  throttled.flush = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    inThrottle = false;
    if (lastArgs) {
      fn.apply(lastThis, lastArgs);
      lastArgs = null;
      lastThis = null;
    }
  };

  return throttled;
}

/**
 * Vue 组合式 API：防抖 Ref
 * @param value 初始值
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的 Ref
 */
export function useDebounceRef<T>(value: T, delay: number = 300): Ref<T> {
  return customRef<T>((track, trigger) => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let internalValue = value;

    return {
      get() {
        track();
        return internalValue;
      },
      set(newValue) {
        if (timer) {
          clearTimeout(timer);
        }
        timer = setTimeout(() => {
          internalValue = newValue;
          trigger();
        }, delay);
      },
    };
  });
}

/**
 * Vue 组合式 API：使用防抖
 * @param fn 需要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @param immediate 是否立即执行
 * @returns 防抖后的函数和取消方法
 */
export function useDebounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number = 300,
  immediate: boolean = false
): {
  run: (...args: Parameters<T>) => void;
  cancel: () => void;
  flush: () => void;
} {
  const debouncedFn = debounceWithCancel(fn, delay, immediate);

  return {
    run: debouncedFn,
    cancel: debouncedFn.cancel,
    flush: debouncedFn.flush,
  };
}

/**
 * Vue 组合式 API：使用节流
 * @param fn 需要节流的函数
 * @param limit 限制时间（毫秒）
 * @param trailing 是否在节流结束后执行最后一次
 * @returns 节流后的函数和取消方法
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number = 300,
  trailing: boolean = true
): {
  run: (...args: Parameters<T>) => void;
  cancel: () => void;
  flush: () => void;
} {
  const throttledFn = throttleWithCancel(fn, limit, trailing);

  return {
    run: throttledFn,
    cancel: throttledFn.cancel,
    flush: throttledFn.flush,
  };
}

/**
 * 防抖搜索 Hook
 * @param searchFn 搜索函数
 * @param delay 延迟时间（毫秒）
 * @returns 搜索状态和搜索方法
 */
export function useDebounceSearch<T>(
  searchFn: (query: string) => Promise<T>,
  delay: number = 300
): {
  query: Ref<string>;
  results: Ref<T | null>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  search: (query: string) => void;
  cancel: () => void;
} {
  const query = ref('');
  const results = ref<T | null>(null) as Ref<T | null>;
  const loading = ref(false);
  const error = ref<Error | null>(null);

  const executeSearch = async (...args: unknown[]) => {
    const searchQuery = args[0] as string;
    if (!searchQuery.trim()) {
      results.value = null;
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const data = await searchFn(searchQuery);
      results.value = data;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err));
    } finally {
      loading.value = false;
    }
  };

  const { run: debouncedSearch, cancel } = useDebounce(executeSearch, delay);

  const search = (newQuery: string) => {
    query.value = newQuery;
    debouncedSearch(newQuery);
  };

  return {
    query,
    results,
    loading,
    error,
    search,
    cancel,
  };
}

/**
 * 滚动节流 Hook
 * @param callback 滚动回调函数
 * @param limit 限制时间（毫秒）
 * @returns 开始监听和停止监听的方法
 */
export function useScrollThrottle(
  callback: (scrollTop: number, scrollHeight: number, clientHeight: number) => void,
  limit: number = 100
): {
  start: (element: HTMLElement | Window) => void;
  stop: () => void;
} {
  let targetElement: HTMLElement | Window | null = null;

  const handleScroll = throttle(() => {
    if (!targetElement) return;

    let scrollTop: number;
    let scrollHeight: number;
    let clientHeight: number;

    if (targetElement === window) {
      scrollTop = window.scrollY || document.documentElement.scrollTop;
      scrollHeight = document.documentElement.scrollHeight;
      clientHeight = window.innerHeight;
    } else {
      const el = targetElement as HTMLElement;
      scrollTop = el.scrollTop;
      scrollHeight = el.scrollHeight;
      clientHeight = el.clientHeight;
    }

    callback(scrollTop, scrollHeight, clientHeight);
  }, limit);

  const start = (element: HTMLElement | Window) => {
    stop();
    targetElement = element;
    element.addEventListener('scroll', handleScroll, { passive: true });
  };

  const stop = () => {
    if (targetElement) {
      targetElement.removeEventListener('scroll', handleScroll);
      targetElement = null;
    }
  };

  return { start, stop };
}
