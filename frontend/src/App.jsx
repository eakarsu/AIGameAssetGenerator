import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CategoryPage from './pages/CategoryPage';
import CollectionsPage from './pages/CollectionsPage';
import AIToolsPage from './pages/AIToolsPage';
import AssetCollabPage from './pages/AssetCollabPage';
import Navbar from './components/Navbar';

// === Batch 04 Gaps & Frontend Mounts ===
import CfAgenticAssetPipelineTurningAGame from './pages/CfAgenticAssetPipelineTurningAGame';
import CfStyleConsistencyEnforcerFlaggingOutl from './pages/CfStyleConsistencyEnforcerFlaggingOutl';
import CfPerformanceOptimizationAdvisorAnalyzi from './pages/CfPerformanceOptimizationAdvisorAnalyzi';
import CfMarketplaceLicensingLayerWithImageS from './pages/CfMarketplaceLicensingLayerWithImageS';
import CfAnimationRetargetingAiReusingAnimati from './pages/CfAnimationRetargetingAiReusingAnimati';
import CfUnityunrealExportPluginWithCorrectP from './pages/CfUnityunrealExportPluginWithCorrectP';
import GapNoStyleTransferEndpointApplyArt from './pages/GapNoStyleTransferEndpointApplyArt';
import GapNoAnimationGenerationEndpointRigging from './pages/GapNoAnimationGenerationEndpointRigging';
import GapNoTextureRefinementEndpoint from './pages/GapNoTextureRefinementEndpoint';
import GapNoSceneCompositionEndpointMultiAsse from './pages/GapNoSceneCompositionEndpointMultiAsse';
import GapNoPromptImprovementHelper from './pages/GapNoPromptImprovementHelper';
import GapNoMarketplaceForSellingAssets from './pages/GapNoMarketplaceForSellingAssets';
import GapNoWebhookIntegrationForEngineSync from './pages/GapNoWebhookIntegrationForEngineSync';
import GapNoGameEngineExportUnityUnreal from './pages/GapNoGameEngineExportUnityUnreal';
import GapNoPaymentRoyaltyHandling from './pages/GapNoPaymentRoyaltyHandling';
import GapNoPublicSharingPortfolioPages from './pages/GapNoPublicSharingPortfolioPages';
import GapNoFileUploadPipelineDetectedBeyond from './pages/GapNoFileUploadPipelineDetectedBeyond';
import GapNoRealTimeCollaboration from './pages/GapNoRealTimeCollaboration';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Invalid token');
          return res.json();
        })
        .then((data) => setUser(data.user || data))
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        });
    }
  }, [token]);

  const handleLogin = (userData, tokenValue) => {
    localStorage.setItem('token', tokenValue);
    setToken(tokenValue);
    setUser(userData);
    showToast('Welcome back!');
    navigate('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    showToast('Logged out successfully');
    navigate('/login');
  };

  const apiFetch = useCallback(
    async (url, options = {}) => {
      const res = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        if (res.status === 429) {
          throw new Error(err.error || 'AI rate limit exceeded. Max 20 requests/hour.');
        }
        throw new Error(err.error || err.message || 'Request failed');
      }
      return res.json();
    },
    [token]
  );

  return (
    <div className="app">
      {token && user && <Navbar user={user} onLogout={handleLogout} />}

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span className="toast-icon">
            {toast.type === 'success' ? '\u2713' : toast.type === 'error' ? '\u2717' : '\u2139'}
          </span>
          {toast.message}
        </div>
      )}

      <Routes>
        <Route
          path="/login"
          element={
            token && user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} showToast={showToast} />
          }
        />
        <Route
          path="/dashboard"
          element={
            token ? <Dashboard apiFetch={apiFetch} showToast={showToast} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/category/:name"
          element={
            token ? <CategoryPage apiFetch={apiFetch} showToast={showToast} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/collections"
          element={
            token ? <CollectionsPage apiFetch={apiFetch} showToast={showToast} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/ai-tools"
          element={
            token ? <AIToolsPage apiFetch={apiFetch} showToast={showToast} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/asset-collab"
          element={
            token ? <AssetCollabPage apiFetch={apiFetch} showToast={showToast} /> : <Navigate to="/login" />
          }
        />
          {/* // === Batch 04 Gaps & Frontend Mounts === */}
          <Route path="/cf-agentic-asset-pipeline-turning-a-game" element={<CfAgenticAssetPipelineTurningAGame />} />
          <Route path="/cf-style-consistency-enforcer-flagging-outl" element={<CfStyleConsistencyEnforcerFlaggingOutl />} />
          <Route path="/cf-performance-optimization-advisor-analyzi" element={<CfPerformanceOptimizationAdvisorAnalyzi />} />
          <Route path="/cf-marketplace-licensing-layer-with-image-s" element={<CfMarketplaceLicensingLayerWithImageS />} />
          <Route path="/cf-animation-retargeting-ai-reusing-animati" element={<CfAnimationRetargetingAiReusingAnimati />} />
          <Route path="/cf-unityunreal-export-plugin-with-correct-p" element={<CfUnityunrealExportPluginWithCorrectP />} />
          <Route path="/gap-no-style-transfer-endpoint-apply-art" element={<GapNoStyleTransferEndpointApplyArt />} />
          <Route path="/gap-no-animation-generation-endpoint-rigging" element={<GapNoAnimationGenerationEndpointRigging />} />
          <Route path="/gap-no-texture-refinement-endpoint" element={<GapNoTextureRefinementEndpoint />} />
          <Route path="/gap-no-scene-composition-endpoint-multi-asse" element={<GapNoSceneCompositionEndpointMultiAsse />} />
          <Route path="/gap-no-prompt-improvement-helper" element={<GapNoPromptImprovementHelper />} />
          <Route path="/gap-no-marketplace-for-selling-assets" element={<GapNoMarketplaceForSellingAssets />} />
          <Route path="/gap-no-webhook-integration-for-engine-sync" element={<GapNoWebhookIntegrationForEngineSync />} />
          <Route path="/gap-no-game-engine-export-unity-unreal" element={<GapNoGameEngineExportUnityUnreal />} />
          <Route path="/gap-no-payment-royalty-handling" element={<GapNoPaymentRoyaltyHandling />} />
          <Route path="/gap-no-public-sharing-portfolio-pages" element={<GapNoPublicSharingPortfolioPages />} />
          <Route path="/gap-no-file-upload-pipeline-detected-beyond" element={<GapNoFileUploadPipelineDetectedBeyond />} />
          <Route path="/gap-no-real-time-collaboration" element={<GapNoRealTimeCollaboration />} />

        <Route path="*" element={<Navigate to={token ? '/dashboard' : '/login'} />} />
      </Routes>
    </div>
  );
}

export default App;
