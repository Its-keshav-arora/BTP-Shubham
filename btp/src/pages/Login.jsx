import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRegister = searchParams.get('register') === '1';
  const [name, setName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const body = isRegister ? { email, password, name } : { email, password };
      const data = await api.post(endpoint, body);
      login(data.token, data.user);
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="top-bar">
        <div className="top-bar-left">
          <img src="/images (1).png" alt="IIT Ropar" className="logo-img" />
          <span className="institute-name">Indian Institute of Technology Ropar</span>
        </div>
      </header>
      <main className="content">
        <div className="auth-card">
          <h2>{isRegister ? 'Create Account' : 'Sign In'}</h2>
          <form className="input-form" onSubmit={handleSubmit}>
            {isRegister && (
              <div className="field">
                <label className="field-label">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
            )}
            <div className="field">
              <label className="field-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
            <div className="field">
              <label className="field-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            {error && <p style={{ color: '#ff6b6b', fontSize: '0.85rem' }}>{error}</p>}
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Please wait...' : isRegister ? 'Register' : 'Login'}
            </button>
          </form>
          <p className="auth-switch">
            {isRegister ? (
              <>
                Already have an account? <Link to="/login">Sign in</Link>
              </>
            ) : (
              <>
                Don't have an account? <Link to="/login?register=1">Register</Link>
              </>
            )}
          </p>
        </div>
      </main>
      <footer className="page-footer">
        <div className="footer-item">Helpline No.: +91-XXXXXXXXXX</div>
        <div className="footer-item">E-mail: example@iitrpr.ac.in</div>
      </footer>
    </div>
  );
}
