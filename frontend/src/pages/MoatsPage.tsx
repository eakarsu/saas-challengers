import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../api';
import { Shield, Crown, Target } from 'lucide-react';

interface Moat {
  id: number; challenger_id: number; challenger_name: string;
  category: string; arr_millions: number; incumbent_name?: string;
  proprietary_data_score: number; vertical_workflow_score: number;
  network_effect_score: number; switching_cost_score: number;
  brand_score: number; regulatory_moat_score: number;
  composite_score: number; rationale: string;
  assessed_at: string; verdict: string;
}
interface Averages {
  proprietary_data: number; vertical_workflow: number;
  network_effect: number; switching_cost: number;
  brand: number; regulatory: number; composite: number; assessments: number;
}
const DIM_LABELS = [
  ['proprietary_data_score', 'Proprietary Data'],
  ['vertical_workflow_score', 'Vertical Workflow'],
  ['network_effect_score', 'Network Effect'],
  ['switching_cost_score', 'Switching Cost'],
  ['brand_score', 'Brand'],
  ['regulatory_moat_score', 'Regulatory'],
] as const;

export default function MoatsPage() {
  const [moats, setMoats] = useState<Moat[]>([]);
  const [averages, setAverages] = useState<Averages | null>(null);
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);

  const [scores, setScores] = useState<Record<string, number>>({
    proprietary_data_score: 6, vertical_workflow_score: 7,
    network_effect_score: 5, switching_cost_score: 5,
    brand_score: 6, regulatory_moat_score: 4,
  });
  const [preview, setPreview] = useState<{ composite_score: number; verdict: string } | null>(null);

  async function load() {
    try {
      const [m, a] = await Promise.all([
        apiFetch('/moats/leaderboard'),
        apiFetch('/moats/dimension-averages'),
      ]);
      setMoats(m); setAverages(a);
    } catch (e: any) { setError(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function scorePreview() {
    setRunning(true); setError('');
    try {
      const r = await apiFetch('/moats/score', { method: 'POST', body: JSON.stringify(scores) });
      setPreview(r);
    } catch (e: any) { setError(e.message); setPreview(null); }
    finally { setRunning(false); }
  }

  const sortedDims = useMemo(() => {
    if (!averages) return [];
    return [
      ['Proprietary Data', averages.proprietary_data],
      ['Vertical Workflow', averages.vertical_workflow],
      ['Network Effect', averages.network_effect],
      ['Switching Cost', averages.switching_cost],
      ['Brand', averages.brand],
      ['Regulatory', averages.regulatory],
    ].sort((a, b) => Number(b[1]) - Number(a[1])) as [string, number][];
  }, [averages]);

  function scoreColor(s: number) {
    if (s >= 7.5) return 'bg-fuchsia-600';
    if (s >= 6) return 'bg-violet-600';
    if (s >= 4.5) return 'bg-amber-600';
    if (s >= 3) return 'bg-orange-700';
    return 'bg-red-800';
  }

  return (
    <div className="p-8 text-gray-100 bg-gray-950 min-h-full">
      <div className="flex items-center gap-3 mb-1">
        <Shield className="w-7 h-7 text-fuchsia-400" />
        <h1 className="text-3xl font-black">Moat Analyzer</h1>
      </div>
      <p className="text-gray-400 text-sm mb-6">Defensibility scoring across six dimensions: proprietary data, vertical workflow, network effect, switching cost, brand, regulatory.</p>

      {error && <div className="mb-4 p-3 bg-red-950 border border-red-900 text-red-300 rounded text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Crown className="w-5 h-5 text-amber-400" />Leaderboard</h2>
          <div className="space-y-2">
            {moats.map(m => (
              <div key={m.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-bold text-white">{m.challenger_name}</div>
                    <div className="text-xs text-gray-400">{m.category} · vs {m.incumbent_name || '—'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-fuchsia-300">{Number(m.composite_score).toFixed(1)}</div>
                    <div className="text-xs text-gray-400">{m.verdict}</div>
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-1 mt-2">
                  {DIM_LABELS.map(([key, label]) => {
                    const v = (m as any)[key] as number;
                    return (
                      <div key={key} className="text-center">
                        <div className={`h-12 rounded ${scoreColor(v)}`} style={{ opacity: 0.3 + v / 12 }}>
                          <div className="text-white font-bold pt-3">{v}</div>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1">{label}</div>
                      </div>
                    );
                  })}
                </div>
                {m.rationale && <p className="text-xs text-gray-400 mt-2 italic">{m.rationale}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-bold mb-3">Dimension Averages</h2>
            {averages ? (
              <div className="space-y-2">
                {sortedDims.map(([label, val]) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs"><span>{label}</span><span>{Number(val).toFixed(2)}</span></div>
                    <div className="h-2 bg-gray-800 rounded overflow-hidden mt-1">
                      <div className={`h-full ${scoreColor(Number(val))}`} style={{ width: `${(Number(val) / 10) * 100}%` }} />
                    </div>
                  </div>
                ))}
                <div className="pt-3 border-t border-gray-800 text-xs text-gray-400">
                  Composite avg: <span className="text-fuchsia-300 font-bold">{averages.composite}</span> across {averages.assessments} challengers
                </div>
              </div>
            ) : <div className="text-gray-500 text-sm">Loading…</div>}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Target className="w-5 h-5 text-violet-400" />Score a Hypothesis</h2>
            <div className="space-y-3">
              {DIM_LABELS.map(([k, lbl]) => (
                <div key={k}>
                  <div className="flex justify-between text-xs"><span>{lbl}</span><span className="text-fuchsia-300">{scores[k]}/10</span></div>
                  <input type="range" min={0} max={10} value={scores[k]} onChange={e => setScores({ ...scores, [k]: Number(e.target.value) })} className="w-full accent-fuchsia-500" />
                </div>
              ))}
              <button onClick={scorePreview} disabled={running} className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 disabled:opacity-50 text-white font-medium px-3 py-2 rounded">
                {running ? 'Scoring…' : 'Score'}
              </button>
              {preview && (
                <div className="bg-gray-950 border border-gray-800 rounded p-3 mt-2">
                  <div className="text-3xl font-black text-fuchsia-300">{preview.composite_score}</div>
                  <div className="text-xs text-gray-300 italic">{preview.verdict}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
