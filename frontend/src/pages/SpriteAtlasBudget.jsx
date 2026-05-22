import React, { useState } from 'react';

export default function SpriteAtlasBudget({ apiFetch }) {
  const [form, setForm] = useState({ sprites: 120, avgWidth: 192, avgHeight: 192, framesPerSprite: 4, targetAtlas: 2048 });
  const [result, setResult] = useState(null);

  const submit = async () => {
    setResult(await apiFetch('/api/sprite-atlas-budget/check', { method: 'POST', body: JSON.stringify(form) }));
  };

  return (
    <main className="container">
      <h1>Sprite Atlas Budget</h1>
      <section className="card">
        {Object.entries(form).map(([key, value]) => (
          <label key={key}>{key.replace(/([A-Z])/g, ' $1')}
            <input type="number" value={value} onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })} />
          </label>
        ))}
        <button className="btn btn-primary" onClick={submit}>Check budget</button>
      </section>
      {result && (
        <section className="card">
          <h2>{result.status.toUpperCase()} · {result.atlasesNeeded} atlas file(s) · {result.utilization}% utilized</h2>
          <ul>{result.actions.map((action) => <li key={action}>{action}</li>)}</ul>
        </section>
      )}
    </main>
  );
}
