import React from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand" onClick={() => navigate('/dashboard')}>
          <span className="navbar-logo">&#x1F3AE;</span>
          <span className="navbar-title">AI Game Assets</span>
        </div>

        <div className="navbar-center" style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>
            Dashboard
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/collections')}>
            &#x1F4DA; Collections
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/ai-tools')}>
            &#x2728; AI Tools
          </button>
          <button className="btn btn-ghost btn-sm" data-testid="nav-asset-views" onClick={() => navigate('/custom-views')}>
            &#x1F4CA; Asset Views
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/sprite-atlas-budget')}>
            Atlas Budget
          </button>
        </div>

        <div className="navbar-right">
          <div className="navbar-user">
            <div className="user-avatar">
              {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <span className="user-name">{user?.name || user?.email}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    
        {/* // === Batch 04 Gaps & Frontend Mounts === */}
        <div style={{ borderTop: '1px solid #eee', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
        <a href="/custom-views" data-testid="sidebar-asset-views" style={{ display: "block", padding: "0.4rem 0.6rem", fontSize: "0.85rem", fontWeight: 600 }}>&#x1F4CA; Asset Views</a>
        <a href="/sprite-atlas-budget" style={{ display: "block", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>Sprite Atlas Budget</a>
        <a href="/cf-agentic-asset-pipeline-turning-a-game" style={{ display: "block", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>Agentic asset pipeline turning a game de</a>
        <a href="/cf-style-consistency-enforcer-flagging-outl" style={{ display: "block", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>Style consistency enforcer flagging outl</a>
        <a href="/cf-performance-optimization-advisor-analyzi" style={{ display: "block", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>Performance optimization advisor analyzi</a>
        <a href="/cf-marketplace-licensing-layer-with-image-s" style={{ display: "block", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>Marketplace + licensing layer with image</a>
        <a href="/cf-animation-retargeting-ai-reusing-animati" style={{ display: "block", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>Animation retargeting AI reusing animati</a>
        <a href="/cf-unityunreal-export-plugin-with-correct-p" style={{ display: "block", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>Unity/Unreal export plugin with correct </a>
        <a href="/gap-no-style-transfer-endpoint-apply-art" style={{ display: "block", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>No style-transfer endpoint (apply art st</a>
        <a href="/gap-no-animation-generation-endpoint-rigging" style={{ display: "block", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>No animation-generation endpoint (riggin</a>
        <a href="/gap-no-texture-refinement-endpoint" style={{ display: "block", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>No texture-refinement endpoint</a>
        <a href="/gap-no-scene-composition-endpoint-multi-asse" style={{ display: "block", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>No scene-composition endpoint (multi-ass</a>
        <a href="/gap-no-prompt-improvement-helper" style={{ display: "block", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>No prompt-improvement helper</a>
        <a href="/gap-no-marketplace-for-selling-assets" style={{ display: "block", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>No marketplace for selling assets</a>
        <a href="/gap-no-webhook-integration-for-engine-sync" style={{ display: "block", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>No webhook integration for engine sync</a>
        <a href="/gap-no-game-engine-export-unity-unreal" style={{ display: "block", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>No game engine export (Unity / Unreal pi</a>
        <a href="/gap-no-payment-royalty-handling" style={{ display: "block", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>No payment / royalty handling</a>
        <a href="/gap-no-public-sharing-portfolio-pages" style={{ display: "block", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>No public sharing / portfolio pages</a>
        <a href="/gap-no-file-upload-pipeline-detected-beyond" style={{ display: "block", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>No file upload pipeline detected beyond </a>
        <a href="/gap-no-real-time-collaboration" style={{ display: "block", padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>No real-time collaboration</a>
        </div>
</nav>
  );
};

export default Navbar;
