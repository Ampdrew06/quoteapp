import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import TradeLogin from './TradeLogin'; // Make sure this path matches your file location
import logo from './TIMBERLITE LOGO SMALL.jpg';

// Sample roof designs
const roofDesigns = [
  'Lean-To',
  'Hipped Lean-To',
  'Double Hipped Lean-To',
  'Gable',
  'Edwardian',
  'Victorian',
];

function Home() {
  const [tradeDiscount, setTradeDiscount] = useState(null);
  const navigate = useNavigate();

  const handleRoofSelect = (design) => {
    navigate(`/design/${design.toLowerCase().replace(/\s+/g, '-')}`);
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <img src={logo} alt="Timberlite Logo" style={{ width: '100%', maxWidth: 400, marginBottom: 20, display: 'block', marginLeft: 'auto', marginRight: 'auto' }} />
      <h1 style={{ textAlign: 'center' }}>Welcome to Timberlite Roof Quote App</h1>

      <TradeLogin onLogin={setTradeDiscount} />

      {tradeDiscount !== null && (
        <p style={{ textAlign: 'center', fontWeight: 'bold' }}>
          Trade discount active: {(tradeDiscount * 100).toFixed(0)}%
        </p>
      )}

      <h2>Select a Roof Design</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {roofDesigns.map((design) => (
          <button
            key={design}
            onClick={() => handleRoofSelect(design)}
            style={{
              padding: '10px 20px',
              cursor: 'pointer',
              borderRadius: 5,
              border: '1px solid #333',
              background: '#eee',
              flex: '1 1 45%',
              minWidth: 120,
            }}
          >
            {design}
          </button>
        ))}
      </div>
    </div>
  );
}

function DesignForm({ design }) {
  // Placeholder form page when a roof design is selected
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
      <h2>{design.replace(/-/g, ' ')} Dimensions & Options</h2>
      <p>This is where input fields for dimensions and options will go.</p>
      <Link to="/">← Back to Home</Link>
    </div>
  );
}

function DesignPage() {
  const { design } = useParams();
  return <DesignForm design={design} />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/design/:design" element={<DesignPage />} />
      </Routes>
    </Router>
  );
}
