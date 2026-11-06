import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Palette } from 'lucide-react';
import { useUIStore } from '../../core/stores/ui.store';
import { THEMES } from '../../core/themes/theme.registry';

const ThemePicker: React.FC = () => {
    const { t } = useTranslation();
    const { accentTheme, setAccentTheme } = useUIStore();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    // Close when clicking outside or pressing Escape
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                setIsOpen(false);
                triggerRef.current?.focus();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    return (
        <div className="relative" ref={containerRef}>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={t('settings.themes.title', { defaultValue: 'Chọn màu chủ đạo' })}
                aria-expanded={isOpen}
                aria-haspopup="true"
                className={`flex items-center justify-center w-11 h-11 md:w-9 md:h-9 rounded-xl transition-all duration-200 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
                    isOpen
                        ? 'bg-accent-50 border-accent-200 text-accent-700 dark:bg-accent-900/30 dark:border-accent-800 dark:text-accent-400'
                        : 'bg-transparent border-transparent text-slate-600 dark:text-slate-300 hover:bg-accent-50 dark:hover:bg-accent-950/40'
                }`}
                title={t('settings.themes.title')}
            >
                <Palette size={18} />
            </button>

            {/* Popover */}
            {isOpen && (
                <div
                    role="dialog"
                    aria-label={t('settings.themes.title', { defaultValue: 'Màu chủ đạo' })}
                    className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden z-50 animate-in fade-in zoom-in duration-150 origin-top-right"
                >
                    {/* Header */}
                    <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                        <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1 leading-none">
                            {t('settings.themes.title').toUpperCase()}
                        </span>
                    </div>

                    <div className="p-1.5 pt-2">
                        {THEMES.map((theme) => (
                            <button
                                key={theme.id}
                                type="button"
                                aria-pressed={accentTheme === theme.id}
                                onClick={() => {
                                    setAccentTheme(theme.id);
                                    setIsOpen(false);
                                    triggerRef.current?.focus();
                                }}
                                className={`w-full flex items-center justify-between p-2.5 min-h-[40px] rounded-xl transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
                                    accentTheme === theme.id
                                        ? 'bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400'
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                }`}
                            >
                                <span className={`text-sm ${accentTheme === theme.id ? 'font-bold' : 'font-medium'} whitespace-nowrap`}>
                                    {t(theme.nameKey)}
                                </span>
                                <div className="flex items-center">
                                    <div className="flex w-[60px] h-3.5 rounded shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] overflow-hidden border border-black/5 dark:border-white/5 opacity-85 group-hover:opacity-100 transition-opacity">
                                        {theme.preview.map((c, i) => (
                                            <div key={i} className={`flex-1 h-full ${c}`} />
                                        ))}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ThemePicker;
