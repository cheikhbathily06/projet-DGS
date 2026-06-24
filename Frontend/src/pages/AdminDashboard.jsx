import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import apiFetch from '../api/client';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from 'recharts';

const STATUT_LABELS = {
  recu: 'Reçu',
  expedie: 'Expédié',
  en_transit: 'En transit',
  arrive: 'Arrivé',
  disponible: 'Disponible',
  livre: 'Livré',
};

const STATUT_COLORS_HEX = {
  recu: '#94a3b8',
  expedie: '#f97316',
  en_transit: '#3b82f6',
  arrive: '#a855f7',
  disponible: '#06b6d4',
  livre: '#22c55e',
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const result = await apiFetch('/admin/stats');
        setData(result);
      } catch (err) {
        setError('Impossible de charger le tableau de bord.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <Layout><p className="text-slate-300 text-lg">Chargement...</p></Layout>;
  if (error || !data) return <Layout><p className="text-red-400 text-lg">{error || 'Erreur de chargement.'}</p></Layout>;

  const pieData = Object.entries(STATUT_LABELS)
    .map(([statut, label]) => ({
      name: label,
      value: data.resume_statuts[statut] || 0,
      color: STATUT_COLORS_HEX[statut],
    }))
    .filter((d) => d.value > 0);

  const barData = data.performance_agents.map((agent) => ({
    name: `${agent.prenom} ${agent.nom[0]}.`,
    colis: agent.colis_crees,
  }));

  const lineData = (data.evolution_mensuelle || []).map((m) => ({
    mois: m.mois,
    total: m.total,
  }));

  const tauxData = (data.taux_par_destination || []).map((d) => ({
    destination: d.destination.length > 15 ? d.destination.substring(0, 15) + '...' : d.destination,
    taux: parseFloat(d.taux),
    total: d.total,
    livres: d.livres,
  }));

  const tauxLivraison = data.resume_statuts.livre && data.total_colis
    ? Math.round((data.resume_statuts.livre / data.total_colis) * 100)
    : 0;

  return (
    <Layout>
      <h2 className="text-2xl sm:text-3xl font-bold text-white">Tableau de bord</h2>
      <p className="text-slate-300 mt-1 text-base">Vue globale de la plateforme DGS Track.</p>

      {/* KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
        {[
          { label: 'Total colis', value: data.total_colis, color: 'border-orange-500' },
          { label: 'Taux de livraison', value: `${tauxLivraison}%`, color: 'border-green-500' },
          { label: 'Délai moyen', value: `${data.delai_moyen_jours}j`, color: 'border-blue-500' },
          { label: 'Agents actifs', value: data.total_agents, color: 'border-purple-500' },
        ].map((kpi) => (
          <div key={kpi.label} className={`bg-white rounded-xl p-5 border-l-4 ${kpi.color}`}>
            <p className="text-sm font-medium text-slate-500">{kpi.label}</p>
            <p className="text-3xl sm:text-4xl font-bold text-slate-900 mt-2">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Camembert statuts */}
        <div className="bg-white rounded-xl p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Répartition des colis par statut</h3>
          {pieData.length === 0 ? (
            <p className="text-slate-400 text-center py-12">Aucune donnée disponible.</p>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value + ' colis', name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 min-w-max">
                {pieData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: entry.color }} />
                    <span className="text-slate-600">{entry.name}</span>
                    <span className="font-semibold text-slate-900 ml-auto pl-4">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Performance agents */}
        <div className="bg-white rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Performance des agents</h3>
            <Link to="/admin/users" className="text-orange-600 text-sm font-medium hover:underline">
              Gérer →
            </Link>
          </div>
          {barData.length === 0 ? (
            <p className="text-slate-400 text-center py-12">Aucun agent enregistré.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  formatter={(value) => [value + ' colis', 'Colis créés']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="colis" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Évolution mensuelle */}
        <div className="bg-white rounded-xl p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Évolution mensuelle des volumes</h3>
          {lineData.length === 0 ? (
            <p className="text-slate-400 text-center py-12">Pas encore de données sur 6 mois.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={lineData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  formatter={(value) => [value + ' colis', 'Volume']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={{ fill: '#f97316', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Taux de succès par destination */}
        <div className="bg-white rounded-xl p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Taux de livraison par destination</h3>
          {tauxData.length === 0 ? (
            <p className="text-slate-400 text-center py-12">Aucune donnée disponible.</p>
          ) : (
            <div className="space-y-4">
              {tauxData.map((d) => (
                <div key={d.destination}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-700 font-medium truncate">{d.destination}</span>
                    <span className="text-slate-500 text-xs ml-2 flex-shrink-0">
                      {d.livres}/{d.total} colis · <span className="font-semibold text-slate-800">{d.taux}%</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${d.taux}%`,
                        background: d.taux >= 80 ? '#22c55e' : d.taux >= 50 ? '#f97316' : '#ef4444'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lien gestion utilisateurs */}
      <div className="mt-6 bg-white rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Gestion des utilisateurs</h3>
          <p className="text-slate-500 text-sm mt-1">
            {data.total_agents} agents · {data.total_clients} clients enregistrés
          </p>
        </div>
        <Link
          to="/admin/users"
          className="bg-blue-950 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-blue-900 transition whitespace-nowrap"
        >
          Gérer les utilisateurs
        </Link>
      </div>
    </Layout>
  );
}