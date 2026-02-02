import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';

// Helper function to extract error message
const getErrorMessage = (error) => {
  if (typeof error === 'string') return error;

  // Check for detail field first
  if (error?.response?.data?.detail) {
    const detail = error.response.data.detail;
    if (typeof detail === 'string') {
      // Split multiple errors by " | " and clean up
      return detail.split(' | ').filter(msg => msg.trim()).join('\n');
    }
    if (Array.isArray(detail)) {
      return detail.map(err => {
        if (typeof err === 'string') return err;
        return err.msg || err.message || 'Validation error';
      }).join('\n');
    }
  }

  // Check for validation errors array (Pydantic v2)
  if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
    return error.response.data.errors.map(err => {
      if (typeof err === 'string') return err;
      const field = err.loc ? err.loc[err.loc.length - 1] : 'field';
      const msg = err.msg || err.message || 'Invalid';
      return `${field}: ${msg}`;
    }).join('\n');
  }

  // Fallback error message
  if (error?.response?.status === 422) {
    return 'Invalid input. Please check your credentials.';
  }

  return error?.message || 'An error occurred. Please try again.';
};

const Login = () => {
  const { login, API } = useContext(AuthContext);
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    identifier: '', // email or username
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, {
        identifier: credentials.identifier,
        password: credentials.password
      });
      login(response.data.access_token, response.data.user);

      if (response.data.user.role === 'owner') {
        navigate('/owner');
      } else {
        navigate('/explore');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>BoxGames</h1>
          <p>Book your sports ground in seconds</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email or Username</label>
            <input
              type="text"
              value={credentials.identifier}
              onChange={(e) => setCredentials({ ...credentials, identifier: e.target.value })}
              placeholder="Enter your email or username"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              required
            />
          </div>

          <div className="forgot-password-link-container">
            <Link to="/forgot-password" className="forgot-password-link">
              Forgot Password?
            </Link>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
