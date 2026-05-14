import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CollectionsPage = ({ apiFetch, showToast }) => {
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [viewingCollection, setViewingCollection] = useState(null);
  const [collectionAssets, setCollectionAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/collections');
      setCollections(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast('Failed to load collections', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await apiFetch('/api/collections', {
        method: 'POST',
        body: JSON.stringify({ name: newName.trim(), description: newDescription.trim() }),
      });
      showToast('Collection created', 'success');
      setNewName('');
      setNewDescription('');
      setShowCreateForm(false);
      loadCollections();
    } catch (err) {
      showToast('Failed to create collection', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this collection?')) return;
    try {
      await apiFetch(`/api/collections/${id}`, { method: 'DELETE' });
      showToast('Collection deleted', 'success');
      if (viewingCollection?.id === id) setViewingCollection(null);
      loadCollections();
    } catch (err) {
      showToast('Failed to delete collection', 'error');
    }
  };

  const handleViewCollection = async (col) => {
    setLoadingAssets(true);
    setViewingCollection(col);
    try {
      const data = await apiFetch(`/api/collections/${col.id}`);
      setCollectionAssets(data.assets || []);
    } catch (err) {
      showToast('Failed to load collection assets', 'error');
    } finally {
      setLoadingAssets(false);
    }
  };

  const handleRemoveAsset = async (assetId) => {
    try {
      await apiFetch(`/api/collections/${viewingCollection.id}/assets/${assetId}`, { method: 'DELETE' });
      showToast('Asset removed', 'success');
      setCollectionAssets((prev) => prev.filter((a) => a.id !== assetId));
      loadCollections();
    } catch (err) {
      showToast('Failed to remove asset', 'error');
    }
  };

  return (
    <div className="page-container">
      <div className="category-header">
        <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>
          &#x2190; Back to Dashboard
        </button>
        <div className="category-title-row">
          <span className="category-page-icon">&#x1F4DA;</span>
          <h1 className="page-title">Collections</h1>
          <span className="asset-count-badge">{collections.length} collections</span>
        </div>
        <div className="category-actions">
          <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
            + New Collection
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create Collection</h2>
              <button className="btn-close" onClick={() => setShowCreateForm(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Collection name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Describe this collection..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating || !newName.trim()}>
                  {creating ? <span className="spinner-inline"></span> : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingCollection && (
        <div className="modal-overlay" onClick={() => setViewingCollection(null)}>
          <div className="modal-content" style={{ maxWidth: 700 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{viewingCollection.name}</h2>
              <button className="btn-close" onClick={() => setViewingCollection(null)}>&times;</button>
            </div>
            <div className="modal-body">
              {viewingCollection.description && (
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{viewingCollection.description}</p>
              )}
              {loadingAssets ? (
                <div className="loading-container"><div className="spinner"></div><p>Loading assets...</p></div>
              ) : collectionAssets.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">&#x1F4E6;</span>
                  <h3>No assets in this collection</h3>
                  <p>Add assets from category pages using the &quot;Add to Collection&quot; option.</p>
                </div>
              ) : (
                <div className="assets-table-wrapper">
                  <table className="assets-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Category</th>
                        <th>AI</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {collectionAssets.map((asset) => (
                        <tr key={asset.id}>
                          <td className="asset-name-cell">{asset.name}</td>
                          <td>{asset.category}</td>
                          <td>
                            <span className={`badge ${asset.ai_generated ? 'badge-ai' : 'badge-manual'}`}>
                              {asset.ai_generated ? '\u2728 AI' : 'Manual'}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleRemoveAsset(asset.id)}
                              style={{ color: 'var(--danger)' }}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setViewingCollection(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-container"><div className="spinner"></div><p>Loading collections...</p></div>
      ) : collections.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">&#x1F4DA;</span>
          <h3>No collections yet</h3>
          <p>Create a collection to group your favorite assets</p>
        </div>
      ) : (
        <div className="assets-table-wrapper">
          <table className="assets-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Assets</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {collections.map((col) => (
                <tr key={col.id} className="asset-row" onClick={() => handleViewCollection(col)}>
                  <td className="asset-name-cell">{col.name}</td>
                  <td className="asset-desc-cell">{col.description || '--'}</td>
                  <td>{col.asset_count}</td>
                  <td className="asset-date-cell">{new Date(col.created_at).toLocaleDateString()}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleDelete(col.id)}
                      style={{ color: 'var(--danger)' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CollectionsPage;
