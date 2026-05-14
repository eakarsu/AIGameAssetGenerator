import React, { useEffect, useState } from 'react';

/**
 * Apply pass 5 frontend: Asset Versioning + Comments + Sharing.
 * Uses the apiFetch helper from App.jsx.
 */

export default function AssetCollabPage({ apiFetch, showToast }) {
  const [assetId, setAssetId] = useState('');
  const [versions, setVersions] = useState([]);
  const [comments, setComments] = useState([]);
  const [shares, setShares] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [shareForm, setShareForm] = useState({ shared_with_user_id: '', scope: 'read' });
  const [versionForm, setVersionForm] = useState({ branch_name: 'main', changelog: '' });

  const refresh = async () => {
    if (!assetId) return;
    try {
      const [v, c, s] = await Promise.all([
        apiFetch(`/api/asset-versions/${assetId}`),
        apiFetch(`/api/asset-collab/${assetId}/comments`),
        apiFetch(`/api/asset-collab/${assetId}/shares`),
      ]);
      setVersions(v); setComments(c); setShares(s);
    } catch (err) { showToast?.(err.message, 'error'); }
  };

  useEffect(() => { if (assetId) refresh(); /* eslint-disable-next-line */ }, [assetId]);

  const addVersion = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/asset-versions/${assetId}`, { method: 'POST', body: JSON.stringify(versionForm) });
      setVersionForm({ branch_name: 'main', changelog: '' });
      refresh();
    } catch (err) { showToast?.(err.message, 'error'); }
  };
  const addComment = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/asset-collab/${assetId}/comments`, { method: 'POST', body: JSON.stringify({ body: newComment }) });
      setNewComment(''); refresh();
    } catch (err) { showToast?.(err.message, 'error'); }
  };
  const addShare = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/asset-collab/${assetId}/shares`, { method: 'POST', body: JSON.stringify(shareForm) });
      setShareForm({ shared_with_user_id: '', scope: 'read' }); refresh();
    } catch (err) { showToast?.(err.message, 'error'); }
  };

  return (
    <div style={{ maxWidth: 800, margin: '24px auto', padding: 16 }}>
      <h1>Asset Versions & Collaboration</h1>
      <input
        type="number"
        placeholder="Asset ID"
        value={assetId}
        onChange={(e) => setAssetId(e.target.value)}
        style={{ padding: 8, marginBottom: 16, width: 200 }}
      />
      {assetId && (
        <>
          <section style={{ marginBottom: 24 }}>
            <h2>Versions</h2>
            <form onSubmit={addVersion} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input placeholder="branch (main)" value={versionForm.branch_name} onChange={(e) => setVersionForm({ ...versionForm, branch_name: e.target.value })} />
              <input placeholder="changelog" value={versionForm.changelog} onChange={(e) => setVersionForm({ ...versionForm, changelog: e.target.value })} style={{ flex: 1 }} />
              <button type="submit">Add version</button>
            </form>
            <ul>
              {versions.map((v) => (
                <li key={v.id}>v{v.version_number} · {v.branch_name} · {v.changelog || '(no changelog)'}</li>
              ))}
            </ul>
          </section>

          <section style={{ marginBottom: 24 }}>
            <h2>Comments</h2>
            <form onSubmit={addComment} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment" style={{ flex: 1 }} />
              <button type="submit">Post</button>
            </form>
            <ul>{comments.map((c) => (<li key={c.id}>{c.body}</li>))}</ul>
          </section>

          <section>
            <h2>Sharing</h2>
            <form onSubmit={addShare} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input type="number" placeholder="user id" value={shareForm.shared_with_user_id} onChange={(e) => setShareForm({ ...shareForm, shared_with_user_id: e.target.value })} />
              <select value={shareForm.scope} onChange={(e) => setShareForm({ ...shareForm, scope: e.target.value })}>
                <option value="read">read</option>
                <option value="comment">comment</option>
                <option value="edit">edit</option>
              </select>
              <button type="submit">Share</button>
            </form>
            <ul>{shares.map((s) => (<li key={s.id}>user {s.shared_with_user_id}: {s.scope}</li>))}</ul>
          </section>
        </>
      )}
    </div>
  );
}
