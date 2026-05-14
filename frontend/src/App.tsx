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

function PrivateRoute({ children }: { children: React.ReactNode }) {
  return localStorage.getItem('token') ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
