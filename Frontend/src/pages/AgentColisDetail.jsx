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

const TRANSITIONS = {
  recu: 'expedie',
  expedie: 'en_transit',
  en_transit: 'arrive',
  arrive: 'disponible',
  disponible: 'livre',
};

const STATUT_COLORS = {
  recu: 'bg-slate-100 text-slate-700',
  expedie: 'bg-orange-100 text-orange-700',
  en_transit: 'bg-blue-100 text-blue-700',
  arrive: 'bg-purple-100 text-purple-700',
  disponible: 'bg-cyan-100 text-cyan-700',
  livre: 'bg-green-100 text-green-700',
};

export default function AgentColisDetail() {
  const { id } = useParams();
  const [colis, setColis] = useState(null);
  const [mouvements, setMouvements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [statutLoading, setStatutLoading] = useState(false);
  const [statutError, setStatutError] = useState('');
  const [statutSuccess, setStatutSuccess] = useState('');

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

  useEffect(() => { load(); }, [id]);

  async function changerStatut() {
    const nouveauStatut = TRANSITIONS[colis.statut];
    if (!nouveauStatut) return;

    setStatutLoading(true);
    setStatutError('');
    setStatutSuccess('');

    try {
      const data = await apiFetch(`/colis/${id}/statut`, {
        method: 'PATCH',
        body: JSON.stringify({ statut: nouveauStatut, commentaire }),
      });
      setColis(data);
      setCommentaire('');
      setStatutSuccess(`Statut mis à jour : ${STATUT_LABELS[nouveauStatut]}`);
      const mouvementsData = await apiFetch(`/colis/${id}/mouvements`);
      setMouvements(mouvementsData);
    } catch (err) {
      setStatutError(err.data?.message || 'Erreur lors du changement de statut.');
    } finally {
      setStatutLoading(false);
    }
  }

  if (loading) return <Layout><p className="text-slate-300">Chargement...</p></Layout>;
  if (error) return (
    <Layout>
      <p className="text-red-400">{error}</p>
      <Link to="/agent/colis" className="text-orange-400 text-sm mt-2 inline-block">← Retour</Link>
    </Layout>
  );

  const prochainStatut = TRANSITIONS[colis.statut];
  const statutActuelIndex = STATUT_ORDER.indexOf(colis.statut);

  return (
    <Layout>
      <Link to="/agent/colis" className="text-slate-300 text-sm hover:text-white">
        ← Retour à la liste
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-3 gap-2">
        <h2 className="text-xl sm:text-2xl font-bold text-white">{colis.code_suivi}</h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium w-fit ${STATUT_COLORS[colis.statut]}`}>
          {STATUT_LABELS[colis.statut]}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mt-6">
        {/* Infos colis */}
        <div className="bg-white rounded-xl p-4 sm:p-6">
          <h3 className="font-bold text-slate-900 mb-4">Détails du colis</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Expéditeur</dt>
              <dd className="text-slate-800 font-medium">{colis.expediteur}</dd>
            </div>
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
              <img src={colis.qr_code_url} alt="QR Code" className="w-28 h-28 mx-auto" />
              <p className="text-xs text-slate-400 mt-2">QR Code de suivi</p>
            </div>
          )}
        </div>

        {/* Statut + historique */}
        <div className="lg:col-span-2 space-y-4">
          {/* Changement de statut */}
          <div className="bg-white rounded-xl p-4 sm:p-6">
            <h3 className="font-bold text-slate-900 mb-4">Progression du colis</h3>

            {/* Frise */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 mb-6">
              {STATUT_ORDER.map((statut, index) => {
                const atteint = index <= statutActuelIndex;
                const estActuel = index === statutActuelIndex;
                return (
                  <div key={statut} className="flex sm:flex-col items-center sm:flex-1 gap-3 sm:gap-2">
                    <div className="flex sm:flex-col items-center sm:w-full">
                      <div
                        className={`w-4 h-4 rounded-full flex-shrink-0 ${atteint ? 'bg-orange-500' : 'bg-slate-200'} ${estActuel ? 'ring-4 ring-orange-100' : ''}`}
                      />
                      {index < STATUT_ORDER.length - 1 && (
                        <div className="hidden sm:block h-0.5 flex-1 ml-2"
                          style={{ background: index < statutActuelIndex ? '#f97316' : '#e2e8f0' }}
                        />
                      )}
                    </div>
                    <span className={`text-xs sm:mt-2 whitespace-nowrap ${atteint ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
                      {STATUT_LABELS[statut]}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bouton changement de statut */}
            {prochainStatut ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Commentaire (optionnel)
                  </label>
                  <input
                    type="text"
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                    placeholder="Note sur cette transition..."
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>

                {statutError && (
                  <p className="text-red-600 text-sm">{statutError}</p>
                )}
                {statutSuccess && (
                  <p className="text-green-600 text-sm">{statutSuccess}</p>
                )}

                <button
                  onClick={changerStatut}
                  disabled={statutLoading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50"
                >
                  {statutLoading
                    ? 'Mise à jour...'
                    : `Passer à "${STATUT_LABELS[prochainStatut]}"`}
                </button>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-center">
                <p className="text-green-700 text-sm font-medium">✓ Colis livré — cycle terminé</p>
              </div>
            )}
          </div>

          {/* Historique */}
          <div className="bg-white rounded-xl p-4 sm:p-6">
            <h3 className="font-bold text-slate-900 mb-4">Historique des mouvements</h3>
            <div className="space-y-4">
              {mouvements.length === 0 && (
                <p className="text-slate-400 text-sm">Aucun mouvement enregistré.</p>
              )}
              {mouvements.map((m) => (
                <div key={m.id} className="flex gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-700">
                      <span className="font-medium">{STATUT_LABELS[m.ancien_statut] || 'Création'}</span>
                      {' → '}
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
      </div>
    </Layout>
  );
}