import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function Results() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .get('/submissions/my')
      .then(setSubmissions)
      .catch((err) => setError(err.message || 'Could not load submissions'))
      .finally(() => setLoading(false));
  }, []);

  const downloadReturned = async (id) => {
    try {
      const data = await api.get(`/submissions/${id}/returned-file`);
      window.open(data.url, '_blank');
    } catch (err) {
      setError(err.message || 'Could not open results');
    }
  };

  return (
    <Layout
      user={user}
      onLogout={() => {
        logout();
        navigate('/login');
      }}
    >
      <section className="form-section user-submissions-section">
        <h2 className="section-title">Results</h2>
        <p className="user-submissions__hint">
          Your requests to the lab and any files returned by the admin. When results are ready, use
          Download to open them.
        </p>
        {loading && (
          <p style={{ color: 'var(--text-muted)' }}>Loading your submissions…</p>
        )}
        {error && !loading && (
          <p style={{ color: '#ff6b6b' }}>{error}</p>
        )}
        {!loading && !error && submissions.length === 0 && (
          <p style={{ color: 'var(--text-muted)' }}>No submissions yet. Submit a request from the dashboard.</p>
        )}
        {!loading && submissions.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="user-submissions-table">
              <thead>
                <tr>
                  <th>Submitted</th>
                  <th>Protein</th>
                  <th>Ligand</th>
                  <th>Status</th>
                  <th>Your results</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr key={s._id}>
                    <td>{new Date(s.createdAt).toLocaleString()}</td>
                    <td>{s.proteinName}</td>
                    <td>{s.ligandName}</td>
                    <td>
                      {s.returnedAt ? (
                        <span className="user-sub-status user-sub-status--ready">Ready</span>
                      ) : (
                        <span className="user-sub-status user-sub-status--wait">Awaiting results</span>
                      )}
                    </td>
                    <td>
                      {s.returnedAt && s.returnedFile?.url ? (
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => downloadReturned(s._id)}
                        >
                          Download ({s.returnedFile.filename || 'file'})
                        </button>
                      ) : (
                        <span className="user-submissions__dash">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Layout>
  );
}
