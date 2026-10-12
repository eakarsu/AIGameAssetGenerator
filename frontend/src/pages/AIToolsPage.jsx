import NativeAIControls from "../components/NativeAIControls";
import useNativeAIRequest from "../components/useNativeAIRequest";
import FormattedAIReport from "../components/FormattedAIReport";
import React, { useEffect, useMemo, useState } from 'react';

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

function ResultBlock({ result, error, title, onRetry, busy }) {
  if (error) {
    return (
      <div className="card" role="alert" style={{ marginTop: 16, padding: 20, borderColor: '#dc2626' }}>
        <h3 style={{ color: '#dc2626', margin: '0 0 8px' }}>Generation failed</h3>
        <p style={{ margin: '0 0 14px' }}>{error}</p>
        <button type="button" className="btn btn-secondary" onClick={onRetry} disabled={busy}>Retry</button>
      </div>
    );
  }
  if (!result) return null;

  return <FormattedAIReport response={result} title={title} />;
}

export default function AIToolsPage({ apiFetch, showToast }) {
  const nativeAIRequest = useNativeAIRequest();

  const [tab, setTab] = useState('style-transfer');

  const [styleForm, setStyleForm] = useState({
    asset_id: '',
    base_description: '',
    target_style: 'pixel art',
  });
  const [sceneForm, setSceneForm] = useState({
    asset_ids: '',
    scene_brief: '',
    perspective: '3d-isometric',
  });
  const [assets, setAssets] = useState([]);
  const [sourceError, setSourceError] = useState('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    apiFetch('/api/assets?limit=15')
      .then((data) => {
        if (!Array.isArray(data?.data)) throw new Error('Assets returned an invalid list.');
        if (active) setAssets(data.data);
      })
      .catch(() => { if (active) setSourceError('Existing assets could not be loaded. Refresh before using an asset-based example.'); });
    return () => { active = false; };
  }, [apiFetch]);

  const presets = useMemo(() => {
    if (tab === 'style-transfer') {
      const labels = ['Pixel hero repaint', 'Painterly environment', 'Neon item concept'];
      const styles = ['32x32 pixel art with a limited fantasy palette', 'hand-painted storybook watercolor', 'cyberpunk neon concept art'];
      const briefs = [
        'A battle-worn knight with a readable shield silhouette, layered travel cloak, steel armor, and a calm heroic stance.',
        'A misty forest shrine with mossy stone arches, shallow water, warm lanterns, and a clear walkable path through the scene.',
        'A compact arcane compass made from dark brass and glass, with a luminous cyan needle and engraved navigation runes.',
      ];
      return labels.map((name, index) => ({ name, fill: () => {
        const assetId = styleForm.asset_id || String(assets[index]?.id || assets[0]?.id || '');
        const source = assets.find((asset) => String(asset.id) === assetId);
        setStyleForm({
          asset_id: assetId,
          base_description: `${briefs[index]}${source ? ` Existing source: ${source.name} — ${source.description || 'no stored description'}.` : ''}`,
          target_style: styles[index],
        });
        return { filled: assetId ? 3 : 2, manual: assetId ? [] : ['an existing Asset ID'] };
      } }));
    }

    const labels = ['Boss arena layout', 'Market exploration scene', 'Co-op puzzle room'];
    const perspectives = ['3d-isometric', 'third-person', 'side-view'];
    const briefs = [
      'Compose a volcanic boss arena at dusk. Keep the player entrance readable, reserve a central combat lane, place cover near the edges, and use lighting to telegraph the boss phase change.',
      'Build a lively harbor market exploration scene at morning. Establish a clear route from the dock to the quest giver, cluster merchants into readable zones, and include quiet discovery spaces.',
      'Design a two-player clockwork puzzle room. Show complementary interaction stations, safe observation points, a visible exit, and lighting cues that communicate each puzzle state.',
    ];
    return labels.map((name, index) => ({ name, fill: () => {
      const ids = sceneForm.asset_ids || assets.slice(index, index + 3).map((asset) => asset.id).join(', ') || assets.slice(0, 3).map((asset) => asset.id).join(', ');
      setSceneForm({ asset_ids: ids, scene_brief: briefs[index], perspective: perspectives[index] });
      return { filled: ids ? 3 : 2, manual: ids ? [] : ['existing Asset IDs'] };
    } }));
  }, [assets, sceneForm.asset_ids, styleForm.asset_id, tab]);

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
          perspective: sceneForm.perspective,
        };
      }
      const res = await nativeAIRequest.run((signal) => apiFetch(path, { ...({ method: 'POST', body: JSON.stringify(body) }), ...({ signal }) }));
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
    <NativeAIControls busy={nativeAIRequest.busy} onCancel={nativeAIRequest.cancel} context="Game Asset Generator" presets={presets}><div className="container" style={{ padding: '24px 20px' }}>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>AI Tools</h1>
        <p style={{ color: '#64748b', marginTop: 6 }}>
          Style transfer prompts and scene composition recipes for downstream image / engine pipelines.
        </p>
      </div>

      {sourceError && <div className="card" role="alert" style={{ marginBottom: 16, padding: 14, borderColor: '#dc2626' }}>{sourceError}</div>}

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
                <input data-ai-field="asset_id"
                  type="number"
                  value={styleForm.asset_id}
                  onChange={(e) => setStyleForm({ ...styleForm, asset_id: e.target.value })}
                  placeholder="ID of an existing asset"
                />
              </div>
              <div className="form-group">
                <label>Target style</label>
                <input data-ai-field="target_style"
                  value={styleForm.target_style}
                  onChange={(e) => setStyleForm({ ...styleForm, target_style: e.target.value })}
                  placeholder="e.g., low-poly, pixel art, watercolor concept"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Base description (optional if Asset ID is provided)</label>
              <textarea data-ai-field="base_description"
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
            <div className="form-row" style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label>Asset IDs (comma-separated, optional)</label>
                <input data-ai-field="asset_ids"
                  value={sceneForm.asset_ids}
                  onChange={(e) => setSceneForm({ ...sceneForm, asset_ids: e.target.value })}
                  placeholder="e.g., 12, 34, 56"
                />
              </div>
              <div className="form-group">
                <label>Perspective (optional)</label>
                <select data-ai-field="perspective"
                  value={sceneForm.perspective}
                  onChange={(e) => setSceneForm({ ...sceneForm, perspective: e.target.value })}
                >
                  <option value="3d-isometric">3D isometric</option>
                  <option value="third-person">Third person</option>
                  <option value="side-view">Side view</option>
                  <option value="top-down">Top down</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Scene brief</label>
              <textarea data-ai-field="scene_brief"
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

      <ResultBlock
        result={result}
        error={error}
        title={tab === 'style-transfer' ? 'Style transfer report' : 'Scene composition report'}
        onRetry={submit}
        busy={loading}
      />
    </div></NativeAIControls>
  );
}
