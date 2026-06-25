import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiFetch from '../api/client';

const NAV_CLIENT = [
  { label: 'Tableau de bord', path: '/dashboard' },
  { label: 'Colis', path: '/colis' },
  { label: 'Notifications', path: '/notifications' },
];

const NAV_AGENT = [
  { label: 'Tableau de bord', path: '/agent/dashboard' },
  { label: 'Colis', path: '/agent/colis' },
  { label: 'Scanner un colis', path: '/agent/scanner' },
  { label: 'Nouveau colis', path: '/agent/colis/nouveau' },
];
const NAV_ADMIN = [
  { label: 'Tableau de bord', path: '/admin/dashboard' },
  { label: 'Utilisateurs', path: '/admin/users' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [nonLues, setNonLues] = useState(0);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const estAdmin = user?.role === 'admin';
  const estAgent = user?.role === 'agent';
  const navItems = estAdmin ? NAV_ADMIN : estAgent ? NAV_AGENT : NAV_CLIENT;

  useEffect(() => {
    if (estAgent || estAdmin) return;

    async function checkNotifications() {
      try {
        const data = await apiFetch('/notifications');
        const derniereVisite = localStorage.getItem('dgs_derniere_visite_notifs');
        const seuil = derniereVisite ? new Date(derniereVisite) : new Date(0);

        const count = (data.data || []).filter((n) => {
          if (!n.envoye_le) return false;
          return new Date(n.envoye_le) > seuil;
        }).length;

        setNonLues(count);
      } catch (err) {
        // silencieux
      }
    }
    checkNotifications();
    const interval = setInterval(checkNotifications, 60000);
    return () => clearInterval(interval);
  }, [estAgent, estAdmin]);

  useEffect(() => {
    if (location.pathname === '/notifications') {
      localStorage.setItem('dgs_derniere_visite_notifs', new Date().toISOString());
      setNonLues(0);
    }
  }, [location.pathname]);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const initiales = user
    ? `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}`.toUpperCase()
    : '';

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-950 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-950 to-slate-950" />

      {/* Topbar mobile */}
      <header className="relative z-20 lg:hidden flex items-center justify-between px-4 py-3 bg-slate-900/80 backdrop-blur border-b border-slate-800">
        <button onClick={() => setMenuOpen(!menuOpen)} className="text-white p-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-orange-500 font-bold">DGS Track</span>
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center text-xs font-semibold">
            {initiales}
          </div>
          {!estAgent && !estAdmin && nonLues > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
              {nonLues}
            </span>
          )}
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`relative z-20 lg:z-10 ${menuOpen ? 'block' : 'hidden'} lg:block w-full lg:w-64 bg-slate-900/90 backdrop-blur lg:bg-slate-900/40 border-r border-slate-800 flex flex-col`}
      >
        <div className="hidden lg:block px-6 py-6 border-b border-slate-800">
          <h1 className="text-lg font-bold text-orange-500">DGS Track</h1>
          <p className="text-xs text-slate-400">
            {estAdmin ? 'Espace Admin' : estAgent ? 'Espace Agent' : 'DGS Africa Logistics'}
          </p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                  active
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>{item.label}</span>
                {!estAgent && !estAdmin && item.path === '/notifications' && nonLues > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {nonLues}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-slate-800">
          <button
            onClick={() => setConfirmLogout(true)}
            className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-950 transition"
          >
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Contenu principal */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0">
        <header className="hidden lg:flex bg-slate-900/40 backdrop-blur border-b border-slate-800 px-8 py-4 items-center justify-between">
          <span className="text-sm text-slate-400">
            › {navItems.find((i) => i.path === location.pathname)?.label || ''}
          </span>

          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-300">
              {user?.prenom} {user?.nom?.[0]}.
            </span>
            <div className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-semibold">
              {initiales}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">{children}</main>
      </div>

      {/* Modale confirmation déconnexion */}
      {confirmLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setConfirmLogout(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <h3 className="text-lg font-bold text-slate-900">Se déconnecter ?</h3>
            <p className="text-slate-500 text-sm mt-2">
              Vous allez être redirigé vers la page de connexion.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfirmLogout(false)}
                className="flex-1 bg-slate-100 text-slate-700 text-sm font-medium py-2.5 rounded-lg hover:bg-slate-200 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-red-700 transition"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}