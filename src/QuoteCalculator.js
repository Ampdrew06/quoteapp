import React, { useState, useEffect } from 'react';

function calculateRoofPrice({
  width,
  projection,
  tileType = 'standard',
  fasciaType = 'white',
  gutterType = 'square',
  isTrade = false,
  tradeDiscount = 0,
}) {
  const area = width * projection;
  let pricePerM2 = -5 * area + 380;
  if (pricePerM2 < 230) pricePerM2 = 230;

  let basePrice = area * pricePerM2;

  const tileMultiplier = tileType === 'premium' ? 1.15 : 1.0;
  const fasciaMultiplier = fasciaType === 'foiled' ? 1.1 : 1.0;
  const gutterMultiplier = gutterType === 'ogee' ? 1.12 : 1.0;

  let priceWithOptions = basePrice * tileMultiplier * fasciaMultiplier * gutterMultiplier;

  let netPrice = priceWithOptions;
  if (isTrade) {
    netPrice = netPrice * (1 - tradeDiscount);
  }

  const grossPrice = netPrice * 1.2;

  return {
    netPrice: netPrice.toFixed(2),
    grossPrice: grossPrice.toFixed(2),
    area: area.toFixed(2),
  };
}

export default function QuoteCalculator({ tradeDiscount, isTrade }) {
  const [width, setWidth] = useState(3.5);
  const [projection, setProjection] = useState(4);
  const [tileType, setTileType] = useState('standard');
  const [fasciaType, setFasciaType] = useState('white');
  const [gutterType, setGutterType] = useState('square');
  const [quote, setQuote] = useState({ netPrice: '0.00', grossPrice: '0.00', area: '0.00' });

  useEffect(() => {
    if (width > 0 && projection > 0) {
      const result = calculateRoofPrice({
        width,
        projection,
        tileType,
        fasciaType,
        gutterType,
        isTrade,
        tradeDiscount,
      });
      setQuote(result);
    } else {
      setQuote({ netPrice: '0.00', grossPrice: '0.00', area: '0.00' });
    }
  }, [width, projection, tileType, fasciaType, gutterType, isTrade, tradeDiscount]);

  return (
    <div style={{ maxWidth: 600, margin: '20px auto', padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h2>Quote Calculator</h2>
      <div style={{ marginBottom: 15 }}>
        <label>
          Width (m):{' '}
          <input
            type="number"
            step="0.1"
            min="0"
            value={width}
            onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
            style={{ width: 80 }}
          />
        </label>
      </div>
      <div style={{ marginBottom: 15 }}>
        <label>
          Projection (m):{' '}
          <input
            type="number"
            step="0.1"
            min="0"
            value={projection}
            onChange={(e) => setProjection(parseFloat(e.target.value) || 0)}
            style={{ width: 80 }}
          />
        </label>
      </div>
      <div style={{ marginBottom: 15 }}>
        <label>
          Tile Type:{' '}
          <select value={tileType} onChange={(e) => setTileType(e.target.value)}>
            <option value="standard">Standard</option>
            <option value="premium">Premium (+15%)</option>
          </select>
        </label>
      </div>
      <div style={{ marginBottom: 15 }}>
        <label>
          Fascia/Soffit:{' '}
          <select value={fasciaType} onChange={(e) => setFasciaType(e.target.value)}>
            <option value="white">White (standard)</option>
            <option value="foiled">Foiled (+10%)</option>
          </select>
        </label>
      </div>
      <div style={{ marginBottom: 15 }}>
        <label>
          Gutter Type:{' '}
          <select value={gutterType} onChange={(e) => setGutterType(e.target.value)}>
            <option value="square">Square (standard)</option>
            <option value="round">Round (standard)</option>
            <option value="ogee">Ogee (+12%)</option>
          </select>
        </label>
      </div>

      <hr />

      <div style={{ marginTop: 20 }}>
        <p>Area: {quote.area} m²</p>
        <p>Net Price (trade): £{quote.netPrice}</p>
        <p>Gross Price (public): £{quote.grossPrice}</p>
      </div>
    </div>
  );
}
