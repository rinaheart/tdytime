/**
 * AboutCard — Settings sub-component
 * App changelog timeline. Period standards moved to PeriodStandardsCard. App identity moved to SettingsView header.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardList } from 'lucide-react';

const AboutCard: React.FC = () => {
    const { t } = useTranslation();
    const changeLog = t('about.history', { returnObjects: true }) as Array<{ version: string; date: string; changes: string[] }>;

    return (
        <div className="space-y-6">
            {/* Changelog */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 md:p-6">
                <h2 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    <ClipboardList size={16} className="text-accent-500" /> {t('about.changelog')}
                </h2>
                <div className="space-y-6 max-h-[400px] overflow-y-auto custom-scrollbar pr-4" tabIndex={0} role="region" aria-label={t('settings.about.title')}>
                    {Array.isArray(changeLog) && changeLog.map((log) => (
                        <div key={log.version} className="relative pl-6 border-l border-slate-200 dark:border-slate-800">
                            <div className="absolute -left-[4.5px] top-0 w-2 h-2 rounded-full bg-accent-500 shadow-sm" />
                            <div className="mb-2 flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-800 dark:text-white">{log.version}</span>
                                <span className="text-[9px] text-slate-500 font-bold uppercase">{log.date}</span>
                            </div>
                            <ul className="space-y-1">
                                {Array.isArray(log.changes) && log.changes.map((change, i) => (
                                    <li key={i} className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed flex items-start gap-2">
                                        <span className="w-1 h-1 rounded-full bg-accent-500/30 mt-1.5 shrink-0" />
                                        {change}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AboutCard;
