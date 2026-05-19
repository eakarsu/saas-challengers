import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { AlertOctagon, GitBranch, Lock } from 'lucide-react';

interface Incumbent { id: number; name: string; category: string; }
interface Challenger { id: number; name: string; incumbent_id: number | null; }

interface PairItem {
  id: number; cost_category: string; description: string;
  one_time_cost_usd: number; duration_weeks: number;
  risk_level: string; blocker: boolean;
}
interface PairResult {
  pair: { incumbent_name: string; challenger_name: string; pricing_model: string; list_price_per_seat_usd: number; arr_millions: number };
  items: PairItem[];
  summary: {
    item_count: number; total_one_time_cost_usd: number;
    critical_path_weeks: number; blocker_count: number;
    cost_by_risk: Record<string, number>;
    readiness_score: number; verdict: string;
  };
}
interface CategoryRow {
  cost_category: string; items: number; total_cost: number;
  avg_duration_weeks: number; blocker_count: number; high_risk_count: number;
}

export default function SwitchingCostsPage() {
  const [incumbents, setIncumbents] = useState<Incumbent[]>([]);
  const [challengers, setChallengers] = useState<Challenger[]>([]);
  const [incumbentId, setIncumbentId] = useState('');
  const [challengerId, setChallengerId] = useState('');
  const [result, setResult] = useState<PairResult | null>(null);
  const [byCat, setByCat] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      const [i, c, b] = await Promise.all([
        apiFetch('/incumbents'),
        apiFetch('/challengers'),
        apiFetch('/switching/by-category'),
      ]);
      setIncumbents(i); setChallengers(c); setByCat(b);
    } catch (e: any) { setError(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function runPair() {
    if (!incumbentId || !challengerId) return;
    setLoading(true); setError('');
    try {
      const r: PairResult = await apiFetch(`/switching/pair/${incumbentId}/${challengerId}`);
      setResult(r);
    } catch (e: any) { setError(e.message); setResult(null); }
    finally { setLoading(false); }
  }

  const fmt$ = (n: any) => n === null || n === undefined ? '—' : `$${Math.round(Number(n)).toLocaleString()}`;

  function riskColor(r: string) {
    return {
      critical: 'bg-red-900 text-red-300',
      high: 'bg-orange-900 text-orange-300',
      medium: 'bg-yellow-900 text-yellow-300',
      low: 'bg-green-900 text-green-300',
    }[r] || 'bg-gray-800 text-gray-300';
  }

  function readinessColor(s: number) {
    if (s >= 75) return 'text-green-300';
    if (s >= 50) return 'text-yellow-300';
    if (s >= 25) return 'text-orange-300';
    return 'text-red-300';
  }

  return (
    <div className="p-8 text-gray-100 bg-gray-950 min-h-full">
      <div className="flex items-center gap-3 mb-1">
        <AlertOctagon className="w-7 h-7 text-orange-400" />
        <h1 className="text-3xl font-black">Switching Costs</h1>
      </div>
      <p className="text-gray-400 text-sm mb-6">Data migration, training, integration breaks, contract penalties — the friction that protects incumbents like a moat.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-bold mb-3">Pair Analyzer</h2>
            <div className="flex flex-wrap gap-2 items-center">
              <select value={incumbentId} onChange={e => setIncumbentId(e.target.value)} className="bg-gray-950 border border-gray-800 rounded px-2 py-1 text-sm">
                <option value="">Pick incumbent</option>
                {incumbents.map(i => <option key={i.id} value={i.id}>{i.name} · {i.category}</option>)}
              </select>
              <select value={challengerId} onChange={e => setChallengerId(e.target.value)} className="bg-gray-950 border border-gray-800 rounded px-2 py-1 text-sm">
                <option value="">Pick challenger</option>
                {challengers.filter(c => !incumbentId || String(c.incumbent_id) === incumbentId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button onClick={runPair} disabled={loading || !incumbentId || !challengerId} className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-4 py-1.5 rounded text-sm">
                {loading ? 'Analysing…' : 'Analyse pair'}
              </button>
            </div>
            {error && <div className="mt-3 p-2 bg-red-950 border border-red-900 text-red-300 rounded text-sm">{error}</div>}

            {result && (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-gray-950 border border-gray-800 rounded p-3">
                    <div className="text-xs text-gray-400">Readiness Score</div>
                    <div className={`text-3xl font-black ${readinessColor(result.summary.readiness_score)}`}>{result.summary.readiness_score}</div>
                  </div>
                  <div className="bg-gray-950 border border-gray-800 rounded p-3">
                    <div className="text-xs text-gray-400">Total Cost</div>
                    <div className="text-xl font-bold text-orange-300">{fmt$(result.summary.total_one_time_cost_usd)}</div>
                  </div>
                  <div className="bg-gray-950 border border-gray-800 rounded p-3">
                    <div className="text-xs text-gray-400">Critical Path</div>
                    <div className="text-xl font-bold">{result.summary.critical_path_weeks} wk</div>
                  </div>
                  <div className="bg-gray-950 border border-gray-800 rounded p-3">
                    <div className="text-xs text-gray-400">Blockers</div>
                    <div className="text-xl font-bold text-red-300 flex items-center gap-1"><Lock className="w-4 h-4" />{result.summary.blocker_count}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-300 italic">{result.summary.verdict}</div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="text-gray-400"><tr>
                      <th className="text-left p-2">Category</th><th className="text-left p-2">Description</th>
                      <th className="text-right p-2">Cost</th><th className="text-right p-2">Weeks</th>
                      <th className="text-left p-2">Risk</th><th className="text-left p-2">Blocker</th>
                    </tr></thead>
                    <tbody>
                      {result.items.map(it => (
                        <tr key={it.id} className="border-t border-gray-800">
                          <td className="p-2"><span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300">{it.cost_category}</span></td>
                          <td className="p-2 text-gray-300">{it.description}</td>
                          <td className="p-2 text-right">{fmt$(it.one_time_cost_usd)}</td>
                          <td className="p-2 text-right">{it.duration_weeks}</td>
                          <td className="p-2"><span className={`px-2 py-0.5 rounded text-xs ${riskColor(it.risk_level)}`}>{it.risk_level}</span></td>
                          <td className="p-2">{it.blocker ? <span className="text-red-300">YES</span> : <span className="text-gray-500">—</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><GitBranch className="w-5 h-5 text-violet-400" />Cost Mix (all pairs)</h2>
          <div className="space-y-2">
            {byCat.map(c => (
              <div key={c.cost_category} className="bg-gray-950 border border-gray-800 rounded p-3">
                <div className="flex justify-between"><div className="font-bold text-white">{c.cost_category}</div><div className="text-xs text-gray-400">{c.items} items</div></div>
                <div className="text-xs text-orange-300 mt-1">{fmt$(c.total_cost)}</div>
                <div className="text-xs text-gray-400">Avg {c.avg_duration_weeks}w · {c.high_risk_count} high-risk · {c.blocker_count} blockers</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
