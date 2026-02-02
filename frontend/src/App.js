import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Toaster } from 'sonner';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import MobileSidebar from './components/MobileSidebar';
import PlayerDashboard from './components/player/PlayerDashboard';
import VenueDetails from './components/player/VenueDetails';
import MyBookings from './components/player/MyBookings';
import Profile from './components/player/Profile';
import OwnerDashboard from './components/owner/OwnerDashboard';
import OwnerAnalytics from './components/owner/OwnerAnalytics';
import ManageVenues from './components/owner/ManageVenues';
import VerifyBooking from './components/owner/VerifyBooking';
import './App.css';

// Determine backend URL at runtime based on current hostname
// If accessed via Docker network IP (e.g., 172.19.0.x), use app-backend service name
// If accessed via localhost, use localhost
const getBackendUrl = () => {
  const hostname = window.location.hostname;

  // Docker network IPs start with 172.
  if (hostname.startsWith('172.')) {
    return 'http://app-backend:8000';
  }

  // If localhost or 127.0.0.1, use localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000';
  }

  // Default: try to use current hostname
  return `http://${hostname}:8000`;
};

const BACKEND_URL = getBackendUrl();
const API = `${BACKEND_URL}/api`;

export const AuthContext = React.createContext();

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(response => {
          setUser(response.data);
          setLoading(false);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setToken(token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, API }}>
      <Toaster position="top-right" richColors closeButton />
      <BrowserRouter>
        {user && <MobileSidebar />}
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to={user.role === 'owner' ? '/owner' : '/explore'} />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to={user.role === 'owner' ? '/owner' : '/explore'} />} />
          <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to={user.role === 'owner' ? '/owner' : '/explore'} />} />

          {/* Player Routes */}
          <Route path="/explore" element={user && user.role === 'player' ? <PlayerDashboard /> : <Navigate to="/login" />} />
          <Route path="/venue/:venueId" element={user && user.role === 'player' ? <VenueDetails /> : <Navigate to="/login" />} />
          <Route path="/my-bookings" element={user && user.role === 'player' ? <MyBookings /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />

          {/* Owner Routes */}
          <Route path="/owner" element={user && user.role === 'owner' ? <OwnerDashboard /> : <Navigate to="/login" />} />
          <Route path="/owner/analytics" element={user && user.role === 'owner' ? <OwnerAnalytics /> : <Navigate to="/login" />} />
          <Route path="/owner/manage" element={user && user.role === 'owner' ? <ManageVenues /> : <Navigate to="/login" />} />
          <Route path="/owner/verify-booking" element={user && user.role === 'owner' ? <VerifyBooking /> : <Navigate to="/login" />} />

          <Route path="/" element={<Navigate to={user ? (user.role === 'owner' ? '/owner' : '/explore') : '/login'} />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
