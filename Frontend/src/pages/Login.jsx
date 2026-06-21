import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.data?.message || 'Identifiants incorrects.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative px-4 py-12">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-950 to-slate-950" />

      <div className="relative z-10 w-full max-w-5xl flex flex-col lg:flex-row items-center gap-12">
        {/* Colonne gauche - formulaire */}
        <div className="w-full lg:w-1/2 bg-white rounded-2xl shadow-2xl px-8 sm:px-12 py-10">
          <div className="max-w-md w-full mx-auto">
            <h1 className="text-2xl font-bold text-slate-900">DGS Track</h1>
            <p className="text-sm text-slate-500 mt-1">A DGS Africa's web app</p>

            <p className="mt-10 text-slate-600">Connectez-vous à votre espace</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votreadresse@email.com"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-600">
                  <input type="checkbox" className="rounded border-slate-300" />
                  Se souvenir de moi
                </label>
                <a href="#" className="text-orange-600 font-medium hover:underline">
                  Mot de passe oublié
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-950 text-white font-medium py-2.5 rounded-lg hover:bg-blue-900 transition disabled:opacity-50"
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>

              <p className="text-center text-sm text-slate-600">
                Nouveau sur DGS Track ?{' '}
                <Link to="/register" className="text-orange-600 font-medium hover:underline">
                  Créer un compte
                </Link>
              </p>
            </form>

            <p className="mt-10 text-xs text-slate-400 text-center">
              © 2026 - DGS Track
            </p>
          </div>
        </div>

        {/* Colonne droite - visuel */}
        <div className="hidden lg:flex lg:w-1/2 flex-col items-start">
          <h2 className="text-4xl font-bold text-orange-500 leading-tight">
            Bienvenue sur<br />DGS Track
          </h2>
          <p className="text-slate-300 mt-4 text-lg leading-relaxed">
            La plateforme de suivi de colis qui connecte les Émirats Arabes Unis au Sénégal, en temps réel.
          </p>

          <div className="mt-10 bg-slate-900/80 backdrop-blur rounded-xl p-6 border border-slate-800 w-full">
            <span className="text-xs font-semibold text-orange-500 tracking-wide">
              COUVERTURE INTERNATIONALE
            </span>
            <h3 className="text-2xl font-bold text-white mt-2 leading-snug">
              Suivez vos expéditions en temps réel partout dans le monde.
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}