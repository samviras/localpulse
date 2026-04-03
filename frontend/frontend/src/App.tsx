import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Locations from './pages/Locations';
import LocationDetail from './pages/LocationDetail';
import Alerts from './pages/Alerts';
import Briefs from './pages/Briefs';
import BriefDetail from './pages/BriefDetail';
import CompetitorProfile from './pages/CompetitorProfile';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/locations" element={<Locations />} />
        <Route path="/locations/:id" element={<LocationDetail />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/briefs" element={<Briefs />} />
        <Route path="/briefs/:id" element={<BriefDetail />} />
        <Route path="/competitors/:id" element={<CompetitorProfile />} />
      </Routes>
    </Layout>
  );
}
// Force rebuild Thu Apr  2 22:55:19 PDT 2026
