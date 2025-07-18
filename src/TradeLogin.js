import React, { useState } from 'react';

const mockUsers = {
  'trade1@example.com': { password: 'password123', discount: 0.2 },
  'trade2@example.com': { password: 'securepass', discount: 0.15 },
};

export default function TradeLogin({ onLogin }) {
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [error, setError] = useState('');

  const toggleLogin = () => {
    setShowLogin(!showLogin);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const user = mockUsers[email.toLowerCase()];
    if (user && user.password === password) {
      setLoggedInUser({ email, discount: user.discount });
      setError('');
      if (onLogin) onLogin(user.discount);
      setShowLogin(false);
    } else {
      setError('Invalid email or password');
    }
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    if (onLogin) onLogin(null);
  };

  if (loggedInUser) {
    return (
      <div style={{ marginBottom: 20 }}>
        <p>
          Logged in as <strong>{loggedInUser.email}</strong> (Trade discount: {(loggedInUser.discount * 100).toFixed(0)}%)
        </p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 30 }}>
      <button onClick={toggleLogin} style={{ marginBottom: 10 }}>
        {showLogin ? 'Hide Trade Login' : 'Trade Login'}
      </button>
      {showLogin && (
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ marginRight: 10, padding: 8, width: 200 }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ marginRight: 10, padding: 8, width: 200 }}
          />
          <button type="submit" style={{ padding: '8px 16px' }}>
            Login
          </button>
          {error && <p style={{ color: 'red', marginTop: 10 }}>{error}</p>}
        </form>
      )}
    </div>
  );
}
