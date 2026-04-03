import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Locations from './pages/Locations';
import LocationDetail from './pages/LocationDetail';
import MenuComparison from './pages/MenuComparison';
import Alerts from './pages/Alerts';
import Briefs from './pages/Briefs';
import BriefDetail from './pages/BriefDetail';
import CompetitorProfile from './pages/CompetitorProfile';

export default function App() {
  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route
        path="/*"
        element={
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/locations" element={<Locations />} />
              <Route path="/menu" element={<MenuComparison />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/briefs" element={<Briefs />} />
            </Routes>
          </Layout>
        }
      />
    </Routes>
  );
}
// Force rebuild Thu Apr  2 22:55:19 PDT 2026
