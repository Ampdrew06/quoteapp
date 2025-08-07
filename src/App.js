import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
  useParams,
  useLocation,
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

// Edwardian detailed form component
function EdwardianForm({ tradeDiscount, isTrade }) {
  const navigate = useNavigate();

  const [internalWidth, setInternalWidth] = useState('');
  const [internalProjection, setInternalProjection] = useState('');
  const [pitch, setPitch] = useState(25);
  const [frameThickness, setFrameThickness] = useState(70);
  const [soffitDepth, setSoffitDepth] = useState(150);
  const [maxHeight, setMaxHeight] = useState('');
  const [tileType, setTileType] = useState('Britmet');
  const [fasciaColour, setFasciaColour] = useState('white');
  const [gutterType, setGutterType] = useState('Square');
  const [gutterColour, setGutterColour] = useState('White');

  const handleSubmit = (e) => {
    e.preventDefault();

    // Navigate to Geometry page passing form data as state
    navigate('/geometry', {
      state: {
        internalWidth: Number(internalWidth),
        internalProjection: Number(internalProjection),
        pitch: Number(pitch),
        frameThickness: Number(frameThickness),
        soffitDepth: Number(soffitDepth),
        maxHeight: maxHeight ? Number(maxHeight) : '',
        tileType,
        fasciaColour,
        gutterType,
        gutterColour,
        tradeDiscount,
        isTrade,
      },
    });
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
      <h2>Edwardian Roof Configuration</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Internal Width (mm):
          <input
            type="number"
            required
            value={internalWidth}
            onChange={(e) => setInternalWidth(e.target.value)}
            style={{ width: 120, marginLeft: 10 }}
          />
        </label>
        <br />
        <label>
          Internal Projection (mm):
          <input
            type="number"
            required
            value={internalProjection}
            onChange={(e) => setInternalProjection(e.target.value)}
            style={{ width: 120, marginLeft: 10 }}
          />
        </label>
        <br />
        <label>
          Pitch (degrees):
          <input
            type="number"
            step="0.1"
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
            style={{ width: 80, marginLeft: 10 }}
          />
        </label>
        <br />
        <label>
          Frame Thickness (mm):
          <input
            type="number"
            value={frameThickness}
            onChange={(e) => setFrameThickness(e.target.value)}
            style={{ width: 80, marginLeft: 10 }}
          />
        </label>
        <br />
        <label>
          Soffit Depth (mm):
          <input
            type="number"
            value={soffitDepth}
            onChange={(e) => setSoffitDepth(e.target.value)}
            style={{ width: 80, marginLeft: 10 }}
          />
        </label>
        <br />
        <label>
          Max Finished Height (mm, optional):
          <input
            type="number"
            value={maxHeight}
            onChange={(e) => setMaxHeight(e.target.value)}
            style={{ width: 100, marginLeft: 10 }}
          />
        </label>
        <br />
        <label>
          Tile Type:
          <select
            value={tileType}
            onChange={(e) => setTileType(e.target.value)}
            style={{ marginLeft: 10 }}
          >
            <option value="Britmet">Britmet</option>
            <option value="Liteslate">Liteslate</option>
          </select>
        </label>
        <br />
        <label>
          Fascia/Soffit Colour:
          <select
            value={fasciaColour}
            onChange={(e) => setFasciaColour(e.target.value)}
            style={{ marginLeft: 10 }}
          >
            <option value="white">White</option>
            <option value="foiled">Foiled</option>
          </select>
        </label>
        <br />
        <label>
          Gutter Type:
          <select
            value={gutterType}
            onChange={(e) => setGutterType(e.target.value)}
            style={{ marginLeft: 10 }}
          >
            <option value="Square">Square</option>
            <option value="Round">Round</option>
            <option value="Ogee">Ogee</option>
          </select>
        </label>
        <br />
        <label>
          Gutter Colour:
          <select
            value={gutterColour}
            onChange={(e) => setGutterColour(e.target.value)}
            style={{ marginLeft: 10 }}
          >
            <option value="White">White</option>
            <option value="Black">Black</option>
            <option value="Brown">Brown</option>
            <option value="Light Oak">Light Oak</option>
            <option value="Anthracite">Anthracite</option>
          </select>
        </label>
        <br />
        <button
          type="submit"
          style={{ marginTop: 10, padding: '8px 15px', cursor: 'pointer' }}
        >
          Calculate Geometry
        </button>
      </form>
      <br />
      <Link to="/">← Back to Home</Link>
    </div>
  );
}

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
  const { design: designParam } = useParams();

  // Only render Edwardian form with inputs; fallback to QuoteCalculator for others
  if (designParam === 'edwardian') {
    return <EdwardianForm tradeDiscount={tradeDiscount} isTrade={isTrade} />;
  }
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
