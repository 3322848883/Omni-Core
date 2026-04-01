// Storage Utilities

/**
 * localStorage wrapper
 */
export const storage = {
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  set(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage set error:', error);
    }
  },

  remove(key: string): void {
    localStorage.removeItem(key);
  },

  clear(): void {
    localStorage.clear();
  },
};

/**
 * sessionStorage wrapper
 */
export const sessionStorage = {
  get<T>(key: string): T | null {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  set(key: string, value: unknown): void {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('SessionStorage set error:', error);
    }
  },

  remove(key: string): void {
    window.sessionStorage.removeItem(key);
  },

  clear(): void {
    window.sessionStorage.clear();
  },
};

/**
 * Cookie utilities
 */
export const cookie = {
  get(name: string): string | null {
    const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
    return match ? decodeURIComponent(match[3]) : null;
  },

  set(name: string, value: string, days: number = 7, path: string = '/'): void {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie =
      name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=' + path;
  },

  remove(name: string, path: string = '/'): void {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=' + path;
  },
};
