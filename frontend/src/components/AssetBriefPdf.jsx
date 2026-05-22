import React, { useState } from 'react';

// NON-VIZ 3 — asset brief PDF generator
export default function AssetBriefPdf({ apiFetch }) {
  const [assetId, setAssetId] = useState('1');
  const [brief, setBrief] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const r = await apiFetch(`/api/custom-views/asset-brief-pdf?asset_id=${encodeURIComponent(assetId)}`);
      setBrief(r);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>Asset brief PDF</h3>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <label style={{ fontSize: 13, color: '#cbd5e1' }}>Asset ID</label>
        <input
          data-testid="brief-asset-id"
          value={assetId}
          onChange={(e) => setAssetId(e.target.value)}
          style={{ width: 80, padding: 6, borderRadius: 4, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0' }}
        />
        <button className="btn btn-primary btn-sm" disabled={loading} onClick={generate} data-testid="brief-generate">
          {loading ? 'Generating…' : 'Generate brief'}
        </button>
        <a
          className="btn btn-ghost btn-sm"
          href={`/api/custom-views/asset-brief-pdf?asset_id=${encodeURIComponent(assetId)}&format=pdf`}
          target="_blank"
          rel="noreferrer"
        >
          Open PDF
        </a>
      </div>
      {error && <div style={{ color: '#dc2626', marginBottom: 8 }}>Error: {error}</div>}
      {brief && (
        <div style={{ background: '#fff', color: '#111', borderRadius: 6, padding: 12 }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
            Brief for {brief.asset_name} (id {brief.asset_id})
          </div>
          <div data-testid="brief-html" dangerouslySetInnerHTML={{ __html: brief.brief_html }} />
        </div>
      )}
    </div>
  );
}
