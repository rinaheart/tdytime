import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    /** Optional title displayed as section header */
    title?: string;
    /** Optional description below title */
    description?: string;
    /** Right-side header action (button, badge, etc.) */
    headerAction?: React.ReactNode;
    /** Remove padding — useful for tables or full-bleed content */
    noPadding?: boolean;
    /** Enable hover micro-interactions (shadow lift, border highlight) */
    interactive?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', title, description, headerAction, noPadding, interactive }) => (
    <div className={`bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm transition-all duration-200 ${interactive ? 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer' : ''} ${noPadding ? '' : 'p-4 md:p-5'} ${className}`}>
        {title && (
            <div className={`flex items-start justify-between gap-3 ${noPadding ? 'px-4 pt-4 md:px-5 md:pt-5' : ''} mb-3`}>
                <div>
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">{title}</h3>
                    {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
                </div>
                {headerAction}
            </div>
        )}
        {children}
    </div>
);

export default Card;
