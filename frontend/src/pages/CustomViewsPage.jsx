import React from 'react';
import AssetUsageFrequencyChart from '../components/AssetUsageFrequencyChart';
import StyleConsistencyHeatmap from '../components/StyleConsistencyHeatmap';
import AssetBriefPdf from '../components/AssetBriefPdf';
import GenerationRulesEditor from '../components/GenerationRulesEditor';

export default function CustomViewsPage({ apiFetch, showToast }) {
  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }} data-testid="custom-views-page">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Asset Views</h1>
        <p style={{ color: '#94a3b8', marginTop: 4 }}>
          Custom additive views: usage frequency, style consistency, briefs, and generation rules.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <AssetUsageFrequencyChart apiFetch={apiFetch} />
        <StyleConsistencyHeatmap   apiFetch={apiFetch} />
        <AssetBriefPdf             apiFetch={apiFetch} />
        <GenerationRulesEditor     apiFetch={apiFetch} showToast={showToast} />
      </div>
    </div>
  );
}
