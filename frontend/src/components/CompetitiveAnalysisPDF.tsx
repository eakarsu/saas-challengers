import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { FileDown, FileText } from 'lucide-react';

interface Incumbent { id: number; name: string; category: string; }

export default function CompetitiveAnalysisPDF() {
  const [incumbents, setIncumbents] = useState<Incumbent[]>([]);
  const [incumbentId, setIncumbentId] = useState<number | ''>('');
  const [topN, setTopN] = useState(5);
  const [status, setStatus] = useState('');
  const [generating, setGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/incumbents').then(setIncumbents).catch(() => {});
  }, []);

  async function generate() {
    setGenerating(true); setStatus(''); setPdfUrl(null);
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch('/api/custom-views/competitive-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ incumbent_id: incumbentId || null, top_n: topN }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setStatus(`PDF generated: ${(blob.size / 1024).toFixed(1)} KB`);
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally { setGenerating(false); }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-violet-400" />
        <h2 className="text-lg font-bold text-white">Competitive Analysis PDF</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Incumbent (optional)</label>
          <select value={incumbentId} onChange={e => setIncumbentId(e.target.value ? Number(e.target.value) : '')}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
            <option value="">All incumbents</option>
            {incumbents.map(i => <option key={i.id} value={i.id}>{i.name} · {i.category}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Top N challengers</label>
          <input type="number" min={1} max={20} value={topN} onChange={e => setTopN(Number(e.target.value))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
        </div>
        <div className="flex items-end">
          <button onClick={generate} disabled={generating}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-gray-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 text-sm">
            <FileDown className="w-4 h-4" />{generating ? 'Generating…' : 'Generate PDF'}
          </button>
        </div>
      </div>
      {status && <p className="text-sm text-gray-400 mb-2">{status}</p>}
      {pdfUrl && (
        <div className="space-y-2">
          <a href={pdfUrl} download="competitive-analysis.pdf" className="text-violet-400 hover:text-violet-300 text-sm underline">Download PDF</a>
          <iframe src={pdfUrl} className="w-full h-72 border border-gray-800 rounded bg-white" title="PDF preview" />
        </div>
      )}
    </div>
  );
}
