import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AssetDetail from '../components/AssetDetail';
import NewAssetForm from '../components/NewAssetForm';

const CATEGORY_ICONS = {
  characters: '\uD83E\uDDD9',
  weapons: '\u2694\uFE0F',
  environments: '\uD83C\uDFD4\uFE0F',
  items: '\uD83C\uDF92',
  monsters: '\uD83D\uDC79',
  npcs: '\uD83D\uDC64',
  quests: '\uD83D\uDCDC',
  spells: '\u2728',
  armor: '\uD83D\uDEE1\uFE0F',
  vehicles: '\uD83D\uDE80',
  sound_effects: '\uD83D\uDD0A',
  textures: '\uD83C\uDFA8',
  ui_elements: '\uD83D\uDDBC\uFE0F',
  lore: '\uD83D\uDCD6',
  animations: '\uD83C\uDFAC',
};

const formatCategoryName = (name) =>
  name
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

const renderMetadataValue = (value) => {
  if (value === null || value === undefined) return <span className="meta-null">--</span>;
  if (typeof value === 'boolean')
    return <span className={`meta-badge ${value ? 'meta-badge-green' : 'meta-badge-red'}`}>{value ? 'Yes' : 'No'}</span>;
  if (typeof value === 'number')
    return <span className="meta-number">{value.toLocaleString()}</span>;
  if (Array.isArray(value))
    return (
      <div className="meta-tags">
        {value.map((item, i) => (
          <span key={i} className="meta-tag">{String(item)}</span>
        ))}
      </div>
    );
  if (typeof value === 'object')
    return (
      <div className="meta-nested">
        {Object.entries(value).map(([k, v]) => (
          <div key={k} className="meta-nested-row">
            <span className="meta-nested-key">{formatFieldName(k)}:</span>
            <span className="meta-nested-val">{renderMetadataValue(v)}</span>
          </div>
        ))}
      </div>
    );
  return <span className="meta-string">{String(value)}</span>;
};

const formatFieldName = (key) =>
  key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();

const CategoryPage = ({ apiFetch, showToast }) => {
  const { name } = useParams();
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  useEffect(() => {
    loadAssets();
  }, [name]);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/assets/category/${name}`);
      setAssets(Array.isArray(data) ? data : data.assets || []);
    } catch (err) {
      showToast('Failed to load assets', 'error');
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setAiResult(null);
    try {
      const data = await apiFetch(`/api/ai/generate/${name}`, { method: 'POST' });
      setAiResult(data);
      showToast('Asset generated with AI!', 'success');
      loadAssets();
    } catch (err) {
      showToast(err.message || 'AI generation failed', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteAsset = async (id) => {
    try {
      await apiFetch(`/api/assets/${id}`, { method: 'DELETE' });
      showToast('Asset deleted', 'success');
      setSelectedAsset(null);
      loadAssets();
    } catch (err) {
      showToast('Failed to delete asset', 'error');
    }
  };

  const handleUpdateAsset = async (id, updates) => {
    try {
      const data = await apiFetch(`/api/assets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      showToast('Asset updated', 'success');
      setSelectedAsset(data.asset || data);
      loadAssets();
    } catch (err) {
      showToast('Failed to update asset', 'error');
    }
  };

  const handleCreateAsset = async (assetData) => {
    try {
      await apiFetch('/api/assets', {
        method: 'POST',
        body: JSON.stringify({ ...assetData, category: name }),
      });
      showToast('Asset created', 'success');
      setShowNewForm(false);
      loadAssets();
    } catch (err) {
      showToast('Failed to create asset', 'error');
    }
  };

  return (
    <div className="page-container">
      <div className="category-header">
        <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>
          &#x2190; Back to Dashboard
        </button>
        <div className="category-title-row">
          <span className="category-page-icon">{CATEGORY_ICONS[name] || '\uD83D\uDCE6'}</span>
          <h1 className="page-title">{formatCategoryName(name)}</h1>
          <span className="asset-count-badge">{assets.length} assets</span>
        </div>
        <div className="category-actions">
          <button className="btn btn-secondary" onClick={() => setShowNewForm(true)}>
            + New Asset
          </button>
          <button className="btn btn-primary btn-glow" onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <>
                <span className="spinner-inline"></span> Generating...
              </>
            ) : (
              <>\u2728 Generate with AI</>
            )}
          </button>
        </div>
      </div>

      {generating && (
        <div className="ai-generating-overlay">
          <div className="ai-generating-card">
            <div className="spinner spinner-lg"></div>
            <h3>AI is generating your asset...</h3>
            <p>This may take a few seconds</p>
          </div>
        </div>
      )}

      {aiResult && (
        <div className="ai-result-section">
          <div className="ai-result-header">
            <h2>\u2728 AI Generated Result</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setAiResult(null)}>
              \u2715 Dismiss
            </button>
          </div>

          {aiResult.asset && (
            <div className="ai-result-card">
              <h3 className="ai-result-name">{aiResult.asset.name}</h3>
              {aiResult.asset.description && (
                <p className="ai-result-desc">{aiResult.asset.description}</p>
              )}
            </div>
          )}

          {aiResult.parsed && typeof aiResult.parsed === 'object' && (
            <div className="ai-fields-grid">
              {Object.entries(aiResult.parsed).map(([key, value]) => (
                <div key={key} className="ai-field-card">
                  <div className="ai-field-label">{formatFieldName(key)}</div>
                  <div className="ai-field-value">{renderMetadataValue(value)}</div>
                </div>
              ))}
            </div>
          )}

          {aiResult.ai_response && !aiResult.parsed && (
            <div className="ai-raw-response">
              <pre>{typeof aiResult.ai_response === 'string' ? aiResult.ai_response : JSON.stringify(aiResult.ai_response, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading assets...</p>
        </div>
      ) : assets.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">{CATEGORY_ICONS[name] || '\uD83D\uDCE6'}</span>
          <h3>No assets yet</h3>
          <p>Generate your first asset with AI or create one manually</p>
        </div>
      ) : (
        <div className="assets-table-wrapper">
          <table className="assets-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>AI Generated</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id} onClick={() => setSelectedAsset(asset)} className="asset-row">
                  <td className="asset-name-cell">{asset.name}</td>
                  <td className="asset-desc-cell">
                    {asset.description
                      ? asset.description.length > 80
                        ? asset.description.slice(0, 80) + '...'
                        : asset.description
                      : '--'}
                  </td>
                  <td>
                    <span className={`badge ${asset.ai_generated ? 'badge-ai' : 'badge-manual'}`}>
                      {asset.ai_generated ? '\u2728 AI' : 'Manual'}
                    </span>
                  </td>
                  <td className="asset-date-cell">
                    {new Date(asset.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedAsset && (
        <AssetDetail
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onDelete={handleDeleteAsset}
          onUpdate={handleUpdateAsset}
        />
      )}

      {showNewForm && (
        <NewAssetForm
          category={name}
          onClose={() => setShowNewForm(false)}
          onCreate={handleCreateAsset}
        />
      )}
    </div>
  );
};

export default CategoryPage;
