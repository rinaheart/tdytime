/**
 * InsightCard — Flat metric cell designed for grouped analytical insight strips.
 * Prioritizes >=12px secondary label readability and zero border clutter on mobile.
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InsightCardProps {
    icon: LucideIcon;
    title: string;
    value: string | React.ReactNode;
    isAlert?: boolean;
}

const InsightCard: React.FC<InsightCardProps> = ({ icon: Icon, title, value, isAlert = false }) => {
    return (
        <div
            className={`p-3.5 md:p-4 flex items-center gap-3 min-w-0 transition-colors relative ${
                isAlert
                    ? 'bg-accent-50/50 dark:bg-slate-900'
                    : 'bg-white dark:bg-slate-900'
            }`}
        >
            {/* Icon Badge */}
            <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isAlert
                        ? 'bg-accent-100 dark:bg-accent-900/40 text-accent-700 dark:text-accent-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
            >
                <Icon className="w-4 h-4" strokeWidth={2.25} />
            </div>

            {/* Label & Value */}
            <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 leading-snug truncate" title={title}>
                    {title}
                </p>
                <p
                    className={`text-sm font-black font-num tracking-tight leading-tight mt-0.5 truncate ${
                        isAlert
                            ? 'text-accent-700 dark:text-accent-400'
                            : 'text-slate-800 dark:text-slate-100'
                    }`}
                >
                    {value}
                </p>
            </div>
        </div>
    );
};

export default React.memo(InsightCard);
