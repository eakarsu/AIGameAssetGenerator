import React, { useState } from 'react';

/**
 * Frontend for the 2 new text-only AI endpoints in server/routes:
 *   POST /api/ai/style-transfer
 *   POST /api/ai/scene-composition
 *
 * Mirrors styling of CategoryPage / Dashboard — uses btn, page-header, card,
 * form-group classNames already defined globally.
 */

const TABS = [
  { id: 'style-transfer', label: 'Style Transfer' },
  { id: 'scene-composition', label: 'Scene Composition' },
];

function ResultBlock({ result, error }) {
  if (error) {
    return (
      <div className="card" style={{ marginTop: 16, padding: 16, borderColor: '#dc2626' }}>
        <strong style={{ color: '#dc2626' }}>Error: </strong>
        {error}
      </div>
    );
  }
  if (!result) return null;

  const text = result.prompt_seed || result.prompt || result.content || result.text;
  return (
    <div className="card" style={{ marginTop: 16, padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>AI Result</h3>
      {text && (
        <pre style={{ whiteSpace: 'pre-wrap', background: '#0f172a', color: '#e2e8f0', padding: 12, borderRadius: 6, fontSize: 13 }}>
          {typeof text === 'string' ? text : JSON.stringify(text, null, 2)}
        </pre>
      )}
      <details style={{ marginTop: 12 }}>
        <summary style={{ cursor: 'pointer', color: '#64748b' }}>Raw response</summary>
        <pre style={{ whiteSpace: 'pre-wrap', background: '#f1f5f9', padding: 12, borderRadius: 6, fontSize: 12 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      </details>
    </div>
  );
}

export default function AIToolsPage({ apiFetch, showToast }) {
  const [tab, setTab] = useState('style-transfer');

  const [styleForm, setStyleForm] = useState({
    asset_id: '',
    base_description: '',
    target_style: 'pixel art',
  });
  const [sceneForm, setSceneForm] = useState({
    asset_ids: '',
    scene_brief: '',
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const submit = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      let body, path;
      if (tab === 'style-transfer') {
        path = '/api/ai/style-transfer';
        body = {
          asset_id: styleForm.asset_id ? Number(styleForm.asset_id) : undefined,
          base_description: styleForm.base_description || undefined,
          target_style: styleForm.target_style,
        };
      } else {
        path = '/api/ai/scene-composition';
        body = {
          asset_ids: sceneForm.asset_ids
            ? sceneForm.asset_ids.split(',').map((s) => Number(s.trim())).filter(Boolean)
            : [],
          scene_brief: sceneForm.scene_brief,
        };
      }
      const res = await apiFetch(path, { method: 'POST', body: JSON.stringify(body) });
      setResult(res);
      showToast?.('AI result generated', 'success');
    } catch (e) {
      setError(e.message || 'Request failed');
      showToast?.(e.message || 'Request failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const styleValid =
    !!(styleForm.asset_id || styleForm.base_description) && !!styleForm.target_style;

  const sceneValid = !!sceneForm.scene_brief;

  return (
    <div className="container" style={{ padding: '24px 20px' }}>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>AI Tools</h1>
        <p style={{ color: '#64748b', marginTop: 6 }}>
          Style transfer prompts and scene composition recipes for downstream image / engine pipelines.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`btn ${tab === t.id ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => {
              setTab(t.id);
              setResult(null);
              setError('');
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 20 }}>
        {tab === 'style-transfer' && (
          <>
            <h2 style={{ marginTop: 0 }}>Style Transfer</h2>
            <p style={{ color: '#64748b' }}>
              Provide an existing asset ID or a base description, plus a target style. Returns palette / silhouette / lighting notes plus a prompt seed.
            </p>
            <div className="form-row" style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label>Asset ID (optional)</label>
                <input
                  type="number"
                  value={styleForm.asset_id}
                  onChange={(e) => setStyleForm({ ...styleForm, asset_id: e.target.value })}
                  placeholder="ID of an existing asset"
                />
              </div>
              <div className="form-group">
                <label>Target style</label>
                <input
                  value={styleForm.target_style}
                  onChange={(e) => setStyleForm({ ...styleForm, target_style: e.target.value })}
                  placeholder="e.g., low-poly, pixel art, watercolor concept"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Base description (optional if Asset ID is provided)</label>
              <textarea
                rows={3}
                value={styleForm.base_description}
                onChange={(e) => setStyleForm({ ...styleForm, base_description: e.target.value })}
                placeholder="e.g., A medieval knight wielding a longsword..."
              />
            </div>
          </>
        )}

        {tab === 'scene-composition' && (
          <>
            <h2 style={{ marginTop: 0 }}>Scene Composition</h2>
            <p style={{ color: '#64748b' }}>
              Provide a scene brief and a comma-separated list of asset IDs. Returns placement (xyz/rotation/scale), lighting, atmosphere, audio cues, and an image-gen prompt.
            </p>
            <div className="form-group">
              <label>Asset IDs (comma-separated, optional)</label>
              <input
                value={sceneForm.asset_ids}
                onChange={(e) => setSceneForm({ ...sceneForm, asset_ids: e.target.value })}
                placeholder="e.g., 12, 34, 56"
              />
            </div>
            <div className="form-group">
              <label>Scene brief</label>
              <textarea
                rows={4}
                value={sceneForm.scene_brief}
                onChange={(e) => setSceneForm({ ...sceneForm, scene_brief: e.target.value })}
                placeholder="Describe the scene mood, time of day, action beats..."
              />
            </div>
          </>
        )}

        <button
          className="btn btn-primary"
          disabled={loading || (tab === 'style-transfer' ? !styleValid : !sceneValid)}
          onClick={submit}
          style={{ marginTop: 12 }}
        >
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>

      <ResultBlock result={result} error={error} />
    </div>
  );
}
