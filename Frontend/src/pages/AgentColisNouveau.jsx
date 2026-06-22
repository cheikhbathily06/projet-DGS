import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import apiFetch from '../api/client';

export default function AgentColisNouveau() {
  const [typeClient, setTypeClient] = useState('avec_compte');
  const [telephone, setTelephone] = useState('');
  const [clientTrouve, setClientTrouve] = useState(null);
  const [rechercheError, setRechercheError] = useState('');
  const [rechercheLoading, setRechercheLoading] = useState(false);

  const [form, setForm] = useState({
    nom: '',
    telephone_whatsapp: '',
    adresse: '',
    expediteur: '',
    origine: '',
    destination: '',
    poids_kg: '',
    volume_m3: '',
    cout_transport: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function rechercherClient() {
    setRechercheError('');
    setClientTrouve(null);
    setRechercheLoading(true);
    try {
      const data = await apiFetch(`/clients/recherche?telephone=${encodeURIComponent(telephone)}`);
      setClientTrouve(data);
    } catch (err) {
      setRechercheError('Aucun client trouvé avec ce numéro.');
    } finally {
      setRechercheLoading(false);
    }
  }

  function resetForm() {
    setSuccess(null);
    setClientTrouve(null);
    setTelephone('');
    setForm({
      nom: '', telephone_whatsapp: '', adresse: '',
      expediteur: '', origine: '', destination: '',
      poids_kg: '', volume_m3: '', cout_transport: '',
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;

      if (typeClient === 'avec_compte') {
        if (!clientTrouve) {
          setError('Veuillez d\'abord rechercher un client par son numéro de téléphone.');
          setLoading(false);
          return;
        }
        result = await apiFetch('/colis', {
          method: 'POST',
          body: JSON.stringify({
            client_id: clientTrouve.id,
            expediteur: form.expediteur,
            origine: form.origine,
            destination: form.destination,
            poids_kg: form.poids_kg,
            volume_m3: form.volume_m3,
            cout_transport: form.cout_transport,
          }),
        });
        setSuccess({ codeSuivi: result.code_suivi, whatsapp: false });
      } else {
        result = await apiFetch('/colis/sans-compte', {
          method: 'POST',
          body: JSON.stringify({
            nom: form.nom,
            telephone_whatsapp: form.telephone_whatsapp,
            adresse: form.adresse,
            expediteur: form.expediteur,
            origine: form.origine,
            destination: form.destination,
            poids_kg: form.poids_kg,
            volume_m3: form.volume_m3,
            cout_transport: form.cout_transport,
          }),
        });
        setSuccess({ codeSuivi: result.colis.code_suivi, whatsapp: true });
      }
    } catch (err) {
      const messages = err.data?.errors
        ? Object.values(err.data.errors).flat().join(' ')
        : err.data?.message || 'Une erreur est survenue.';
      setError(messages);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Layout>
        <div className="bg-white rounded-xl p-8 max-w-lg mx-auto mt-12 text-center">
          <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl">
            ✓
          </div>
          <h3 className="text-lg font-bold text-slate-900 mt-4">Colis enregistré avec succès</h3>
          <p className="text-slate-500 text-sm mt-2">
            Code de suivi : <span className="font-semibold text-slate-800">{success.codeSuivi}</span>
          </p>
          {success.whatsapp && (
            <p className="text-green-600 text-sm mt-3 bg-green-50 rounded-lg px-4 py-2">
              ✓ Message WhatsApp de confirmation envoyé au client
            </p>
          )}
          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={resetForm}
              className="bg-slate-100 text-slate-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-slate-200 transition"
            >
              Créer un autre colis
            </button>
            <button
              onClick={() => navigate('/agent/colis')}
              className="bg-orange-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-orange-600 transition"
            >
              Voir la liste des colis
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Link to="/agent/colis" className="text-slate-300 text-sm hover:text-white">
        ← Retour à la liste
      </Link>

      <h2 className="text-xl sm:text-2xl font-bold text-white mt-3">Nouveau colis</h2>
      <p className="text-slate-300 mt-1 text-sm">Enregistrez un nouveau colis dans le système.</p>

      <div className="bg-white rounded-xl p-4 sm:p-6 mt-6 max-w-3xl">
        {/* Toggle type de client */}
        <div className="flex gap-2 bg-slate-100 rounded-lg p-1 w-full sm:w-fit mb-6">
          <button
            type="button"
            onClick={() => { setTypeClient('avec_compte'); setClientTrouve(null); setTelephone(''); setRechercheError(''); }}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition ${
              typeClient === 'avec_compte' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Client avec compte
          </button>
          <button
            type="button"
            onClick={() => { setTypeClient('sans_compte'); setClientTrouve(null); setTelephone(''); setRechercheError(''); }}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition ${
              typeClient === 'sans_compte' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Client sans compte
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {/* Champs client avec compte */}
          {typeClient === 'avec_compte' ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Numéro de téléphone du client
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={telephone}
                  onChange={(e) => { setTelephone(e.target.value); setClientTrouve(null); setRechercheError(''); }}
                  placeholder="+221771234567"
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
                <button
                  type="button"
                  onClick={rechercherClient}
                  disabled={!telephone || rechercheLoading}
                  className="px-4 py-2.5 bg-blue-950 text-white text-sm rounded-lg hover:bg-blue-900 transition disabled:opacity-50"
                >
                  {rechercheLoading ? '...' : 'Rechercher'}
                </button>
              </div>

              {rechercheError && (
                <p className="text-red-600 text-xs mt-1">{rechercheError}</p>
              )}

              {clientTrouve && (
                <div className="mt-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {clientTrouve.prenom?.[0]}{clientTrouve.nom?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {clientTrouve.prenom} {clientTrouve.nom}
                    </p>
                    <p className="text-xs text-slate-500">{clientTrouve.email}</p>
                  </div>
                  <span className="ml-auto text-green-600 text-xs font-medium">✓ Trouvé</span>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
                <input
                  name="nom"
                  required
                  value={form.nom}
                  onChange={handleChange}
                  placeholder="Ex: Fatou Sow"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Numéro WhatsApp</label>
                <input
                  name="telephone_whatsapp"
                  required
                  value={form.telephone_whatsapp}
                  onChange={handleChange}
                  placeholder="+221771234567"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Adresse</label>
                <input
                  name="adresse"
                  required
                  value={form.adresse}
                  onChange={handleChange}
                  placeholder="Ex: Médina, Dakar"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>
            </div>
          )}

          <hr className="border-slate-100" />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Expéditeur</label>
            <input
              name="expediteur"
              required
              value={form.expediteur}
              onChange={handleChange}
              placeholder="Nom de l'expéditeur"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Origine</label>
              <input
                name="origine"
                required
                value={form.origine}
                onChange={handleChange}
                placeholder="Ex: Dubai, UAE"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Destination</label>
              <input
                name="destination"
                required
                value={form.destination}
                onChange={handleChange}
                placeholder="Ex: Dakar, Senegal"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Poids (kg)</label>
              <input
                name="poids_kg"
                required
                type="number"
                step="0.01"
                min="0.01"
                value={form.poids_kg}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Volume (m³)</label>
              <input
                name="volume_m3"
                required
                type="number"
                step="0.001"
                min="0.001"
                value={form.volume_m3}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Coût (XOF)</label>
              <input
                name="cout_transport"
                required
                type="number"
                step="1"
                min="1"
                value={form.cout_transport}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-950 text-white font-medium py-2.5 rounded-lg hover:bg-blue-900 transition disabled:opacity-50"
          >
            {loading ? 'Enregistrement...' : 'Enregistrer le colis'}
          </button>
        </form>
      </div>
    </Layout>
  );
}