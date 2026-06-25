import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import apiFetch from '../api/client';

const TAUX_FCFA_PAR_KG = 10000;
const TAUX_AED_PAR_FCFA = 0.0062; // 1 FCFA ≈ 0.0062 AED

export default function AgentColisNouveau() {
  const [typeClient, setTypeClient] = useState('avec_compte');
  const [telephone, setTelephone] = useState('');
  const [clientTrouve, setClientTrouve] = useState(null);
  const [rechercheError, setRechercheError] = useState('');
  const [rechercheLoading, setRechercheLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');

  const [form, setForm] = useState({
    nom: '',
    telephone_whatsapp: '',
    adresse: '',
    expediteur: '',
    nom_destinataire: '',
    telephone_destinataire: '',
    origine: '',
    destination: '',
    poids_kg: '',
    cout_transport: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Calcul automatique du coût
  const coutFCFA = form.poids_kg ? Math.round(parseFloat(form.poids_kg) * TAUX_FCFA_PAR_KG) : 0;
  const coutAED = Math.round(coutFCFA * TAUX_AED_PAR_FCFA);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'poids_kg' ? { cout_transport: Math.round(parseFloat(value || 0) * TAUX_FCFA_PAR_KG) } : {}),
    }));
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'dgs_track');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dzqq3zcs7/image/upload`,
        { method: 'POST', body: formData }
      );
      const data = await response.json();
      setPhotoUrl(data.secure_url);
    } catch (err) {
      setError('Erreur lors de l\'upload de la photo.');
    } finally {
      setPhotoLoading(false);
    }
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
    setPhotoUrl('');
    setPhotoFile(null);
    setForm({
      nom: '', telephone_whatsapp: '', adresse: '',
      expediteur: '', nom_destinataire: '', telephone_destinataire: '',
      origine: '', destination: '', poids_kg: '', cout_transport: '',
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      const payload = {
        expediteur: form.expediteur,
        nom_destinataire: form.nom_destinataire,
        telephone_destinataire: form.telephone_destinataire,
        origine: form.origine,
        destination: form.destination,
        poids_kg: form.poids_kg,
        cout_transport: coutFCFA,
        ...(photoUrl ? { photo_url: photoUrl } : {}),
      };

      if (typeClient === 'avec_compte') {
        if (!clientTrouve) {
          setError('Veuillez d\'abord rechercher un client par son numéro de téléphone.');
          setLoading(false);
          return;
        }
        result = await apiFetch('/colis', {
          method: 'POST',
          body: JSON.stringify({ ...payload, client_id: clientTrouve.id }),
        });
        setSuccess({ codeSuivi: result.code_suivi, whatsapp: false });
      } else {
        result = await apiFetch('/colis/sans-compte', {
          method: 'POST',
          body: JSON.stringify({
            ...payload,
            nom: form.nom,
            telephone_whatsapp: form.telephone_whatsapp,
            adresse: form.adresse,
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
          <p className="text-slate-500 text-sm mt-1">
            Coût : <span className="font-semibold text-slate-800">{coutFCFA.toLocaleString('fr-FR')} FCFA</span>
            {' · '}
            <span className="font-semibold text-slate-800">{coutAED} AED</span>
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

          {/* Infos expéditeur */}
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

          {/* Infos destinataire */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom du destinataire</label>
              <input
                name="nom_destinataire"
                value={form.nom_destinataire}
                onChange={handleChange}
                placeholder="Ex: Mamadou Diallo"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone destinataire</label>
              <input
                name="telephone_destinataire"
                value={form.telephone_destinataire}
                onChange={handleChange}
                placeholder="+221771234567"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>

          {/* Origine / Destination */}
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

          {/* Poids + Coût calculé automatiquement */}
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

          {/* Affichage du coût calculé */}
          {form.poids_kg > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
              <p className="text-sm font-medium text-blue-900">Coût calculé automatiquement :</p>
              <div className="flex gap-4 mt-1">
                <span className="text-lg font-bold text-blue-950">
                  {coutFCFA.toLocaleString('fr-FR')} FCFA
                </span>
                <span className="text-lg font-bold text-orange-600">
                  ≈ {coutAED} AED
                </span>
              </div>
              <p className="text-xs text-blue-600 mt-1">Tarif : 10 000 FCFA/kg · 1 FCFA = 0,0062 AED</p>
            </div>
          )}

          {/* Photo du colis */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Photo du colis <span className="text-slate-400 font-normal">(optionnel)</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-700 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-blue-950 file:text-white file:text-xs"
            />
            {photoLoading && <p className="text-xs text-slate-400 mt-1">Upload en cours...</p>}
            {photoUrl && (
              <div className="mt-2">
                <img src={photoUrl} alt="Photo du colis" className="w-24 h-24 object-cover rounded-lg border border-slate-200" />
                <p className="text-xs text-green-600 mt-1">✓ Photo uploadée</p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || photoLoading}
            className="w-full bg-blue-950 text-white font-medium py-2.5 rounded-lg hover:bg-blue-900 transition disabled:opacity-50"
          >
            {loading ? 'Enregistrement...' : 'Enregistrer le colis'}
          </button>
        </form>
      </div>
    </Layout>
  );
}