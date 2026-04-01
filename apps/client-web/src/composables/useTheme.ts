import { ref, onMounted } from 'vue';
import { STORAGE_KEYS } from '@/constants';

type Theme = 'light' | 'dark' | 'auto';

export function useTheme() {
  const theme = ref<Theme>('auto');
  const isDark = ref(false);

  const updateTheme = () => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (theme.value === 'dark' || (theme.value === 'auto' && prefersDark)) {
      root.classList.add('dark');
      isDark.value = true;
    } else {
      root.classList.remove('dark');
      isDark.value = false;
    }
  };

  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme;
    localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
    updateTheme();
  };

  const toggleTheme = () => {
    const newTheme = isDark.value ? 'light' : 'dark';
    setTheme(newTheme);
  };

  onMounted(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) as Theme;
    if (savedTheme) {
      theme.value = savedTheme;
    }
    updateTheme();

    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', updateTheme);
  });

  return {
    theme,
    isDark,
    setTheme,
    toggleTheme,
  };
}
