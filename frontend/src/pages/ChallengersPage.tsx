import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../api';
import { Swords, RefreshCw, Filter, Trophy } from 'lucide-react';

interface Challenger {
  id: number; name: string; incumbent_id: number | null; incumbent_name?: string;
  category: string; ai_native_thesis: string; pricing_model: string;
  arr_millions: number | null; total_funding_millions: number | null;
  last_valuation_billions: number | null; fte_per_million_arr: number | null;
  customer_count: number | null; flagship_customers: string;
  founded_year: number; stage: string; hq_country: string;
  case_count?: number; moat_score?: number | null;
}
interface Efficiency {
  id: number; name: string; incumbent_name?: string;
  arr_millions: number; total_funding_millions: number;
  capital_efficiency: number | null; revenue_multiple: number | null;
  arr_per_customer_k: number | null; stage: string; pricing_model: string;
}
interface PricingMix {
  pricing_model: string; count: number; arr_m: number;
  avg_arr_m: number; avg_fte_per_m: number;
}

export default function ChallengersPage() {
  const [tab, setTab] = useState<'list' | 'efficiency' | 'pricing'>('list');
  const [data, setData] = useState<Challenger[]>([]);
  const [eff, setEff] = useState<Efficiency[]>([]);
  const [pm, setPm] = useState<PricingMix[]>([]);
  const [stage, setStage] = useState('');
  const [pricing, setPricing] = useState('');
  const [, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const q = new URLSearchParams();
      if (stage) q.set('stage', stage);
      if (pricing) q.set('pricing_model', pricing);
      const [d, e, p] = await Promise.all([
        apiFetch(`/challengers${q.toString() ? `?${q}` : ''}`),
        apiFetch('/challengers/efficiency-leaderboard'),
        apiFetch('/challengers/pricing-mix'),
      ]);
      setData(d); setEff(e); setPm(p);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [stage, pricing]);

  const totals = useMemo(() => ({
    arr: data.reduce((s, c) => s + Number(c.arr_millions || 0), 0),
    funding: data.reduce((s, c) => s + Number(c.total_funding_millions || 0), 0),
    customers: data.reduce((s, c) => s + Number(c.customer_count || 0), 0),
  }), [data]);

  const fmt = (n: any) => n === null || n === undefined ? '—' : Number(n).toLocaleString();

  function pricingTag(p: string) {
    const colors: Record<string, string> = {
      per_seat: 'bg-blue-900 text-blue-300',
      per_action: 'bg-emerald-900 text-emerald-300',
      outcome: 'bg-fuchsia-900 text-fuchsia-300',
      hybrid: 'bg-amber-900 text-amber-300',
      freemium: 'bg-slate-800 text-slate-300',
    };
    return colors[p] || 'bg-gray-800 text-gray-300';
  }

  return (
    <div className="p-8 text-gray-100 bg-gray-950 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Swords className="w-7 h-7 text-emerald-400" />
            <h1 className="text-3xl font-black">Challengers</h1>
          </div>
          <p className="text-gray-400 text-sm">AI-native startups taking seats from legacy SaaS. Glean, Harvey, Cresta, Hippocratic, Sierra, Cursor, Cognition, Rippling…</p>
        </div>
        <button onClick={load} className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4"><div className="text-xs text-gray-400">Total ARR (filtered)</div><div className="text-2xl font-bold text-emerald-300">${fmt(Math.round(totals.arr))}M</div></div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4"><div className="text-xs text-gray-400">Capital Raised</div><div className="text-2xl font-bold text-violet-300">${fmt(Math.round(totals.funding))}M</div></div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4"><div className="text-xs text-gray-400">Customer Count</div><div className="text-2xl font-bold text-blue-300">{fmt(totals.customers)}</div></div>
      </div>

      <div className="flex gap-2 mb-4 border-b border-gray-800">
        {(['list', 'efficiency', 'pricing'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t ? 'border-emerald-500 text-emerald-300' : 'border-transparent text-gray-400 hover:text-white'}`}>
            {t === 'efficiency' ? 'Capital Efficiency' : t === 'pricing' ? 'Pricing Mix' : 'All Challengers'}
          </button>
        ))}
      </div>

      {tab === 'list' && (
        <>
          <div className="flex gap-3 mb-4 items-center text-sm">
            <Filter className="w-4 h-4 text-gray-500" />
            <select value={stage} onChange={e => setStage(e.target.value)} className="bg-gray-900 border border-gray-800 rounded px-2 py-1">
              <option value="">All stages</option>
              {['seed','series_a','series_b','series_c','series_d','series_e','series_f','series_g','late','public'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={pricing} onChange={e => setPricing(e.target.value)} className="bg-gray-900 border border-gray-800 rounded px-2 py-1">
              <option value="">All pricing</option>
              {['per_seat','per_action','outcome','hybrid','freemium'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {error && <div className="mb-4 p-3 bg-red-950 border border-red-900 text-red-300 rounded text-sm">{error}</div>}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.map(c => (
              <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-xl font-bold text-white">{c.name}</h3>
                    <p className="text-xs text-gray-400">vs <span className="text-orange-300">{c.incumbent_name || '—'}</span> · {c.category} · {c.hq_country}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${pricingTag(c.pricing_model)}`}>{c.pricing_model}</span>
                </div>
                <p className="text-sm text-gray-300 mb-3 line-clamp-3">{c.ai_native_thesis}</p>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div><div className="text-gray-500">ARR</div><div className="text-emerald-300 font-semibold">${fmt(c.arr_millions)}M</div></div>
                  <div><div className="text-gray-500">Funding</div><div className="text-violet-300 font-semibold">${fmt(c.total_funding_millions)}M</div></div>
                  <div><div className="text-gray-500">Valuation</div><div className="font-semibold">${fmt(c.last_valuation_billions)}B</div></div>
                  <div><div className="text-gray-500">FTE/$M</div><div className="font-semibold">{c.fte_per_million_arr ?? '—'}</div></div>
                </div>
                {c.flagship_customers && <p className="mt-3 text-xs text-gray-500">{c.flagship_customers}</p>}
                <div className="mt-2 text-xs text-gray-500 flex gap-3">
                  <span>{c.customer_count ?? 0} customers</span>
                  <span>{c.case_count ?? 0} case studies</span>
                  {c.moat_score != null && <span className="text-fuchsia-300">moat {Number(c.moat_score).toFixed(1)}</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'efficiency' && (
        <div className="overflow-x-auto bg-gray-900 border border-gray-800 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-gray-300"><tr>
              <th className="text-left p-3">Rank</th><th className="text-left p-3">Challenger</th><th className="text-left p-3">Targets</th>
              <th className="text-right p-3">ARR ($M)</th><th className="text-right p-3">Funding ($M)</th>
              <th className="text-right p-3">Cap Efficiency</th><th className="text-right p-3">Rev Multiple</th>
              <th className="text-right p-3">ARR/Cust ($k)</th>
            </tr></thead>
            <tbody>
              {eff.map((r, i) => (
                <tr key={r.id} className="border-t border-gray-800">
                  <td className="p-3 text-gray-400">{i < 3 ? <Trophy className={`w-4 h-4 inline ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-400' : 'text-amber-700'}`} /> : `#${i + 1}`}</td>
                  <td className="p-3 font-medium text-white">{r.name}</td>
                  <td className="p-3 text-gray-400">{r.incumbent_name || '—'}</td>
                  <td className="p-3 text-right text-emerald-300">${fmt(r.arr_millions)}</td>
                  <td className="p-3 text-right text-violet-300">${fmt(r.total_funding_millions)}</td>
                  <td className="p-3 text-right font-bold">{r.capital_efficiency ?? '—'}%</td>
                  <td className="p-3 text-right">{r.revenue_multiple ?? '—'}x</td>
                  <td className="p-3 text-right">{r.arr_per_customer_k ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'pricing' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pm.map(p => (
            <div key={p.pricing_model} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <span className={`text-xs px-2 py-1 rounded ${pricingTag(p.pricing_model)}`}>{p.pricing_model}</span>
              <div className="text-3xl font-black mt-3">${fmt(Math.round(Number(p.arr_m)))}M</div>
              <div className="text-xs text-gray-400 mb-2">total ARR · {p.count} challengers</div>
              <div className="text-xs text-gray-300">Avg ARR: ${Number(p.avg_arr_m).toFixed(1)}M</div>
              <div className="text-xs text-gray-300">Avg FTE/$M displaced: {Number(p.avg_fte_per_m).toFixed(2)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
