import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ColisListe from './pages/ColisListe';
import ColisDetail from './pages/ColisDetail';
import Notifications from './pages/Notifications';
import AgentDashboard from './pages/AgentDashboard';
import AgentColisListe from './pages/AgentColisListe';
import AgentColisNouveau from './pages/AgentColisNouveau';
import AgentColisDetail from './pages/AgentColisDetail';
import AgentScanner from './pages/AgentScanner';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import ForgotPassword from './pages/ForgotPassword';
import SuiviPublic from './pages/SuiviPublic';
import ResetPassword from './pages/ResetPassword';

function PrivateRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'agent') return <Navigate to="/agent/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/suivi/:codeSuivi" element={<SuiviPublic />} />

      {/* Routes client */}
      <Route path="/dashboard" element={<PrivateRoute allowedRoles={['client']}><Dashboard /></PrivateRoute>} />
      <Route path="/colis" element={<PrivateRoute allowedRoles={['client']}><ColisListe /></PrivateRoute>} />
      <Route path="/colis/:id" element={<PrivateRoute allowedRoles={['client']}><ColisDetail /></PrivateRoute>} />
      <Route path="/notifications" element={<PrivateRoute allowedRoles={['client']}><Notifications /></PrivateRoute>} />

      {/* Routes agent uniquement */}
      <Route path="/agent/dashboard" element={<PrivateRoute allowedRoles={['agent']}><AgentDashboard /></PrivateRoute>} />
      <Route path="/agent/colis" element={<PrivateRoute allowedRoles={['agent']}><AgentColisListe /></PrivateRoute>} />
      <Route path="/agent/colis/nouveau" element={<PrivateRoute allowedRoles={['agent']}><AgentColisNouveau /></PrivateRoute>} />
      <Route path="/agent/colis/:id" element={<PrivateRoute allowedRoles={['agent']}><AgentColisDetail /></PrivateRoute>} />
      <Route path="/agent/scanner" element={<PrivateRoute allowedRoles={['agent']}><AgentScanner /></PrivateRoute>} />

      {/* Routes admin uniquement */}
      <Route path="/admin/dashboard" element={<PrivateRoute allowedRoles={['admin']}><AdminDashboard /></PrivateRoute>} />
      <Route path="/admin/users" element={<PrivateRoute allowedRoles={['admin']}><AdminUsers /></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  );
}