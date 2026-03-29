/**
 * InsightCard — Compact alert card showing a single insight metric.
 * Consistent with app's white-card design system.
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
        <div className={`bg-white dark:bg-slate-900 p-2 md:p-3 rounded-2xl border transition-all duration-300
            ${isAlert
                ? 'border-accent-400 dark:border-accent-500/60 ring-1 ring-accent-500/20 shadow-accent-500/10'
                : 'border-slate-200 dark:border-slate-800/60'
            } shadow-sm relative overflow-hidden group hover:shadow-md flex flex-col items-center justify-center text-center h-full min-w-[75px] md:min-w-[95px] space-y-1.5`}
        >
            {/* Row 1: Icon */}
            <div className={`w-6 h-6 md:w-8 md:h-8 rounded-xl flex items-center justify-center shrink-0
                ${isAlert
                    ? 'bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400'
                    : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400'
                }`}
            >
                <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" strokeWidth={2.5} />
            </div>

            {/* Row 2: Title */}
            <h4 className="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-tight w-full break-words">
                {title}
            </h4>

            {/* Row 3: Value */}
            <p className={`text-[10px] md:text-xs font-black tracking-tight leading-tight w-full
                ${isAlert
                    ? 'text-accent-600 dark:text-accent-400'
                    : 'text-slate-800 dark:text-slate-100'
                }`}
            >
                {value}
            </p>

            {/* Subtle accent line */}
            {isAlert && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-400 to-accent-600 opacity-60" />
            )}
        </div>
    );
};

export default React.memo(InsightCard);
