import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom';

import TradeLogin from './TradeLogin';
import QuoteCalculator from './QuoteCalculator';
import GeometryPage from './GeometryPage';
import logo from './TIMBERLITE LOGO SMALL.jpg';

const roofDesigns = [
  'Lean-To',
  'Hipped Lean-To',
  'Double Hipped Lean-To',
  'Gable',
  'Edwardian',
  'Victorian',
];

function Home({ onLogin }) {
  const [tradeDiscount, setTradeDiscount] = useState(null);
  const navigate = useNavigate();

  const handleRoofSelect = (design) => {
    navigate(`/design/${design.toLowerCase().replace(/\s+/g, '-')}`);
  };

  const handleLogin = (discount) => {
    setTradeDiscount(discount);
    if (onLogin) onLogin(discount);
  };

  return (
    <div
      style={{
        maxWidth: 600,
        margin: '0 auto',
        padding: 20,
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <img
        src={logo}
        alt="Timberlite Logo"
        style={{
          width: '100%',
          maxWidth: 400,
          marginBottom: 20,
          display: 'block',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      />
      <h1 style={{ textAlign: 'center' }}>
        Welcome to Timberlite Roof Quote App
      </h1>

      <TradeLogin onLogin={handleLogin} />

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

      <Link
        to="/geometry"
        style={{ display: 'block', marginTop: 30, textAlign: 'center' }}
      >
        Go to Geometry & Material Calculator
      </Link>
    </div>
  );
}

function DesignForm({ design, tradeDiscount, isTrade }) {
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
      <h2>{design.replace(/-/g, ' ')} Dimensions & Options</h2>
      <QuoteCalculator tradeDiscount={tradeDiscount} isTrade={isTrade} />
      <Link to="/">← Back to Home</Link>
    </div>
  );
}

function DesignPage({ tradeDiscount, isTrade }) {
  const { design } = useParams();
  return (
    <DesignForm design={design} tradeDiscount={tradeDiscount} isTrade={isTrade} />
  );
}

export default function App() {
  const [tradeDiscount, setTradeDiscount] = useState(null);
  const isTrade = tradeDiscount !== null;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home onLogin={setTradeDiscount} />} />
        <Route
          path="/design/:design"
          element={<DesignPage tradeDiscount={tradeDiscount} isTrade={isTrade} />}
        />
        <Route path="/geometry" element={<GeometryPage />} />
      </Routes>
    </Router>
  );
}
