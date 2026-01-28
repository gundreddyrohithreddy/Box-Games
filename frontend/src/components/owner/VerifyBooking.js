import React, { useState, useContext } from 'react';
import { AuthContext } from '../../App';
import axios from 'axios';

const VerifyBooking = () => {
  const { API } = useContext(AuthContext);
  const [verificationCode, setVerificationCode] = useState('');
  const [bookingDetails, setBookingDetails] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setBookingDetails(null);

    try {
      const response = await axios.post(`${API}/bookings/verify-code`, {
        verification_code: verificationCode.trim()
      });
      setBookingDetails(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmVerification = async () => {
    if (!bookingDetails) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API}/bookings/confirm-verification`, {
        verification_code: verificationCode.trim()
      });
      setVerified(true);
      alert(`✓ ${response.data.message}`);
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setVerificationCode('');
        setBookingDetails(null);
        setVerified(false);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to verify booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px' }}>
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginBottom: '10px', color: '#1f2937' }}>Verify Booking</h2>
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>
          Enter the 6-digit code provided by the player
        </p>

        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            borderRadius: '4px',
            marginBottom: '15px',
            border: '1px solid #fecaca'
          }}>
            {error}
          </div>
        )}

        {verified && (
          <div style={{
            padding: '12px',
            backgroundColor: '#dcfce7',
            color: '#166534',
            borderRadius: '4px',
            marginBottom: '15px',
            border: '1px solid #bbf7d0'
          }}>
            ✓ Booking verified successfully!
          </div>
        )}

        {!bookingDetails ? (
          <form onSubmit={handleVerifyCode}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#374151' }}>
                Verification Code (6 digits)
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.slice(0, 6))}
                placeholder="000000"
                maxLength="6"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '20px',
                  letterSpacing: '4px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '4px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontFamily: 'monospace'
                }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || verificationCode.length !== 6}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: verificationCode.length === 6 ? '#3b82f6' : '#d1d5db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: verificationCode.length === 6 ? 'pointer' : 'not-allowed',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
        ) : (
          <div>
            {/* Player Info */}
            <div style={{
              backgroundColor: '#e0e7ff',
              padding: '15px',
              borderRadius: '6px',
              marginBottom: '20px',
              border: '2px solid #818cf8'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#3730a3' }}>Player Information</h3>
              <p style={{ margin: '5px 0' }}><strong>Name:</strong> {bookingDetails.player_name}</p>
              <p style={{ margin: '5px 0' }}><strong>Email:</strong> {bookingDetails.player_email}</p>
              <p style={{ margin: '5px 0' }}><strong>Mobile:</strong> {bookingDetails.mobile_number}</p>
            </div>

            {/* Booking Details */}
            <div style={{
              backgroundColor: '#f3f4f6',
              padding: '15px',
              marginBottom: '20px',
              borderLeft: '4px solid #059669',
              borderRadius: '4px'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#1f2937' }}>Booking Details</h3>
              <p style={{ margin: '8px 0', fontWeight: '600' }}>
                {bookingDetails.venue_name} → {bookingDetails.ground_name}
              </p>
              <p style={{ margin: '8px 0', color: '#6b7280' }}>
                📅 {bookingDetails.booking_date}
              </p>
              <p style={{ margin: '8px 0', color: '#6b7280' }}>
                🕐 {bookingDetails.booking_time}
              </p>
              <p style={{ margin: '8px 0', color: '#6b7280' }}>
                Status: <span style={{ 
                  padding: '2px 8px', 
                  backgroundColor: bookingDetails.status === 'verified' ? '#dcfce7' : '#fef3c7',
                  color: bookingDetails.status === 'verified' ? '#166534' : '#92400e',
                  borderRadius: '3px',
                  fontWeight: 'bold'
                }}>
                  {bookingDetails.status.toUpperCase()}
                </span>
              </p>
            </div>

            {/* Amount */}
            <div style={{
              backgroundColor: '#fef3c7',
              padding: '15px',
              borderRadius: '6px',
              marginBottom: '20px',
              border: '2px solid #fcd34d',
              textAlign: 'center'
            }}>
              <p style={{ margin: '0 0 10px 0', color: '#78350f', fontSize: '14px' }}>Amount</p>
              <p style={{ margin: '0', color: '#b45309', fontSize: '32px', fontWeight: 'bold' }}>
                ₹{bookingDetails.booking_price}
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  setBookingDetails(null);
                  setVerificationCode('');
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#e5e7eb',
                  color: '#1f2937',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmVerification}
                disabled={loading || bookingDetails.status === 'verified'}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: bookingDetails.status === 'verified' ? '#d1d5db' : '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: bookingDetails.status === 'verified' ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                {loading ? 'Confirming...' : bookingDetails.status === 'verified' ? '✓ Already Verified' : '✓ Confirm Verification'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyBooking;
