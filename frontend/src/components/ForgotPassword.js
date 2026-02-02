import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { AuthContext } from '../App';

const ForgotPassword = () => {
    const { API } = useContext(AuthContext);
    const [step, setStep] = useState(1); // 1: email, 2: verification, 3: new password
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSendCode = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await axios.post(`${API}/auth/forgot-password`, { email });
            toast.success('Verification code sent to your email!');
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to send verification code');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await axios.post(`${API}/auth/verify-reset-code`, {
                email,
                verification_code: verificationCode
            });
            toast.success('Code verified! Set your new password.');
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid verification code');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);

        try {
            await axios.post(`${API}/auth/reset-password`, {
                email,
                verification_code: verificationCode,
                new_password: newPassword
            });
            toast.success('Password reset successfully! You can now login.');
            // Redirect to login after success
            window.location.href = '/login';
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-logo">
                    <h1>BoxGames</h1>
                    <p>Reset Your Password</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                {/* Step 1: Enter Email */}
                {step === 1 && (
                    <form onSubmit={handleSendCode}>
                        <div className="step-indicator">
                            <span className="step active">1</span>
                            <span className="step-line"></span>
                            <span className="step">2</span>
                            <span className="step-line"></span>
                            <span className="step">3</span>
                        </div>
                        <p className="step-description">Enter your email address to receive a verification code</p>

                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                            />
                        </div>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Sending...' : 'Send Verification Code'}
                        </button>
                    </form>
                )}

                {/* Step 2: Enter Verification Code */}
                {step === 2 && (
                    <form onSubmit={handleVerifyCode}>
                        <div className="step-indicator">
                            <span className="step completed">✓</span>
                            <span className="step-line completed"></span>
                            <span className="step active">2</span>
                            <span className="step-line"></span>
                            <span className="step">3</span>
                        </div>
                        <p className="step-description">Enter the verification code sent to {email}</p>

                        <div className="form-group">
                            <label htmlFor="code">Verification Code</label>
                            <input
                                type="text"
                                id="code"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                placeholder="Enter 6-digit code"
                                required
                            />
                        </div>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify Code'}
                        </button>
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setStep(1)}
                            style={{ marginTop: '10px', width: '100%' }}
                        >
                            Back to Email
                        </button>
                    </form>
                )}

                {/* Step 3: Set New Password */}
                {step === 3 && (
                    <form onSubmit={handleResetPassword}>
                        <div className="step-indicator">
                            <span className="step completed">✓</span>
                            <span className="step-line completed"></span>
                            <span className="step completed">✓</span>
                            <span className="step-line completed"></span>
                            <span className="step active">3</span>
                        </div>
                        <p className="step-description">Create your new password</p>

                        <div className="form-group">
                            <label htmlFor="newPassword">New Password</label>
                            <input
                                type="password"
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                required
                                minLength={8}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                required
                            />
                        </div>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}

                <div className="auth-footer">
                    <p>Remember your password? <Link to="/login">Login</Link></p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
