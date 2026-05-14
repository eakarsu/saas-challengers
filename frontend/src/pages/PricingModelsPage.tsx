import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { CircleDollarSign, Play, BarChart3 } from 'lucide-react';

interface PricingModel {
  name: string; description: string; typical_acv_usd: number; gross_margin_pct: number;
  scaling_curve: string; buyer_persona: string; notes: string;
  challenger_count?: number; arr_m?: number;
}
interface Distribution {
  pricing_model: string; model_gm: number; model_acv: number; scaling_curve: string;
  challenger_count: number; arr_m: number; funding_m: number; avg_fte_per_m: number;
}
interface SimResult {
  inputs: any;
  scenarios: { model: string; revenue_usd: number; cogs_usd: number; gross_profit_usd: number; gross_margin_pct: number | null }[];
  best_model: { model: string; gross_profit_usd: number; gross_margin_pct: number | null };
  worst_model: { model: string; gross_profit_usd: number; gross_margin_pct: number | null };
  notes: string;
}

export default function PricingModelsPage() {
  const [models, setModels] = useState<PricingModel[]>([]);
  const [dist, setDist] = useState<Distribution[]>([]);
  const [sim, setSim] = useState<SimResult | null>(null);
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);

  const [form, setForm] = useState({
    seats: '500', actions_per_year: '120000', savings_pool_usd: '4000000',
    per_seat_price_usd: '1800', per_action_price_usd: '4',
    outcome_share_pct: '25', cogs_per_action_usd: '1.4',
    cogs_per_seat_usd: '360', deflection_rate_pct: '70'
  });

  async function load() {
    try {
      const [m, d] = await Promise.all([apiFetch('/pricing'), apiFetch('/pricing/distribution')]);
      setModels(m); setDist(d);
    } catch (e: any) { setError(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function runSim(e: React.FormEvent) {
    e.preventDefault();
    setRunning(true); setError('');
    try {
      const body = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, Number(v)]));
      const r = await apiFetch('/pricing/simulate', { method: 'POST', body: JSON.stringify(body) });
      setSim(r);
    } catch (e: any) { setError(e.message); setSim(null); }
    finally { setRunning(false); }
  }

  const fmt$ = (n: any) => `$${Math.round(Number(n || 0)).toLocaleString()}`;
  const pctColor = (p: any) => p === null ? 'text-gray-500' : Number(p) >= 70 ? 'text-emerald-300' : Number(p) >= 50 ? 'text-yellow-300' : 'text-red-300';
  const profitColor = (p: any) => Number(p) > 0 ? 'text-emerald-300' : 'text-red-300';

  return (
    <div className="p-8 text-gray-100 bg-gray-950 min-h-full">
      <div className="flex items-center gap-3 mb-1">
        <CircleDollarSign className="w-7 h-7 text-amber-400" />
        <h1 className="text-3xl font-black">Pricing Models</h1>
      </div>
      <p className="text-gray-400 text-sm mb-6">per-seat vs per-action vs outcome-based. The economic vector along which AI-native challengers split from incumbents.</p>

      {error && <div className="mb-4 p-3 bg-red-950 border border-red-900 text-red-300 rounded text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {models.map(m => (
          <div key={m.name} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-bold text-amber-300">{m.name}</h3>
              <span className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-300">{m.scaling_curve}</span>
            </div>
            <p className="text-xs text-gray-300 mb-3">{m.description}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><div className="text-gray-500">Typical ACV</div><div className="font-semibold">{fmt$(m.typical_acv_usd)}</div></div>
              <div><div className="text-gray-500">Gross Margin</div><div className={`font-semibold ${pctColor(m.gross_margin_pct)}`}>{m.gross_margin_pct}%</div></div>
              <div><div className="text-gray-500">Buyer</div><div>{m.buyer_persona}</div></div>
              <div><div className="text-gray-500">Adopted by</div><div className="text-violet-300">{m.challenger_count} cos · ${Math.round(Number(m.arr_m || 0))}M ARR</div></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-emerald-400" />Market Distribution</h2>
          <table className="w-full text-sm">
            <thead className="text-gray-400"><tr>
              <th className="text-left p-2">Model</th><th className="text-right p-2">Challengers</th>
              <th className="text-right p-2">ARR ($M)</th><th className="text-right p-2">Funding ($M)</th>
              <th className="text-right p-2">Avg GM</th><th className="text-right p-2">Avg FTE/$M</th>
            </tr></thead>
            <tbody>
              {dist.map(d => (
                <tr key={d.pricing_model} className="border-t border-gray-800">
                  <td className="p-2 text-amber-300 font-medium">{d.pricing_model}</td>
                  <td className="p-2 text-right">{d.challenger_count}</td>
                  <td className="p-2 text-right text-emerald-300">${Math.round(Number(d.arr_m || 0))}</td>
                  <td className="p-2 text-right text-violet-300">${Math.round(Number(d.funding_m || 0))}</td>
                  <td className="p-2 text-right">{d.model_gm}%</td>
                  <td className="p-2 text-right">{Number(d.avg_fte_per_m || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Play className="w-5 h-5 text-violet-400" />Simulator</h2>
          <form onSubmit={runSim} className="grid grid-cols-2 gap-2 text-xs">
            {([
              ['seats', 'Seats'], ['actions_per_year', 'Actions/yr'],
              ['savings_pool_usd', 'Savings pool $'], ['per_seat_price_usd', 'Per-seat $'],
              ['per_action_price_usd', 'Per-action $'], ['outcome_share_pct', 'Outcome %'],
              ['cogs_per_action_usd', 'COGS/action $'], ['cogs_per_seat_usd', 'COGS/seat $'],
              ['deflection_rate_pct', 'Deflection %']
            ] as const).map(([k, lbl]) => (
              <label key={k} className="text-gray-400">{lbl}
                <input type="number" className="w-full bg-gray-950 border border-gray-800 rounded px-2 py-1"
                  value={(form as any)[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} />
              </label>
            ))}
            <button disabled={running} className="col-span-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-medium px-3 py-2 rounded mt-2">
              {running ? 'Running…' : 'Simulate all 4 models'}
            </button>
          </form>
          {sim && (
            <div className="mt-4 space-y-1">
              {sim.scenarios.map(s => (
                <div key={s.model} className="bg-gray-950 border border-gray-800 rounded p-2 flex justify-between items-center">
                  <div className="text-amber-300 font-medium text-xs">{s.model}</div>
                  <div className="text-right text-xs">
                    <div className={profitColor(s.gross_profit_usd)}>{fmt$(s.gross_profit_usd)}</div>
                    <div className="text-gray-500">{s.gross_margin_pct ?? '—'}% GM</div>
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-300 italic pt-2">{sim.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
