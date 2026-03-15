import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AIStudio from './pages/AIStudio';
import QuestionBank from './pages/QuestionBank';
import Landing from './pages/Landing';
import Correction from './pages/Correction';
import Assessments from './pages/Assessments';
import History from './pages/History';
import ManualCorrection from './pages/ManualCorrection';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Pricing } from './pages/Pricing';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/pricing';

  if (isLandingPage || isAuthPage) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/pricing" element={<Pricing />} />
      </Routes>
    );
  }

  return (
    <ProtectedRoute>
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
    </ProtectedRoute>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
