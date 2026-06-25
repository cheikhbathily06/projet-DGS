import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiFetch from '../api/client';

const STATUT_LABELS = {
  recu: 'Reçu',
  expedie: 'Expédié',
  en_transit: 'En transit',
  arrive: 'Arrivé',
  disponible: 'Disponible',
  livre: 'Livré',
};

const STATUT_ORDER = ['recu', 'expedie', 'en_transit', 'arrive', 'disponible', 'livre'];

export default function SuiviPublic() {
  const { codeSuivi } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem('dgs_token');

      if (token) {
        try {
          const user = await apiFetch('/auth/me');

          if (user.role === 'agent' || user.role === 'admin') {
            const colis = await apiFetch(`/colis?recherche=${codeSuivi}`);
            if (colis.data && colis.data.length > 0) {
              navigate(`/agent/colis/${colis.data[0].id}`, { replace: true });
              return;
            }
          } else if (user.role === 'client') {
            const colis = await apiFetch(`/colis?recherche=${codeSuivi}`);
            if (colis.data && colis.data.length > 0) {
              navigate(`/colis/${colis.data[0].id}`, { replace: true });
              return;
            } else {
              setError('Ce colis ne vous appartient pas.');
              setLoading(false);
              return;
            }
          }
        } catch (err) {
          // Token invalide, on continue avec le suivi public
          localStorage.removeItem('dgs_token');
        }
      }

      // Utilisateur non connecté → suivi public
      try {
        const result = await apiFetch(`/suivi/${codeSuivi}`);
        setData(result);
      } catch (err) {
        setError('Code de suivi introuvable.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [codeSuivi]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-950 to-slate-950 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-orange-500">DGS Track</h1>
          <p className="text-slate-400 text-sm mt-1">Suivi de colis en temps réel</p>
        </div>

        {loading && (
          <div className="bg-white rounded-2xl p-8 text-center">
            <p className="text-slate-400">Chargement...</p>
          </div>
        )}

        {error && (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="w-14 h-14 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto text-2xl mb-4">
              ✗
            </div>
            <h2 className="text-lg font-bold text-slate-900">Accès refusé</h2>
            <p className="text-slate-500 text-sm mt-2">{error}</p>
            <Link to="/login" className="text-orange-600 text-sm font-medium hover:underline mt-4 inline-block">
              Se connecter →
            </Link>
          </div>
        )}

        {data && (
          <div className="space-y-4">
            {/* Carte principale */}
            <div className="bg-white rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400 tracking-wide">CODE DE SUIVI</p>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">{data.code_suivi}</h2>
                </div>
                <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap">
                  {STATUT_LABELS[data.statut]}
                </span>
              </div>

              <div className="flex gap-6 mt-4 text-sm">
                <div>
                  <p className="text-slate-400 text-xs">Origine</p>
                  <p className="text-slate-800 font-medium">{data.origine}</p>
                </div>
                <div className="text-slate-300">→</div>
                <div>
                  <p className="text-slate-400 text-xs">Destination</p>
                  <p className="text-slate-800 font-medium">{data.destination}</p>
                </div>
              </div>
            </div>

            {/* Frise des statuts */}
            <div className="bg-white rounded-2xl p-6">
              <h3 className="font-bold text-slate-900 mb-6">Progression</h3>
              <div className="relative">
                <div className="absolute top-3 left-3 right-3 h-0.5 bg-slate-200" />
                <div
                  className="absolute top-3 left-3 h-0.5 bg-orange-500 transition-all"
                  style={{
                    width: `${(STATUT_ORDER.indexOf(data.statut) / (STATUT_ORDER.length - 1)) * 100}%`
                  }}
                />
                <div className="relative flex justify-between">
                  {STATUT_ORDER.map((statut, index) => {
                    const atteint = index <= STATUT_ORDER.indexOf(data.statut);
                    const estActuel = statut === data.statut;
                    return (
                      <div key={statut} className="flex flex-col items-center gap-2">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          atteint ? 'bg-orange-500 border-orange-500' : 'bg-white border-slate-300'
                        } ${estActuel ? 'ring-4 ring-orange-100' : ''}`}>
                          {atteint && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <span className={`text-xs text-center max-w-12 leading-tight ${
                          atteint ? 'text-slate-800 font-medium' : 'text-slate-400'
                        }`}>
                          {STATUT_LABELS[statut]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Historique */}
            {data.historique && data.historique.length > 0 && (
              <div className="bg-white rounded-2xl p-6">
                <h3 className="font-bold text-slate-900 mb-4">Historique</h3>
                <div className="space-y-4">
                  {data.historique.map((m, index) => (
                    <div key={index} className="flex gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="text-slate-700 font-medium">
                          {STATUT_LABELS[m.nouveau_statut]}
                        </p>
                        <p className="text-slate-400 text-xs mt-0.5">
                          {new Date(m.date_evenement).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center text-slate-400 text-xs pb-4">
              <p>DGS Africa Logistics — Suivi de colis international</p>
              <Link to="/login" className="text-orange-400 hover:underline mt-1 inline-block">
                Accéder à mon espace →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}