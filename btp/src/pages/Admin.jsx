import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function Admin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/submissions/admin')
      .then(setSubmissions)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const downloadFile = async (id, type) => {
    try {
      const data = await api.get(`/submissions/admin/${id}/file/${type}`);
      window.open(data.url, '_blank');
    } catch (err) {
      alert(err.message || 'Download failed');
    }
  };

  const formatResults = (results) => {
    if (!results || typeof results !== 'object') return '—';
    const labels = { rmsd: 'RMSD', hbond: 'H-Bond', ionic: 'Ionic', xyz: 'XYZ' };
    const cols = { pp: 'P-P', ll: 'L-L', pl: 'P-L' };
    const parts = [];
    for (const [key, label] of Object.entries(labels)) {
      const row = results[key];
      if (!row || typeof row !== 'object') continue;
      const selected = Object.entries(row)
        .filter(([, v]) => v)
        .map(([c]) => cols[c] || c);
      if (selected.length) parts.push(`${label}: ${selected.join(', ')}`);
    }
    return parts.length ? parts.join('; ') : '—';
  };

  return (
    <Layout
      user={user}
      onLogout={() => {
        logout();
        navigate('/login');
      }}
    >
      <section className="form-section">
        <h2 className="section-title">Admin Portal – User Submissions</h2>
        {loading && <p style={{ color: 'var(--text-muted)' }}>Loading...</p>}
        {error && <p style={{ color: '#ff6b6b' }}>{error}</p>}
        {!loading && !error && submissions.length === 0 && (
          <p style={{ color: 'var(--text-muted)' }}>No submissions yet.</p>
        )}
        {!loading && !error && submissions.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>User</th>
                  <th>Protein</th>
                  <th>Ligand</th>
                  <th>Experiments (P-P, L-L, P-L)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr key={s._id}>
                    <td>
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      {s.user?.email || '—'}
                    </td>
                    <td>{s.proteinName}</td>
                    <td>{s.ligandName}</td>
                    <td style={{ fontSize: '0.8rem', maxWidth: 220 }}>
                      {formatResults(s.results)}
                    </td>
                    <td>
                      <div className="actions">
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => downloadFile(s._id, 'protein')}
                        >
                          Protein .pdb
                        </button>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => downloadFile(s._id, 'ligand')}
                        >
                          Ligand .pdb
                        </button>
                      </div>
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
