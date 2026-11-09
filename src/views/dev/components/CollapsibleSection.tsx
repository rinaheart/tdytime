/**
 * CollapsibleSection — DevTools Console
 * Reusable wrapper with chevron toggle + localStorage persistence.
 */

import React, { useState, useCallback } from 'react';
import { ChevronRight } from 'lucide-react';

interface CollapsibleSectionProps {
    id: string;
    title: string;
    icon: React.ReactNode;
    badge?: React.ReactNode;
    defaultExpanded?: boolean;
    children: React.ReactNode;
}

const STORAGE_PREFIX = 'tdytime-devtools-section-';

function getInitialState(id: string, defaultExpanded: boolean): boolean {
    try {
        const saved = localStorage.getItem(`${STORAGE_PREFIX}${id}`);
        if (saved !== null) return saved === 'open';
    } catch { /* ignore */ }
    return defaultExpanded;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
    id,
    title,
    icon,
    badge,
    defaultExpanded = true,
    children,
}) => {
    const [expanded, setExpanded] = useState(() => getInitialState(id, defaultExpanded));

    const toggle = useCallback(() => {
        setExpanded(prev => {
            const next = !prev;
            try {
                localStorage.setItem(`${STORAGE_PREFIX}${id}`, next ? 'open' : 'closed');
            } catch { /* ignore */ }
            return next;
        });
    }, [id]);

    return (
        <div
            className={`bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-none shadow-none overflow-hidden transition-none ${
                expanded ? 'border-amber-500/20' : ''
            }`}
        >
            {/* Header */}
            <button
                type="button"
                onClick={toggle}
                className="w-full flex items-center justify-between cursor-pointer p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 select-none transition-none border-b border-transparent dark:border-transparent data-[expanded=true]:border-slate-100 dark:data-[expanded=true]:border-slate-800"
                data-expanded={expanded}
            >
                <div className="flex items-center gap-2">
                    <span className="text-amber-500">{icon}</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        {title}
                    </span>
                    {badge && <span className="ml-1">{badge}</span>}
                </div>
                <ChevronRight
                    size={16}
                    className={`text-slate-400 font-bold ${
                        expanded ? 'rotate-90' : ''
                    }`}
                />
            </button>

            {/* Content */}
            {expanded && (
                <div className="px-4 pb-4">
                    {children}
                </div>
            )}
        </div>
    );
};

export default CollapsibleSection;
