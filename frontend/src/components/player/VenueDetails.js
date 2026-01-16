import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../App';

const VenueDetails = () => {
  const { venueId } = useParams();
  const { user, token, logout, API } = useContext(AuthContext);
  const [venue, setVenue] = useState(null);
  const [grounds, setGrounds] = useState([]);
  const [slots, setSlots] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [bookingSlot, setBookingSlot] = useState(null);

  const fetchVenueDetails = useCallback(async () => {
    try {
      const venueResponse = await axios.get(`${API}/venues/${venueId}`);
      setVenue(venueResponse.data);

      const groundsResponse = await axios.get(`${API}/venues/${venueId}/grounds`);
      setGrounds(groundsResponse.data);
    } catch (error) {
      console.error('Error fetching venue details:', error);
    } finally {
      setLoading(false);
    }
  }, [API, venueId]);

  useEffect(() => {
    fetchVenueDetails();
  }, [fetchVenueDetails]);

  const fetchSlots = useCallback(async () => {
    const slotsData = {};
    for (const ground of grounds) {
      try {
        const response = await axios.get(`${API}/grounds/${ground.id}/slots`, {
          params: { slot_date: selectedDate }
        });
        slotsData[ground.id] = response.data;
      } catch (error) {
        console.error(`Error fetching slots for ground ${ground.id}:`, error);
      }
    }
    setSlots(slotsData);
  }, [API, grounds, selectedDate]);

  useEffect(() => {
    if (grounds.length > 0) {
      fetchSlots();
    }
  }, [grounds, selectedDate, fetchSlots]);

  const handleBookSlot = async (slotId) => {
    try {
      await axios.post(
        `${API}/bookings`,
        { slot_id: slotId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Booking confirmed!');
      fetchSlots();
    } catch (error) {
      alert(error.response?.data?.detail || 'Booking failed');
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading venue...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="sidebar-logo">
          <h2>BoxGames</h2>
          <p>{user?.username}</p>
        </div>
        <ul className="sidebar-nav">
          <li><Link to="/explore" data-testid="explore-nav">🏟️ Explore Venues</Link></li>
          <li><Link to="/my-bookings" data-testid="my-bookings-nav">📅 My Bookings</Link></li>
          <li><button onClick={logout} data-testid="logout-btn">🚪 Logout</button></li>
        </ul>
      </div>

      <div className="main-content">
        <div className="page-header">
          <h1>{venue?.name}</h1>
          <p>📍 {venue?.location}</p>
        </div>

        <div className="date-filter">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            data-testid="date-filter"
          />
        </div>

        {grounds.map((ground) => (
          <div key={ground.id} className="slots-section">
            <h2>{ground.name}</h2>
            {slots[ground.id] && slots[ground.id].length > 0 ? (
              <div className="slots-grid">
                {slots[ground.id].map((slot) => (
                  <div
                    key={slot.id}
                    className={`slot-card ${slot.is_booked ? 'booked' : 'available'}`}
                    onClick={() => !slot.is_booked && handleBookSlot(slot.id)}
                    data-testid={`slot-${slot.id}`}
                  >
                    <div className="slot-time">{slot.start_time} - {slot.end_time}</div>
                    <div className="slot-price">₹{slot.price}</div>
                    <div className="slot-status">{slot.is_booked ? 'Booked' : 'Available'}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No slots available for this date</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VenueDetails;
