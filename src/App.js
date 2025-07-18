// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';


import logo from './TIMBERLITE LOGO SMALL.jpg'; // make sure to put the logo file in src/

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
  const navigate = useNavigate();

  const handleRoofSelect = (design) => {
    navigate(`/design/${design.toLowerCase().replace(/\s+/g, '-')}`);
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <img src={logo} alt="Timberlite Logo" style={{ width: '100%', maxWidth: 400, marginBottom: 20 }} />
      <h1>Welcome to Timberlite Roof Quote App</h1>

      <TradeLogin />

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

function TradeLogin() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loggedIn, setLoggedIn] = React.useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Placeholder: Add real auth logic later
    if (email && password) {
      setLoggedIn(true);
    }
  };

  if (loggedIn) {
    return <p style={{ marginBottom: 20 }}>Logged in as {email}</p>;
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 30 }}>
      <h3>Trade Login (optional)</h3>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ marginRight: 10, padding: 8, width: 200 }}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ marginRight: 10, padding: 8, width: 200 }}
        required
      />
      <button type="submit" style={{ padding: '8px 16px' }}>
        Login
      </button>
    </form>
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
