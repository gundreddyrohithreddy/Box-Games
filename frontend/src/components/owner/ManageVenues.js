import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../App';

const ManageVenues = () => {
  const { user, token, logout, API } = useContext(AuthContext);
  const [venues, setVenues] = useState([]);
  const [grounds, setGrounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [showGroundModal, setShowGroundModal] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [venueForm, setVenueForm] = useState({ name: '', location: '', image_url: '' });
  const [groundForm, setGroundForm] = useState({ name: '', venue_id: '' });
  const [slotForm, setSlotForm] = useState({
    ground_id: '',
    slot_date: new Date().toISOString().split('T')[0],
    start_time: '06:00',
    end_time: '07:00',
    price: 1000
  });

  const fetchData = useCallback(async () => {
    try {
      const [venuesRes, groundsRes] = await Promise.all([
        axios.get(`${API}/owner/venues`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/owner/grounds`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setVenues(venuesRes.data);
      setGrounds(groundsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [API, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateVenue = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/owner/venues`, venueForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Venue created successfully');
      setShowVenueModal(false);
      setVenueForm({ name: '', location: '', image_url: '' });
      fetchData();
    } catch (error) {
      alert('Failed to create venue');
    }
  };

  const handleCreateGround = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/owner/grounds`, groundForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Ground created successfully');
      setShowGroundModal(false);
      setGroundForm({ name: '', venue_id: '' });
      fetchData();
    } catch (error) {
      alert('Failed to create ground');
    }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/owner/slots`, slotForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Slot created successfully');
      setShowSlotModal(false);
      setSlotForm({
        ground_id: '',
        slot_date: new Date().toISOString().split('T')[0],
        start_time: '06:00',
        end_time: '07:00',
        price: 1000
      });
    } catch (error) {
      alert('Failed to create slot');
    }
  };

  const handleDeleteVenue = async (venueId) => {
    if (!window.confirm('Are you sure you want to delete this venue?')) return;
    try {
      await axios.delete(`${API}/owner/venues/${venueId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Venue deleted successfully');
      fetchData();
    } catch (error) {
      alert('Failed to delete venue');
    }
  };

  const handleDeleteGround = async (groundId) => {
    if (!window.confirm('Are you sure you want to delete this ground?')) return;
    try {
      await axios.delete(`${API}/owner/grounds/${groundId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Ground deleted successfully');
      fetchData();
    } catch (error) {
      alert('Failed to delete ground');
    }
  };

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="sidebar-logo">
          <h2>BoxGames</h2>
          <p>{user?.username}</p>
        </div>
        <ul className="sidebar-nav">
          <li><Link to="/owner" data-testid="owner-dashboard-nav">📊 Dashboard</Link></li>
          <li><Link to="/owner/manage" className="active" data-testid="manage-venues-nav">🏟️ Manage Venues</Link></li>
          <li><Link to="/owner/analytics" data-testid="analytics-nav">📈 Analytics</Link></li>
          <li><button onClick={logout} data-testid="logout-btn">🚪 Logout</button></li>
        </ul>
      </div>

      <div className="main-content">
        <div className="page-header">
          <h1>Manage Venues & Grounds</h1>
          <p>Create and manage your sports facilities</p>
        </div>

        <div style={{ marginBottom: '40px' }}>
          <button className="btn-primary" onClick={() => setShowVenueModal(true)} data-testid="create-venue-btn">
            + Create Venue
          </button>
          <button className="btn-primary" onClick={() => setShowGroundModal(true)} style={{ marginLeft: '15px' }} data-testid="create-ground-btn">
            + Create Ground
          </button>
          <button className="btn-primary" onClick={() => setShowSlotModal(true)} style={{ marginLeft: '15px' }} data-testid="create-slot-btn">
            + Create Slot
          </button>
        </div>

        {loading ? (
          <div className="loading-screen">
            <div className="loading-spinner"></div>
            <p>Loading...</p>
          </div>
        ) : (
          <>
            <h2 style={{ marginTop: '40px', marginBottom: '20px', color: '#fff' }}>Your Venues</h2>
            <div className="venue-grid">
              {venues.map((venue) => (
                <div key={venue.id} className="venue-card" data-testid={`venue-${venue.id}`}>
                  <img src={venue.image_url} alt={venue.name} className="venue-image" />
                  <div className="venue-info">
                    <h3>{venue.name}</h3>
                    <p className="venue-location">📍 {venue.location}</p>
                    <button className="btn-danger" onClick={() => handleDeleteVenue(venue.id)} data-testid={`delete-venue-${venue.id}`}>
                      Delete Venue
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <h2 style={{ marginTop: '60px', marginBottom: '20px', color: '#fff' }}>Your Grounds</h2>
            <div className="analytics-table">
              <table>
                <thead>
                  <tr>
                    <th>Ground Name</th>
                    <th>Venue</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {grounds.map((ground) => {
                    const venue = venues.find(v => v.id === ground.venue_id);
                    return (
                      <tr key={ground.id} data-testid={`ground-${ground.id}`}>
                        <td>{ground.name}</td>
                        <td>{venue?.name || 'Unknown'}</td>
                        <td>
                          <button className="btn-danger" onClick={() => handleDeleteGround(ground.id)} data-testid={`delete-ground-${ground.id}`}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Venue Modal */}
        {showVenueModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Create New Venue</h2>
                <button className="btn-close" onClick={() => setShowVenueModal(false)}>&times;</button>
              </div>
              <form onSubmit={handleCreateVenue}>
                <div className="form-group">
                  <label>Venue Name</label>
                  <input
                    type="text"
                    value={venueForm.name}
                    onChange={(e) => setVenueForm({ ...venueForm, name: e.target.value })}
                    required
                    data-testid="venue-name-input"
                  />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={venueForm.location}
                    onChange={(e) => setVenueForm({ ...venueForm, location: e.target.value })}
                    required
                    data-testid="venue-location-input"
                  />
                </div>
                <div className="form-group">
                  <label>Image URL</label>
                  <input
                    type="url"
                    value={venueForm.image_url}
                    onChange={(e) => setVenueForm({ ...venueForm, image_url: e.target.value })}
                    required
                    data-testid="venue-image-input"
                  />
                </div>
                <button type="submit" className="btn-primary" data-testid="submit-venue-btn">Create Venue</button>
              </form>
            </div>
          </div>
        )}

        {/* Ground Modal */}
        {showGroundModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Create New Ground</h2>
                <button className="btn-close" onClick={() => setShowGroundModal(false)}>&times;</button>
              </div>
              <form onSubmit={handleCreateGround}>
                <div className="form-group">
                  <label>Ground Name</label>
                  <input
                    type="text"
                    value={groundForm.name}
                    onChange={(e) => setGroundForm({ ...groundForm, name: e.target.value })}
                    required
                    data-testid="ground-name-input"
                  />
                </div>
                <div className="form-group">
                  <label>Select Venue</label>
                  <select
                    value={groundForm.venue_id}
                    onChange={(e) => setGroundForm({ ...groundForm, venue_id: e.target.value })}
                    required
                    data-testid="ground-venue-select"
                  >
                    <option value="">Select a venue</option>
                    {venues.map((venue) => (
                      <option key={venue.id} value={venue.id}>{venue.name}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn-primary" data-testid="submit-ground-btn">Create Ground</button>
              </form>
            </div>
          </div>
        )}

        {/* Slot Modal */}
        {showSlotModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Create New Slot</h2>
                <button className="btn-close" onClick={() => setShowSlotModal(false)}>&times;</button>
              </div>
              <form onSubmit={handleCreateSlot}>
                <div className="form-group">
                  <label>Select Ground</label>
                  <select
                    value={slotForm.ground_id}
                    onChange={(e) => setSlotForm({ ...slotForm, ground_id: e.target.value })}
                    required
                    data-testid="slot-ground-select"
                  >
                    <option value="">Select a ground</option>
                    {grounds.map((ground) => {
                      const venue = venues.find(v => v.id === ground.venue_id);
                      return (
                        <option key={ground.id} value={ground.id}>
                          {venue?.name} - {ground.name}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={slotForm.slot_date}
                    onChange={(e) => setSlotForm({ ...slotForm, slot_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    data-testid="slot-date-input"
                  />
                </div>
                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={slotForm.start_time}
                    onChange={(e) => setSlotForm({ ...slotForm, start_time: e.target.value })}
                    required
                    data-testid="slot-start-time-input"
                  />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="time"
                    value={slotForm.end_time}
                    onChange={(e) => setSlotForm({ ...slotForm, end_time: e.target.value })}
                    required
                    data-testid="slot-end-time-input"
                  />
                </div>
                <div className="form-group">
                  <label>Price (₹)</label>
                  <input
                    type="number"
                    value={slotForm.price}
                    onChange={(e) => setSlotForm({ ...slotForm, price: parseInt(e.target.value) })}
                    required
                    min="0"
                    data-testid="slot-price-input"
                  />
                </div>
                <button type="submit" className="btn-primary" data-testid="submit-slot-btn">Create Slot</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageVenues;
