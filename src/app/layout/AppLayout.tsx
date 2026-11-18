/**
 * App Layout — TdyTime v2
 * Main layout wrapper with Header, Sidebar (desktop), BottomNav (mobile).
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Zap, LayoutGrid, BarChart3, Settings,
    CalendarDays, Menu, Upload, Globe,
    Sun, Moon
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useUIStore, useScheduleStore } from '@/core/stores';
import { Toast } from '@/ui/primitives';
import { APP_VERSION } from '@/core/constants';
import { formatSemester } from '@/core/schedule';
import ThemePicker from '@/ui/composites/ThemePicker';
import { changeLanguage } from '@/i18n/config';

// Navigation items for both Desktop Sidebar and Mobile BottomNav
const NAV_ITEMS = [
    { path: '/today', icon: Zap, labelKey: 'nav.today' },
    { path: '/week', icon: CalendarDays, labelKey: 'nav.weekly' },
    { path: '/semester', icon: LayoutGrid, labelKey: 'nav.semester' },
    { path: '/stats', icon: BarChart3, labelKey: 'nav.statistics' },
    { path: '/settings', icon: Settings, labelKey: 'nav.settings' },
];

const AppLayout: React.FC = () => {
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
    const toggleSidebar = useUIStore((s) => s.toggleSidebar);
    const darkMode = useUIStore((s) => s.darkMode);
    const toggleDarkMode = useUIStore((s) => s.toggleDarkMode);
    const metadata = useScheduleStore(useShallow(s => s.data?.metadata));
    // eslint-disable-next-line react-hooks/purity
    const lastActiveRef = useRef<number>(Date.now());

    // Smart Session Auto-Reset Logic
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                const now = Date.now();
                const idleTime = now - lastActiveRef.current;
                const THRESHOLD = 30 * 60 * 1000; // 30 minutes

                if (idleTime > THRESHOLD && location.pathname !== '/today') {
                    navigate('/today', { replace: true });
                }
                lastActiveRef.current = now;
            } else {
                lastActiveRef.current = Date.now();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [location.pathname, navigate]);

    const handleReset = useCallback(() => {
        navigate('/', { state: { forceUpload: true } });
    }, [navigate]);

    const toggleLanguage = useCallback(() => {
        const next = i18n.language === 'vi' ? 'en' : 'vi';
        changeLanguage(next);
    }, [i18n]);

    return (
        <div className="min-h-dvh transition-colors duration-200 bg-white dark:bg-slate-950 selection:bg-accent-100 dark:selection:bg-accent-900/30">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-40 h-12 md:h-14 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-150 print:hidden">
                <div className="flex items-center justify-between h-full px-3 md:px-6">
                    {/* Left: Menu toggle + Teacher name */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={toggleSidebar}
                            className="hidden lg:flex w-11 h-11 md:w-9 md:h-9 items-center justify-center rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                            aria-label={sidebarCollapsed ? t('nav.expandSidebar', { defaultValue: 'Mở rộng thanh bên' }) : t('nav.collapseSidebar', { defaultValue: 'Thu gọn thanh bên' })}
                            aria-expanded={!sidebarCollapsed}
                            title={sidebarCollapsed ? t('nav.expandSidebar', { defaultValue: 'Mở rộng' }) : t('nav.collapseSidebar', { defaultValue: 'Thu gọn' })}
                        >
                            <Menu size={20} />
                        </button>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[200px] md:max-w-none">
                            <span className="md:hidden">TdyTime</span>
                            <span className="hidden md:inline">{metadata?.teacher || 'TdyTime'}</span>
                        </div>
                        {metadata && (
                            <span className="hidden md:inline text-xs text-slate-500 dark:text-slate-400">
                                {formatSemester(metadata.semester)} • {metadata.academicYear}
                            </span>
                        )}
                    </div>

                    {/* Right: Actions — Globe → ThemePicker → DarkMode → Upload */}
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={toggleLanguage}
                            className="w-11 h-11 md:w-9 md:h-9 flex items-center justify-center rounded-xl cursor-pointer hover:bg-accent-50 dark:hover:bg-accent-950/40 text-slate-600 dark:text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                            aria-label={t('common.switchLanguage')}
                            title={i18n.language === 'vi' ? 'English' : 'Tiếng Việt'}
                        >
                            <Globe size={18} />
                        </button>
                        <ThemePicker />
                        <button
                            type="button"
                            onClick={toggleDarkMode}
                            className="w-11 h-11 md:w-9 md:h-9 flex items-center justify-center rounded-xl cursor-pointer hover:bg-accent-50 dark:hover:bg-accent-950/40 text-slate-600 dark:text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                            aria-label={darkMode ? t('common.lightMode', 'Sáng') : t('common.darkMode', 'Tối')}
                            title={darkMode ? t('common.lightMode', 'Chế độ sáng') : t('common.darkMode', 'Chế độ tối')}
                        >
                            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="w-11 h-11 md:w-9 md:h-9 flex items-center justify-center rounded-xl cursor-pointer hover:bg-accent-50 dark:hover:bg-accent-950/40 text-slate-600 dark:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                            aria-label={t('nav.loadData')}
                            title={t('nav.loadData')}
                        >
                            <Upload size={18} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Area */}
            <div className="flex h-[calc(100dvh-48px)] md:h-[calc(100dvh-56px)] print:h-auto pt-12 md:pt-14 print:pt-0 relative transition-all duration-150">
                {/* Sidebar (desktop only) */}
                <aside
                    aria-label="Thanh điều hướng bên"
                    className={`hidden lg:flex flex-col fixed top-12 md:top-14 bottom-0 left-0 z-30 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-150 ${sidebarCollapsed ? 'w-20' : 'w-48'
                        } print:hidden`}
                >
                    <nav aria-label="Điều hướng chính" className="flex-1 py-4 space-y-1 px-3 overflow-y-auto">
                        {NAV_ITEMS.map(({ path, icon: Icon, labelKey }) => {
                            const isActive = location.pathname === path;
                            return (
                                <button
                                    key={path}
                                    type="button"
                                    onClick={() => navigate(path)}
                                    aria-label={t(labelKey)}
                                    aria-current={isActive ? 'page' : undefined}
                                    title={sidebarCollapsed ? t(labelKey) : undefined}
                                    className={`w-full flex items-center gap-0 px-2 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${isActive
                                        ? 'bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400 font-bold'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    <div className="w-10 flex items-center justify-center shrink-0">
                                        <Icon size={20} />
                                    </div>
                                    {!sidebarCollapsed && <span className="ml-1 truncate">{t(labelKey)}</span>}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Version */}
                    <div className="mt-auto pl-5 pb-6 transition-all duration-300">
                        <div className="w-10 flex items-center justify-center shrink-0">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest select-none">
                                v{APP_VERSION}
                            </span>
                        </div>
                    </div>
                </aside>

                {/* Content */}
                <main
                    className={`flex-1 min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-48'
                        } print:pl-0`}
                >
                    <div className="h-full print:h-auto print:overflow-visible overflow-y-auto custom-scrollbar">
                        <div className="max-w-7xl mx-auto p-3 md:p-8 pb-20 lg:pb-8">
                            <Outlet />
                        </div>
                    </div>
                </main>
            </div>

            {/* Bottom Nav (mobile only) — San bằng 5 Tabs phẳng */}
            <nav aria-label="Điều hướng di động" className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.04)] print:hidden">
                <div className="flex items-center h-16">
                    {NAV_ITEMS.map(({ path, icon: Icon, labelKey }) => {
                        const isActive = location.pathname === path;
                        return (
                            <button
                                key={path}
                                type="button"
                                onClick={() => navigate(path)}
                                aria-label={t(labelKey)}
                                aria-current={isActive ? 'page' : undefined}
                                className={`flex-1 flex flex-col items-center justify-center h-full pb-1 cursor-pointer transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-500 ${isActive ? 'text-accent-600 dark:text-accent-400' : 'text-slate-600 dark:text-slate-400'}`}
                            >
                                <div>
                                    <Icon size={22} className={isActive ? 'opacity-100' : 'opacity-75'} strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                                <span className={`text-[11px] mt-0.5 truncate w-full text-center px-1 tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                                    {t(labelKey)}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* Global Toast Notification */}
            <Toast />
        </div>
    );
};

export default AppLayout;
