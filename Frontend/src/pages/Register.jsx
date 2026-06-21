import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    password: '',
    password_confirmation: '',
  });
  const [acceptCgu, setAcceptCgu] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (form.password !== form.password_confirmation) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (!acceptCgu) {
      setError('Vous devez accepter les conditions d\'utilisation.');
      return;
    }

    setLoading(true);
    try {
      await register({
        nom: form.nom,
        prenom: form.prenom,
        email: form.email,
        telephone: form.telephone,
        password: form.password,
        role: 'client',
      });
      navigate('/dashboard');
    } catch (err) {
      const messages = err.data?.errors
        ? Object.values(err.data.errors).flat().join(' ')
        : err.data?.message || 'Une erreur est survenue.';
      setError(messages);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12">
      <div className="max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col lg:flex-row">
        {/* Colonne gauche - visuel */}
        <div className="lg:w-2/5 bg-gradient-to-br from-blue-950 to-slate-950 p-10 text-white flex flex-col justify-between">
          <div>
            <h1 className="text-xl font-bold">DGS Track</h1>
          </div>
          <div>
            <div className="w-10 h-1 bg-orange-500 rounded mb-6" />
            <h2 className="text-2xl font-bold leading-snug">
              La logistique pan-africaine simplifiée.
            </h2>
            <p className="text-slate-300 text-sm mt-3">
              Rejoignez le réseau leader pour la gestion et le suivi de vos colis à travers le continent.
            </p>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span>📡</span> Suivi en temps réel
            </div>
            <div className="flex items-center gap-2">
              <span>🛡️</span> Sécurité garantie
            </div>
            <div className="flex items-center gap-2">
              <span>🌍</span> Réseau continental
            </div>
          </div>
        </div>

        {/* Colonne droite - formulaire */}
        <div className="lg:w-3/5 p-8 sm:p-10">
          <h2 className="text-xl font-bold text-slate-900">Créer un compte</h2>
          <p className="text-sm text-slate-500 mt-1">
            Veuillez renseigner vos informations pour commencer.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prénom</label>
                <input
                  name="prenom"
                  required
                  value={form.prenom}
                  onChange={handleChange}
                  placeholder="Ex: Abdou"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
                <input
                  name="nom"
                  required
                  value={form.nom}
                  onChange={handleChange}
                  placeholder="Ex: Camara"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="Ex: votreadresse@email.com"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
              <input
                name="telephone"
                required
                value={form.telephone}
                onChange={handleChange}
                placeholder="Ex: +221 00 000 00 00"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirmation</label>
                <input
                  type="password"
                  name="password_confirmation"
                  required
                  value={form.password_confirmation}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>
            </div>

            <label className="flex items-start gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={acceptCgu}
                onChange={(e) => setAcceptCgu(e.target.checked)}
                className="mt-1 rounded border-slate-300"
              />
              J'accepte les conditions d'utilisation et la politique de confidentialité.
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-950 text-white font-medium py-2.5 rounded-lg hover:bg-blue-900 transition disabled:opacity-50"
            >
              {loading ? 'Création...' : 'Créer mon compte'}
            </button>

            <p className="text-center text-sm text-slate-600">
              Déjà inscrit ?{' '}
              <Link to="/login" className="text-orange-600 font-medium hover:underline">
                Se connecter
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}