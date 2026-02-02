import React from 'react';

/**
 * Venue Card Skeleton for loading states
 */
const VenueCardSkeleton = () => {
    return (
        <div className="venue-card skeleton-card">
            <div className="skeleton skeleton-image"></div>
            <div className="venue-info">
                <div className="skeleton skeleton-title"></div>
                <div className="skeleton skeleton-text"></div>
                <div className="skeleton skeleton-button"></div>
            </div>
        </div>
    );
};

/**
 * Multiple skeleton cards for grid loading
 */
export const VenueGridSkeleton = ({ count = 6 }) => {
    return (
        <div className="venue-grid">
            {Array(count).fill(0).map((_, index) => (
                <VenueCardSkeleton key={index} />
            ))}
        </div>
    );
};

export default VenueCardSkeleton;
