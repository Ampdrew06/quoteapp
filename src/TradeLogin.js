import React, { useState, useEffect } from 'react';
import {
  findCustomerByLoginCode,
  setCurrentCustomer,
  getCurrentCustomer,
  logoutCustomer,
} from "./lib/customers";

export default function TradeLogin({ onLogin }) {
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
  const existing = getCurrentCustomer();

  if (existing) {
    setLoggedInUser({
      name: existing.name,
      discount: existing.discountPct,
    });

    if (onLogin) onLogin(existing.discountPct || 0);
  }
}, []);

  const toggleLogin = () => {
    setShowLogin(!showLogin);
    setError('');
  };

  const handleSubmit = (e) => {
  e.preventDefault();

  const customer = findCustomerByLoginCode(password); // using password field as code

  if (customer) {
    setLoggedInUser({
      name: customer.name,
      discount: customer.discountPct,
    });

    setCurrentCustomer(customer);

    if (onLogin) onLogin(customer.discountPct || 0);

    setError("");
    setShowLogin(false);
  } else {
    setError("Invalid login code");
  }
};

  const handleLogout = () => {
  setLoggedInUser(null);
  logoutCustomer();
  if (onLogin) onLogin(null);
};

  if (loggedInUser) {
    return (
      <div style={{ marginBottom: 20 }}>
        <p>
          <p>
  Logged in as <strong>{loggedInUser.name}</strong>
</p>
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
            type="text"
            placeholder="Username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
