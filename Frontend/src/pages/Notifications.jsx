import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import apiFetch from '../api/client';

const CANAL_LABELS = {
  email: 'Email',
  sms: 'SMS',
  whatsapp: 'WhatsApp',
};

const CANAL_COLORS = {
  email: 'bg-blue-100 text-blue-700',
  sms: 'bg-purple-100 text-purple-700',
  whatsapp: 'bg-green-100 text-green-700',
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await apiFetch(`/notifications?page=${page}`);
        setNotifications(data.data);
        setPagination(data);
      } catch (err) {
        // gestion silencieuse
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page]);

  return (
    <Layout>
      <h2 className="text-xl sm:text-2xl font-bold text-white">Notifications</h2>
      <p className="text-slate-300 mt-1 text-sm sm:text-base">
        Historique des notifications reçues pour vos colis.
      </p>

      <div className="bg-white rounded-xl p-4 sm:p-6 mt-6">
        {loading && <p className="text-slate-400 text-sm py-6 text-center">Chargement...</p>}

        {!loading && notifications.length === 0 && (
          <p className="text-slate-400 text-sm py-6 text-center">Aucune notification pour le moment.</p>
        )}

        <div className="space-y-4">
          {notifications.map((notif) => (
            <div key={notif.id} className="border-b border-slate-50 pb-4 last:border-0">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-slate-700">{notif.contenu}</p>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${CANAL_COLORS[notif.canal]}`}>
                  {CANAL_LABELS[notif.canal]}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {notif.colis && (
                  <Link
                    to={`/colis/${notif.colis.id}`}
                    className="text-orange-600 text-xs font-medium hover:underline"
                  >
                    {notif.colis.code_suivi}
                  </Link>
                )}
                <span className="text-xs text-slate-400">
                  · {notif.envoye_le
                    ? new Date(notif.envoye_le).toLocaleString('fr-FR')
                    : 'En attente d\'envoi'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {pagination && pagination.last_page > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 rounded-lg text-sm border border-slate-200 disabled:opacity-40"
            >
              Précédent
            </button>
            <span className="text-sm text-slate-500">
              Page {pagination.current_page} / {pagination.last_page}
            </span>
            <button
              disabled={page >= pagination.last_page}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 rounded-lg text-sm border border-slate-200 disabled:opacity-40"
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}