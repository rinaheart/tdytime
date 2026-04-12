/**
 * UI Store — TdyTime v2
 * Theme (dark mode, accent color) and layout state.
 */

import { create } from 'zustand';
import { type AccentTheme, DEFAULT_THEME, THEME_MIGRATION, isValidTheme } from '../themes/theme.registry';

// Re-export for convenience
export type { AccentTheme };

interface UIState {
    darkMode: boolean;
    accentTheme: AccentTheme;
    sidebarCollapsed: boolean;
    toast: { message: string | null; type: 'success' | 'error' | 'info' };
    toggleDarkMode: () => void;
    setAccentTheme: (theme: AccentTheme) => void;
    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    setToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    clearToast: () => void;
    resetAll: () => void;
}

/** Resolve a stored theme string to a valid AccentTheme */
function resolveTheme(raw: string | null): AccentTheme {
    if (!raw) return DEFAULT_THEME;
    if (isValidTheme(raw)) return raw;
    return THEME_MIGRATION[raw] || DEFAULT_THEME;
}

/** Apply accent theme attribute to <html> */
function applyAccentTheme(theme: AccentTheme) {
    document.documentElement.setAttribute('data-accent', theme);
}

export const useUIStore = create<UIState>((set) => ({
    darkMode: (() => {
        try {
            const saved = localStorage.getItem('color-theme');
            if (saved) return saved === 'dark';
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        } catch {
            return false;
        }
    })(),

    accentTheme: (() => {
        try {
            return resolveTheme(localStorage.getItem('accent-theme'));
        } catch {
            return DEFAULT_THEME;
        }
    })(),

    sidebarCollapsed: typeof window !== 'undefined' ? window.innerWidth < 1024 : true,
    
    toast: { message: null, type: 'success' },

    toggleDarkMode: () =>
        set((state) => {
            const newDark = !state.darkMode;
            const theme = newDark ? 'dark' : 'light';
            localStorage.setItem('color-theme', theme);
            if (newDark) document.documentElement.classList.add('dark');
            else document.documentElement.classList.remove('dark');
            return { darkMode: newDark };
        }),

    setAccentTheme: (theme: AccentTheme) => {
        localStorage.setItem('accent-theme', theme);
        applyAccentTheme(theme);
        set({ accentTheme: theme });
    },

    toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

    setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

    setToast: (message, type = 'success') => set({ toast: { message, type } }),
    
    clearToast: () => set({ toast: { message: null, type: 'success' } }),

    resetAll: () => {
        localStorage.removeItem('color-theme');
        localStorage.removeItem('accent-theme');
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (systemDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        applyAccentTheme(DEFAULT_THEME);

        set({
            darkMode: systemDark,
            accentTheme: DEFAULT_THEME,
            sidebarCollapsed: typeof window !== 'undefined' ? window.innerWidth < 1024 : true,
            toast: { message: null, type: 'success' }
        });
    },
}));

// Apply initial classes on load
if (typeof window !== 'undefined') {
    try {
        const savedDark = localStorage.getItem('color-theme');
        if (savedDark === 'dark' || (!savedDark && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        }
        
        const accent = resolveTheme(localStorage.getItem('accent-theme'));
        applyAccentTheme(accent);

        // Persist migrated value
        localStorage.setItem('accent-theme', accent);
    } catch {
        // Ignore
    }
}
