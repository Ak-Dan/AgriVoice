import React from 'react';

/*
  Stylized regional heatmap — no external data, no projection, cannot fail to render.
  Schematic positions for the three countries; bubbles sized + coloured by pressure.
  (Not true geography — a reliable visual stand-in. Swap for a real choropleth later
   once the source GeoJSON is cleaned of its malformed feature.)
*/

interface Props {
  pressureByName: Record<string, number>;
  country: 'All' | 'Kenya' | 'Ethiopia' | 'Nigeria';
}

// Schematic layout (0..100 box). Names match the simulation's active regions.
const LAYOUT: { name: string; country: string; x: number; y: number }[] = [
  { name: 'Uasin Gishu', country: 'Kenya', x: 30, y: 46 },
  { name: 'Trans Nzoia', country: 'Kenya', x: 26, y: 40 },
  { name: 'Bungoma', country: 'Kenya', x: 22, y: 44 },
  { name: 'Kakamega', country: 'Kenya', x: 24, y: 50 },
  { name: 'Nakuru', country: 'Kenya', x: 34, y: 52 },
  { name: 'Meru', country: 'Kenya', x: 40, y: 48 },
  { name: 'Turkana', country: 'Kenya', x: 30, y: 32 },
  { name: 'Oromia', country: 'Ethiopia', x: 52, y: 24 },
  { name: 'Amhara', country: 'Ethiopia', x: 50, y: 14 },
  { name: 'SNNPR', country: 'Ethiopia', x: 48, y: 30 },
  { name: 'Tigray', country: 'Ethiopia', x: 54, y: 8 },
  { name: 'Oyo', country: 'Nigeria', x: 74, y: 44 },
  { name: 'Benue', country: 'Nigeria', x: 82, y: 42 },
  { name: 'Kaduna', country: 'Nigeria', x: 80, y: 32 },
  { name: 'Kano', country: 'Nigeria', x: 82, y: 24 },
  { name: 'Plateau', country: 'Nigeria', x: 84, y: 36 },
  { name: 'Cross River', country: 'Nigeria', x: 86, y: 52 },
  { name: 'Niger', country: 'Nigeria', x: 76, y: 34 },
];

const ZONES = [
  { name: 'Kenya', x: 16, y: 26, w: 32, h: 36 },
  { name: 'Ethiopia', x: 44, y: 4, w: 18, h: 34 },
  { name: 'Nigeria', x: 68, y: 18, w: 26, h: 42 },
];

function colorFor(p: number) {
  if (p >= 70) return '#dc2626';
  if (p >= 50) return '#f97316';
  if (p >= 30) return '#fbbf24';
  if (p >= 15) return '#86efac';
  return '#16a34a';
}

const GeoChoropleth: React.FC<Props> = ({ pressureByName, country = 'All' }) => {
  const regions = LAYOUT.filter((r) => country === 'All' || r.country === country);
  const zones = ZONES.filter((z) => country === 'All' || z.name === country);

  return (
    <div style={{ background: '#f0fdf4', borderRadius: 14, padding: 8 }}>
      <svg viewBox="0 0 100 64" style={{ width: '100%', height: 'auto', display: 'block' }}>
        {zones.map((z) => (
          <g key={z.name}>
            <rect x={z.x} y={z.y} width={z.w} height={z.h} rx={3} fill="#ffffff" stroke="#bbf7d0" strokeWidth={0.4} />
            <text x={z.x + 2} y={z.y + 4} fill="#166534" fontSize={2.4} fontWeight={700}>{z.name}</text>
          </g>
        ))}
        {regions.map((r) => {
          const p = pressureByName[r.name] ?? 0;
          const radius = 0.9 + (p / 100) * 2.2;
          const col = colorFor(p);
          return (
            <g key={r.name}>
              <circle cx={r.x} cy={r.y} r={radius + 0.8} fill={col} opacity={0.16} />
              <circle cx={r.x} cy={r.y} r={radius} fill={col} opacity={0.92}>
                {p >= 70 && <animate attributeName="opacity" values="0.92;0.5;0.92" dur="1.8s" repeatCount="indefinite" />}
              </circle>
              <text x={r.x} y={r.y - radius - 1} fill="#14532d" fontSize={1.8} textAnchor="middle" fontWeight={700}>{r.name}</text>
              <text x={r.x} y={r.y + 0.5} fill="#ffffff" fontSize={1.4} textAnchor="middle" fontWeight={800}>{Math.round(p)}</text>
              <title>{`${r.name}: ${Math.round(p)}/100`}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default GeoChoropleth;
