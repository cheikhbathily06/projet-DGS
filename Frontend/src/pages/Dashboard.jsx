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

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [dashboardData, notifData] = await Promise.all([
          apiFetch('/dashboard/client'),
          apiFetch('/notifications'),
        ]);
        setData(dashboardData);
        setNotifications(notifData.data || []);
      } catch (err) {
        setError('Impossible de charger le tableau de bord.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <Layout>
        <p className="text-slate-300">Chargement...</p>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <p className="text-red-400">{error}</p>
      </Layout>
    );
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
        Bienvenue, suivez vos colis en temps réel à travers le monde.
      </p>

      {/* Cartes KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-6">
        <div className="bg-white rounded-xl p-4 sm:p-5">
          <p className="text-xs font-semibold text-slate-400 tracking-wide">COLIS EN COURS</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{enCours}</p>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-5">
          <p className="text-xs font-semibold text-slate-400 tracking-wide">COLIS LIVRÉS</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{livres}</p>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-5">
          <p className="text-xs font-semibold text-slate-400 tracking-wide">NOTIFICATIONS</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{notifications.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mt-6">
        {/* Expéditions récentes */}
        <div className="lg:col-span-2 bg-white rounded-xl p-4 sm:p-6 min-w-0">
          <h3 className="font-bold text-slate-900">Expéditions récentes</h3>
          <p className="text-sm text-slate-500">Aperçu de vos 5 dernières activités de transport.</p>

          {/* Vue carte sur mobile, tableau sur desktop */}
          <div className="mt-4 space-y-3 sm:hidden">
            {data.dernieres_expeditions.length === 0 && (
              <p className="text-center text-slate-400 py-6 text-sm">Aucune expédition pour le moment.</p>
            )}
            {data.dernieres_expeditions.map((colis) => (
              <div key={colis.id} className="border border-slate-100 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-800 text-sm">{colis.code_suivi}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUT_COLORS[colis.statut]}`}>
                    {STATUT_LABELS[colis.statut]}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{colis.destination}</p>
                <Link to={`/colis/${colis.id}`} className="text-orange-600 font-medium text-xs hover:underline">
                  Voir le suivi
                </Link>
              </div>
            ))}
          </div>

          <div className="hidden sm:block overflow-x-auto mt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                  <th className="pb-2 font-medium whitespace-nowrap">CODE SUIVI</th>
                  <th className="pb-2 font-medium whitespace-nowrap">DESTINATION</th>
                  <th className="pb-2 font-medium whitespace-nowrap">STATUT</th>
                  <th className="pb-2 font-medium whitespace-nowrap">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {data.dernieres_expeditions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      Aucune expédition pour le moment.
                    </td>
                  </tr>
                )}
                {data.dernieres_expeditions.map((colis) => (
                  <tr key={colis.id} className="border-b border-slate-50">
                    <td className="py-3 font-medium text-slate-800 whitespace-nowrap">{colis.code_suivi}</td>
                    <td className="py-3 text-slate-600 whitespace-nowrap">{colis.destination}</td>
                    <td className="py-3 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUT_COLORS[colis.statut]}`}>
                        {STATUT_LABELS[colis.statut]}
                      </span>
                    </td>
                    <td className="py-3 whitespace-nowrap">
                      <Link to={`/colis/${colis.id}`} className="text-orange-600 font-medium hover:underline">
                        Voir le suivi
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Link
            to="/colis"
            className="block text-center text-sm text-slate-500 hover:text-slate-700 mt-4"
          >
            Afficher tout l'historique →
          </Link>
        </div>

        {/* Notifications récentes */}
        <div className="bg-white rounded-xl p-4 sm:p-6 min-w-0">
          <h3 className="font-bold text-slate-900">Notifications récentes</h3>

          <div className="mt-4 space-y-4">
            {notifications.length === 0 && (
              <p className="text-sm text-slate-400">Aucune notification pour le moment.</p>
            )}
            {notifications.slice(0, 5).map((notif) => (
              <div key={notif.id} className="border-b border-slate-50 pb-3 last:border-0">
                <p className="text-sm text-slate-700">{notif.contenu}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Colis {notif.colis?.code_suivi} ·{' '}
                  {notif.envoye_le ? new Date(notif.envoye_le).toLocaleString('fr-FR') : 'En attente'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}