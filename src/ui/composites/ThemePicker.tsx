import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Palette, Check } from 'lucide-react';
import { useUIStore } from '../../core/stores/ui.store';
import { THEMES } from '../../core/themes/theme.registry';

const ThemePicker: React.FC = () => {
    const { t } = useTranslation();
    const { accentTheme, setAccentTheme } = useUIStore();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded-xl transition-all duration-300 ${
                    isOpen 
                    ? 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400' 
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={t('settings.themes.title')}
            >
                <Palette size={20} />
            </button>

            {/* Popover */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
                    <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            {t('settings.themes.title')}
                        </span>
                    </div>
                    <div className="p-1.5">
                        {THEMES.map((theme) => (
                            <button
                                key={theme.id}
                                onClick={() => {
                                    setAccentTheme(theme.id);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all group ${
                                    accentTheme === theme.id
                                    ? 'bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    {/* Swatch */}
                                    <div className="flex -space-x-1.5">
                                        {theme.preview.map((c, i) => (
                                            <div 
                                                key={i} 
                                                className={`w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${c}`} 
                                            />
                                        ))}
                                    </div>
                                    <span className="text-xs font-bold whitespace-nowrap">
                                        {t(theme.nameKey)}
                                    </span>
                                </div>
                                {accentTheme === theme.id && <Check size={14} className="text-accent-600" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ThemePicker;
