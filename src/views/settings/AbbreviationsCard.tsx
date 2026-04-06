/**
 * AbbreviationsCard — Settings sub-component
 * Manages short names for course subjects.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Type, RotateCcw, Wand2, Save } from 'lucide-react';
import { useScheduleStore } from '@/core/stores';

interface AbbreviationsCardProps {
    onSuccess: (msg: string) => void;
}

const AbbreviationsCard: React.FC<AbbreviationsCardProps> = ({ onSuccess }) => {
    const { t } = useTranslation();
    const data = useScheduleStore((s) => s.data);
    const abbreviations = useScheduleStore((s) => s.abbreviations);
    const setAbbreviations = useScheduleStore((s) => s.setAbbreviations);

    const [tempAbbr, setTempAbbr] = useState<Record<string, string>>(abbreviations);

    const uniqueSubjects = useMemo(() => {
        const map = new Map<string, string>();
        data?.allCourses.forEach((c) => { if (!map.has(c.name)) map.set(c.name, c.name); });
        return Array.from(map.values()).sort();
    }, [data?.allCourses]);

    useEffect(() => { setTempAbbr(abbreviations); }, [abbreviations]);

    const suggestAbbreviations = () => {
        const next = { ...tempAbbr };
        uniqueSubjects.forEach((name) => {
            const abbr = name.split(' ').map((part) => {
                if (part === '-' || part === '&') return part;
                if (/^[A-ZĐ0-9]{2,}$/.test(part)) return part;
                if (part.startsWith('(') && part.endsWith(')')) return part;
                return part.charAt(0).toUpperCase();
            }).join('');
            if (!next[name]) next[name] = abbr;
        });
        setTempAbbr(next);
        setAbbreviations(next); // Auto-save when suggesting
        onSuccess(t('settings.toast.abbreviationsSuggested'));
    };

    const handleSave = () => {
        setAbbreviations(tempAbbr);
        onSuccess(t('settings.toast.abbreviationsSaved'));
    };

    if (uniqueSubjects.length === 0) return null;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Type size={20} className="text-accent-600" /> {t('settings.abbreviations.title')}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">{t('settings.abbreviations.description')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => { setTempAbbr({}); onSuccess(t('settings.toast.abbreviationsReset')); }} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
                        <RotateCcw size={14} /> {t('settings.abbreviations.reset')}
                    </button>
                    <button onClick={suggestAbbreviations} className="px-3 py-1.5 bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400 text-[10px] font-bold rounded-xl border border-accent-200 dark:border-accent-800 hover:bg-accent-100 transition-colors flex items-center gap-2">
                        <Wand2 size={14} /> {t('settings.abbreviations.suggest')}
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar max-h-[300px]">
                <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-3 font-bold text-slate-400 uppercase w-10 text-center">#</th>
                            <th className="px-4 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-wider">{t('settings.abbreviations.originalName')}</th>
                            <th className="px-4 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-wider w-1/3 min-w-[120px]">{t('settings.abbreviations.shortName')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {uniqueSubjects.map((name, idx) => (
                            <tr key={name} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-4 py-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                                <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">{name}</td>
                                <td className="px-4 py-3">
                                    <input
                                        type="text"
                                        aria-label={`${t('settings.abbreviations.shortName')} ${name}`}
                                        value={tempAbbr[name] || ''}
                                        onChange={(e) => setTempAbbr({ ...tempAbbr, [name]: e.target.value })}
                                        placeholder={t('settings.abbreviations.placeholder')}
                                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-accent-500 font-mono text-accent-600 dark:text-accent-400 font-bold"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-end border-t border-slate-100 dark:border-slate-800">
                <button onClick={handleSave} className="px-6 h-11 bg-accent-600 text-white text-sm font-bold rounded-xl shadow-lg hover:bg-accent-700 active:scale-95 transition-all flex items-center gap-2">
                    <Save size={18} /> {t('settings.abbreviations.save')}
                </button>
            </div>
        </div>
    );
};

export default AbbreviationsCard;
