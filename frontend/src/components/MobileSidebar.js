import React, { useState, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../App';

/**
 * Mobile Sidebar Component with hamburger menu toggle
 */
const MobileSidebar = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    const closeSidebar = () => {
        setIsOpen(false);
    };

    const isActive = (path) => location.pathname === path;

    const playerLinks = [
        { path: '/explore', icon: '🏟️', label: 'Explore Venues' },
        { path: '/my-bookings', icon: '📅', label: 'My Bookings' },
        { path: '/profile', icon: '👤', label: 'Profile' },
    ];

    const ownerLinks = [
        { path: '/owner', icon: '📊', label: 'Dashboard' },
        { path: '/owner/manage', icon: '🏟️', label: 'Manage Venues' },
        { path: '/owner/verify-booking', icon: '✓', label: 'Verify Booking' },
        { path: '/owner/analytics', icon: '📈', label: 'Analytics' },
        { path: '/profile', icon: '👤', label: 'Profile' },
    ];

    const links = user?.role === 'owner' ? ownerLinks : playerLinks;

    return (
        <>
            {/* Hamburger Button - Only visible on mobile */}
            <button
                className="hamburger-btn"
                onClick={toggleSidebar}
                aria-label="Toggle menu"
            >
                <span className={`hamburger-line ${isOpen ? 'open' : ''}`}></span>
                <span className={`hamburger-line ${isOpen ? 'open' : ''}`}></span>
                <span className={`hamburger-line ${isOpen ? 'open' : ''}`}></span>
            </button>

            {/* Overlay */}
            {isOpen && (
                <div className="sidebar-overlay" onClick={closeSidebar}></div>
            )}

            {/* Mobile Sidebar */}
            <div className={`mobile-sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <h2>BoxGames</h2>
                    <p>{user?.username}</p>
                </div>
                <ul className="sidebar-nav">
                    {links.map((link) => (
                        <li key={link.path}>
                            <Link
                                to={link.path}
                                className={isActive(link.path) ? 'active' : ''}
                                onClick={closeSidebar}
                            >
                                {link.icon} {link.label}
                            </Link>
                        </li>
                    ))}
                    <li>
                        <button onClick={() => { logout(); closeSidebar(); }}>
                            🚪 Logout
                        </button>
                    </li>
                </ul>
            </div>

            {/* Main content wrapper */}
            {children}
        </>
    );
};

export default MobileSidebar;
