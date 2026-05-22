import React, { useEffect, useState } from 'react';

// NON-VIZ 4 — CRUD editor for generation rules (prompt + dimensions + style tokens)
export default function GenerationRulesEditor({ apiFetch, showToast }) {
  const [rules, setRules] = useState([]);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState({ name: '', prompt: '', dimensions: '1024x1024', style_tokens: '' });

  const reload = async () => {
    try {
      const r = await apiFetch('/api/custom-views/generation-rules');
      setRules(r.rules || []);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => { reload(); }, []);

  const create = async () => {
    if (!draft.name) return;
    try {
      await apiFetch('/api/custom-views/generation-rules', {
        method: 'POST',
        body: JSON.stringify({
          ...draft,
          style_tokens: draft.style_tokens.split(',').map((s) => s.trim()).filter(Boolean),
        }),
      });
      setDraft({ name: '', prompt: '', dimensions: '1024x1024', style_tokens: '' });
      showToast?.('Rule created', 'success');
      reload();
    } catch (e) {
      showToast?.(e.message, 'error');
    }
  };

  const update = async (rule, patch) => {
    try {
      await apiFetch(`/api/custom-views/generation-rules/${rule.id}`, {
        method: 'PUT',
        body: JSON.stringify(patch),
      });
      reload();
    } catch (e) {
      showToast?.(e.message, 'error');
    }
  };

  const remove = async (rule) => {
    try {
      await apiFetch(`/api/custom-views/generation-rules/${rule.id}`, { method: 'DELETE' });
      showToast?.('Rule deleted', 'success');
      reload();
    } catch (e) {
      showToast?.(e.message, 'error');
    }
  };

  return (
    <div className="card" style={{ padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>Generation rules</h3>
      {error && <div style={{ color: '#dc2626' }}>Error: {error}</div>}

      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr', marginBottom: 16, padding: 12, background: '#0f172a', borderRadius: 6 }}>
        <input
          data-testid="rule-name"
          placeholder="Rule name"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          style={{ padding: 6, borderRadius: 4, border: '1px solid #334155', background: '#1e293b', color: '#e2e8f0' }}
        />
        <input
          placeholder="Dimensions (e.g. 1024x1024)"
          value={draft.dimensions}
          onChange={(e) => setDraft({ ...draft, dimensions: e.target.value })}
          style={{ padding: 6, borderRadius: 4, border: '1px solid #334155', background: '#1e293b', color: '#e2e8f0' }}
        />
        <textarea
          placeholder="Prompt template"
          value={draft.prompt}
          onChange={(e) => setDraft({ ...draft, prompt: e.target.value })}
          style={{ gridColumn: 'span 2', padding: 6, borderRadius: 4, border: '1px solid #334155', background: '#1e293b', color: '#e2e8f0', minHeight: 50 }}
        />
        <input
          placeholder="Style tokens (comma-separated)"
          value={draft.style_tokens}
          onChange={(e) => setDraft({ ...draft, style_tokens: e.target.value })}
          style={{ gridColumn: 'span 2', padding: 6, borderRadius: 4, border: '1px solid #334155', background: '#1e293b', color: '#e2e8f0' }}
        />
        <button className="btn btn-primary btn-sm" data-testid="rule-create" onClick={create}>Add rule</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rules.map((r) => (
          <div key={r.id} data-testid={`rule-${r.id}`} style={{ padding: 10, background: '#1e293b', borderRadius: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <strong style={{ color: '#f1f5f9' }}>{r.name}</strong>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    const next = prompt('Update prompt', r.prompt) ?? r.prompt;
                    if (next !== r.prompt) update(r, { prompt: next });
                  }}
                >Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => remove(r)}>Delete</button>
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
              {r.dimensions} · tokens: {(r.style_tokens || []).join(', ') || '(none)'}
            </div>
            <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 4 }}>{r.prompt}</div>
          </div>
        ))}
        {rules.length === 0 && <div style={{ color: '#64748b' }}>No rules yet.</div>}
      </div>
    </div>
  );
}
