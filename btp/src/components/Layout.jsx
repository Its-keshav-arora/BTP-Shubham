import { Link } from 'react-router-dom';

export default function Layout({ children, user, onLogout }) {
  return (
    <div className="page">
      <header className="top-bar">
        <div className="top-bar-left">
          <img src="/images (1).png" alt="IIT Ropar" className="logo-img" />
          <span className="institute-name">Indian Institute of Technology Ropar</span>
        </div>
        <nav className="nav-links">
          {user?.role === 'admin' && (
            <Link to="/admin" className="nav-link">Admin</Link>
          )}
          {user?.role === 'user' && (
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
          )}
          <span className="nav-link" style={{ opacity: 0.8 }}>
            {user?.email}
          </span>
          <button type="button" className="secondary-button" onClick={onLogout}>
            Logout
          </button>
        </nav>
      </header>
      <main className="content">{children}</main>
      <footer className="page-footer">
        <div className="footer-item">Helpline No.: +91-XXXXXXXXXX</div>
        <div className="footer-item">E-mail: example@iitrpr.ac.in</div>
      </footer>
    </div>
  );
}
