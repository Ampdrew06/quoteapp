import React from 'react';

export default function QuotationOutline({
  editable, points, x, y, width, height, fill, stroke, strokeWidth,
}) {
  if (!editable) {
    return points
      ? <polygon points={points.map(point => point.join(',')).join(' ')} {...{fill, stroke, strokeWidth}} />
      : <rect {...{x, y, width, height, fill, stroke, strokeWidth}} />;
  }

  const corners = points ?? [[x, y], [x + width, y], [x + width, y + height], [x, y + height]];
  const channels = stroke.slice(1).match(/../g).map(channel => parseInt(channel, 16));
  return <>
    {fill !== 'none' && <polygon points={corners.map(point => point.join(',')).join(' ')} fill={fill} />}
    {corners.map(([x1, y1], index) => {
      const [x2, y2] = corners[(index + 1) % corners.length];
      // Distinct paint colours prevent adjacent edges being grouped in PDF export.
      const colour = channels.map(value => Math.max(0, Math.min(255, value + index - Math.floor(corners.length / 2))));
      return <line key={index} {...{x1, y1, x2, y2, strokeWidth}} stroke={`rgb(${colour.join(',')})`} strokeLinecap="square" />;
    })}
  </>;
}
