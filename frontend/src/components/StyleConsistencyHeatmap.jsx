import React, { useEffect, useState } from 'react';

// VIZ 2 — asset x style-attribute heatmap
export default function StyleConsistencyHeatmap({ apiFetch }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/custom-views/style-consistency-heatmap')
      .then(setData)
      .catch((e) => setError(e.message));
  }, [apiFetch]);

  if (error) return <div className="card" style={{ padding: 16, color: '#dc2626' }}>Error: {error}</div>;
  if (!data) return <div className="card" style={{ padding: 16 }}>Loading heatmap…</div>;

  const colorFor = (v) => {
    if (v >= 0.75) return '#16a34a';
    if (v >= 0.4)  return '#eab308';
    if (v > 0)     return '#f97316';
    return '#475569';
  };

  return (
    <div className="card" style={{ padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>Style consistency heatmap</h3>
      <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12 }}>
        Columns = style attributes · cell = consistency score 0..1
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', minWidth: 480 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 6, fontSize: 12, color: '#cbd5e1' }}>Asset</th>
              {data.attributes.map((a) => (
                <th key={a} style={{ padding: 6, fontSize: 12, color: '#cbd5e1' }}>{a}</th>
              ))}
              <th style={{ padding: 6, fontSize: 12, color: '#cbd5e1' }}>avg</th>
            </tr>
          </thead>
          <tbody>
            {data.matrix.map((row) => (
              <tr key={row.asset_id} data-testid={`heatmap-row-${row.asset_id}`}>
                <td style={{ padding: 6, fontSize: 12, color: '#e2e8f0' }}>
                  {row.asset_name} <span style={{ color: '#64748b' }}>({row.category})</span>
                </td>
                {data.attributes.map((a) => (
                  <td key={a} style={{ padding: 4 }}>
                    <div style={{ width: 60, height: 24, background: colorFor(row.scores[a]), borderRadius: 3, color: '#0f172a', fontSize: 11, textAlign: 'center', lineHeight: '24px', fontWeight: 600 }}>
                      {row.scores[a]}
                    </div>
                  </td>
                ))}
                <td style={{ padding: 6, fontSize: 12, color: '#e2e8f0' }}>{row.overall}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 12, fontSize: 12, color: '#94a3b8' }}>
        Attribute averages: {Object.entries(data.attribute_averages).map(([k, v]) => `${k}=${v}`).join(' · ')}
      </div>
    </div>
  );
}
