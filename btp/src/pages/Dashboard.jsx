import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, uploadSubmission } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import Toast from '../components/Toast';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [proteinName, setProteinName] = useState('');
  const [ligandName, setLigandName] = useState('');
  const [proteinFile, setProteinFile] = useState(null);
  const [ligandFile, setLigandFile] = useState(null);
  const [results, setResults] = useState({
    rmsd: { pp: false, ll: false, pl: false },
    hbond: { pp: false, ll: false, pl: false },
    ionic: { pp: false, ll: false, pl: false },
    xyz: { pp: false, ll: false, pl: false },
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ msg: '', visible: false });
  const proteinRef = useRef(null);
  const ligandRef = useRef(null);

  const showToast = (msg) => {
    setToast({ msg, visible: true });
    setTimeout(() => setToast({ msg: '', visible: false }), 2600);
  };

  const handleResultsChange = (key, col, checked) => {
    setResults((prev) => ({
      ...prev,
      [key]: { ...prev[key], [col]: checked },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!proteinName || !ligandName) {
      showToast('Please fill protein and ligand names');
      return;
    }
    if (!proteinFile || !ligandFile) {
      showToast('Please upload both protein and ligand .pdb files');
      return;
    }
    if (!termsAccepted) {
      showToast('Please agree to the terms and conditions');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('proteinName', proteinName);
      formData.append('ligandName', ligandName);
      formData.append('proteinFile', proteinFile);
      formData.append('ligandFile', ligandFile);
      formData.append('termsAccepted', termsAccepted);
      formData.append(
        'results',
        JSON.stringify({
          rmsd: results.rmsd,
          hbond: results.hbond,
          ionic: results.ionic,
          xyz: results.xyz,
        })
      );
      await uploadSubmission(formData);
      showToast('Request submitted successfully!');
      setProteinName('');
      setLigandName('');
      setProteinFile(null);
      setLigandFile(null);
      setResults({
        rmsd: { pp: false, ll: false, pl: false },
        hbond: { pp: false, ll: false, pl: false },
        ionic: { pp: false, ll: false, pl: false },
        xyz: { pp: false, ll: false, pl: false },
      });
      setTermsAccepted(false);
      if (proteinRef.current) proteinRef.current.value = '';
      if (ligandRef.current) ligandRef.current.value = '';
    } catch (err) {
      showToast(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
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
      <section className="hero-card">
        <div className="hero-text">
          <p className="section-tagline">Real Time Simulation of Protein - Ligand</p>
          <h1 className="hero-title">
            Protein - Ligand
            <br />
            Interactions
          </h1>
        </div>
        <div className="hero-visual">
          <img
            src="/Screenshot 2026-01-16 103921.png"
            alt="Protein-ligand structure"
            className="hero-image"
          />
        </div>
      </section>

      <section className="form-section">
        <h2 className="section-title">Share Your Inputs</h2>

        <form className="input-form" onSubmit={handleSubmit}>
          <div className="field-row">
            <div className="field">
              <label className="field-label">1. Protein Name</label>
              <input
                type="text"
                value={proteinName}
                onChange={(e) => setProteinName(e.target.value)}
                placeholder="Enter protein name"
                required
              />
            </div>
            <div className="field">
              <label className="field-label">2. Ligand Name</label>
              <input
                type="text"
                value={ligandName}
                onChange={(e) => setLigandName(e.target.value)}
                placeholder="Enter ligand name"
                required
              />
            </div>
          </div>

          <div className="field-row" style={{ marginTop: 16 }}>
            <div className="field">
              <label className="field-label">1. Protein File (.pdb)</label>
              <div
                className="file-input-wrap"
                onClick={() => proteinRef.current?.click()}
              >
                <input
                  ref={proteinRef}
                  type="file"
                  accept=".pdb"
                  onChange={(e) => setProteinFile(e.target.files?.[0] || null)}
                />
                <div className="file-input-label">Click to select .pdb file</div>
                {proteinFile && (
                  <div className="file-name">{proteinFile.name}</div>
                )}
              </div>
            </div>
            <div className="field">
              <label className="field-label">2. Ligand File (.pdb)</label>
              <div
                className="file-input-wrap"
                onClick={() => ligandRef.current?.click()}
              >
                <input
                  ref={ligandRef}
                  type="file"
                  accept=".pdb"
                  onChange={(e) => setLigandFile(e.target.files?.[0] || null)}
                />
                <div className="file-input-label">Click to select .pdb file</div>
                {ligandFile && (
                  <div className="file-name">{ligandFile.name}</div>
                )}
              </div>
            </div>
          </div>

          <h2 className="section-title section-title--spaced">
            Share The Results You Need
          </h2>

          <div className="results-table">
            <div className="results-header">
              <div className="results-header-cell results-header-cell--label">
                &nbsp;
              </div>
              <div className="results-header-cell">Protein - Protein</div>
              <div className="results-header-cell">Ligand - Ligand</div>
              <div className="results-header-cell">Protein - Ligand</div>
            </div>
            {[
              { key: 'rmsd', label: '1. RMSD' },
              { key: 'hbond', label: '2. H-Bond' },
              { key: 'ionic', label: '3. Ionic Energy' },
              { key: 'xyz', label: '4. XYZ' },
            ].map(({ key, label }) => (
              <div className="results-row" key={key}>
                <div className="results-label">{label}</div>
                <div className="results-cell">
                  <input
                    type="checkbox"
                    checked={results[key].pp}
                    onChange={(e) => handleResultsChange(key, 'pp', e.target.checked)}
                  />
                </div>
                <div className="results-cell">
                  <input
                    type="checkbox"
                    checked={results[key].ll}
                    onChange={(e) => handleResultsChange(key, 'll', e.target.checked)}
                  />
                </div>
                <div className="results-cell">
                  <input
                    type="checkbox"
                    checked={results[key].pl}
                    onChange={(e) => handleResultsChange(key, 'pl', e.target.checked)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="form-footer">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                required
              />
              <span>I agree to the terms and conditions</span>
            </label>
            <button
              type="submit"
              className="primary-button"
              disabled={submitting}
            >
              {submitting ? 'Uploading...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </section>

      <Toast message={toast.msg} visible={toast.visible} />
    </Layout>
  );
}
