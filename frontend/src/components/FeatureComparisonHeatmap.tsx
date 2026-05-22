import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { Grid3x3, RefreshCw } from 'lucide-react';

interface Row { id: number; label: string; category: string; scores: Record<string, number>; }
interface Resp { dimensions: string[]; rows: Row[]; count: number; }

function color(v: number) {
  // 0 = deep navy, 100 = bright violet
  const t = Math.max(0, Math.min(1, v / 100));
  const r = Math.round(40 + t * 130);
  const g = Math.round(30 + t * 60);
  const b = Math.round(80 + t * 150);
  return `rgb(${r},${g},${b})`;
}

export default function FeatureComparisonHeatmap() {
  const [data, setData] = useState<Resp | null>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true); setErr('');
    try { setData(await apiFetch('/custom-views/feature-heatmap?limit=15')); }
    catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Grid3x3 className="w-5 h-5 text-violet-400" />
          <h2 className="text-lg font-bold text-white">Feature Comparison Heatmap</h2>
          <span className="text-xs text-gray-500">0 (cold) → 100 (hot)</span>
        </div>
        <button onClick={load} className="text-gray-400 hover:text-white"><RefreshCw className="w-4 h-4" /></button>
      </div>
      {err && <div className="text-red-400 text-sm mb-2">{err}</div>}
      {loading && <div className="text-gray-400 text-sm mb-2">Loading…</div>}
      {data && (
        <div className="overflow-x-auto">
          <table className="text-xs">
            <thead>
              <tr>
                <th className="text-left p-2 text-gray-400 sticky left-0 bg-gray-900">Challenger</th>
                {data.dimensions.map(d => (
                  <th key={d} className="p-2 text-gray-400 text-center" style={{ minWidth: 110 }}>{d.replace(/_/g, ' ')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map(row => (
                <tr key={row.id}>
                  <td className="p-2 text-white font-medium sticky left-0 bg-gray-900 whitespace-nowrap">
                    {row.label} <span className="text-gray-500 text-[10px]">{row.category}</span>
                  </td>
                  {data.dimensions.map(d => {
                    const v = row.scores[d] ?? 0;
                    return (
                      <td key={d} className="p-1">
                        <div className="rounded text-center py-2 font-mono text-white" style={{ background: color(v) }}>
                          <span title={`${d}: ${v}`}>{v}</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
