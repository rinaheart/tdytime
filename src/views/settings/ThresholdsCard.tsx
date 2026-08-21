/**
 * ThresholdsCard — Settings sub-component
 * Daily/weekly warning and danger thresholds.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BellRing, Shield, AlertTriangle, RefreshCw, Save } from 'lucide-react';
import { useScheduleStore } from '@/core/stores';
import { DEFAULT_THRESHOLDS } from '@/core/constants';
import type { Thresholds } from '@/core/schedule/schedule.types';

interface ThresholdsCardProps {
    onSuccess: (msg: string) => void;
}

const inputClass = 'w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-sm';

const ThresholdsCard: React.FC<ThresholdsCardProps> = ({ onSuccess }) => {
    const { t } = useTranslation();
    const thresholds = useScheduleStore((s) => s.thresholds);
    const setThresholds = useScheduleStore((s) => s.setThresholds);

    const [temp, setTemp] = useState<Thresholds>(thresholds);
    const [prevThresholds, setPrevThresholds] = useState<Thresholds>(thresholds);

    if (thresholds !== prevThresholds) {
        setPrevThresholds(thresholds);
        setTemp(thresholds);
    }

    const handleReset = () => {
        setTemp(DEFAULT_THRESHOLDS);
        onSuccess(t('settings.toast.thresholdsReset'));
    };

    const handleSave = () => {
        setThresholds(temp);
        onSuccess(t('settings.toast.thresholdsSaved'));
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
            <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <BellRing size={20} className="text-amber-500" /> {t('settings.thresholds.title')}
                </h3>
                <p className="text-xs text-slate-500 mt-1">{t('settings.thresholds.description')}</p>
            </div>

            <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                {/* Daily */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                        <Shield size={16} className="text-accent-500" /> {t('settings.thresholds.daily')}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="daily-warning" className="block text-[9px] text-slate-500 uppercase font-bold mb-1">{t('settings.thresholds.warning')}</label>
                            <input id="daily-warning" type="number" value={temp.daily.warning} onChange={(e) => setTemp({ ...temp, daily: { ...temp.daily, warning: Number(e.target.value) } })} className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="daily-danger" className="block text-[9px] text-slate-500 uppercase font-bold mb-1">{t('settings.thresholds.danger')}</label>
                            <input id="daily-danger" type="number" value={temp.daily.danger} onChange={(e) => setTemp({ ...temp, daily: { ...temp.daily, danger: Number(e.target.value) } })} className={inputClass} />
                        </div>
                    </div>
                </div>
                {/* Weekly */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                        <AlertTriangle size={16} className="text-orange-500" /> {t('settings.thresholds.weekly')}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="weekly-warning" className="block text-[9px] text-slate-500 uppercase font-bold mb-1">{t('settings.thresholds.warning')}</label>
                            <input id="weekly-warning" type="number" value={temp.weekly.warning} onChange={(e) => setTemp({ ...temp, weekly: { ...temp.weekly, warning: Number(e.target.value) } })} className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="weekly-danger" className="block text-[9px] text-slate-500 uppercase font-bold mb-1">{t('settings.thresholds.danger')}</label>
                            <input id="weekly-danger" type="number" value={temp.weekly.danger} onChange={(e) => setTemp({ ...temp, weekly: { ...temp.weekly, danger: Number(e.target.value) } })} className={inputClass} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button onClick={handleReset} className="px-4 py-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs font-bold rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors flex items-center gap-2">
                    <RefreshCw size={14} /> {t('settings.abbreviations.reset')}
                </button>
                <button onClick={handleSave} className="px-6 py-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white text-xs font-bold rounded-xl shadow hover:shadow-lg active:scale-95 transition-all flex items-center gap-2">
                    <Save size={14} /> {t('settings.thresholds.save')}
                </button>
            </div>
        </div>
    );
};

export default ThresholdsCard;
