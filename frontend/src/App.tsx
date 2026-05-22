import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import ProjectsPage from './pages/ProjectsPage';
import IssuesPage from './pages/IssuesPage';
import SprintsPage from './pages/SprintsPage';
import TeamPage from './pages/TeamPage';
import CommentsPage from './pages/CommentsPage';
import LabelsPage from './pages/LabelsPage';
import AICenterPage from './pages/AICenterPage';
import SearchPage from './pages/SearchPage';
import AuditLogPage from './pages/AuditLogPage';
import SampleDataPage from './pages/SampleDataPage';
import Dashboard from './pages/Dashboard';
import IncumbentsPage from './pages/IncumbentsPage';
import ChallengersPage from './pages/ChallengersPage';
import DisplacementPage from './pages/DisplacementPage';
import SwitchingCostsPage from './pages/SwitchingCostsPage';
import PricingModelsPage from './pages/PricingModelsPage';
import MoatsPage from './pages/MoatsPage';
import CustomViewsPage from './pages/CustomViewsPage';

import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

import TimelineView from './pages/TimelineView';

import GapAgentExecutor from './pages/GapAgentExecutor';
import GapAutoPrFromIssue from './pages/GapAutoPrFromIssue';
import GapCustomerPortal from './pages/GapCustomerPortal';
import GapCycleTimeExplainer from './pages/GapCycleTimeExplainer';
import GapDependencyGraph from './pages/GapDependencyGraph';
import GapGitIntegration from './pages/GapGitIntegration';
import GapKeyboardPalette from './pages/GapKeyboardPalette';
import GapSsoIntegration from './pages/GapSsoIntegration';
import GapStandupSummarizer from './pages/GapStandupSummarizer';
import GapWebhookIngest from './pages/GapWebhookIngest';
import GapWebsocketEvents from './pages/GapWebsocketEvents';
import CfAgentExecutableSpec from './pages/CfAgentExecutableSpec';
import CfAutoRetros from './pages/CfAutoRetros';
import CfCodeAwareSimilarity from './pages/CfCodeAwareSimilarity';
import CfGithubSync from './pages/CfGithubSync';
import CfPlanFromBrief from './pages/CfPlanFromBrief';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  return localStorage.getItem('token') ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/insights/timeline" element={<TimelineView />} />
        <Route path="/codex/custom-viz" element={<CodexCustomVizFeature />} />
        <Route path="/codex/operations" element={<CodexOperationsFeature />} />

        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="issues" element={<IssuesPage />} />
          <Route path="sprints" element={<SprintsPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="comments" element={<CommentsPage />} />
          <Route path="labels" element={<LabelsPage />} />
          <Route path="ai" element={<AICenterPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="audit" element={<AuditLogPage />} />
          <Route path="sample-data" element={<SampleDataPage />} />
          <Route path="incumbents" element={<IncumbentsPage />} />
          <Route path="challengers" element={<ChallengersPage />} />
          <Route path="displacement" element={<DisplacementPage />} />
          <Route path="switching" element={<SwitchingCostsPage />} />
          <Route path="pricing" element={<PricingModelsPage />} />
          <Route path="moats" element={<MoatsPage />} />
          <Route path="custom-views" element={<CustomViewsPage />} />
          <Route path="gap/agent-executor" element={<GapAgentExecutor />} />
          <Route path="gap/auto-pr-from-issue" element={<GapAutoPrFromIssue />} />
          <Route path="gap/customer-portal" element={<GapCustomerPortal />} />
          <Route path="gap/cycle-time-explainer" element={<GapCycleTimeExplainer />} />
          <Route path="gap/dependency-graph" element={<GapDependencyGraph />} />
          <Route path="gap/git-integration" element={<GapGitIntegration />} />
          <Route path="gap/keyboard-palette" element={<GapKeyboardPalette />} />
          <Route path="gap/sso-integration" element={<GapSsoIntegration />} />
          <Route path="gap/standup-summarizer" element={<GapStandupSummarizer />} />
          <Route path="gap/webhook-ingest" element={<GapWebhookIngest />} />
          <Route path="gap/websocket-events" element={<GapWebsocketEvents />} />
          <Route path="cf/agent-executable-spec" element={<CfAgentExecutableSpec />} />
          <Route path="cf/auto-retros" element={<CfAutoRetros />} />
          <Route path="cf/code-aware-similarity" element={<CfCodeAwareSimilarity />} />
          <Route path="cf/github-sync" element={<CfGithubSync />} />
          <Route path="cf/plan-from-brief" element={<CfPlanFromBrief />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
