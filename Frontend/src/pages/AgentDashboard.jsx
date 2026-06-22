import Layout from '../components/Layout';

export default function AgentDashboard() {
  return (
    <Layout>
      <h2 className="text-xl sm:text-2xl font-bold text-white">Tableau de bord Agent</h2>
      <p className="text-slate-300 mt-1 text-sm sm:text-base">
        Bienvenue dans votre espace de gestion des colis.
      </p>

      <div className="bg-white rounded-xl p-6 mt-6">
        <p className="text-slate-500 text-sm">
          Interface agent en cours de construction — liste des colis, création, gestion des statuts à venir.
        </p>
      </div>
    </Layout>
  );
}