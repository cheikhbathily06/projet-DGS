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

export default function AgentColisListe() {
  const [colis, setColis] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [statutFiltre, setStatutFiltre] = useState('');
  const [destinationFiltre, setDestinationFiltre] = useState('');
  const [recherche, setRecherche] = useState('');
  const [rechercheInput, setRechercheInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setRecherche(rechercheInput), 400);
    return () => clearTimeout(timeout);
  }, [rechercheInput]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page });
        if (statutFiltre) params.append('statut', statutFiltre);
        if (destinationFiltre) params.append('destination', destinationFiltre);
        if (recherche) params.append('recherche', recherche);

        const data = await apiFetch(`/colis?${params.toString()}`);
        setColis(data.data);
        setPagination(data);
      } catch (err) {
        // gestion silencieuse
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page, statutFiltre, destinationFiltre, recherche]);

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Gestion des colis</h2>
          <p className="text-slate-300 mt-1 text-sm">Recherchez, filtrez et gérez les expéditions.</p>
        </div>
        <Link
          to="/agent/colis/nouveau"
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg text-center transition"
        >
          + Nouveau colis
        </Link>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <input
          type="text"
          placeholder="Rechercher par code de suivi..."
          value={rechercheInput}
          onChange={(e) => { setRechercheInput(e.target.value); setPage(1); }}
          className="flex-1 px-4 py-2.5 rounded-lg bg-white text-sm text-slate-700 border-0"
        />
        <select
          value={statutFiltre}
          onChange={(e) => { setStatutFiltre(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-lg bg-white text-sm text-slate-700 border-0"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(STATUT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Filtrer par destination"
          value={destinationFiltre}
          onChange={(e) => { setDestinationFiltre(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-lg bg-white text-sm text-slate-700 border-0"
        />
      </div>

      <div className="bg-white rounded-xl p-4 sm:p-6 mt-4">
        {loading && <p className="text-slate-400 text-sm py-6 text-center">Chargement...</p>}

        {!loading && colis.length === 0 && (
          <p className="text-slate-400 text-sm py-6 text-center">Aucun colis trouvé.</p>
        )}

        {/* Vue mobile - cartes */}
        <div className="space-y-3 sm:hidden">
          {colis.map((c) => (
            <Link
              key={c.id}
              to={`/agent/colis/${c.id}`}
              className="block border border-slate-100 rounded-lg p-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-800 text-sm">{c.code_suivi}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUT_COLORS[c.statut]}`}>
                  {STATUT_LABELS[c.statut]}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{c.origine} → {c.destination}</p>
              <p className="text-xs text-slate-400 mt-1">{c.expediteur}</p>
            </Link>
          ))}
        </div>

        {/* Vue desktop - tableau */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                <th className="pb-2 font-medium whitespace-nowrap">CODE SUIVI</th>
                <th className="pb-2 font-medium whitespace-nowrap">EXPÉDITEUR</th>
                <th className="pb-2 font-medium whitespace-nowrap">DESTINATION</th>
                <th className="pb-2 font-medium whitespace-nowrap">STATUT</th>
                <th className="pb-2 font-medium whitespace-nowrap">DATE</th>
                <th className="pb-2 font-medium whitespace-nowrap">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {colis.map((c) => (
                <tr key={c.id} className="border-b border-slate-50">
                  <td className="py-3 font-medium text-slate-800 whitespace-nowrap">{c.code_suivi}</td>
                  <td className="py-3 text-slate-600 whitespace-nowrap">{c.expediteur}</td>
                  <td className="py-3 text-slate-600 whitespace-nowrap">{c.destination}</td>
                  <td className="py-3 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUT_COLORS[c.statut]}`}>
                      {STATUT_LABELS[c.statut]}
                    </span>
                  </td>
                  <td className="py-3 text-slate-500 whitespace-nowrap">
                    {new Date(c.cree_le).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-3 whitespace-nowrap">
                    <Link to={`/agent/colis/${c.id}`} className="text-orange-600 font-medium hover:underline">
                      Gérer
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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