import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { Calculator, Users, DollarSign, Clock } from 'lucide-react';

interface Challenger { id: number; name: string; }
interface Case {
  id: number; challenger_name: string; customer_name: string; industry: string;
  pre_headcount: number; post_headcount: number; displaced_fte: number;
  contract_acv_usd: number; loaded_fte_cost_usd: number;
  payback_months: number | null; fte_reduction_pct: number | null;
  annual_loaded_savings_usd: number; net_savings_usd: number;
}
interface ByIndustry {
  industry: string; cases: number; total_displaced_fte: number;
  avg_reduction_pct: number; total_acv_usd: number; avg_payback_months: number;
}
interface CalcResult {
  customer_name: string; pre_headcount: number; post_headcount: number;
  displaced_fte: number; fte_reduction_pct: number;
  contract_acv_usd: number; loaded_fte_cost_usd: number;
  annual_loaded_savings_usd: number; net_savings_usd: number;
  payback_months: number | null; verdict: string;
}

export default function DisplacementPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [industries, setIndustries] = useState<ByIndustry[]>([]);
  const [challengers, setChallengers] = useState<Challenger[]>([]);
  const [error, setError] = useState('');
  const [calc, setCalc] = useState<CalcResult | null>(null);
  const [running, setRunning] = useState(false);

  const [form, setForm] = useState({
    challenger_id: '', customer_name: 'Acme Co', industry: 'Software',
    pre_headcount: '40', post_headcount: '15', contract_acv_usd: '500000',
    loaded_fte_cost_usd: '165000', ramp_months: '6'
  });

  async function load() {
    setError('');
    try {
      const [c, i, ch] = await Promise.all([
        apiFetch('/displacement'),
        apiFetch('/displacement/by-industry'),
        apiFetch('/challengers'),
      ]);
      setCases(c); setIndustries(i); setChallengers(ch);
    } catch (e: any) { setError(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setRunning(true);
    try {
      const body = {
        challenger_id: form.challenger_id || null,
        customer_name: form.customer_name,
        industry: form.industry,
        pre_headcount: Number(form.pre_headcount),
        post_headcount: Number(form.post_headcount),
        contract_acv_usd: Number(form.contract_acv_usd),
        loaded_fte_cost_usd: Number(form.loaded_fte_cost_usd),
        ramp_months: Number(form.ramp_months),
      };
      const r = await apiFetch('/displacement/calculate', { method: 'POST', body: JSON.stringify(body) });
      setCalc(r);
    } catch (e: any) { setError(e.message); }
    finally { setRunning(false); }
  }

  const fmt$ = (n: any) => n === null || n === undefined ? '—' : `$${Math.round(Number(n)).toLocaleString()}`;

  return (
    <div className="p-8 text-gray-100 bg-gray-950 min-h-full">
      <div className="flex items-center gap-3 mb-1">
        <Users className="w-7 h-7 text-emerald-400" />
        <h1 className="text-3xl font-black">Seat Displacement</h1>
      </div>
      <p className="text-gray-400 text-sm mb-6">Real FTE replaced per $1M ARR. Shows the seat-replacement math behind every outcome-priced challenger.</p>

      {error && <div className="mb-4 p-3 bg-red-950 border border-red-900 text-red-300 rounded text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><DollarSign className="w-5 h-5 text-emerald-400" />Case Library</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-gray-400"><tr>
                  <th className="text-left p-2">Customer</th><th className="text-left p-2">Challenger</th>
                  <th className="text-right p-2">Pre</th><th className="text-right p-2">Post</th>
                  <th className="text-right p-2">FTE Cut</th>
                  <th className="text-right p-2">ACV</th><th className="text-right p-2">Savings</th>
                  <th className="text-right p-2">Payback</th>
                </tr></thead>
                <tbody>
                  {cases.map(c => (
                    <tr key={c.id} className="border-t border-gray-800">
                      <td className="p-2 text-white">{c.customer_name}<div className="text-gray-500">{c.industry}</div></td>
                      <td className="p-2 text-emerald-300">{c.challenger_name}</td>
                      <td className="p-2 text-right">{c.pre_headcount}</td>
                      <td className="p-2 text-right">{c.post_headcount}</td>
                      <td className="p-2 text-right font-bold">{c.displaced_fte} <span className="text-gray-500">({c.fte_reduction_pct}%)</span></td>
                      <td className="p-2 text-right text-violet-300">{fmt$(c.contract_acv_usd)}</td>
                      <td className="p-2 text-right text-emerald-300">{fmt$(c.net_savings_usd)}</td>
                      <td className="p-2 text-right">{c.payback_months ?? '—'}m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-bold mb-3">By Industry</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {industries.map(i => (
                <div key={i.industry} className="bg-gray-950 border border-gray-800 rounded-lg p-3">
                  <div className="flex justify-between"><div className="font-bold text-white">{i.industry}</div><div className="text-xs text-gray-400">{i.cases} cases</div></div>
                  <div className="text-xs text-gray-400 mt-1">FTE displaced: <span className="text-emerald-300 font-semibold">{i.total_displaced_fte}</span></div>
                  <div className="text-xs text-gray-400">Avg cut: {i.avg_reduction_pct}% · payback {i.avg_payback_months}m</div>
                  <div className="text-xs text-gray-400">Total ACV: {fmt$(i.total_acv_usd)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Calculator className="w-5 h-5 text-violet-400" />Scenario Calculator</h2>
          <form onSubmit={run} className="space-y-2 text-sm">
            <select value={form.challenger_id} onChange={e => setForm({ ...form, challenger_id: e.target.value })} className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1">
              <option value="">No challenger (hypothetical)</option>
              {challengers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1" placeholder="Customer name" value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} />
            <input className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1" placeholder="Industry" value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-gray-400">Pre FTE<input type="number" className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1" value={form.pre_headcount} onChange={e => setForm({ ...form, pre_headcount: e.target.value })} /></label>
              <label className="text-xs text-gray-400">Post FTE<input type="number" className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1" value={form.post_headcount} onChange={e => setForm({ ...form, post_headcount: e.target.value })} /></label>
              <label className="text-xs text-gray-400">Contract ACV ($)<input type="number" className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1" value={form.contract_acv_usd} onChange={e => setForm({ ...form, contract_acv_usd: e.target.value })} /></label>
              <label className="text-xs text-gray-400">Loaded FTE Cost ($)<input type="number" className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1" value={form.loaded_fte_cost_usd} onChange={e => setForm({ ...form, loaded_fte_cost_usd: e.target.value })} /></label>
              <label className="text-xs text-gray-400 col-span-2">Ramp (months)<input type="number" className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1" value={form.ramp_months} onChange={e => setForm({ ...form, ramp_months: e.target.value })} /></label>
            </div>
            <button disabled={running} className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-medium px-3 py-2 rounded">
              {running ? 'Calculating…' : 'Calculate'}
            </button>
          </form>
          {calc && (
            <div className="mt-4 p-3 bg-gray-950 border border-gray-800 rounded">
              <div className="text-xs text-gray-400">{calc.customer_name}</div>
              <div className="text-2xl font-black mt-1">{calc.displaced_fte} FTE <span className="text-sm text-gray-500">({calc.fte_reduction_pct}%)</span></div>
              <div className="text-sm text-emerald-300">Net savings: {fmt$(calc.net_savings_usd)}/yr</div>
              <div className="text-sm flex items-center gap-1"><Clock className="w-3 h-3" /> Payback: {calc.payback_months ?? 'never'} months</div>
              <div className="mt-2 text-xs text-gray-300">{calc.verdict}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
