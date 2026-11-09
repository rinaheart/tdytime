import React from 'react';

interface SkeletonProps {
    className?: string;
    /** Render as a circle (avatar placeholder) */
    circle?: boolean;
    /** Width in rem or CSS value */
    width?: string;
    /** Height in rem or CSS value */
    height?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '', circle, width, height }) => (
    <div
        className={`animate-shimmer bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 bg-[length:200%_100%] ${circle ? 'rounded-full' : 'rounded-xl'} ${className}`}
        style={{ width, height }}
        aria-hidden="true"
    />
);

/** Pre-built skeleton for a SessionCard placeholder */
export const SessionCardSkeleton: React.FC = () => (
    <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center gap-3">
            <Skeleton width="2.5rem" height="2.5rem" circle />
            <div className="flex-1 space-y-2">
                <Skeleton height="0.75rem" className="w-3/4" />
                <Skeleton height="0.625rem" className="w-1/2" />
            </div>
        </div>
        <Skeleton height="0.625rem" className="w-full" />
        <Skeleton height="0.625rem" className="w-2/3" />
    </div>
);

export default Skeleton;
