import React, { useState } from 'react';

const formatFieldName = (key) =>
  key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();

const renderMetadataValue = (value) => {
  if (value === null || value === undefined) return <span className="meta-null">--</span>;
  if (typeof value === 'boolean')
    return (
      <span className={`meta-badge ${value ? 'meta-badge-green' : 'meta-badge-red'}`}>
        {value ? 'Yes' : 'No'}
      </span>
    );
  if (typeof value === 'number')
    return <span className="meta-number">{value.toLocaleString()}</span>;
  if (Array.isArray(value))
    return (
      <div className="meta-tags">
        {value.map((item, i) => (
          <span key={i} className="meta-tag">
            {typeof item === 'object' ? JSON.stringify(item) : String(item)}
          </span>
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

const AssetDetail = ({ asset, onClose, onDelete, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(asset.name);
  const [editDesc, setEditDesc] = useState(asset.description || '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = () => {
    onUpdate(asset.id, { name: editName, description: editDesc });
    setEditing(false);
  };

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(asset.id);
    } else {
      setConfirmDelete(true);
    }
  };

  const metadata = asset.metadata || {};

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">
              {editing ? (
                <input
                  type="text"
                  className="form-input inline-edit"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              ) : (
                asset.name
              )}
            </h2>
            <div className="modal-meta-row">
              <span className={`badge ${asset.ai_generated ? 'badge-ai' : 'badge-manual'}`}>
                {asset.ai_generated ? '\u2728 AI Generated' : 'Manual'}
              </span>
              <span className="badge badge-category">{formatFieldName(asset.category)}</span>
              <span className="modal-date">
                Created {new Date(asset.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>
            \u2715
          </button>
        </div>

        <div className="modal-body">
          <div className="detail-section">
            <h3 className="section-label">Description</h3>
            {editing ? (
              <textarea
                className="form-textarea"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
              />
            ) : (
              <p className="detail-description">{asset.description || 'No description'}</p>
            )}
          </div>

          {Object.keys(metadata).length > 0 && (
            <div className="detail-section">
              <h3 className="section-label">Metadata</h3>
              <div className="metadata-grid">
                {Object.entries(metadata).map(([key, value]) => (
                  <div key={key} className="metadata-card">
                    <div className="metadata-card-label">{formatFieldName(key)}</div>
                    <div className="metadata-card-value">{renderMetadataValue(value)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {editing ? (
            <>
              <button className="btn btn-ghost" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave}>
                Save Changes
              </button>
            </>
          ) : (
            <>
              <button
                className={`btn ${confirmDelete ? 'btn-danger-confirm' : 'btn-danger'}`}
                onClick={handleDelete}
              >
                {confirmDelete ? 'Confirm Delete?' : 'Delete'}
              </button>
              <button className="btn btn-secondary" onClick={() => setEditing(true)}>
                Edit
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetDetail;
