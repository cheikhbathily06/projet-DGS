import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import apiFetch from '../api/client';

const STATUT_LABELS = {
  recu: 'Reçu',
  expedie: 'Expédié',
  en_transit: 'En transit',
  arrive: 'Arrivé',
  disponible: 'Disponible',
  livre: 'Livré',
};

const STATUT_COLORS = {
  recu: 'bg-slate-100 text-slate-700',
  expedie: 'bg-orange-100 text-orange-700',
  en_transit: 'bg-blue-100 text-blue-700',
  arrive: 'bg-purple-100 text-purple-700',
  disponible: 'bg-cyan-100 text-cyan-700',
  livre: 'bg-green-100 text-green-700',
};

export default function AgentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const result = await apiFetch('/dashboard/agent');
        setData(result);
      } catch (err) {
        setError('Impossible de charger le tableau de bord.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <Layout><p className="text-slate-300">Chargement...</p></Layout>;
  }

  if (error) {
    return <Layout><p className="text-red-400">{error}</p></Layout>;
  }

  const enCours =
    (data.resume_par_statut.recu || 0) +
    (data.resume_par_statut.expedie || 0) +
    (data.resume_par_statut.en_transit || 0) +
    (data.resume_par_statut.arrive || 0) +
    (data.resume_par_statut.disponible || 0);

  const livres = data.resume_par_statut.livre || 0;

  return (
    <Layout>
      <h2 className="text-xl sm:text-2xl font-bold text-white">Tableau de bord</h2>
      <p className="text-slate-300 mt-1 text-sm sm:text-base">
        Vue d'ensemble de toutes les expéditions DGS Africa.
      </p>

      {/* Cartes KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-6">
        <div className="bg-white rounded-xl p-4 sm:p-5">
          <p className="text-xs font-semibold text-slate-400 tracking-wide">TOTAL COLIS</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{data.total_colis}</p>
        </div>
        <div className="bg-white rounded-xl p-4 sm:p-5">
          <p className="text-xs font-semibold text-slate-400 tracking-wide">EN COURS</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{enCours}</p>
        </div>
        <div className="bg-white rounded-xl p-4 sm:p-5">
          <p className="text-xs font-semibold text-slate-400 tracking-wide">LIVRÉS</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{livres}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mt-6">
        {/* Répartition par statut */}
        <div className="bg-white rounded-xl p-4 sm:p-6">
          <h3 className="font-bold text-slate-900 mb-4">Répartition par statut</h3>
          <div className="space-y-3">
            {Object.entries(STATUT_LABELS).map(([statut, label]) => {
              const total = data.resume_par_statut[statut] || 0;
              const pourcentage = data.total_colis > 0
                ? Math.round((total / data.total_colis) * 100)
                : 0;
              return (
                <div key={statut}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUT_COLORS[statut]}`}>
                      {label}
                    </span>
                    <span className="text-slate-600 font-medium">{total}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className="bg-orange-500 h-1.5 rounded-full"
                      style={{ width: `${pourcentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dernières activités */}
        <div className="lg:col-span-2 bg-white rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">Dernières activités</h3>
            <Link to="/agent/colis" className="text-orange-600 text-sm hover:underline">
              Voir tous les colis →
            </Link>
          </div>

          <div className="space-y-4">
            {data.derniers_mouvements.length === 0 && (
              <p className="text-slate-400 text-sm">Aucune activité récente.</p>
            )}
            {data.derniers_mouvements.map((m) => (
              <div key={m.id} className="flex gap-3 text-sm border-b border-slate-50 pb-3 last:border-0">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-slate-700 truncate">
                      <span className="font-medium">{m.colis?.code_suivi}</span>
                      {' · '}
                      <span className="text-slate-500">{m.colis?.destination}</span>
                    </p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${STATUT_COLORS[m.nouveau_statut]}`}>
                      {STATUT_LABELS[m.nouveau_statut]}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {new Date(m.date_evenement).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Link
            to="/agent/colis/nouveau"
            className="mt-6 block w-full text-center bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 rounded-lg transition text-sm"
          >
            + Nouveau colis
          </Link>
        </div>
      </div>
    </Layout>
  );
}