import React, { useState, useEffect, useMemo, useRef } from 'react';
import GeoChoropleth from './GeoChoropleth';

/*
  Agrivoice Surveillance Dashboard (English-only, fully simulated).
  Seeded simulation engine -> correlated, live-feeling time-series.
  When live: replace engine output with real API data of the same shape,
  and (later) feed real /infer diagnoses into the inquiry panel.
*/

function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

const COUNTRIES = ['Kenya', 'Ethiopia', 'Nigeria'] as const;
type Country = typeof COUNTRIES[number];

interface Region {
  id: string; name: string; country: Country;
  humidity: number; crop: string;
}

/*
  Active-surveillance regions (Option B). `name` matches the real geoBoundaries
  ADM1 shapeName EXACTLY (verified from the console log), so the choropleth colours
  the correct region. The other ~80 ADM1 units that are not listed here are treated
  as a calm baseline by the map (see baselineFor in the dashboard), reflecting that
  active outbreaks are localized rather than nationwide.

  humidity values are reasoned estimates (wetter highlands/south higher, arid north
  lower) — verify against climate data before citing specific figures in a report.
*/
const REGIONS: Region[] = [
  { id: 'KE-UAS', name: "Uasin Gishu", country: 'Kenya', humidity: 0.70, crop: 'Maize' },
  { id: 'KE-TNZ', name: "Trans Nzoia", country: 'Kenya', humidity: 0.74, crop: 'Maize' },
  { id: 'KE-BUN', name: "Bungoma", country: 'Kenya', humidity: 0.78, crop: 'Maize' },
  { id: 'KE-KAK', name: "Kakamega", country: 'Kenya', humidity: 0.80, crop: 'Maize' },
  { id: 'KE-NAK', name: "Nakuru", country: 'Kenya', humidity: 0.58, crop: 'Tomato' },
  { id: 'KE-MER', name: "Meru", country: 'Kenya', humidity: 0.62, crop: 'Potato' },
  { id: 'KE-TUR', name: "Turkana", country: 'Kenya', humidity: 0.20, crop: 'Maize' },
  { id: 'ET-ORO', name: "Oromia", country: 'Ethiopia', humidity: 0.58, crop: 'Maize' },
  { id: 'ET-AMH', name: "Amhara", country: 'Ethiopia', humidity: 0.50, crop: 'Potato' },
  { id: 'ET-SNN', name: "SNNPR", country: 'Ethiopia', humidity: 0.70, crop: 'Maize' },
  { id: 'ET-TIG', name: "Tigray", country: 'Ethiopia', humidity: 0.34, crop: 'Tomato' },
  { id: 'NG-OYO', name: "Oyo", country: 'Nigeria', humidity: 0.66, crop: 'Maize' },
  { id: 'NG-BEN', name: "Benue", country: 'Nigeria', humidity: 0.72, crop: 'Maize' },
  { id: 'NG-KAD', name: "Kaduna", country: 'Nigeria', humidity: 0.52, crop: 'Maize' },
  { id: 'NG-KAN', name: "Kano", country: 'Nigeria', humidity: 0.36, crop: 'Tomato' },
  { id: 'NG-PLA', name: "Plateau", country: 'Nigeria', humidity: 0.60, crop: 'Potato' },
  { id: 'NG-CRS', name: "Cross River", country: 'Nigeria', humidity: 0.84, crop: 'Tomato' },
  { id: 'NG-NIG', name: "Niger", country: 'Nigeria', humidity: 0.58, crop: 'Maize' },
];

type Tier = 'warning' | 'critical';
interface Alert {
  id: string; regionId: string; region: string; country: Country;
  tier: Tier; disease: string; pressure: number; day: number; message: string;
}
interface Snapshot {
  day: number;
  pressure: Record<string, number>;
  history: Record<Country, number[]>;
  weather: Record<Country, { rain: number; hum: number }>;
  inquiriesToday: number;
  inquiryHistory: number[];
  alerts: Alert[];
}

function pickDisease(region: Region, rand: () => number) {
  if (region.crop === 'Tomato') return rand() > 0.5 ? 'Tomato Late Blight' : 'Common Rust';
  if (region.crop === 'Potato') return 'Potato Early Blight';
  const o = ['Northern Leaf Blight', 'Common Rust', 'Gray Leaf Spot'];
  return o[Math.floor(rand() * o.length)];
}

function makeEngine(seed: number) {
  const rand = mulberry32(seed);
  const pressure: Record<string, number> = {};
  REGIONS.forEach((r) => { pressure[r.id] = 8 + rand() * 12 + r.humidity * 25; });
  pressure['KE-KAK'] = 64; pressure['NG-CRS'] = 58;  // seeded outbreaks (humid zones)

  // Clustering: regions in the same country are treated as neighbours, so pressure
  // bleeds within a country (no schematic x/y coordinates needed anymore).
  const neighbours: Record<string, string[]> = {};
  REGIONS.forEach((a) => {
    neighbours[a.id] = REGIONS
      .filter((b) => b.country === a.country && b.id !== a.id)
      .map((b) => b.id);
  });

  let day = 0;
  const history: Record<Country, number[]> = { Kenya: [], Ethiopia: [], Nigeria: [] };
  const weather: Record<Country, { rain: number; hum: number }> = {
    Kenya: { rain: 0, hum: 0 }, Ethiopia: { rain: 0, hum: 0 }, Nigeria: { rain: 0, hum: 0 },
  };
  COUNTRIES.forEach((c) => { weather[c] = { rain: 40 + rand() * 30, hum: 55 + rand() * 15 }; });
  let inquiriesToday = 0;
  const inquiryHistory: number[] = [];
  const alerts: Alert[] = [];

  function pushAlert(region: Region, tier: Tier, p: number) {
    const disease = pickDisease(region, rand);
    alerts.unshift({
      id: `${region.id}-${day}-${Math.floor(rand() * 1000)}`,
      regionId: region.id, region: region.name, country: region.country,
      tier, disease, pressure: Math.round(p), day,
      message: tier === 'critical'
        ? `${disease} pressure critical in ${region.name}. Advise immediate fungicide rotation and field scouting.`
        : `Rising ${disease} risk in ${region.name}. Recommend preventive monitoring within 7 days.`,
    });
    if (alerts.length > 12) alerts.pop();
  }

  function step() {
    day += 1;
    COUNTRIES.forEach((c) => {
      const seasonal = Math.sin((day / 30) * Math.PI * 2) * 18;
      weather[c].rain = clamp(weather[c].rain + (rand() - 0.45) * 12 + seasonal * 0.3, 5, 120);
      weather[c].hum = clamp(weather[c].hum + (rand() - 0.5) * 6 + seasonal * 0.15, 30, 95);
    });
    REGIONS.forEach((r) => {
      const w = weather[r.country];
      const wf = ((w.rain / 120) * 0.6 + (w.hum / 100) * 0.4) * r.humidity * 6;
      const neigh = neighbours[r.id].reduce((s, id) => s + pressure[id], 0) / (neighbours[r.id].length || 1);
      const spread = (neigh - pressure[r.id]) * 0.06;
      const decay = -pressure[r.id] * 0.04;
      const noise = (rand() - 0.5) * 4;
      pressure[r.id] = clamp(pressure[r.id] + wf + spread + decay + noise, 0, 100);
    });
    COUNTRIES.forEach((c) => {
      const regs = REGIONS.filter((r) => r.country === c);
      const avg = regs.reduce((s, r) => s + pressure[r.id], 0) / regs.length;
      history[c].push(Math.round(avg));
      if (history[c].length > 30) history[c].shift();
    });
    const natAvg = COUNTRIES.reduce((s, c) => s + (history[c][history[c].length - 1] || 0), 0) / 3;
    inquiriesToday = Math.round(40 + natAvg * 2.4 + rand() * 30);
    inquiryHistory.push(inquiriesToday);
    if (inquiryHistory.length > 30) inquiryHistory.shift();
    REGIONS.forEach((r) => {
      const p = pressure[r.id];
      const last = alerts.find((a) => a.regionId === r.id);
      if (p >= 70 && (!last || last.tier !== 'critical')) pushAlert(r, 'critical', p);
      else if (p >= 50 && p < 70 && (!last || last.tier !== 'critical')) pushAlert(r, 'warning', p);
    });
  }

  for (let i = 0; i < 18; i++) step();

  return {
    step,
    snapshot(): Snapshot {
      return {
        day,
        pressure: { ...pressure },
        history: { Kenya: [...history.Kenya], Ethiopia: [...history.Ethiopia], Nigeria: [...history.Nigeria] },
        weather: JSON.parse(JSON.stringify(weather)),
        inquiriesToday,
        inquiryHistory: [...inquiryHistory],
        alerts: alerts.map((a) => ({ ...a })),
      };
    },
  };
}

const T = {
  ink: '#14532d', ink2: '#166534', accent: '#22c55e', accent2: '#16a34a',
  mint: '#f0fdf4', card: '#ffffff', border: '#d1fadf', dim: '#6B7280',
  low: '#16a34a', med: '#e0a92e', high: '#ea7a3c', crit: '#DC2626',
  pageBg: 'linear-gradient(160deg,#f0fdf4 0%,#fefce8 60%,#ecfdf5 100%)',
  shadow: '0 4px 32px rgba(34,197,94,0.13),0 1px 4px rgba(0,0,0,0.05)',
};
function tierColor(p: number) { if (p >= 70) return T.crit; if (p >= 50) return T.high; if (p >= 30) return T.med; return T.low; }
function tierLabel(p: number) { if (p >= 70) return 'Critical'; if (p >= 50) return 'High'; if (p >= 30) return 'Moderate'; return 'Low'; }

const Spark: React.FC<{ data: number[]; color: string; width?: number; height?: number }> = ({ data, color, width = 70, height = 28 }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data), min = Math.min(...data); const range = max - min || 1;
  const pts = data.map((v, i) => `${((i / (data.length - 1)) * width).toFixed(1)},${(height - ((v - min) / range) * (height - 4) - 2).toFixed(1)}`).join(' ');
  return <svg width={width} height={height} style={{ display: 'block' }}><polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" /></svg>;
};

const Metric: React.FC<any> = ({ label, value, suffix, sub, color, spark, small }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: '16px 18px', boxShadow: T.shadow }}>
    <div style={{ fontSize: 12.5, color: T.dim, marginBottom: 7, fontWeight: 600 }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
      <div style={{ fontSize: small ? 19 : 30, fontWeight: 800, color, letterSpacing: '-0.5px' }}>{value}<span style={{ fontSize: 14, color: T.dim, fontWeight: 600 }}>{suffix}</span></div>
      {spark && <Spark data={spark} color={color} />}
    </div>
    {sub && <div style={{ fontSize: 12, color: T.dim, marginTop: 5, fontWeight: 500 }}>{sub}</div>}
  </div>
);

const Panel: React.FC<any> = ({ title, subtitle, children }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, padding: 22, boxShadow: T.shadow }}>
    <div style={{ marginBottom: 14 }}>
      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.ink, letterSpacing: '-0.3px' }}>{title}</h2>
      {subtitle && <p style={{ margin: '3px 0 0', fontSize: 12.5, color: T.dim }}>{subtitle}</p>}
    </div>
    {children}
  </div>
);

const Legend: React.FC = () => {
  const items: [string, string][] = [['Low', T.low], ['Moderate', T.med], ['High', T.high], ['Critical', T.crit]];
  return <div style={{ display: 'flex', gap: 16, marginTop: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
    {items.map(([l, c]) => <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.dim, fontWeight: 600 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />{l}</span>)}
  </div>;
};

const TrendChart: React.FC<{ history: Record<Country, number[]>; country: string }> = ({ history, country }) => {
  const series = country === 'All' ? COUNTRIES.map((c) => ({ name: c, data: history[c] })) : [{ name: country as Country, data: history[country as Country] }];
  const colors: Record<string, string> = { Kenya: '#16a34a', Ethiopia: '#e0a92e', Nigeria: '#2563eb' };
  const W = 100, H = 42; const allVals = series.flatMap((s) => s.data); const max = Math.max(...allVals, 10), min = 0;
  return <div>
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
      {[0.25, 0.5, 0.75].map((g) => <line key={g} x1={0} x2={W} y1={H * g} y2={H * g} stroke="#e4ece7" strokeWidth={0.3} />)}
      {series.map((s) => { if (!s.data.length) return null; const pts = s.data.map((v, i) => `${((i / (s.data.length - 1 || 1)) * W).toFixed(1)},${(H - ((v - min) / (max - min || 1)) * (H - 4) - 2).toFixed(1)}`).join(' '); return <polyline key={s.name} points={pts} fill="none" stroke={colors[s.name]} strokeWidth={1.2} strokeLinejoin="round" />; })}
    </svg>
    <div style={{ display: 'flex', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
      {series.map((s) => <span key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: T.dim, fontWeight: 600 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: colors[s.name] }} />{s.name} {s.data[s.data.length - 1] || 0}</span>)}
    </div>
  </div>;
};

const WeatherReadout: React.FC<{ weather: Record<Country, { rain: number; hum: number }>; country: string }> = ({ weather, country }) => {
  const list = country === 'All' ? COUNTRIES : [country as Country];
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${list.length},1fr)`, gap: 10, marginTop: 14 }}>
    {list.map((c) => <div key={c} style={{ background: T.mint, border: `1px solid ${T.border}`, borderRadius: 12, padding: '10px 12px' }}>
      <div style={{ fontSize: 12, color: T.ink2, marginBottom: 5, fontWeight: 700 }}>{c}</div>
      <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>Rain {Math.round(weather[c].rain)} mm</div>
      <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>Humidity {Math.round(weather[c].hum)}%</div>
    </div>)}
  </div>;
};

const InquiryChart: React.FC<{ data: number[] }> = ({ data }) => {
  const W = 100, H = 42; const max = Math.max(...data, 10); const bw = W / data.length;
  return <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
    {data.map((v, i) => { const hh = (v / max) * (H - 4); return <rect key={i} x={i * bw + 0.5} y={H - hh} width={bw - 1} height={hh} rx={0.6} fill={T.accent} opacity={0.4 + (i / data.length) * 0.55} />; })}
  </svg>;
};

const TrendingDiseases: React.FC<{ alerts: Alert[] }> = ({ alerts }) => {
  const counts: Record<string, number> = {};
  alerts.forEach((a) => { counts[a.disease] = (counts[a.disease] || 0) + 1; });
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const maxC = Math.max(...ranked.map((r) => r[1]), 1);
  return <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
    {ranked.length === 0 && <span style={{ fontSize: 12, color: T.dim }}>No trending diseases yet.</span>}
    {ranked.map(([name, count]) => <div key={name}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 3, color: T.ink, fontWeight: 600 }}><span>{name}</span><span style={{ color: T.dim }}>{count}</span></div>
      <div style={{ height: 6, background: T.mint, borderRadius: 3, overflow: 'hidden' }}><div style={{ width: `${(count / maxC) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#16a34a,#22c55e)', borderRadius: 3 }} /></div>
    </div>)}
  </div>;
};

const SurveillanceDashboard: React.FC = () => {
  const engineRef = useRef<ReturnType<typeof makeEngine> | null>(null);
  if (!engineRef.current) engineRef.current = makeEngine(1337);
  const [snap, setSnap] = useState<Snapshot>(() => engineRef.current!.snapshot());
  const [paused, setPaused] = useState(false);
  const [sel, setSel] = useState<string>('All');

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => { engineRef.current!.step(); setSnap(engineRef.current!.snapshot()); }, 2000);
    return () => clearInterval(t);
  }, [paused]);

  const vis = useMemo(() => REGIONS.filter((r) => sel === 'All' || r.country === sel), [sel]);
  const natAvg = useMemo(() => { const v = vis.map((r) => snap.pressure[r.id]); return Math.round(v.reduce((s, x) => s + x, 0) / v.length); }, [snap, vis]);
  const aa = snap.alerts.filter((a) => sel === 'All' || a.country === sel);
  const crit = aa.filter((a) => a.tier === 'critical').length;
  const hot = [...vis].sort((a, b) => snap.pressure[b.id] - snap.pressure[a.id])[0];

  // pressure keyed by region NAME for the choropleth
  const pressureByName = useMemo(() => {
    const m: Record<string, number> = {};
    REGIONS.forEach((r) => { m[r.name] = snap.pressure[r.id]; });
    return m;
  }, [snap]);

  const btn = (active: boolean): React.CSSProperties => ({
    background: active ? 'linear-gradient(90deg,#16a34a,#22c55e)' : '#fff',
    color: active ? '#fff' : T.ink2, border: `1.5px solid ${active ? 'transparent' : T.border}`,
    padding: '7px 14px', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontWeight: 700,
    boxShadow: active ? '0 2px 10px rgba(34,197,94,0.3)' : 'none',
  });

  return (
    <div style={{ background: T.pageBg, padding: 20, borderRadius: 18, fontFamily: "'Segoe UI',Arial,sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.5rem' }}>🌱</span>
            <h1 style={{ margin: 0, fontSize: 21, fontWeight: 900, color: T.ink, letterSpacing: '-0.5px' }}>Agrivoice Surveillance</h1>
          </div>
          <p style={{ margin: '4px 0 0 32px', color: T.dim, fontSize: 13, fontWeight: 500 }}>
            Crop disease early-warning · Kenya · Ethiopia · Nigeria · sim day {snap.day}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {['All', ...COUNTRIES].map((c) => <button key={c} onClick={() => setSel(c)} style={btn(sel === c)}>{c}</button>)}
          <button onClick={() => setPaused((p) => !p)} style={{ background: '#fff', color: T.ink2, border: `1.5px solid ${T.border}`, padding: '7px 14px', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontWeight: 700 }}>{paused ? '▶ Resume' : '⏸ Pause'}</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 18 }}>
        <Metric label="National pressure index" value={natAvg} suffix="/100" color={tierColor(natAvg)} sub={`${tierLabel(natAvg)} risk`} />
        <Metric label="Active alerts" value={aa.length} color={aa.length ? T.high : T.low} sub={`${crit} critical`} />
        <Metric label="Farmer inquiries today" value={snap.inquiriesToday} color={T.accent2} sub="live feed" spark={snap.inquiryHistory} />
        <Metric label="Hotspot region" value={hot ? hot.name : '—'} small color={hot ? tierColor(snap.pressure[hot.id]) : T.dim} sub={hot ? `${Math.round(snap.pressure[hot.id])}/100 · ${hot.country}` : ''} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 16, marginBottom: 16 }}>
        <Panel title="Disease spread heatmap" subtitle="Region pressure 0–100 · darker = more intense">
          <GeoChoropleth pressureByName={pressureByName} country={sel as any} />
          <Legend />
        </Panel>
        <Panel title="Early-warning alerts" subtitle="Newest first · auto-fires on threshold">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, maxHeight: 360, overflowY: 'auto' }}>
            {aa.length === 0 && <div style={{ color: T.dim, fontSize: 13, padding: '20px 0', textAlign: 'center' }}>No active alerts in this view.</div>}
            {aa.map((a) => <div key={a.id} style={{ background: a.tier === 'critical' ? '#fef2f2' : '#fffbeb', border: `1px solid ${a.tier === 'critical' ? '#fecaca' : '#fde68a'}`, borderLeft: `4px solid ${a.tier === 'critical' ? T.crit : T.high}`, borderRadius: 10, padding: '11px 13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: T.ink }}>{a.region} · {a.country}</span>
                <span style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: a.tier === 'critical' ? T.crit : '#b45309', background: a.tier === 'critical' ? '#fee2e2' : '#fef3c7', padding: '2px 7px', borderRadius: 6 }}>{a.tier}</span>
              </div>
              <div style={{ fontSize: 12.5, color: '#4b5563', lineHeight: 1.45 }}>{a.message}</div>
            </div>)}
          </div>
        </Panel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16 }}>
        <Panel title="Weather → disease pressure" subtitle="National pressure index, last 30 sim-days">
          <TrendChart history={snap.history} country={sel} />
          <WeatherReadout weather={snap.weather} country={sel} />
        </Panel>
        <Panel title="Farmer inquiry traffic" subtitle="Volume + trending diseases">
          <InquiryChart data={snap.inquiryHistory} />
          <TrendingDiseases alerts={snap.alerts} />
        </Panel>
      </div>

      <p style={{ color: T.dim, fontSize: 11.5, marginTop: 16, textAlign: 'center', lineHeight: 1.5 }}>
        Demonstration data from a seeded simulation engine. Patterns mirror expected live behaviour. Not for operational decisions.
      </p>
    </div>
  );
};

export default SurveillanceDashboard;
