import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
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
    return 'Invalid input. Please check all required fields.';
  }

  return error?.message || 'An error occurred. Please try again.';
};

const Register = () => {
  const { login, API } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    mobileNumber: '',
    email: '',
    password: '',
    role: 'player'
  });
  const [passwordValidation, setPasswordValidation] = useState({
    hasUppercase: false,
    hasLowercase: false,
    hasSymbol: false,
    hasNumber: false,
    hasMinLength: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState(null);

  // Validate password on change
  const validatePassword = (pwd) => {
    const validation = {
      hasUppercase: /[A-Z]/.test(pwd),
      hasLowercase: /[a-z]/.test(pwd),
      hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasMinLength: pwd.length >= 8
    };
    setPasswordValidation(validation);
    return Object.values(validation).every(val => val);
  };

  const handlePasswordChange = (e) => {
    const pwd = e.target.value;
    setFormData({ ...formData, password: pwd });
    validatePassword(pwd);
  };

  // Format mobile number with automatic country code
  const handleMobileChange = (e) => {
    let value = e.target.value;

    // Remove all non-digit and non-plus characters
    let cleaned = value.replace(/[^\d+]/g, '');

    // If it doesn't start with +, add default country code +91 (India)
    if (cleaned === '' || !cleaned.startsWith('+')) {
      if (cleaned.length > 0) {
        cleaned = '+91' + cleaned.replace(/^\+91/, '');
      }
    }

    // Limit to reasonable length (country code + 10 digits = 13 chars max)
    if (cleaned.length > 13) {
      cleaned = cleaned.slice(0, 13);
    }

    setFormData({ ...formData, mobileNumber: cleaned });
  };

  const isPasswordValid = Object.values(passwordValidation).every(val => val);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError('Password must meet all requirements');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/register`, formData);
      login(response.data.access_token, response.data.user);

      // Display verification code
      setVerificationCode(response.data.user.verification_code);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // If verification code is displayed, show it
  if (verificationCode) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">
            <h1>BoxGames</h1>
            <p>Account Created Successfully!</p>
          </div>

          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f0f9ff', borderRadius: '8px', marginBottom: '20px' }}>
            <h3 style={{ color: '#1e40af', marginBottom: '10px' }}>Your Verification Code</h3>
            <div style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#dc2626',
              fontFamily: 'monospace',
              letterSpacing: '10px',
              padding: '15px',
              backgroundColor: '#fff',
              borderRadius: '5px',
              border: '2px solid #1e40af'
            }}>
              {verificationCode}
            </div>
            <p style={{ color: '#666', marginTop: '15px', fontSize: '14px' }}>
              Save this code. You'll need it when you book slots and visit the ground for confirmation.
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(verificationCode);
                toast.success('Code copied to clipboard!');
              }}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                backgroundColor: '#1e40af',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              📋 Copy Code
            </button>
          </div>

          <button
            onClick={() => {
              if (formData.role === 'owner') {
                navigate('/owner');
              } else {
                navigate('/explore');
              }
            }}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>BoxGames</h1>
          <p>Create your account</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Mobile Number</label>
            <input
              type="tel"
              value={formData.mobileNumber}
              onChange={handleMobileChange}
              placeholder="Enter mobile number (auto-formats with +91)"
              required
            />
            <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
              Country code will auto-generate. Default: +91 (India). Supports 10+ digit numbers.
            </small>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={handlePasswordChange}
              required
            />
            <div className="password-requirements">
              <p className={passwordValidation.hasUppercase ? 'valid' : ''}>
                ✓ Uppercase letter (A-Z)
              </p>
              <p className={passwordValidation.hasLowercase ? 'valid' : ''}>
                ✓ Lowercase letter (a-z)
              </p>
              <p className={passwordValidation.hasNumber ? 'valid' : ''}>
                ✓ Number (0-9)
              </p>
              <p className={passwordValidation.hasSymbol ? 'valid' : ''}>
                ✓ Symbol (!@#$%^&*...)
              </p>
              <p className={passwordValidation.hasMinLength ? 'valid' : ''}>
                ✓ Minimum 8 characters
              </p>
            </div>
          </div>

          <div className="form-group">
            <label>Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="player">Player</option>
              <option value="owner">Owner</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={loading || !isPasswordValid}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
