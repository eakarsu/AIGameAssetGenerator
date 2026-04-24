import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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

const CATEGORY_GRADIENTS = {
  characters: 'linear-gradient(135deg, #7c3aed33, #a855f733)',
  weapons: 'linear-gradient(135deg, #ef444433, #f9731633)',
  environments: 'linear-gradient(135deg, #10b98133, #06b6d433)',
  items: 'linear-gradient(135deg, #f59e0b33, #eab30833)',
  monsters: 'linear-gradient(135deg, #ef444433, #dc262633)',
  npcs: 'linear-gradient(135deg, #6366f133, #818cf833)',
  quests: 'linear-gradient(135deg, #f59e0b33, #d9740033)',
  spells: 'linear-gradient(135deg, #a855f733, #ec489933)',
  armor: 'linear-gradient(135deg, #64748b33, #94a3b833)',
  vehicles: 'linear-gradient(135deg, #06b6d433, #0ea5e933)',
  sound_effects: 'linear-gradient(135deg, #10b98133, #34d39933)',
  textures: 'linear-gradient(135deg, #ec489933, #f4347833)',
  ui_elements: 'linear-gradient(135deg, #8b5cf633, #a78bfa33)',
  lore: 'linear-gradient(135deg, #d9740033, #f59e0b33)',
  animations: 'linear-gradient(135deg, #06b6d433, #7c3aed33)',
};

const formatCategoryName = (name) =>
  name
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

const Dashboard = ({ apiFetch, showToast }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await apiFetch('/api/assets/categories');
      const allCategories = Object.keys(CATEGORY_ICONS).map((cat) => {
        const found = (data || []).find((d) => d.category === cat);
        return { category: cat, count: found ? found.count : 0 };
      });
      setCategories(allCategories);
    } catch (err) {
      showToast('Failed to load categories', 'error');
      const allCategories = Object.keys(CATEGORY_ICONS).map((cat) => ({
        category: cat,
        count: 0,
      }));
      setCategories(allCategories);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <h1 className="page-title">Game Asset Dashboard</h1>
        <p className="page-subtitle">Select a category to manage your AI-generated game assets</p>
      </div>

      <div className="category-grid">
        {categories.map((cat) => (
          <div
            key={cat.category}
            className="category-card"
            style={{ background: CATEGORY_GRADIENTS[cat.category] }}
            onClick={() => navigate(`/category/${cat.category}`)}
          >
            <div className="card-glow"></div>
            <div className="card-content">
              <span className="card-icon">{CATEGORY_ICONS[cat.category]}</span>
              <h3 className="card-title">{formatCategoryName(cat.category)}</h3>
              <div className="card-count">
                <span className="count-number">{cat.count}</span>
                <span className="count-label">assets</span>
              </div>
            </div>
            <div className="card-arrow">&#x2192;</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
