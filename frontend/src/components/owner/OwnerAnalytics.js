import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../App';

const OwnerAnalytics = () => {
  const { user, token, logout, API } = useContext(AuthContext);
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/owner/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [API, token]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="sidebar-logo">
          <h2>BoxGames</h2>
          <p>{user?.username}</p>
        </div>
        <ul className="sidebar-nav">
          <li><Link to="/owner" data-testid="owner-dashboard-nav">📊 Dashboard</Link></li>
          <li><Link to="/owner/manage" data-testid="manage-venues-nav">🏟️ Manage Venues</Link></li>
          <li><Link to="/owner/analytics" className="active" data-testid="analytics-nav">📈 Analytics</Link></li>
          <li><button onClick={logout} data-testid="logout-btn">🚪 Logout</button></li>
        </ul>
      </div>

      <div className="main-content">
        <div className="page-header">
          <h1>Revenue Analytics</h1>
          <p>Track your earnings by venue and ground</p>
        </div>

        {loading ? (
          <div className="loading-screen">
            <div className="loading-spinner"></div>
            <p>Loading analytics...</p>
          </div>
        ) : analytics.length > 0 ? (
          <div className="analytics-table">
            <table>
              <thead>
                <tr>
                  <th>Venue</th>
                  <th>Ground</th>
                  <th>Total Bookings</th>
                  <th>Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {analytics.map((item, index) => (
                  <tr key={index} data-testid={`analytics-row-${index}`}>
                    <td>{item.venue_name}</td>
                    <td>{item.ground_name}</td>
                    <td>{item.total_bookings}</td>
                    <td>₹{item.total_revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No analytics data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerAnalytics;
