import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthContext } from '../../App';

const Profile = () => {
    const { user, logout } = useContext(AuthContext);

    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard!`);
    };

    return (
        <div className="dashboard-container">
            <div className="sidebar">
                <div className="sidebar-logo">
                    <h2>BoxGames</h2>
                    <p>{user?.username}</p>
                </div>
                <ul className="sidebar-nav">
                    {user?.role === 'player' ? (
                        <>
                            <li><Link to="/explore" data-testid="explore-nav">🏟️ Explore Venues</Link></li>
                            <li><Link to="/my-bookings" data-testid="my-bookings-nav">📅 My Bookings</Link></li>
                        </>
                    ) : (
                        <>
                            <li><Link to="/owner" data-testid="owner-dashboard-nav">📊 Dashboard</Link></li>
                            <li><Link to="/owner/manage" data-testid="manage-venues-nav">🏟️ Manage Venues</Link></li>
                            <li><Link to="/owner/verify-booking" data-testid="verify-booking-nav">✓ Verify Booking</Link></li>
                            <li><Link to="/owner/analytics" data-testid="analytics-nav">📈 Analytics</Link></li>
                        </>
                    )}
                    <li><Link to="/profile" className="active" data-testid="profile-nav">👤 Profile</Link></li>
                    <li><button onClick={logout} data-testid="logout-btn">🚪 Logout</button></li>
                </ul>
            </div>

            <div className="main-content">
                <div className="page-header">
                    <h1>My Profile</h1>
                    <p>View your account information</p>
                </div>

                <div className="profile-container">
                    <div className="profile-card">
                        <div className="profile-avatar">
                            <span>{user?.username?.charAt(0)?.toUpperCase() || '?'}</span>
                        </div>

                        <div className="profile-info">
                            <div className="profile-field">
                                <label>Username</label>
                                <div className="field-value">
                                    <span>{user?.username || 'N/A'}</span>
                                    <button
                                        className="btn-copy"
                                        onClick={() => copyToClipboard(user?.username, 'Username')}
                                    >
                                        📋
                                    </button>
                                </div>
                            </div>

                            <div className="profile-field">
                                <label>Email</label>
                                <div className="field-value">
                                    <span>{user?.email || 'N/A'}</span>
                                    <button
                                        className="btn-copy"
                                        onClick={() => copyToClipboard(user?.email, 'Email')}
                                    >
                                        📋
                                    </button>
                                </div>
                            </div>

                            <div className="profile-field">
                                <label>Mobile Number</label>
                                <div className="field-value">
                                    <span>{user?.mobileNumber || 'N/A'}</span>
                                    {user?.mobileNumber && (
                                        <button
                                            className="btn-copy"
                                            onClick={() => copyToClipboard(user?.mobileNumber, 'Mobile number')}
                                        >
                                            📋
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="profile-field">
                                <label>Role</label>
                                <div className="field-value">
                                    <span className="role-badge">{user?.role?.toUpperCase() || 'N/A'}</span>
                                </div>
                            </div>

                            <div className="profile-field verification-code-field">
                                <label>🔐 Verification Code</label>
                                <p className="field-hint">Show this code when visiting a venue to confirm your booking</p>
                                <div className="verification-code-display">
                                    <span className="code">{user?.verification_code || 'N/A'}</span>
                                    {user?.verification_code && (
                                        <button
                                            className="btn-copy-code"
                                            onClick={() => copyToClipboard(user?.verification_code, 'Verification code')}
                                        >
                                            📋 Copy Code
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="profile-field">
                                <label>Member Since</label>
                                <div className="field-value">
                                    <span>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
