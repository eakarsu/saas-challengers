import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { Building2, RefreshCw, AlertTriangle, TrendingDown } from 'lucide-react';

interface Incumbent {
  id: number; name: string; category: string; flagship_product: string;
  annual_revenue_billions: number | null; paying_seats_millions: number | null;
  list_price_per_seat_usd: number | null; gross_margin_pct: number | null;
  code_lines_millions: number | null; rule_of_40: number | null;
  hq_country: string; founded_year: number; ticker: string;
  active_challengers?: number; attacker_arr_millions?: number;
}
interface CategoryRow {
  category: string; incumbent_count: number; combined_revenue_b: number;
  avg_gross_margin: number; avg_seat_price: number; challenger_count: number;
  challenger_arr_m: number; attack_intensity_pct: number;
}
interface VulnRow {
  id: number; name: string; category: string; vulnerability_index: number;
  attack_share_pct: number; challenger_arr_m: number; gross_margin_pct: number;
  rule_of_40: number; annual_revenue_billions: number;
}

export default function IncumbentsPage() {
  const [tab, setTab] = useState<'list' | 'categories' | 'vulnerability'>('list');
  const [data, setData] = useState<Incumbent[]>([]);
  const [cats, setCats] = useState<CategoryRow[]>([]);
  const [vuln, setVuln] = useState<VulnRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const [d, c, v] = await Promise.all([
        apiFetch('/incumbents'),
        apiFetch('/incumbents/category-map'),
        apiFetch('/incumbents/vulnerability-ranking'),
      ]);
      setData(d); setCats(c); setVuln(v);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const fmt = (n: any) => n === null || n === undefined ? '—' : Number(n).toLocaleString();
  const fmtB = (n: any) => n === null || n === undefined ? '—' : `$${Number(n).toFixed(2)}B`;
  const fmtPct = (n: any) => n === null || n === undefined ? '—' : `${Number(n).toFixed(1)}%`;

  function vulnColor(v: number) {
    if (v >= 70) return 'text-red-400 bg-red-950 border-red-900';
    if (v >= 50) return 'text-orange-400 bg-orange-950 border-orange-900';
    if (v >= 30) return 'text-yellow-400 bg-yellow-950 border-yellow-900';
    return 'text-green-400 bg-green-950 border-green-900';
  }

  return (
    <div className="p-8 text-gray-100 bg-gray-950 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Building2 className="w-7 h-7 text-violet-400" />
            <h1 className="text-3xl font-black">Incumbents</h1>
          </div>
          <p className="text-gray-400 text-sm">Legacy SaaS vendors under attack: Salesforce, Workday, Adobe, ServiceNow, Atlassian, SAP, Oracle…</p>
        </div>
        <button onClick={load} className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-800">
        {(['list', 'categories', 'vulnerability'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t ? 'border-violet-500 text-violet-300' : 'border-transparent text-gray-400 hover:text-white'}`}>
            {t === 'list' ? 'All Incumbents' : t === 'categories' ? 'By Category' : 'Vulnerability Ranking'}
          </button>
        ))}
      </div>

      {error && <div className="mb-4 p-3 bg-red-950 border border-red-900 text-red-300 rounded-lg text-sm">{error}</div>}
      {loading && <div className="text-gray-400 text-sm mb-4">Loading…</div>}

      {tab === 'list' && (
        <div className="overflow-x-auto bg-gray-900 border border-gray-800 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-gray-300">
              <tr>
                <th className="text-left p-3">Vendor</th>
                <th className="text-left p-3">Category</th>
                <th className="text-right p-3">Revenue</th>
                <th className="text-right p-3">Paid Seats (M)</th>
                <th className="text-right p-3">List Price/Seat</th>
                <th className="text-right p-3">Gross Margin</th>
                <th className="text-right p-3">Rule of 40</th>
                <th className="text-right p-3">Challengers</th>
                <th className="text-right p-3">Attacker ARR</th>
              </tr>
            </thead>
            <tbody>
              {data.map(r => (
                <tr key={r.id} className="border-t border-gray-800 hover:bg-gray-850">
                  <td className="p-3 font-medium text-white">{r.name} <span className="text-gray-500 text-xs">{r.ticker || ''}</span></td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 text-xs">{r.category}</span></td>
                  <td className="p-3 text-right">{fmtB(r.annual_revenue_billions)}</td>
                  <td className="p-3 text-right">{fmt(r.paying_seats_millions)}</td>
                  <td className="p-3 text-right">${fmt(r.list_price_per_seat_usd)}</td>
                  <td className="p-3 text-right">{fmtPct(r.gross_margin_pct)}</td>
                  <td className="p-3 text-right">{r.rule_of_40 ?? '—'}</td>
                  <td className="p-3 text-right">{r.active_challengers ?? 0}</td>
                  <td className="p-3 text-right text-violet-300">${fmt(r.attacker_arr_millions)}M</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cats.map(c => (
            <div key={c.category} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-white">{c.category}</h3>
                <span className="text-xs text-gray-400">{c.incumbent_count} vendors</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-400">Combined Revenue</span><span>{fmtB(c.combined_revenue_b)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Avg Gross Margin</span><span>{fmtPct(c.avg_gross_margin)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Avg Seat Price</span><span>${fmt(Math.round(c.avg_seat_price))}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Challengers</span><span className="text-violet-300">{c.challenger_count} (${fmt(c.challenger_arr_m)}M ARR)</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Attack Intensity</span><span className="text-orange-300">{c.attack_intensity_pct}%</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'vulnerability' && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 flex items-center gap-2 mb-3"><AlertTriangle className="w-4 h-4" /> Index combines attacker ARR share, gross-margin compression, Rule of 40, and legacy code mass.</p>
          {vuln.map(v => (
            <div key={v.id} className={`flex items-center gap-4 p-3 border rounded-lg ${vulnColor(v.vulnerability_index)}`}>
              <div className="w-12 text-center"><TrendingDown className="w-5 h-5 inline" /></div>
              <div className="flex-1">
                <div className="font-bold">{v.name} <span className="text-xs opacity-70">· {v.category}</span></div>
                <div className="text-xs opacity-80">Revenue {fmtB(v.annual_revenue_billions)} · GM {fmtPct(v.gross_margin_pct)} · R40 {v.rule_of_40 ?? '—'}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black">{v.vulnerability_index}</div>
                <div className="text-xs opacity-80">${fmt(v.challenger_arr_m)}M attacking · {v.attack_share_pct}%</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
