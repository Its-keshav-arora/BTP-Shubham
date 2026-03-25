import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, uploadReturnedResult } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const METRIC_LABELS = {
  rmsd: 'RMSD',
  hbond: 'H-Bond',
  ionic: 'Binding Energy',
  Rg: 'Radius of Gyration',
  rmsf: 'RMSF',
  sasa: 'SASA',
};
const INTERACTION_SHORT = { pp: 'P–P', ll: 'L–L', pl: 'P–L' };

function buildResultRows(results) {
  if (!results || typeof results !== 'object') return [];
  const rows = [];
  for (const [key, label] of Object.entries(METRIC_LABELS)) {
    const row = results[key];
    if (!row || typeof row !== 'object') continue;
    const tags = Object.entries(row)
      .filter(([, v]) => v)
      .map(([c]) => INTERACTION_SHORT[c] || c);
    if (tags.length) rows.push({ key, label, tags });
  }
  return rows;
}

function RequestedResults({ results }) {
  const rows = buildResultRows(results);
  if (!rows.length) {
    return <span className="admin-results-empty">—</span>;
  }
  return (
    <ul className="admin-results">
      {rows.map(({ key, label, tags }) => (
        <li key={key} className="admin-results__row">
          <span className="admin-results__metric">{label}</span>
          <span className="admin-results__tags">
            {tags.map((t, i) => (
              <span key={`${key}-${i}`} className="admin-results__tag">
                {t}
              </span>
            ))}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ReturnResultCell({ submissionId, hasReturned, onDone }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const f = inputRef.current?.files?.[0];
    if (!f) {
      alert('Choose a results file to send to the user');
      return;
    }
    const fd = new FormData();
    fd.append('returnedFile', f);
    setBusy(true);
    try {
      await uploadReturnedResult(submissionId, fd);
      if (inputRef.current) inputRef.current.value = '';
      onDone();
    } catch (e) {
      alert(e.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-return">
      <input
        ref={inputRef}
        type="file"
        className="admin-return__input"
        aria-label="Select file to return to user"
      />
      <button
        type="button"
        className="secondary-button admin-return__btn"
        onClick={submit}
        disabled={busy}
      >
        {busy ? 'Uploading…' : hasReturned ? 'Replace results' : 'Send to user'}
      </button>
    </div>
  );
}

export default function Admin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSubmissions = useCallback((showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    api
      .get('/submissions/admin')
      .then(setSubmissions)
      .catch((err) => setError(err.message))
      .finally(() => {
        if (showLoading) setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadSubmissions(true);
  }, [loadSubmissions]);

  const downloadFile = async (id, type) => {
    try {
      const data = await api.get(`/submissions/admin/${id}/file/${type}`);
      window.open(data.url, '_blank');
    } catch (err) {
      alert(err.message || 'Download failed');
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
                  <th>Protein name</th>
                  <th>Ligand name</th>
                  <th>Protein file (.pdb)</th>
                  <th>Ligand file (.pdb)</th>
                  <th>Requested results</th>
                  <th>Result status</th>
                  <th>Return to user</th>
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
                    <td style={{ fontSize: '0.85rem', maxWidth: 160 }}>
                      {s.proteinFile?.filename || '—'}
                    </td>
                    <td style={{ fontSize: '0.85rem', maxWidth: 160 }}>
                      {s.ligandFile?.filename || '—'}
                    </td>
                    <td className="admin-table__results-cell">
                      <RequestedResults results={s.results} />
                    </td>
                    <td>
                      {s.returnedAt ? (
                        <span className="admin-status admin-status--done">
                          Returned
                          <span className="admin-status__date">
                            {new Date(s.returnedAt).toLocaleString()}
                          </span>
                        </span>
                      ) : (
                        <span className="admin-status admin-status--pending">Pending</span>
                      )}
                    </td>
                    <td className="admin-table__return-cell">
                      <ReturnResultCell
                        submissionId={s._id}
                        hasReturned={Boolean(s.returnedAt)}
                        onDone={() => loadSubmissions(false)}
                      />
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
