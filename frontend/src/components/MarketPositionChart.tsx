import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { ScatterChart, RefreshCw } from 'lucide-react';

interface Point {
  id: number; label: string; category: string; stage: string;
  x: number; y: number; valuation_b: number; customers: number;
  capital_efficiency: number | null; incumbent: string | null;
}
interface Resp { points: Point[]; bounds: { max_funding_m: number; max_arr_m: number }; count: number; }

const STAGE_COLORS: Record<string, string> = {
  seed: '#fbbf24', series_a: '#34d399', series_b: '#60a5fa', series_c: '#a78bfa',
  growth: '#f472b6', late: '#fb7185', public: '#f87171',
};

export default function MarketPositionChart() {
  const [data, setData] = useState<Resp | null>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true); setErr('');
    try { setData(await apiFetch('/custom-views/market-position')); }
    catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const W = 720, H = 380, PAD = 50;
  const maxX = data ? Math.max(10, data.bounds.max_funding_m) : 10;
  const maxY = data ? Math.max(10, data.bounds.max_arr_m) : 10;
  const sx = (x: number) => PAD + (x / maxX) * (W - PAD * 2);
  const sy = (y: number) => H - PAD - (y / maxY) * (H - PAD * 2);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ScatterChart className="w-5 h-5 text-violet-400" />
          <h2 className="text-lg font-bold text-white">Market Position</h2>
          <span className="text-xs text-gray-500">Funding (M) vs ARR (M) · bubble = customers</span>
        </div>
        <button onClick={load} className="text-gray-400 hover:text-white"><RefreshCw className="w-4 h-4" /></button>
      </div>
      {err && <div className="text-red-400 text-sm mb-2">{err}</div>}
      {loading && <div className="text-gray-400 text-sm mb-2">Loading…</div>}
      {data && (
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="bg-gray-950 rounded">
          <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#374151" />
          <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="#374151" />
          {[0.25, 0.5, 0.75, 1].map(t => (
            <g key={t}>
              <line x1={sx(maxX * t)} y1={PAD} x2={sx(maxX * t)} y2={H - PAD} stroke="#1f2937" strokeDasharray="3 3" />
              <text x={sx(maxX * t)} y={H - PAD + 14} fill="#6b7280" fontSize="10" textAnchor="middle">${Math.round(maxX * t)}M</text>
              <line x1={PAD} y1={sy(maxY * t)} x2={W - PAD} y2={sy(maxY * t)} stroke="#1f2937" strokeDasharray="3 3" />
              <text x={PAD - 8} y={sy(maxY * t) + 3} fill="#6b7280" fontSize="10" textAnchor="end">${Math.round(maxY * t)}M</text>
            </g>
          ))}
          <text x={W / 2} y={H - 8} fill="#9ca3af" fontSize="11" textAnchor="middle">Total Funding (M)</text>
          <text x={14} y={H / 2} fill="#9ca3af" fontSize="11" textAnchor="middle" transform={`rotate(-90 14 ${H / 2})`}>ARR (M)</text>
          {data.points.map(p => {
            const r = Math.min(20, 4 + Math.sqrt(p.customers || 1) * 0.6);
            const fill = STAGE_COLORS[p.stage] || '#a78bfa';
            return (
              <g key={p.id}>
                <circle cx={sx(p.x)} cy={sy(p.y)} r={r} fill={fill} fillOpacity="0.5" stroke={fill} strokeWidth="1.5">
                  <title>{`${p.label}\nStage: ${p.stage || '-'}\nARR $${p.y}M · Funding $${p.x}M · ${p.customers} cust\nCapEff ${p.capital_efficiency ?? '-'}%`}</title>
                </circle>
                <text x={sx(p.x) + r + 3} y={sy(p.y) + 3} fill="#d1d5db" fontSize="9">{p.label}</text>
              </g>
            );
          })}
        </svg>
      )}
      <div className="flex flex-wrap gap-3 mt-3 text-xs">
        {Object.entries(STAGE_COLORS).map(([s, c]) => (
          <div key={s} className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: c }} /><span className="text-gray-400">{s}</span></div>
        ))}
      </div>
    </div>
  );
}
