import React from 'react';

/**
 * KPI Card Skeleton for owner dashboard loading states
 */
const KPICardSkeleton = () => {
    return (
        <div className="kpi-card skeleton-card">
            <div className="skeleton skeleton-kpi-value"></div>
            <div className="skeleton skeleton-kpi-label"></div>
        </div>
    );
};

/**
 * Multiple KPI skeleton cards for dashboard loading
 */
export const KPIGridSkeleton = ({ count = 4 }) => {
    return (
        <div className="kpi-grid">
            {Array(count).fill(0).map((_, index) => (
                <KPICardSkeleton key={index} />
            ))}
        </div>
    );
};

export default KPICardSkeleton;
