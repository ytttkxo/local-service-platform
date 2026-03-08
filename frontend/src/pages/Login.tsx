import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { post, setToken } from '../api/client';
import { useAuth } from '../context/AuthContext';
import styles from './Login.module.css';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const sendCode = async () => {
    if (!phone || phone.length < 6) {
      setError('Please enter a valid phone number');
      return;
    }
    setError('');
    const res = await post('/user/code?phone=' + encodeURIComponent(phone));
    if (res.success) {
      setCodeSent(true);
      setCountdown(60);
    } else {
      setError(res.errorMsg || 'Failed to send code');
    }
  };

  const handleLogin = async () => {
    if (!code) {
      setError('Please enter the verification code');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await post<string>('/user/login', { phone, code });
      if (res.success && res.data) {
        setToken(res.data);
        login(res.data);
      } else {
        setError(res.errorMsg || 'Login failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <div className={styles.brandOverlay}>
          <h1 className={styles.brandTitle}>Locale</h1>
          <p className={styles.brandSub}>
            Discover the best dining spots around you
          </p>
        </div>
      </div>
      <div className={styles.right}>
        <div className={styles.form}>
          <h2 className={styles.title}>Welcome back</h2>
          <p className={styles.subtitle}>
            Sign in with your phone number to continue
          </p>

          <div className={styles.field}>
            <label className={styles.label}>Phone number</label>
            <input
              className={styles.input}
              type="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Verification code</label>
            <div className={styles.codeRow}>
              <input
                className={styles.input}
                type="text"
                placeholder="6-digit code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
              <button
                className={styles.codeBtn}
                onClick={sendCode}
                disabled={countdown > 0}
              >
                {countdown > 0 ? `${countdown}s` : codeSent ? 'Resend' : 'Send code'}
              </button>
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            className={styles.submitBtn}
            onClick={handleLogin}
            disabled={submitting}
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>

          <p className={styles.hint}>
            A verification code will be sent to your phone via SMS.
            <br />
            New users will be registered automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
