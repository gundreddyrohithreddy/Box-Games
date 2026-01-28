import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../App';

const MyBookings = () => {
  const { user, token, logout, API } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/bookings/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [API, token]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await axios.delete(`${API}/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Booking cancelled successfully');
      fetchBookings();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to cancel booking');
    }
  };

  const canCancelBooking = (slotDate, startTime) => {
    const slotDateTime = new Date(`${slotDate}T${startTime}`);
    const now = new Date();
    const hoursDifference = (slotDateTime - now) / (1000 * 60 * 60);
    return hoursDifference > 1;
  };

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="sidebar-logo">
          <h2>BoxGames</h2>
          <p>{user?.username}</p>
        </div>
        <ul className="sidebar-nav">
          <li><Link to="/explore" data-testid="explore-nav">🏟️ Explore Venues</Link></li>
          <li><Link to="/my-bookings" className="active" data-testid="my-bookings-nav">📅 My Bookings</Link></li>
          <li><button onClick={logout} data-testid="logout-btn">🚪 Logout</button></li>
        </ul>
      </div>

      <div className="main-content">
        <div className="page-header">
          <h1>My Bookings</h1>
          <p>View and manage your bookings</p>
        </div>

        {/* Verification Codes Section */}
        {bookings.length > 0 && (
          <div style={{
            backgroundColor: '#fef3c7',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '2px solid #f59e0b'
          }}>
            <p style={{ margin: '0 0 10px 0', color: '#92400e', fontWeight: 'bold', fontSize: '14px' }}>
              🔐 Verification Codes (Show these when you visit the ground)
            </p>
            <div style={{ display: 'grid', gap: '10px' }}>
              {bookings.map((booking) => (
                <div key={booking.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: 'white',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '2px dashed #f59e0b'
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#666' }}>
                      {booking.venue_name} - {booking.ground_name}
                    </p>
                    <span style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: '#dc2626',
                      fontFamily: 'monospace',
                      letterSpacing: '2px'
                    }}>
                      {booking.verification_code || 'N/A'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(booking.verification_code || '');
                      alert('Code copied!');
                    }}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    📋 Copy
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading-screen">
            <div className="loading-spinner"></div>
            <p>Loading bookings...</p>
          </div>
        ) : bookings.length > 0 ? (
          <div className="bookings-grid">
            {bookings.map((booking) => (
              <div key={booking.id} className="booking-card" data-testid={`booking-${booking.id}`}>
                <div className="booking-header">
                  <h3>{booking.venue_name}</h3>
                  <p>{booking.ground_name}</p>
                </div>
                <div className="booking-details">
                  <div>
                    <span>Date:</span>
                    <strong>{booking.slot_date}</strong>
                  </div>
                  <div>
                    <span>Time:</span>
                    <strong>{booking.start_time} - {booking.end_time}</strong>
                  </div>
                  <div>
                    <span>Price:</span>
                    <strong>₹{booking.price}</strong>
                  </div>
                  <div>
                    <span>Booked on:</span>
                    <strong>{new Date(booking.booked_at).toLocaleDateString()}</strong>
                  </div>
                </div>
                {canCancelBooking(booking.slot_date, booking.start_time) && (
                  <button
                    className="btn-cancel"
                    onClick={() => handleCancelBooking(booking.id)}
                    data-testid={`cancel-booking-${booking.id}`}
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No bookings yet</p>
            <p style={{ fontSize: '14px', marginTop: '10px' }}>
              <Link to="/explore" style={{ color: '#39ff14' }}>Explore venues</Link> to make your first booking
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
