import React from 'react';

/**
 * BadgeVariant categories:
 * - Session Status: 'live' | 'pending' | 'completed'
 * - Academic Shift (Domain): 'morning' | 'afternoon' | 'evening'
 * - Course Modality (Domain): 'theory' | 'practice'
 * - System Status: 'warning' | 'danger' | 'info' | 'default'
 */
export type BadgeVariant =
    | 'live'
    | 'pending'
    | 'completed'
    | 'morning'
    | 'afternoon'
    | 'evening'
    | 'theory'
    | 'practice'
    | 'warning'
    | 'danger'
    | 'info'
    | 'default';

export interface BadgeProps {
    variant?: BadgeVariant;
    children?: React.ReactNode;
    className?: string;
    /** Explicitly show or hide the static semantic dot indicator (overrides default variant behavior when false) */
    showDot?: boolean;
    /** Legacy alias for showDot (supports dot={false} to suppress automatic semantic dot) */
    dot?: boolean;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
    live: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
    pending: 'bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800',
    completed: 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    morning: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800',
    afternoon: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
    evening: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800',
    theory: 'bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800',
    practice: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
    danger: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
    info: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800',
    default: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
};

const SEMANTIC_DOTS: Partial<Record<BadgeVariant, { from: string; to: string }>> = {
    morning: { from: 'var(--semantic-morning-from)', to: 'var(--semantic-morning-to)' },
    afternoon: { from: 'var(--semantic-afternoon-from)', to: 'var(--semantic-afternoon-to)' },
    evening: { from: 'var(--semantic-evening-from)', to: 'var(--semantic-evening-to)' },
    live: { from: 'var(--semantic-success-from)', to: 'var(--semantic-success-to)' },
    warning: { from: 'var(--semantic-warning-from)', to: 'var(--semantic-warning-to)' },
    danger: { from: 'var(--semantic-danger-from)', to: 'var(--semantic-danger-to)' },
};

const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className = '', showDot, dot }) => {
    const dotColors = SEMANTIC_DOTS[variant];
    const hasDot = showDot ?? dot ?? Boolean(dotColors);

    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded-badge ${VARIANT_CLASSES[variant]} ${className}`}>
            {hasDot && (
                <span 
                    className="h-1.5 w-1.5 rounded-full shrink-0 shadow-sm"
                    style={dotColors ? { background: `linear-gradient(to right, ${dotColors.from}, ${dotColors.to})` } : { backgroundColor: 'currentColor' }}
                />
            )}
            {children}
        </span>
    );
};

export default Badge;
