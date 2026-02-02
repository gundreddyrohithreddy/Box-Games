import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { AuthContext } from '../../App';
import ConfirmDialog from '../ConfirmDialog';

const ManageVenues = () => {
  const { user, token, logout, API } = useContext(AuthContext);
  const [venues, setVenues] = useState([]);
  const [grounds, setGrounds] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [showGroundModal, setShowGroundModal] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [selectedGround, setSelectedGround] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'venue-details', 'ground-details'
  const [venueForm, setVenueForm] = useState({
    name: '',
    location: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    latitude: null,
    longitude: null,
    image_url: '',
    imageFile: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUploadMode, setImageUploadMode] = useState('url'); // 'url' or 'file'
  const [locationMode, setLocationMode] = useState('manual'); // 'gps' or 'manual'
  const [geoLoading, setGeoLoading] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [groundForm, setGroundForm] = useState({ name: '', venue_id: '' });
  const [slotForm, setSlotForm] = useState({
    ground_id: '',
    slot_date: new Date().toISOString().split('T')[0],
    start_time: '06:00',
    end_time: '07:00',
    price: 1000
  });
  const [slotConfig, setSlotConfig] = useState({
    ground_id: '',
    slot_date: new Date().toISOString().split('T')[0],
    start_time: '06:00',
    end_time: '22:00',
    duration: 60,
    price_per_slot: 1000
  });
  const [generatedSlots, setGeneratedSlots] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: null, id: null });

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

  const fetchGroundSlots = useCallback(async (groundId) => {
    try {
      const response = await axios.get(`${API}/grounds/${groundId}/slots`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSlots(response.data);
    } catch (error) {
      console.error('Error fetching slots:', error);
      setSlots([]);
    }
  }, [API, token]);

  const handleVenueClick = (venue) => {
    setSelectedVenue(venue);
    setViewMode('venue-details');
  };

  const handleGroundClick = async (ground) => {
    setSelectedGround(ground);
    setViewMode('ground-details');
    await fetchGroundSlots(ground.id);
  };

  const handleBackClick = () => {
    if (viewMode === 'ground-details') {
      setViewMode('venue-details');
      setSelectedGround(null);
      setSlots([]);
    } else if (viewMode === 'venue-details') {
      setViewMode('list');
      setSelectedVenue(null);
    }
  };

  // Context-aware button handlers
  const handleOpenVenueModal = () => {
    setVenueForm({
      name: '',
      location: '',
      city: '',
      state: '',
      country: '',
      pincode: '',
      latitude: null,
      longitude: null,
      image_url: '',
      imageFile: null
    });
    setImagePreview(null);
    setImageUploadMode('url');
    setLocationMode('manual');
    setShowVenueModal(true);
  };

  const handleOpenGroundModal = () => {
    // Pre-fill with current venue if in venue-details view
    const venueId = viewMode === 'venue-details' ? selectedVenue.id : '';
    setGroundForm({ name: '', venue_id: venueId });
    setShowGroundModal(true);
  };

  const handleOpenSlotModal = () => {
    // Pre-fill with current ground if in ground-details view
    const groundId = viewMode === 'ground-details' ? selectedGround.id : '';
    setSlotConfig({
      ground_id: groundId,
      slot_date: new Date().toISOString().split('T')[0],
      start_time: '06:00',
      end_time: '22:00',
      duration: 60,
      price_per_slot: 1000
    });
    setGeneratedSlots([]);
    setShowSlotModal(true);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleImageUpload = (file) => {
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setVenueForm({
        ...venueForm,
        imageFile: file,
        image_url: reader.result // Store base64 or file reference
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageUpload(files[0]);
    }
  };

  const handleImageUrlChange = (url) => {
    setVenueForm({
      ...venueForm,
      image_url: url
    });
    setImagePreview(url);
  };

  const handleGetGPSLocation = () => {
    setGeoLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Try to reverse geocode to get address
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            if (data.address) {
              const city = data.address.city || data.address.town || data.address.village || '';
              const state = data.address.state || '';
              const country = data.address.country || '';
              const pincode = data.address.postcode || '';

              // Format location like delivery apps: "City, State, Country"
              const formattedLocation = [city, state, country].filter(Boolean).join(', ');

              setVenueForm(prev => ({
                ...prev,
                city,
                state,
                country,
                pincode,
                latitude,
                longitude,
                location: formattedLocation || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
              }));
            } else {
              // Fallback if reverse geocoding fails
              setVenueForm(prev => ({
                ...prev,
                latitude,
                longitude,
                location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
              }));
            }
          } catch (error) {
            console.log('Could not fetch address details from GPS');
            // Fallback to coordinates
            setVenueForm(prev => ({
              ...prev,
              latitude,
              longitude,
              location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            }));
          }
          setGeoLoading(false);
        },
        (error) => {
          alert('Error getting location: ' + error.message);
          setGeoLoading(false);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
      setGeoLoading(false);
    }
  };

  const handlePincodeSearch = async (pincode) => {
    if (pincode.length !== 6) {
      return;
    }

    setPincodeLoading(true);
    try {
      // Using OpenStreetMap Nominatim API for pincode lookup
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&postalcode=${pincode}&country=IN`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const addressData = result.address || {};

        const city = addressData.city || addressData.town || addressData.village || '';
        const state = addressData.state || '';
        const country = addressData.country || 'India';

        // Format location like delivery apps: "City, State, Country"
        const formattedLocation = [city, state, country].filter(Boolean).join(', ');

        setVenueForm(prev => ({
          ...prev,
          pincode,
          city,
          state,
          country,
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          location: formattedLocation
        }));
      } else {
        alert('Pincode not found. Please check and try again.');
      }
    } catch (error) {
      console.error('Error fetching pincode data:', error);
      alert('Error looking up pincode. Please try again.');
    } finally {
      setPincodeLoading(false);
    }
  };

  const handleCreateVenue = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/owner/venues`, venueForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Venue created successfully');
      setShowVenueModal(false);
      setVenueForm({
        name: '',
        location: '',
        city: '',
        state: '',
        country: '',
        pincode: '',
        latitude: null,
        longitude: null,
        image_url: '',
        imageFile: null
      });
      setImagePreview(null);
      setImageUploadMode('url');
      setLocationMode('manual');
      fetchData();
    } catch (error) {
      toast.error('Failed to create venue');
    }
  };

  const handleCreateGround = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/owner/grounds`, groundForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Ground created successfully');
      setShowGroundModal(false);
      setGroundForm({ name: '', venue_id: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to create ground');
    }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/owner/slots`, slotForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Slot created successfully');
      setShowSlotModal(false);
      setSlotForm({
        ground_id: '',
        slot_date: new Date().toISOString().split('T')[0],
        start_time: '06:00',
        end_time: '07:00',
        price: 1000
      });
    } catch (error) {
      toast.error('Failed to create slot');
    }
  };

  const generateSlots = () => {
    if (!slotConfig.ground_id || !slotConfig.slot_date || !slotConfig.start_time || !slotConfig.end_time || !slotConfig.duration || !slotConfig.price_per_slot) {
      toast.warning('Please fill all fields');
      return;
    }

    const slots = [];
    const startTime = new Date(`2000-01-01 ${slotConfig.start_time}`);
    const endTime = new Date(`2000-01-01 ${slotConfig.end_time}`);
    const durationMinutes = parseInt(slotConfig.duration);

    let currentTime = new Date(startTime);
    let slotNumber = 1;

    while (currentTime < endTime) {
      const nextTime = new Date(currentTime.getTime() + durationMinutes * 60000);

      if (nextTime <= endTime) {
        const startTimeStr = currentTime.toTimeString().slice(0, 5);
        const endTimeStr = nextTime.toTimeString().slice(0, 5);

        slots.push({
          id: slotNumber,
          ground_id: slotConfig.ground_id,
          slot_date: slotConfig.slot_date,
          start_time: startTimeStr,
          end_time: endTimeStr,
          duration: durationMinutes,
          price: slotConfig.price_per_slot
        });

        slotNumber++;
        currentTime = nextTime;
      } else {
        break;
      }
    }

    if (slots.length === 0) {
      toast.warning('No slots can be generated with these settings');
      return;
    }

    setGeneratedSlots(slots);
  };

  const removeSlot = (slotId) => {
    setGeneratedSlots(generatedSlots.filter(slot => slot.id !== slotId));
  };

  const confirmAllSlots = async () => {
    if (generatedSlots.length === 0) {
      toast.warning('No slots to confirm');
      return;
    }

    try {
      for (const slot of generatedSlots) {
        await axios.post(`${API}/owner/slots`, {
          ground_id: slot.ground_id,
          slot_date: slot.slot_date,
          start_time: slot.start_time,
          end_time: slot.end_time,
          price: slot.price
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      toast.success(`${generatedSlots.length} slots created successfully`);
      setShowSlotModal(false);
      setGeneratedSlots([]);
      setSlotConfig({
        ground_id: '',
        slot_date: new Date().toISOString().split('T')[0],
        start_time: '06:00',
        end_time: '22:00',
        duration: 60,
        price_per_slot: 1000
      });
      fetchData();
    } catch (error) {
      console.error('Error creating slots:', error);
      toast.error('Failed to create some slots');
    }
  };

  const handleDeleteVenue = async (venueId) => {
    try {
      await axios.delete(`${API}/owner/venues/${venueId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Venue deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete venue');
    }
  };

  const handleDeleteGround = async (groundId) => {
    try {
      await axios.delete(`${API}/owner/grounds/${groundId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Ground deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete ground');
    }
  };

  const openDeleteDialog = (type, id) => {
    setConfirmDialog({ isOpen: true, type, id });
  };

  const closeDeleteDialog = () => {
    setConfirmDialog({ isOpen: false, type: null, id: null });
  };

  const confirmDelete = () => {
    if (confirmDialog.type === 'venue') {
      handleDeleteVenue(confirmDialog.id);
    } else if (confirmDialog.type === 'ground') {
      handleDeleteGround(confirmDialog.id);
    }
    closeDeleteDialog();
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

        {/* Context-aware action buttons */}
        <div className="action-row">
          {viewMode === 'list' && (
            <>
              <button className="btn-primary" onClick={handleOpenVenueModal} data-testid="create-venue-btn">+ Create Venue</button>
              <button className="btn-primary" onClick={handleOpenGroundModal} data-testid="create-ground-btn">+ Create Ground</button>
              <button className="btn-primary" onClick={handleOpenSlotModal} data-testid="create-slot-btn">+ Create Slot</button>
            </>
          )}

          {viewMode === 'venue-details' && (
            <>
              <button className="btn-primary" onClick={handleOpenGroundModal} data-testid="create-ground-btn">+ Create Ground in {selectedVenue?.name}</button>
              <button className="btn-primary" onClick={handleOpenSlotModal} data-testid="create-slot-btn">+ Create Slots</button>
            </>
          )}

          {viewMode === 'ground-details' && (
            <button className="btn-primary" onClick={handleOpenSlotModal} data-testid="create-slot-btn">+ Create Slots in {selectedGround?.name}</button>
          )}
        </div>

        {loading ? (
          <div className="loading-screen">
            <div className="loading-spinner"></div>
            <p>Loading...</p>
          </div>
        ) : (
          <>
            {viewMode === 'list' && (
              <>
                <h2 style={{ marginTop: '40px', marginBottom: '20px', color: '#fff' }}>Your Venues</h2>
                <div className="venue-grid">
                  {venues.map((venue) => (
                    <div
                      key={venue.id}
                      className="venue-card clickable"
                      data-testid={`venue-${venue.id}`}
                      onClick={() => handleVenueClick(venue)}
                    >
                      <img src={venue.image_url} alt={venue.name} className="venue-image" />
                      <div className="venue-info">
                        <h3>{venue.name}</h3>
                        <p className="venue-location">📍 {venue.location}</p>
                        <button
                          className="btn-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteDialog('venue', venue.id);
                          }}
                          data-testid={`delete-venue-${venue.id}`}
                        >
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
                              <button className="btn-danger" onClick={() => openDeleteDialog('ground', ground.id)} data-testid={`delete-ground-${ground.id}`}>
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

            {viewMode === 'venue-details' && selectedVenue && (
              <div className="details-view">
                <div className="details-header">
                  <button className="btn-back" onClick={handleBackClick}>← Back to Venues</button>
                  <h2>{selectedVenue.name}</h2>
                </div>

                <div className="venue-details-card">
                  <img src={selectedVenue.image_url} alt={selectedVenue.name} className="details-image" />
                  <div className="venue-details-info">
                    <p><strong>Location:</strong> {selectedVenue.location}</p>
                    <p><strong>Venue ID:</strong> {selectedVenue.id}</p>
                  </div>
                </div>

                <h3 style={{ marginTop: '30px', marginBottom: '20px', color: '#fff' }}>Grounds in this Venue</h3>
                <div className="grounds-list">
                  {grounds.filter(g => g.venue_id === selectedVenue.id).length > 0 ? (
                    grounds.filter(g => g.venue_id === selectedVenue.id).map((ground) => (
                      <div
                        key={ground.id}
                        className="ground-item clickable"
                        onClick={() => handleGroundClick(ground)}
                        data-testid={`ground-detail-${ground.id}`}
                      >
                        <div className="ground-info">
                          <h4>{ground.name}</h4>
                          <p className="ground-id">ID: {ground.id}</p>
                        </div>
                        <button
                          className="btn-view-slots"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGroundClick(ground);
                          }}
                        >
                          View Slots →
                        </button>
                        <button
                          className="btn-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteDialog('ground', ground.id);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="no-data">No grounds in this venue yet. Create one to get started!</p>
                  )}
                </div>
              </div>
            )}

            {viewMode === 'ground-details' && selectedGround && selectedVenue && (
              <div className="details-view">
                <div className="details-header">
                  <button className="btn-back" onClick={handleBackClick}>← Back to Grounds</button>
                  <h2>{selectedVenue.name} / {selectedGround.name}</h2>
                </div>

                <div className="slots-stats">
                  <div className="stat-card">
                    <h4>Total Slots</h4>
                    <p className="stat-number">{slots.length}</p>
                  </div>
                  <div className="stat-card booked">
                    <h4>Booked Slots</h4>
                    <p className="stat-number">{slots.filter(s => s.is_booked).length}</p>
                  </div>
                  <div className="stat-card available">
                    <h4>Available Slots</h4>
                    <p className="stat-number">{slots.filter(s => !s.is_booked).length}</p>
                  </div>
                </div>

                <h3 style={{ marginTop: '30px', marginBottom: '20px', color: '#fff' }}>Slots Details</h3>
                <div className="slots-table-wrapper">
                  {slots.length > 0 ? (
                    <div className="analytics-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Price</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {slots.map((slot) => (
                            <tr key={slot.id} className={slot.is_booked ? 'booked-slot' : 'available-slot'}>
                              <td>{slot.slot_date}</td>
                              <td>{slot.start_time} - {slot.end_time}</td>
                              <td>₹{slot.price}</td>
                              <td>
                                <span className={`status-badge ${slot.is_booked ? 'status-booked' : 'status-available'}`}>
                                  {slot.is_booked ? '✓ Booked' : '○ Available'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="no-data">No slots created for this ground yet.</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Venue Modal */}
        {showVenueModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Create New Venue</h2>
                <button className="btn-close" onClick={() => {
                  setShowVenueModal(false);
                  setVenueForm({
                    name: '',
                    location: '',
                    city: '',
                    state: '',
                    country: '',
                    pincode: '',
                    latitude: null,
                    longitude: null,
                    image_url: '',
                    imageFile: null
                  });
                  setImagePreview(null);
                  setImageUploadMode('url');
                  setLocationMode('manual');
                }}>&times;</button>
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

                {/* Location Input Mode Tabs */}
                <div className="form-group">
                  <label>Location</label>
                  <div className="location-mode-tabs">
                    <button
                      type="button"
                      className={`tab-button ${locationMode === 'gps' ? 'active' : ''}`}
                      onClick={() => setLocationMode('gps')}
                      data-testid="gps-location-tab"
                    >
                      📍 Use GPS
                    </button>
                    <button
                      type="button"
                      className={`tab-button ${locationMode === 'pincode' ? 'active' : ''}`}
                      onClick={() => setLocationMode('pincode')}
                      data-testid="pincode-location-tab"
                    >
                      🔍 Search by Pincode
                    </button>
                  </div>

                  {locationMode === 'gps' ? (
                    <div className="location-input-group">
                      <button
                        type="button"
                        className="btn-gps"
                        onClick={handleGetGPSLocation}
                        disabled={geoLoading}
                        data-testid="get-gps-btn"
                      >
                        {geoLoading ? 'Getting Location...' : '📍 Get My Location'}
                      </button>
                    </div>
                  ) : (
                    <div className="location-input-group">
                      <input
                        type="text"
                        placeholder="Enter 6-digit pincode"
                        maxLength="6"
                        inputMode="numeric"
                        value={venueForm.pincode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          setVenueForm({ ...venueForm, pincode: value });
                          if (value.length === 6) {
                            handlePincodeSearch(value);
                          }
                        }}
                        data-testid="venue-pincode-input"
                      />
                      {pincodeLoading && <span className="loading-text">Searching...</span>}
                    </div>
                  )}

                  {/* Display Address Details */}
                  {(venueForm.city || venueForm.state || venueForm.country) && (
                    <div className="address-details-box">
                      <div className="address-row">
                        <span className="address-label">City:</span>
                        <span className="address-value">{venueForm.city || 'N/A'}</span>
                      </div>
                      <div className="address-row">
                        <span className="address-label">State:</span>
                        <span className="address-value">{venueForm.state || 'N/A'}</span>
                      </div>
                      <div className="address-row">
                        <span className="address-label">Country:</span>
                        <span className="address-value">{venueForm.country || 'N/A'}</span>
                      </div>
                      {venueForm.pincode && (
                        <div className="address-row">
                          <span className="address-label">Pincode:</span>
                          <span className="address-value">{venueForm.pincode}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <input
                    type="text"
                    value={venueForm.location}
                    onChange={(e) => setVenueForm({ ...venueForm, location: e.target.value })}
                    placeholder="Full location address"
                    required
                    data-testid="venue-location-input"
                    style={{ marginTop: '10px' }}
                  />
                </div>

                {/* Image Upload Section */}
                <div className="form-group">
                  <label>Upload Image</label>
                  <div className="image-upload-tabs">
                    <button
                      type="button"
                      className={`tab-button ${imageUploadMode === 'url' ? 'active' : ''}`}
                      onClick={() => setImageUploadMode('url')}
                      data-testid="url-upload-tab"
                    >
                      URL
                    </button>
                    <button
                      type="button"
                      className={`tab-button ${imageUploadMode === 'file' ? 'active' : ''}`}
                      onClick={() => setImageUploadMode('file')}
                      data-testid="file-upload-tab"
                    >
                      Upload File
                    </button>
                  </div>

                  {imageUploadMode === 'url' ? (
                    <div className="image-url-input">
                      <input
                        type="url"
                        value={venueForm.image_url}
                        onChange={(e) => handleImageUrlChange(e.target.value)}
                        placeholder="Enter image URL"
                        required={!venueForm.imageFile}
                        data-testid="venue-image-url-input"
                      />
                    </div>
                  ) : (
                    <div
                      className="image-upload-area"
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      data-testid="image-drag-drop-area"
                    >
                      <div className="upload-content">
                        <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2v20M2 12h20"></path>
                        </svg>
                        <p className="upload-text">Drag and drop your image here</p>
                        <p className="upload-subtext">or</p>
                        <label htmlFor="image-file-input" className="upload-link">
                          click to select a file
                        </label>
                        <input
                          id="image-file-input"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e.target.files?.[0])}
                          style={{ display: 'none' }}
                          data-testid="venue-image-file-input"
                        />
                        <p className="upload-info">JPG, PNG or GIF (max 5MB)</p>
                      </div>
                    </div>
                  )}

                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="image-preview-container">
                      <img src={imagePreview} alt="Preview" className="image-preview" data-testid="image-preview" />
                      <button
                        type="button"
                        className="btn-remove-image"
                        onClick={() => {
                          setImagePreview(null);
                          setVenueForm({ ...venueForm, image_url: '', imageFile: null });
                        }}
                        data-testid="remove-image-btn"
                      >
                        Remove Image
                      </button>
                    </div>
                  )}
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

                {viewMode === 'venue-details' && selectedVenue ? (
                  <div className="form-group">
                    <label>Venue</label>
                    <div className="venue-display-box">
                      <strong>{selectedVenue.name}</strong>
                      <p className="venue-location">{selectedVenue.location}</p>
                    </div>
                  </div>
                ) : (
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
                )}

                <button type="submit" className="btn-primary" data-testid="submit-ground-btn">Create Ground</button>
              </form>
            </div>
          </div>
        )}

        {/* Slot Modal */}
        {showSlotModal && (
          <div className="modal-overlay">
            <div className="modal-content slot-modal-content">
              <div className="modal-header">
                <h2>Create Slots</h2>
                <button className="btn-close" onClick={() => {
                  setShowSlotModal(false);
                  setGeneratedSlots([]);
                  setSlotConfig({
                    ground_id: '',
                    slot_date: new Date().toISOString().split('T')[0],
                    start_time: '06:00',
                    end_time: '22:00',
                    duration: 60,
                    price_per_slot: 1000
                  });
                }}>&times;</button>
              </div>

              {generatedSlots.length === 0 ? (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  generateSlots();
                }}>
                  {viewMode === 'ground-details' && selectedGround ? (
                    <div className="form-group">
                      <label>Ground</label>
                      <div className="ground-display-box">
                        <strong>{selectedGround.name}</strong>
                        <p className="ground-venue">
                          Venue: {selectedVenue?.name}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="form-group">
                      <label>Select Ground</label>
                      <select
                        value={slotConfig.ground_id}
                        onChange={(e) => setSlotConfig({ ...slotConfig, ground_id: e.target.value })}
                        required
                        data-testid="slot-ground-select"
                      >
                        <option value="">Select a ground</option>
                        {(() => {
                          // Filter grounds based on current view
                          const filteredGrounds = viewMode === 'venue-details' && selectedVenue
                            ? grounds.filter(g => g.venue_id === selectedVenue.id)
                            : grounds;

                          return filteredGrounds.map((ground) => {
                            const venue = venues.find(v => v.id === ground.venue_id);
                            return (
                              <option key={ground.id} value={ground.id}>
                                {venue?.name} - {ground.name}
                              </option>
                            );
                          });
                        })()}
                      </select>
                    </div>
                  )}


                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      value={slotConfig.slot_date}
                      onChange={(e) => setSlotConfig({ ...slotConfig, slot_date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      required
                      data-testid="slot-date-input"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Schedule Start Time</label>
                      <input
                        type="time"
                        value={slotConfig.start_time}
                        onChange={(e) => setSlotConfig({ ...slotConfig, start_time: e.target.value })}
                        required
                        data-testid="slot-start-time-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Schedule End Time</label>
                      <input
                        type="time"
                        value={slotConfig.end_time}
                        onChange={(e) => setSlotConfig({ ...slotConfig, end_time: e.target.value })}
                        required
                        data-testid="slot-end-time-input"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Duration (minutes)</label>
                      <input
                        type="number"
                        value={slotConfig.duration}
                        onChange={(e) => setSlotConfig({ ...slotConfig, duration: e.target.value })}
                        required
                        min="15"
                        step="15"
                        data-testid="slot-duration-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Price per Slot (₹)</label>
                      <input
                        type="number"
                        value={slotConfig.price_per_slot}
                        onChange={(e) => setSlotConfig({ ...slotConfig, price_per_slot: parseInt(e.target.value) })}
                        required
                        min="0"
                        data-testid="slot-price-input"
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-primary generate-btn" data-testid="generate-slots-btn">
                    Generate Slots
                  </button>
                </form>
              ) : (
                <div className="slots-review">
                  <div className="slots-info">
                    <h3>Generated Slots: {generatedSlots.length}</h3>
                    <p className="slot-details">
                      Date: {slotConfig.slot_date} | Duration: {slotConfig.duration} min | Price: ₹{slotConfig.price_per_slot}
                    </p>
                  </div>

                  <div className="slots-list">
                    {generatedSlots.map((slot) => (
                      <div key={slot.id} className="slot-item">
                        <div className="slot-time">
                          <span className="slot-number">#{slot.id}</span>
                          <span className="time-range">{slot.start_time} - {slot.end_time}</span>
                        </div>
                        <button
                          type="button"
                          className="btn-remove"
                          onClick={() => removeSlot(slot.id)}
                          data-testid={`remove-slot-${slot.id}`}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="modal-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setGeneratedSlots([]);
                      }}
                      data-testid="back-to-config-btn"
                    >
                      Back to Config
                    </button>
                    <button
                      type="button"
                      className="btn-primary confirm-btn"
                      onClick={confirmAllSlots}
                      data-testid="confirm-slots-btn"
                    >
                      Confirm & Create Slots
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={confirmDelete}
        title={confirmDialog.type === 'venue' ? 'Delete Venue' : 'Delete Ground'}
        message={confirmDialog.type === 'venue'
          ? 'Are you sure you want to delete this venue? All associated grounds and slots will also be deleted.'
          : 'Are you sure you want to delete this ground? All associated slots will also be deleted.'}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        confirmVariant="danger"
      />
    </div>
  );
};

export default ManageVenues;
