import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

function PrivateRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallback = user.role === 'agent' || user.role === 'admin' ? '/agent/dashboard' : '/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Routes client */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute allowedRoles={['client']}>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/colis"
        element={
          <PrivateRoute allowedRoles={['client']}>
            <ColisListe />
          </PrivateRoute>
        }
      />
      <Route
        path="/colis/:id"
        element={
          <PrivateRoute allowedRoles={['client']}>
            <ColisDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <PrivateRoute allowedRoles={['client']}>
            <Notifications />
          </PrivateRoute>
        }
      />

      {/* Routes agent/admin */}
      <Route
        path="/agent/dashboard"
        element={
          <PrivateRoute allowedRoles={['agent', 'admin']}>
            <AgentDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/agent/colis"
        element={
          <PrivateRoute allowedRoles={['agent', 'admin']}>
            <AgentColisListe />
          </PrivateRoute>
        }
      />
      <Route
        path="/agent/colis/nouveau"
        element={
          <PrivateRoute allowedRoles={['agent', 'admin']}>
            <AgentColisNouveau />
          </PrivateRoute>
        }
      />
      <Route
        path="/agent/colis/:id"
        element={
          <PrivateRoute allowedRoles={['agent', 'admin']}>
            <AgentColisDetail />
          </PrivateRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}