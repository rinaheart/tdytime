/**
 * App Layout — TdyTime v2
 * Main layout wrapper with Header, Sidebar (desktop), BottomNav (mobile).
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Zap, LayoutGrid, BarChart3, Settings,
    CalendarDays, Menu, Upload, Globe, Wrench, Calendar, Clock
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
    const { sidebarCollapsed, toggleSidebar } = useUIStore();
    const metadata = useScheduleStore(useShallow(s => s.data?.metadata));
    const mockState = useScheduleStore(s => s.mockState);
    const isMockEnabled = useScheduleStore(s => s.isMockEnabled);
    const toggleMockEnabled = useScheduleStore(s => s.toggleMockEnabled);
    const lastActiveRef = useRef<number>(Date.now());

    // Mock Time Clock Logic
    const mockDateRef = useRef<HTMLInputElement>(null);
    const mockTimeRef = useRef<HTMLInputElement>(null);
    const [mockDisplayDate, setMockDisplayDate] = useState<string>('');
    const [mockDisplayTimeOnly, setMockDisplayTimeOnly] = useState<string>('');
    const [mockOffset, setMockOffset] = useState<string | null>(null);

    const VI_DAY_MAP: Record<number, string> = {
        0: 'CN', 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7'
    };

    const formatMockTime = useCallback((date: Date) => {
        const day = VI_DAY_MAP[date.getDay()];
        const d = String(date.getDate()).padStart(2, '0');
        const mo = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        const hh = String(date.getHours()).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        return {
            dateStr: `${day}, ${d}/${mo}/${y}`,
            timeStr: `${hh}:${mm}`
        };
    }, []);

    const calculateOffset = useCallback((mockMs: number, localMs: number) => {
        const diff = mockMs - localMs;
        const absDiff = Math.abs(diff);
        const mins = Math.round(absDiff / 60000);
        if (mins < 1) return null;
        
        const sign = diff >= 0 ? '+' : '-';
        if (mins < 60) return `${sign}${mins}m`;
        
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${sign}${hrs}h`;
        
        const days = Math.floor(hrs / 24);
        return `${sign}${days}d`;
    }, []);

    const updateMockTime = useCallback((newMockDate: Date) => {
        if (!mockState) return;
        useScheduleStore.getState().setMockState({
            startTimeLocal: Date.now(),
            startTimeMock: newMockDate.getTime(),
            multiplier: 1 // Auto-fallback to real-time
        });
    }, [mockState]);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!mockState || !e.target.value) return;
        const [y, mm, d] = e.target.value.split('-').map(Number);
        const now = Date.now();
        const elapsed = now - mockState.startTimeLocal;
        const currentM = new Date(mockState.startTimeMock + elapsed * mockState.multiplier);
        const next = new Date(currentM);
        next.setFullYear(y, mm - 1, d);
        updateMockTime(next);
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!mockState || !e.target.value) return;
        const [hh, min] = e.target.value.split(':').map(Number);
        const now = Date.now();
        const elapsed = now - mockState.startTimeLocal;
        const currentM = new Date(mockState.startTimeMock + elapsed * mockState.multiplier);
        const next = new Date(currentM);
        next.setHours(hh, min, 0, 0);
        updateMockTime(next);
    };

    const handleResetMockTime = useCallback(() => {
        const now = Date.now();
        useScheduleStore.getState().setMockState({
            startTimeLocal: now,
            startTimeMock: now,
            multiplier: 1
        });
    }, []);

    useEffect(() => {
        if (!mockState) {
            setMockDisplayDate('');
            setMockDisplayTimeOnly('');
            setMockOffset(null);
            return;
        }

        const tick = () => {
            const now = Date.now();
            const elapsed = now - mockState.startTimeLocal;
            const currentMs = mockState.startTimeMock + elapsed * mockState.multiplier;
            const date = new Date(currentMs);
            const fm = formatMockTime(date);
            
            setMockDisplayDate(fm.dateStr);
            setMockDisplayTimeOnly(fm.timeStr);
            setMockOffset(calculateOffset(currentMs, now));
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [mockState, formatMockTime, calculateOffset]);

    // Global Key Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl + Shift + M -> Toggle Mock Time
            if (e.ctrlKey && e.shiftKey && e.code === 'KeyM') {
                const target = e.target as HTMLElement;
                const isWriting = ['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable;
                if (isWriting) return;

                const isDevRoute = location.pathname === '/dev';
                const isDevMode = localStorage.getItem('tdy_dev_mode') === 'true' || !!mockState;

                if (isDevRoute || isDevMode) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    toggleMockEnabled();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [location.pathname, toggleMockEnabled, mockState]);

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
            {/* Mock Time Developer Toolbar */}
            {mockState && isMockEnabled && (
                <div className="flex items-center justify-between px-3 md:px-4 fixed top-0 left-0 right-0 z-[45] bg-amber-400 dark:bg-amber-500 text-amber-950 text-sm font-semibold select-none transition-all duration-150 h-10">
                    {/* LEFT: Branding & Config */}
                    <div className="flex items-center gap-3 flex-shrink-0 w-1/4">
                        <span className="flex items-center gap-1.5 animate-pulse opacity-80">
                            <span className="w-1.5 h-1.5 rounded-none bg-amber-950"></span> 
                            <span className="hidden xl:inline text-[9px] tracking-[0.2em] font-black uppercase">MOCK</span>
                        </span>
                        
                        <button onClick={() => navigate('/dev')}
                                title="Mở DevTools"
                                className="px-2.5 py-1 bg-amber-950 hover:bg-black text-amber-500 text-[10px] font-black tracking-widest transition-none cursor-pointer flex items-center gap-1.5 rounded-none">
                            <Wrench size={10} strokeWidth={3} />
                            <span className="hidden md:inline uppercase">DEVTOOLS</span>
                        </button>
                    </div>

                    {/* CENTER: Time State & Speed */}
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-1 min-w-0 overflow-hidden">
                        {/* Clickable Time Group */}
                        <div className="flex items-center gap-1.5 bg-amber-950/10 p-1 relative rounded-none flex-shrink-0">
                            {/* Date Region */}
                            <div className="flex items-center gap-2 cursor-pointer bg-amber-950 hover:bg-black text-amber-500 transition-none px-4 py-1.5 group h-full"
                                 onClick={() => mockDateRef.current?.showPicker()}
                                 title="Click để đổi ngày">
                                <Calendar size={16} strokeWidth={3} className="opacity-80 hidden sm:block" />
                                <span className="font-mono font-black text-base tracking-tight">
                                    {mockDisplayDate}
                                </span>
                            </div>

                            {/* Time Region */}
                            <div className="flex items-center gap-2 cursor-pointer bg-amber-950 hover:bg-black text-amber-400 transition-none px-4 py-1.5 group h-full"
                                 onClick={() => mockTimeRef.current?.showPicker()}
                                 title="Click để đổi giờ">
                                <Clock size={16} strokeWidth={3} className="opacity-80 hidden sm:block" />
                                <span className="font-mono font-black text-base tracking-tight">
                                    {mockDisplayTimeOnly}
                                </span>
                            </div>

                            {/* Hidden native pickers */}
                            <input ref={mockDateRef} type="date" className="absolute opacity-0 pointer-events-none w-0 h-0" onChange={handleDateChange} />
                            <input ref={mockTimeRef} type="time" className="absolute opacity-0 pointer-events-none w-0 h-0" onChange={handleTimeChange} />
                        </div>

                        {/* Offset badge */}
                        {mockOffset && (
                            <span className="text-[10px] text-amber-950/50 font-mono tracking-tighter bg-amber-950/5 px-2 py-2 flex-shrink-0 hidden lg:inline border-x border-amber-950/5">
                                {mockOffset}
                            </span>
                        )}

                        {/* Speed Pills */}
                        <div className="hidden md:flex items-center gap-px bg-amber-950/10 p-px rounded-none flex-shrink-0 border-l border-amber-950/20 h-full">
                            {[
                                { l: '1s', v: 1 },
                                { l: '1m', v: 60 },
                                { l: '5m', v: 300 },
                                { l: '10m', v: 600 },
                                { l: '30m', v: 1800 }
                            ].map(sp => (
                                <button 
                                    key={sp.l}
                                    onClick={() => useScheduleStore.getState().setMockState({ ...mockState, multiplier: sp.v })}
                                    className={`px-2.5 py-1.5 h-full cursor-pointer text-[10px] font-black tracking-widest transition-none ${
                                        mockState.multiplier === sp.v 
                                        ? 'bg-amber-950 text-amber-400 z-10 scale-y-110' 
                                        : 'bg-amber-950/5 hover:bg-amber-950/20 text-amber-950/70 border border-transparent'
                                    }`}
                                    title={`Tốc độ: ${sp.l} mỗi giây thực`}
                                >
                                    {sp.l}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: Lifecycle Actions */}
                    <div className="flex items-center justify-end flex-shrink-0 w-1/4">
                        <button onClick={handleResetMockTime}
                                title="Về giờ hệ thống"
                                className="px-3 py-2 bg-amber-950/5 hover:bg-amber-950/10 text-amber-950/80 text-[10px] font-bold tracking-widest transition-none cursor-pointer flex items-center gap-1.5 border-l border-amber-950/10">
                            <span className="hidden sm:inline">RESET</span>
                            <span className="sm:hidden">↻</span>
                        </button>
                        <button onClick={toggleMockEnabled} 
                                title="Tạm tắt mô phỏng"
                                className="px-3 py-2 bg-amber-950 hover:bg-black text-amber-400 text-[10px] font-black tracking-widest transition-none cursor-pointer border-l border-amber-400/20">
                            <span className="sm:hidden">×</span>
                            <span className="hidden sm:inline">HIDE</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className={`fixed ${mockState && isMockEnabled ? 'top-[40px]' : 'top-0'} left-0 right-0 z-40 h-12 md:h-14 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-150`}>
                <div className="flex items-center justify-between h-full px-3 md:px-6">
                    {/* Left: Menu toggle + Teacher name */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleSidebar}
                            className="hidden lg:flex p-2 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                            aria-label="Toggle sidebar"
                            title={sidebarCollapsed ? t('nav.expandSidebar', { defaultValue: 'Mở rộng' }) : t('nav.collapseSidebar', { defaultValue: 'Thu gọn' })}
                        >
                            <Menu size={20} />
                        </button>
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[200px] md:max-w-none">
                            {metadata?.teacher || 'TdyTime'}
                        </div>
                        {metadata && (
                            <span className="hidden md:inline text-xs text-slate-500 dark:text-slate-500">
                                {formatSemester(metadata.semester)} • {metadata.academicYear}
                            </span>
                        )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={toggleLanguage}
                            className="p-2 rounded-xl cursor-pointer hover:bg-accent-50 dark:hover:bg-accent-950/40 text-slate-500 dark:text-slate-400 transition-colors"
                            aria-label={t('common.switchLanguage')}
                            title={i18n.language === 'vi' ? 'English' : 'Tiếng Việt'}
                        >
                            <Globe size={18} />
                        </button>
                        <ThemePicker />
                        <button
                            onClick={handleReset}
                            className="p-2 rounded-xl cursor-pointer hover:bg-accent-50 dark:hover:bg-accent-950/40 text-slate-500 dark:text-slate-400"
                            aria-label={t('nav.loadData')}
                            title={t('nav.loadData')}
                        >
                            <Upload size={18} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Area */}
            <div className={`flex h-[calc(100dvh-48px)] md:h-[calc(100dvh-56px)] ${mockState && isMockEnabled ? 'pt-[88px] md:pt-[96px]' : 'pt-12 md:pt-14'} relative transition-all duration-150`}>
                {/* Sidebar (desktop only) */}
                <aside
                    className={`hidden lg:flex flex-col fixed ${mockState && isMockEnabled ? 'top-[88px] md:top-[96px]' : 'top-12 md:top-14'} bottom-0 left-0 z-30 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-150 ${sidebarCollapsed ? 'w-20' : 'w-48'
                        }`}
                >
                    <nav className="flex-1 py-4 space-y-1 px-3 overflow-y-auto">
                        {NAV_ITEMS.map(({ path, icon: Icon, labelKey }) => {
                            const isActive = location.pathname === path;
                            return (
                                <button
                                    key={path}
                                    onClick={() => navigate(path)}
                                    title={sidebarCollapsed ? t(labelKey) : undefined}
                                    className={`w-full flex items-center gap-0 px-2 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all ${isActive
                                        ? 'bg-accent-50 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400'
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
                            <span className="text-[9px] text-slate-500 dark:text-slate-600 uppercase font-black tracking-widest select-none">
                                v{APP_VERSION}
                            </span>
                        </div>
                    </div>
                </aside>

                {/* Content */}
                <main
                    className={`flex-1 min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-48'
                        }`}
                >
                    <div className="h-full overflow-y-auto custom-scrollbar">
                        <div className="max-w-7xl mx-auto p-3 md:p-8">
                            <Outlet />
                        </div>
                    </div>
                </main>
            </div>

            {/* Bottom Nav (mobile only) — San bằng 5 Tabs phẳng */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
                <div className="flex items-center h-16">
                    {NAV_ITEMS.map(({ path, icon: Icon, labelKey }) => {
                        const isActive = location.pathname === path;
                        return (
                            <button
                                key={path}
                                onClick={() => navigate(path)}
                                className={`flex-1 flex flex-col items-center justify-center h-full pb-1 cursor-pointer transition-none ${isActive ? 'text-accent-600 dark:text-accent-400' : 'text-slate-400 dark:text-slate-500'}`}
                            >
                                <div className="">
                                    <Icon size={24} className={isActive ? 'opacity-100' : 'opacity-[0.65]'} strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                                <span className={`text-[10px] mt-0.5 truncate w-full text-center px-1 tracking-tight ${isActive ? 'font-bold' : 'font-medium opacity-80'}`}>
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
