import { Eye } from 'lucide-react';
import MarketPositionChart from '../components/MarketPositionChart';
import FeatureComparisonHeatmap from '../components/FeatureComparisonHeatmap';
import CompetitiveAnalysisPDF from '../components/CompetitiveAnalysisPDF';
import TrackingRulesEditor from '../components/TrackingRulesEditor';

export default function CustomViewsPage() {
  return (
    <div className="p-8 text-gray-100 bg-gray-950 min-h-full space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Eye className="w-7 h-7 text-violet-400" />
          <h1 className="text-3xl font-black">Challenger Views</h1>
        </div>
        <p className="text-gray-400 text-sm">
          Custom competitive intelligence dashboards: market position, feature heatmap, analyst PDF, tracking rules.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <MarketPositionChart />
        <FeatureComparisonHeatmap />
      </div>

      <CompetitiveAnalysisPDF />
      <TrackingRulesEditor />
    </div>
  );
}
