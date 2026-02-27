import { create } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
  initialize: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: false,

  toggle: () =>
    set((state) => {
      const newDark = !state.isDark;
      document.documentElement.classList.toggle('dark', newDark);
      localStorage.setItem('theme', newDark ? 'dark' : 'light');
      return { isDark: newDark };
    }),

  initialize: () => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = stored ? stored === 'dark' : prefersDark;
    document.documentElement.classList.toggle('dark', isDark);
    set({ isDark });
  },
}));
