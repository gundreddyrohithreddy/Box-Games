import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../App';
import { VenueGridSkeleton } from '../VenueCardSkeleton';

const PlayerDashboard = () => {
  const { user, token, logout, API } = useContext(AuthContext);
  const [venues, setVenues] = useState([]);
  const [filteredVenues, setFilteredVenues] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchVenues = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/venues`);
      setVenues(response.data);
      setFilteredVenues(response.data);
    } catch (error) {
      console.error('Error fetching venues:', error);
    } finally {
      setLoading(false);
    }
  }, [API]);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = venues.filter(venue =>
        venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredVenues(filtered);
    } else {
      setFilteredVenues(venues);
    }
  }, [searchQuery, venues]);

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="sidebar-logo">
          <h2>BoxGames</h2>
          <p>{user?.username}</p>
        </div>
        <ul className="sidebar-nav">
          <li><Link to="/explore" className="active" data-testid="explore-nav">🏟️ Explore Venues</Link></li>
          <li><Link to="/my-bookings" data-testid="my-bookings-nav">📅 My Bookings</Link></li>
          <li><Link to="/profile" data-testid="profile-nav">👤 Profile</Link></li>
          <li><button onClick={logout} data-testid="logout-btn">🚪 Logout</button></li>
        </ul>
      </div>

      <div className="main-content">
        <div className="page-header">
          <h1>Explore Venues</h1>
          <p>Find and book the perfect sports ground</p>
        </div>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search venues by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="search-input"
          />
        </div>

        {loading ? (
          <VenueGridSkeleton count={6} />
        ) : filteredVenues.length > 0 ? (
          <div className="venue-grid">
            {filteredVenues.map((venue) => (
              <div key={venue.id} className="venue-card" data-testid={`venue-card-${venue.id}`}>
                <img src={venue.image_url} alt={venue.name} className="venue-image" />
                <div className="venue-info">
                  <h3>{venue.name}</h3>
                  <p className="venue-location">📍 {venue.location}</p>
                  <Link to={`/venue/${venue.id}`}>
                    <button className="btn-view" data-testid={`view-venue-${venue.id}`}>View Slots</button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No venues found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerDashboard;
