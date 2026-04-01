import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  debounce,
  throttle,
  debounceWithCancel,
  throttleWithCancel,
  useDebounce,
  useThrottle,
  useDebounceRef,
  useDebounceSearch,
  useScrollThrottle,
} from '../debounce';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should delay function execution', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 300);

    debouncedFn();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should reset timer on multiple calls', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 300);

    debouncedFn();
    vi.advanceTimersByTime(200);
    debouncedFn();
    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should execute immediately when immediate is true', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 300, true);

    debouncedFn();
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should pass arguments to the debounced function', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 300);

    debouncedFn('arg1', 'arg2');
    vi.advanceTimersByTime(300);

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
  });
});

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should execute function immediately', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 300);

    throttledFn();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should ignore calls during throttle period', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 300);

    throttledFn();
    throttledFn();
    throttledFn();
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should not execute trailing call when trailing is false', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 300, false);

    throttledFn();
    throttledFn();
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('debounceWithCancel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should cancel pending execution', () => {
    const fn = vi.fn();
    const debouncedFn = debounceWithCancel(fn, 300);

    debouncedFn();
    debouncedFn.cancel();
    vi.advanceTimersByTime(300);

    expect(fn).not.toHaveBeenCalled();
  });

  it('should flush pending execution immediately', () => {
    const fn = vi.fn();
    const debouncedFn = debounceWithCancel(fn, 300);

    debouncedFn();
    debouncedFn.flush();

    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('throttleWithCancel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should cancel throttle state', () => {
    const fn = vi.fn();
    const throttledFn = throttleWithCancel(fn, 300);

    throttledFn();
    throttledFn.cancel();

    vi.advanceTimersByTime(300);
    throttledFn();

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should flush trailing call immediately', () => {
    const fn = vi.fn();
    const throttledFn = throttleWithCancel(fn, 300, true);

    throttledFn();
    throttledFn();
    throttledFn.flush();

    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return run, cancel, and flush functions', () => {
    const fn = vi.fn();
    const { run, cancel, flush } = useDebounce(fn, 300);

    expect(typeof run).toBe('function');
    expect(typeof cancel).toBe('function');
    expect(typeof flush).toBe('function');
  });

  it('should debounce function execution', () => {
    const fn = vi.fn();
    const { run } = useDebounce(fn, 300);

    run();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('useThrottle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return run, cancel, and flush functions', () => {
    const fn = vi.fn();
    const { run, cancel, flush } = useThrottle(fn, 300);

    expect(typeof run).toBe('function');
    expect(typeof cancel).toBe('function');
    expect(typeof flush).toBe('function');
  });

  it('should throttle function execution', () => {
    const fn = vi.fn();
    const { run } = useThrottle(fn, 300);

    run();
    run();
    run();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('useDebounceRef', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create a debounced ref', () => {
    const debouncedRef = useDebounceRef('initial', 300);

    expect(debouncedRef.value).toBe('initial');

    debouncedRef.value = 'updated';
    expect(debouncedRef.value).toBe('initial');

    vi.advanceTimersByTime(300);
    expect(debouncedRef.value).toBe('updated');
  });
});

describe('useDebounceSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return search state and functions', () => {
    const searchFn = vi.fn().mockResolvedValue([]);
    const result = useDebounceSearch(searchFn, 300);

    expect(result.query).toBeDefined();
    expect(result.results).toBeDefined();
    expect(result.loading).toBeDefined();
    expect(result.error).toBeDefined();
    expect(typeof result.search).toBe('function');
    expect(typeof result.cancel).toBe('function');
  });

  it('should debounce search execution', async () => {
    const searchFn = vi.fn().mockResolvedValue(['result']);
    const { search, loading } = useDebounceSearch(searchFn, 300);

    search('query');
    expect(loading.value).toBe(false);

    vi.advanceTimersByTime(300);
    await Promise.resolve();

    expect(searchFn).toHaveBeenCalledWith('query');
  });
});

describe('useScrollThrottle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return start and stop functions', () => {
    const callback = vi.fn();
    const { start, stop } = useScrollThrottle(callback, 100);

    expect(typeof start).toBe('function');
    expect(typeof stop).toBe('function');
  });

  it('should throttle scroll events', () => {
    const callback = vi.fn();
    const { start } = useScrollThrottle(callback, 100);

    const mockElement = document.createElement('div');
    start(mockElement);

    // Simulate scroll events
    mockElement.dispatchEvent(new Event('scroll'));
    mockElement.dispatchEvent(new Event('scroll'));
    mockElement.dispatchEvent(new Event('scroll'));

    expect(callback).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(2);
  });
});
