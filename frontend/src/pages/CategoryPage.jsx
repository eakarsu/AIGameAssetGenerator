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

const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', padding: '16px 0' }}>
      <button
        className="btn btn-ghost btn-sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        &larr; Prev
      </button>
      <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
        Page {page} of {totalPages}
      </span>
      <button
        className="btn btn-ghost btn-sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next &rarr;
      </button>
    </div>
  );
};

const CategoryPage = ({ apiFetch, showToast }) => {
  const { name } = useParams();
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  // Batch generation
  const [batchMode, setBatchMode] = useState(false);
  const [batchCount, setBatchCount] = useState(2);
  const [batchProgress, setBatchProgress] = useState(null);

  // Collections
  const [collections, setCollections] = useState([]);
  const [addToColAsset, setAddToColAsset] = useState(null);
  const [showColDropdown, setShowColDropdown] = useState(false);

  useEffect(() => {
    loadAssets(1);
    loadCollections();
  }, [name]);

  const loadAssets = async (pageNum = page) => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/assets/category/${name}?page=${pageNum}&limit=20`);
      if (data && data.data) {
        setAssets(data.data);
        setPagination(data.pagination);
        setPage(pageNum);
      } else {
        // fallback for old API
        setAssets(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      showToast('Failed to load assets', 'error');
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCollections = async () => {
    try {
      const data = await apiFetch('/api/collections');
      setCollections(Array.isArray(data) ? data : []);
    } catch (err) {
      // non-fatal
    }
  };

  const handleGenerate = async () => {
    if (batchMode) {
      await handleBatchGenerate();
      return;
    }
    setGenerating(true);
    setAiResult(null);
    try {
      const data = await apiFetch(`/api/ai/generate/${name}`, { method: 'POST' });
      setAiResult(data);
      showToast('Asset generated with AI!', 'success');
      loadAssets(1);
    } catch (err) {
      if (err.message && err.message.includes('rate limit')) {
        showToast('AI rate limit exceeded. Max 20 requests/hour. Please wait before generating more.', 'error');
      } else {
        showToast(err.message || 'AI generation failed', 'error');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleBatchGenerate = async () => {
    setGenerating(true);
    setAiResult(null);
    setBatchProgress({ current: 0, total: batchCount });
    try {
      const data = await apiFetch(`/api/ai/generate-batch`, {
        method: 'POST',
        body: JSON.stringify({ category: name, count: batchCount }),
      });
      setBatchProgress(null);
      showToast(`Generated ${data.count} assets!`, 'success');
      loadAssets(1);
      if (data.generated && data.generated.length > 0) {
        setAiResult({ batchResults: data.generated, count: data.count });
      }
    } catch (err) {
      setBatchProgress(null);
      if (err.message && err.message.includes('rate limit')) {
        showToast('AI rate limit exceeded. Max 20 requests/hour. Please wait before generating more.', 'error');
      } else {
        showToast(err.message || 'Batch generation failed', 'error');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteAsset = async (id) => {
    try {
      await apiFetch(`/api/assets/${id}`, { method: 'DELETE' });
      showToast('Asset deleted', 'success');
      setSelectedAsset(null);
      loadAssets(page);
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
      loadAssets(page);
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
      loadAssets(1);
    } catch (err) {
      showToast('Failed to create asset', 'error');
    }
  };

  const handleExport = () => {
    const token = localStorage.getItem('token');
    const url = `/api/assets/export?category=${name}&format=json`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `assets-${name}.json`;
        a.click();
      })
      .catch(() => showToast('Export failed', 'error'));
  };

  const handleAddToCollection = async (collectionId) => {
    try {
      await apiFetch(`/api/collections/${collectionId}/assets`, {
        method: 'POST',
        body: JSON.stringify({ assetId: addToColAsset.id }),
      });
      showToast('Added to collection!', 'success');
    } catch (err) {
      showToast('Failed to add to collection', 'error');
    } finally {
      setShowColDropdown(false);
      setAddToColAsset(null);
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
          <span className="asset-count-badge">{pagination.total} assets</span>
        </div>
        <div className="category-actions" style={{ flexWrap: 'wrap', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={handleExport}>
            &#x2B07; Export JSON
          </button>
          <button className="btn btn-secondary" onClick={() => setShowNewForm(true)}>
            + New Asset
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                type="checkbox"
                checked={batchMode}
                onChange={(e) => setBatchMode(e.target.checked)}
              />
              Generate Multiple
            </label>
            {batchMode && (
              <select
                value={batchCount}
                onChange={(e) => setBatchCount(Number(e.target.value))}
                className="form-input"
                style={{ width: 60, padding: '4px 8px', fontSize: 13 }}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            )}
          </div>
          <button className="btn btn-primary btn-glow" onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <>
                <span className="spinner-inline"></span>
                {batchProgress ? ` Generating... (${batchProgress.current}/${batchProgress.total})` : ' Generating...'}
              </>
            ) : (
              <>{batchMode ? `\u2728 Generate ${batchCount}` : '\u2728 Generate with AI'}</>
            )}
          </button>
        </div>
      </div>

      {generating && (
        <div className="ai-generating-overlay">
          <div className="ai-generating-card">
            <div className="spinner spinner-lg"></div>
            <h3>{batchMode ? `Generating ${batchCount} assets with AI...` : 'AI is generating your asset...'}</h3>
            <p>This may take a few seconds</p>
          </div>
        </div>
      )}

      {aiResult && (
        <div className="ai-result-section">
          <div className="ai-result-header">
            <h2>\u2728 AI Generated Result{aiResult.batchResults ? `s (${aiResult.count})` : ''}</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setAiResult(null)}>
              \u2715 Dismiss
            </button>
          </div>

          {aiResult.batchResults ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {aiResult.batchResults.map((r, i) => (
                <div key={i} className="ai-result-card">
                  <h3 className="ai-result-name">{r.asset?.name || `Asset ${i + 1}`}{r.error ? ` (Error: ${r.error})` : ''}</h3>
                  {r.asset?.description && <p className="ai-result-desc">{r.asset.description}</p>}
                </div>
              ))}
            </div>
          ) : (
            <>
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
            </>
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
        <>
          <div className="assets-table-wrapper">
            <table className="assets-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>AI Generated</th>
                  <th>Created</th>
                  <th></th>
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
                    <td onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: 12 }}
                        onClick={() => {
                          setAddToColAsset(asset);
                          setShowColDropdown(true);
                        }}
                      >
                        + Collection
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(p) => loadAssets(p)}
          />
        </>
      )}

      {showColDropdown && addToColAsset && (
        <div className="modal-overlay" onClick={() => { setShowColDropdown(false); setAddToColAsset(null); }}>
          <div className="modal-content" style={{ maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add to Collection</h2>
              <button className="btn-close" onClick={() => { setShowColDropdown(false); setAddToColAsset(null); }}>&times;</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>
                Adding: <strong>{addToColAsset.name}</strong>
              </p>
              {collections.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No collections yet. Create one from the Collections page.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {collections.map((col) => (
                    <button
                      key={col.id}
                      className="btn btn-secondary"
                      style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                      onClick={() => handleAddToCollection(col.id)}
                    >
                      {col.name} ({col.asset_count} assets)
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => { setShowColDropdown(false); setAddToColAsset(null); }}>Cancel</button>
            </div>
          </div>
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
