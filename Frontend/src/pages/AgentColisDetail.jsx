import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import apiFetch from '../api/client';
import jsPDF from 'jspdf';

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

const TAUX_AED_PAR_FCFA = 0.0062;

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

  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');

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
      setPhotoUrl(colisData.photo_url || '');
      setEditForm({
        expediteur: colisData.expediteur,
        nom_destinataire: colisData.nom_destinataire || '',
        telephone_destinataire: colisData.telephone_destinataire || '',
        origine: colisData.origine,
        destination: colisData.destination,
        poids_kg: colisData.poids_kg,
        cout_transport: colisData.cout_transport,
      });
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

  async function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
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

      await apiFetch(`/colis/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ photo_url: data.secure_url }),
      });
    } catch (err) {
      setEditError('Erreur lors de l\'upload de la photo.');
    } finally {
      setPhotoLoading(false);
    }
  }

 function handleEditChange(e) {
  const { name, value } = e.target;
  
  let updates = { [name]: value };
  
  if (name === 'origine') {
    if (value === 'Dakar, Sénégal') updates.destination = 'Dubai, UAE';
    else if (value === 'Dubai, UAE') updates.destination = 'Dakar, Sénégal';
  }
  if (name === 'destination') {
    if (value === 'Dakar, Sénégal') updates.origine = 'Dubai, UAE';
    else if (value === 'Dubai, UAE') updates.origine = 'Dakar, Sénégal';
  }
  
  if (name === 'poids_kg') {
    updates.cout_transport = Math.round(parseFloat(value || 0) * 10000);
  }
  
  setEditForm((prev) => ({ ...prev, ...updates }));
}

  async function handleEditSubmit(e) {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    setEditSuccess('');

    try {
      const data = await apiFetch(`/colis/${id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm),
      });
      setColis(data);
      setEditMode(false);
      setEditSuccess('Colis modifié avec succès.');
    } catch (err) {
      const messages = err.data?.errors
        ? Object.values(err.data.errors).flat().join(' ')
        : err.data?.message || 'Erreur lors de la modification.';
      setEditError(messages);
    } finally {
      setEditLoading(false);
    }
  }

  async function exporterPDF() {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    let y = 20;

    pdf.setFillColor(12, 68, 124);
    pdf.rect(0, 0, pageWidth, 20, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DGS AFRICA LOGISTICS', margin, 13);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text('BON DE LIVRAISON', pageWidth - margin, 13, { align: 'right' });

    y = 32;
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.text(colis.code_suivi, pageWidth / 2, y, { align: 'center' });

    y += 8;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Statut : ${STATUT_LABELS[colis.statut]}`, pageWidth / 2, y, { align: 'center' });

    y += 12;
    pdf.setDrawColor(200, 200, 200);
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(margin, y, pageWidth - margin * 2, 60, 3, 3, 'FD');

    y += 8;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 58, 138);
    pdf.text('EXPÉDITEUR', margin + 5, y);
    pdf.text('DESTINATAIRE', pageWidth / 2 + 5, y);

    y += 6;
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(30, 30, 30);
    pdf.setFontSize(10);
    pdf.text(colis.expediteur, margin + 5, y);
    pdf.text(colis.nom_destinataire || colis.destination, pageWidth / 2 + 5, y);

    y += 6;
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(9);
    pdf.text(`Origine : ${colis.origine}`, margin + 5, y);
    if (colis.telephone_destinataire) {
      pdf.text(`Tél : ${colis.telephone_destinataire}`, pageWidth / 2 + 5, y);
    }

    y += 6;
    pdf.text(`Destination : ${colis.destination}`, margin + 5, y);

    y += 20;
    pdf.setDrawColor(200, 200, 200);
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(margin, y, pageWidth - margin * 2, 38, 3, 3, 'FD');

    y += 8;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 58, 138);
    pdf.text('DÉTAILS DU COLIS', margin + 5, y);

    y += 7;
    const col1X = margin + 5;
    const col2X = pageWidth / 2 + 5;
    const coutAED = Math.round(Number(colis.cout_transport) * TAUX_AED_PAR_FCFA);

    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80, 80, 80);
    pdf.setFontSize(9);

    pdf.text('Poids :', col1X, y);
    pdf.setTextColor(30, 30, 30);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${colis.poids_kg} kg`, col1X + 25, y);

    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80, 80, 80);
    pdf.text('Date :', col2X, y);
    pdf.setTextColor(30, 30, 30);
    pdf.setFont('helvetica', 'bold');
    pdf.text(new Date(colis.cree_le).toLocaleDateString('fr-FR'), col2X + 25, y);

    y += 8;
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80, 80, 80);
    pdf.text('Coût :', col1X, y);
    pdf.setTextColor(30, 30, 30);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${Number(colis.cout_transport).toLocaleString('fr-FR')} FCFA (≈ ${coutAED} AED)`, col1X + 25, y);

    y += 20;

    if (colis.qr_code_url) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = colis.qr_code_url;
        });
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
        const imgData = canvas.toDataURL('image/png');
        const qrSize = 50;
        const qrX = (pageWidth - qrSize) / 2;
        pdf.addImage(imgData, 'PNG', qrX, y, qrSize, qrSize);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(150, 150, 150);
        pdf.text('Scannez pour suivre votre colis', pageWidth / 2, y + qrSize + 5, { align: 'center' });
        y += qrSize + 12;
      } catch (e) {
        // silencieux
      }
    }

    pdf.setDrawColor(180, 180, 180);
    pdf.setLineDashPattern([2, 2], 0);
    pdf.line(margin, y + 5, pageWidth - margin, y + 5);
    pdf.setLineDashPattern([], 0);
    pdf.setFontSize(7);
    pdf.setTextColor(180, 180, 180);
    pdf.text('✂ Découpez et collez sur le colis', pageWidth / 2, y + 10, { align: 'center' });

    y += 18;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(150, 150, 150);
    pdf.text('DGS Africa Logistics — Document généré le ' + new Date().toLocaleString('fr-FR'), pageWidth / 2, y, { align: 'center' });

    pdf.save(`BON_${colis.code_suivi}.pdf`);
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
  const coutAED = Math.round(Number(colis.cout_transport) * TAUX_AED_PAR_FCFA);
  const coutEditAED = Math.round(Number(editForm.cout_transport) * TAUX_AED_PAR_FCFA);

  return (
    <Layout>
      <Link to="/agent/colis" className="text-slate-300 text-sm hover:text-white">
        ← Retour à la liste
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-3 gap-2">
        <h2 className="text-xl sm:text-2xl font-bold text-white">{colis.code_suivi}</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUT_COLORS[colis.statut]}`}>
            {STATUT_LABELS[colis.statut]}
          </span>
          <button
            onClick={() => setEditMode(!editMode)}
            className="bg-slate-100 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-200 transition"
          >
            ✏️ {editMode ? 'Annuler' : 'Modifier'}
          </button>
          <button
            onClick={exporterPDF}
            className="bg-white text-slate-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-100 transition"
          >
            📄 Exporter PDF
          </button>
        </div>
      </div>

      {editSuccess && <p className="text-green-400 text-sm mt-2">{editSuccess}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mt-6">
        <div className="bg-white rounded-xl p-4 sm:p-6">
          {editMode ? (
            <>
              <h3 className="font-bold text-slate-900 mb-4">Modifier le colis</h3>
              <form onSubmit={handleEditSubmit} className="space-y-3">
                {editError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">{editError}</div>
                )}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Expéditeur</label>
                  <input name="expediteur" value={editForm.expediteur} onChange={handleEditChange}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nom destinataire</label>
                  <input name="nom_destinataire" value={editForm.nom_destinataire} onChange={handleEditChange}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Téléphone destinataire</label>
                  <input name="telephone_destinataire" value={editForm.telephone_destinataire} onChange={handleEditChange}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Origine</label>
                  <select name="origine" value={editForm.origine} onChange={handleEditChange}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900">
                    <option value="">Sélectionner</option>
                    <option value="Dubai, UAE">Dubai, UAE</option>
                    <option value="Dakar, Sénégal">Dakar, Sénégal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Destination</label>
                  <select name="destination" value={editForm.destination} onChange={handleEditChange}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900">
                    <option value="">Sélectionner</option>
                    <option value="Dakar, Sénégal">Dakar, Sénégal</option>
                    <option value="Dubai, UAE">Dubai, UAE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Poids (kg)</label>
                  <input name="poids_kg" type="number" step="0.01" min="0.01" value={editForm.poids_kg} onChange={handleEditChange}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
                </div>
                {editForm.poids_kg > 0 && (
                  <div className="bg-blue-50 rounded-lg px-3 py-2 text-xs">
                    <span className="font-bold text-blue-900">{Number(editForm.cout_transport).toLocaleString('fr-FR')} FCFA</span>
                    {' · '}
                    <span className="font-bold text-orange-600">≈ {coutEditAED} AED</span>
                  </div>
                )}
                <button type="submit" disabled={editLoading}
                  className="w-full bg-blue-950 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-900 transition disabled:opacity-50">
                  {editLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h3 className="font-bold text-slate-900 mb-4">Détails du colis</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Expéditeur</dt>
                  <dd className="text-slate-800 font-medium">{colis.expediteur}</dd>
                </div>
                {colis.nom_destinataire && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Destinataire</dt>
                    <dd className="text-slate-800 font-medium">{colis.nom_destinataire}</dd>
                  </div>
                )}
                {colis.telephone_destinataire && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Tél. destinataire</dt>
                    <dd className="text-slate-800 font-medium">{colis.telephone_destinataire}</dd>
                  </div>
                )}
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
                  <dt className="text-slate-500">Coût</dt>
                  <dd className="text-slate-800 font-medium">
                    {Number(colis.cout_transport).toLocaleString('fr-FR')} FCFA
                    <span className="text-orange-600 ml-1">(≈ {coutAED} AED)</span>
                  </dd>
                </div>
              </dl>

              {colis.qr_code_url && (
                <div className="mt-6 text-center">
                  <img src={colis.qr_code_url} alt="QR Code" className="w-28 h-28 mx-auto" />
                  <p className="text-xs text-slate-400 mt-2">QR Code de suivi</p>
                </div>
              )}

              <div className="mt-4">
                <p className="text-xs font-medium text-slate-600 mb-2">Photo du colis</p>
                {photoUrl ? (
                  <div>
                    <img src={photoUrl} alt="Photo du colis" className="w-full h-32 object-cover rounded-lg border border-slate-200" />
                    <label className="block mt-2 text-xs text-orange-600 cursor-pointer hover:underline">
                      Changer la photo
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  </div>
                ) : (
                  <label className="block w-full border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:border-orange-400 transition">
                    <p className="text-slate-400 text-xs">📷 Ajouter une photo</p>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                )}
                {photoLoading && <p className="text-xs text-slate-400 mt-1">Upload en cours...</p>}
              </div>
            </>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl p-4 sm:p-6">
            <h3 className="font-bold text-slate-900 mb-4">Progression du colis</h3>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 mb-6">
              {STATUT_ORDER.map((statut, index) => {
                const atteint = index <= statutActuelIndex;
                const estActuel = index === statutActuelIndex;
                return (
                  <div key={statut} className="flex sm:flex-col items-center sm:flex-1 gap-3 sm:gap-2">
                    <div className="flex sm:flex-col items-center sm:w-full">
                      <div className={`w-4 h-4 rounded-full flex-shrink-0 ${atteint ? 'bg-orange-500' : 'bg-slate-200'} ${estActuel ? 'ring-4 ring-orange-100' : ''}`} />
                      {index < STATUT_ORDER.length - 1 && (
                        <div className="hidden sm:block h-0.5 flex-1 ml-2"
                          style={{ background: index < statutActuelIndex ? '#f97316' : '#e2e8f0' }} />
                      )}
                    </div>
                    <span className={`text-xs sm:mt-2 whitespace-nowrap ${atteint ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
                      {STATUT_LABELS[statut]}
                    </span>
                  </div>
                );
              })}
            </div>

            {prochainStatut ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Commentaire (optionnel)</label>
                  <input type="text" value={commentaire} onChange={(e) => setCommentaire(e.target.value)}
                    placeholder="Note sur cette transition..."
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
                </div>
                {statutError && <p className="text-red-600 text-sm">{statutError}</p>}
                {statutSuccess && <p className="text-green-600 text-sm">{statutSuccess}</p>}
                <button onClick={changerStatut} disabled={statutLoading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50">
                  {statutLoading ? 'Mise à jour...' : `Passer à "${STATUT_LABELS[prochainStatut]}"`}
                </button>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-center">
                <p className="text-green-700 text-sm font-medium">✓ Colis livré — cycle terminé</p>
              </div>
            )}
          </div>

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
                    {m.commentaire && <p className="text-slate-500 text-xs mt-0.5">{m.commentaire}</p>}
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