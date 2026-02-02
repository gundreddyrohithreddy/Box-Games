import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../App';
import { KPIGridSkeleton } from '../KPICardSkeleton';

const OwnerDashboard = () => {
  const { user, token, logout, API } = useContext(AuthContext);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/owner/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboard(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [API, token]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="sidebar-logo">
          <h2>BoxGames</h2>
          <p>{user?.username}</p>
        </div>
        <ul className="sidebar-nav">
          <li><Link to="/owner" className="active" data-testid="owner-dashboard-nav">📊 Dashboard</Link></li>
          <li><Link to="/owner/manage" data-testid="manage-venues-nav">🏟️ Manage Venues</Link></li>
          <li><Link to="/owner/verify-booking" data-testid="verify-booking-nav">✓ Verify Booking</Link></li>
          <li><Link to="/owner/analytics" data-testid="analytics-nav">📈 Analytics</Link></li>
          <li><Link to="/profile" data-testid="profile-nav">👤 Profile</Link></li>
          <li><button onClick={logout} data-testid="logout-btn">🚪 Logout</button></li>
        </ul>
      </div>

      <div className="main-content">
        <div className="page-header">
          <h1>Owner Dashboard</h1>
          <p>Overview of your business</p>
        </div>

        {loading ? (
          <KPIGridSkeleton count={4} />
        ) : (
          <div className="kpi-grid">
            <div className="kpi-card" data-testid="total-venues">
              <div className="kpi-value">{dashboard?.total_venues || 0}</div>
              <div className="kpi-label">Total Venues</div>
            </div>
            <div className="kpi-card" data-testid="total-grounds">
              <div className="kpi-value">{dashboard?.total_grounds || 0}</div>
              <div className="kpi-label">Total Grounds</div>
            </div>
            <div className="kpi-card" data-testid="booked-slots">
              <div className="kpi-value">{dashboard?.booked_slots || 0}</div>
              <div className="kpi-label">Booked Slots</div>
            </div>
            <div className="kpi-card" data-testid="total-revenue">
              <div className="kpi-value">₹{dashboard?.total_revenue || 0}</div>
              <div className="kpi-label">Total Revenue</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerDashboard;
