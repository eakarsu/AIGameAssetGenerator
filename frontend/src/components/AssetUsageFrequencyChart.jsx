import React, { useEffect, useState } from 'react';

// VIZ 1 — asset usage frequency per scene (category) / level (rarity proxy)
export default function AssetUsageFrequencyChart({ apiFetch }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/custom-views/asset-usage-frequency')
      .then(setData)
      .catch((e) => setError(e.message));
  }, [apiFetch]);

  if (error) return <div className="card" style={{ padding: 16, color: '#dc2626' }}>Error: {error}</div>;
  if (!data) return <div className="card" style={{ padding: 16 }}>Loading usage chart…</div>;

  const max = Math.max(1, ...data.by_scene.map((s) => s.count));

  return (
    <div className="card" style={{ padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>Asset usage frequency by scene</h3>
      <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12 }}>
        Total assets: {data.total_assets} · {data.by_scene.length} scenes
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.by_scene.map((s) => (
          <div key={s.scene} data-testid={`usage-row-${s.scene}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 140, fontSize: 13, color: '#cbd5e1' }}>{s.scene}</div>
            <div style={{ flex: 1, background: '#1e293b', borderRadius: 4, height: 22, position: 'relative' }}>
              <div
                style={{
                  width: `${(s.count / max) * 100}%`,
                  background: 'linear-gradient(90deg, #6366f1, #22d3ee)',
                  height: '100%',
                  borderRadius: 4,
                }}
              />
              <span style={{ position: 'absolute', right: 8, top: 2, fontSize: 12, color: '#f1f5f9' }}>
                {s.count} ({s.pct}%)
              </span>
            </div>
          </div>
        ))}
      </div>
      <details style={{ marginTop: 12 }}>
        <summary style={{ cursor: 'pointer', color: '#64748b' }}>Level breakdown ({data.by_level?.length || 0})</summary>
        <pre style={{ fontSize: 11, color: '#cbd5e1', background: '#0f172a', padding: 8, borderRadius: 4 }}>
          {JSON.stringify(data.by_level, null, 2)}
        </pre>
      </details>
    </div>
  );
}
