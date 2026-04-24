import React, { useState } from 'react';

const CATEGORY_FIELDS = {
  characters: ['class', 'race', 'level', 'health', 'abilities'],
  weapons: ['type', 'damage', 'rarity', 'element', 'range'],
  environments: ['biome', 'size', 'difficulty', 'features', 'weather'],
  items: ['type', 'rarity', 'weight', 'value', 'effects'],
  monsters: ['type', 'level', 'health', 'attacks', 'weaknesses'],
  npcs: ['role', 'faction', 'location', 'dialogue_style', 'quests'],
  quests: ['type', 'difficulty', 'rewards', 'objectives', 'prerequisites'],
  spells: ['school', 'mana_cost', 'damage', 'range', 'cooldown'],
  armor: ['type', 'defense', 'rarity', 'material', 'weight'],
  vehicles: ['type', 'speed', 'capacity', 'fuel', 'terrain'],
  sound_effects: ['type', 'duration', 'trigger', 'volume', 'loop'],
  textures: ['type', 'resolution', 'style', 'tileable', 'material'],
  ui_elements: ['type', 'size', 'interactive', 'screen_position', 'style'],
  lore: ['era', 'region', 'characters_involved', 'significance', 'related_quests'],
  animations: ['type', 'duration', 'frames', 'loop', 'trigger'],
};

const formatFieldName = (key) =>
  key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();

const NewAssetForm = ({ category, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [metaFields, setMetaFields] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fields = CATEGORY_FIELDS[category] || [];

  const handleMetaChange = (field, value) => {
    setMetaFields((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);

    const metadata = {};
    for (const [key, value] of Object.entries(metaFields)) {
      if (value.trim()) {
        metadata[key] = value;
      }
    }

    await onCreate({ name, description, metadata });
    setSubmitting(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create New {formatFieldName(category)}</h2>
          <button className="btn-close" onClick={onClose}>
            \u2715
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Asset name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                placeholder="Describe this asset..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {fields.length > 0 && (
              <>
                <h3 className="section-label" style={{ marginTop: '1.5rem' }}>
                  Metadata Fields
                </h3>
                <div className="form-grid">
                  {fields.map((field) => (
                    <div key={field} className="form-group">
                      <label className="form-label">{formatFieldName(field)}</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder={formatFieldName(field)}
                        value={metaFields[field] || ''}
                        onChange={(e) => handleMetaChange(field, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting || !name.trim()}>
              {submitting ? <span className="spinner-inline"></span> : 'Create Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewAssetForm;
