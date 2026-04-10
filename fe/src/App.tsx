import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import PortalSelection from './pages/PortalSelection';
import HRLogin from './pages/HRLogin';
import CandidateLogin from './pages/CandidateLogin';
import HRDashboard from './pages/hr/Dashboard';
import CandidateJobs from './pages/candidate/Jobs';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PortalSelection />} />
        <Route path="/hr/login" element={<HRLogin />} />
        <Route path="/hr/*" element={<HRDashboard />} />
        <Route path="/candidate/login" element={<CandidateLogin />} />
        <Route path="/candidate/*" element={<CandidateJobs />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </Router>
  );
}
