import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AIStudio from './pages/AIStudio';
import QuestionBank from './pages/QuestionBank';
import Landing from './pages/Landing';
import Correction from './pages/Correction';
import Assessments from './pages/Assessments';
import History from './pages/History';
import ManualCorrection from './pages/ManualCorrection';

// Fallback for missing pages
const Placeholder = ({ name }: { name: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
    <h2 className="text-2xl font-bold mb-2">{name}</h2>
    <p>Esta funcionalidade está sendo preparada para você.</p>
  </div>
);

const AppRoutes = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  if (isLandingPage) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/ai-studio" element={<AIStudio />} />
        <Route path="/bank" element={<QuestionBank />} />
        <Route path="/assessments" element={<Assessments />} />
        <Route path="/history" element={<History />} />
        <Route path="/correct" element={<Correction />} />
        <Route path="/manual-correct" element={<ManualCorrection />} />
      </Routes>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

export default App;
