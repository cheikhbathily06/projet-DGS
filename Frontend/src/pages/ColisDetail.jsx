import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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

const STATUT_ORDER = ['recu', 'expedie', 'en_transit', 'arrive', 'disponible', 'livre'];

export default function ColisDetail() {
  const { id } = useParams();
  const [colis, setColis] = useState(null);
  const [mouvements, setMouvements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [colisData, mouvementsData] = await Promise.all([
          apiFetch(`/colis/${id}`),
          apiFetch(`/colis/${id}/mouvements`),
        ]);
        setColis(colisData);
        setMouvements(mouvementsData);
      } catch (err) {
        setError(err.data?.message || 'Colis introuvable.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

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
        <Link to="/colis" className="text-orange-400 text-sm mt-2 inline-block hover:underline">
          ← Retour à la liste
        </Link>
      </Layout>
    );
  }

  const statutActuelIndex = STATUT_ORDER.indexOf(colis.statut);

  return (
    <Layout>
      <Link to="/colis" className="text-slate-300 text-sm hover:text-white">
        ← Retour à la liste
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-3 gap-2">
        <h2 className="text-xl sm:text-2xl font-bold text-white">{colis.code_suivi}</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mt-6">
        {/* Infos colis + QR code */}
        <div className="bg-white rounded-xl p-4 sm:p-6">
          <h3 className="font-bold text-slate-900 mb-4">Détails du colis</h3>

          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Origine</dt>
              <dd className="text-slate-800 font-medium">{colis.origine}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Destination</dt>
              <dd className="text-slate-800 font-medium">{colis.destination}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Poids</dt>
              <dd className="text-slate-800 font-medium">{colis.poids_kg} kg</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Volume</dt>
              <dd className="text-slate-800 font-medium">{colis.volume_m3} m³</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Coût</dt>
              <dd className="text-slate-800 font-medium">
                {Number(colis.cout_transport).toLocaleString('fr-FR')} XOF
              </dd>
            </div>
          </dl>

          {colis.qr_code_url && (
            <div className="mt-6 text-center">
              <img
                src={colis.qr_code_url}
                alt="QR Code de suivi"
                className="w-32 h-32 mx-auto"
              />
              <p className="text-xs text-slate-400 mt-2">Scannez pour partager le suivi</p>
            </div>
          )}
        </div>

        {/* Frise de statuts + historique */}
        <div className="lg:col-span-2 bg-white rounded-xl p-4 sm:p-6">
          <h3 className="font-bold text-slate-900 mb-6">Statut de la livraison</h3>

          {/* Frise des statuts */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 mb-8">
            {STATUT_ORDER.map((statut, index) => {
              const atteint = index <= statutActuelIndex;
              const estActuel = index === statutActuelIndex;
              return (
                <div key={statut} className="flex sm:flex-col items-center sm:flex-1 gap-3 sm:gap-2">
                  <div className="flex sm:flex-col items-center sm:w-full">
                    <div
                      className={`w-4 h-4 rounded-full flex-shrink-0 ${
                        atteint ? 'bg-orange-500' : 'bg-slate-200'
                      } ${estActuel ? 'ring-4 ring-orange-100' : ''}`}
                    />
                    {index < STATUT_ORDER.length - 1 && (
                      <div className="hidden sm:block h-0.5 flex-1 ml-2 ${atteint ? 'bg-orange-500' : 'bg-slate-200'}"
                        style={{ background: index < statutActuelIndex ? '#f97316' : '#e2e8f0' }}
                      />
                    )}
                  </div>
                  <span className={`text-xs sm:mt-2 ${atteint ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
                    {STATUT_LABELS[statut]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Historique détaillé */}
          <h4 className="font-medium text-slate-900 text-sm mb-3">Historique des mouvements</h4>
          <div className="space-y-4">
            {mouvements.length === 0 && (
              <p className="text-slate-400 text-sm">Aucun mouvement enregistré pour le moment.</p>
            )}
            {mouvements.map((m) => (
              <div key={m.id} className="flex gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-slate-700">
                    Passage de <span className="font-medium">{STATUT_LABELS[m.ancien_statut] || 'Création'}</span> à{' '}
                    <span className="font-medium">{STATUT_LABELS[m.nouveau_statut]}</span>
                  </p>
                  {m.commentaire && (
                    <p className="text-slate-500 text-xs mt-0.5">{m.commentaire}</p>
                  )}
                  <p className="text-slate-400 text-xs mt-0.5">
                    {new Date(m.date_evenement).toLocaleString('fr-FR')}
                    {m.auteur && ` · ${m.auteur.prenom} ${m.auteur.nom}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}