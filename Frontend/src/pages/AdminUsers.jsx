import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import apiFetch from '../api/client';

const ROLE_COLORS = {
  admin: 'bg-purple-100 text-purple-700',
  agent: 'bg-blue-100 text-blue-700',
  client: 'bg-green-100 text-green-700',
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [roleFiltre, setRoleFiltre] = useState('');
  const [recherche, setRecherche] = useState('');
  const [rechercheInput, setRechercheInput] = useState('');
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', telephone: '', role: 'client', password: '' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const [deleteUser, setDeleteUser] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => setRecherche(rechercheInput), 400);
    return () => clearTimeout(timeout);
  }, [rechercheInput]);

  useEffect(() => {
    load();
  }, [page, roleFiltre, recherche]);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page });
      if (roleFiltre) params.append('role', roleFiltre);
      if (recherche) params.append('recherche', recherche);
      const data = await apiFetch(`/admin/users?${params.toString()}`);
      setUsers(data.data);
      setPagination(data);
    } catch (err) {
      // silencieux
    } finally {
      setLoading(false);
    }
  }

  function ouvrirCreation() {
    setEditUser(null);
    setForm({ nom: '', prenom: '', email: '', telephone: '', role: 'client', password: '' });
    setFormError('');
    setModalOpen(true);
  }

  function ouvrirEdition(user) {
    setEditUser(user);
    setForm({ nom: user.nom, prenom: user.prenom, email: user.email, telephone: user.telephone, role: user.role, password: '' });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;

      if (editUser) {
        await apiFetch(`/admin/users/${editUser.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiFetch('/admin/users', { method: 'POST', body: JSON.stringify(payload) });
      }

      setModalOpen(false);
      load();
    } catch (err) {
      const messages = err.data?.errors
        ? Object.values(err.data.errors).flat().join(' ')
        : err.data?.message || 'Une erreur est survenue.';
      setFormError(messages);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteUser) return;
    setDeleteError('');
    try {
      await apiFetch(`/admin/users/${deleteUser.id}`, { method: 'DELETE' });
      setDeleteUser(null);
      load();
    } catch (err) {
      setDeleteError(err.data?.message || 'Impossible de supprimer cet utilisateur.');
    }
  }

  async function toggleActif(user) {
    try {
      await apiFetch(`/admin/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({ actif: !user.actif }),
      });
      load();
    } catch (err) {
      // silencieux
    }
  }

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Gestion des utilisateurs</h2>
          <p className="text-slate-300 mt-1">Créez, modifiez et gérez les comptes agents et clients.</p>
        </div>
        <button
          onClick={ouvrirCreation}
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
        >
          + Nouvel utilisateur
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <input
          type="text"
          placeholder="Rechercher par nom, prénom ou email..."
          value={rechercheInput}
          onChange={(e) => { setRechercheInput(e.target.value); setPage(1); }}
          className="flex-1 px-4 py-2.5 rounded-lg bg-white text-sm text-slate-700 border-0"
        />
        <select
          value={roleFiltre}
          onChange={(e) => { setRoleFiltre(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-lg bg-white text-sm text-slate-700 border-0"
        >
          <option value="">Tous les rôles</option>
          <option value="admin">Admin</option>
          <option value="agent">Agent</option>
          <option value="client">Client</option>
        </select>
      </div>

      <div className="bg-white rounded-xl p-4 sm:p-6 mt-4">
        {loading && <p className="text-slate-400 text-sm py-6 text-center">Chargement...</p>}
        {!loading && users.length === 0 && (
          <p className="text-slate-400 text-sm py-6 text-center">Aucun utilisateur trouvé.</p>
        )}

        {/* Vue mobile */}
        <div className="space-y-3 sm:hidden">
          {users.map((u) => (
            <div key={u.id} className="border border-slate-100 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-800 text-sm">{u.prenom} {u.nom}</p>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role]}`}>
                  {u.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{u.email}</p>
              <p className="text-xs text-slate-400">{u.telephone}</p>
              <div className="flex gap-2 mt-2">
                <button onClick={() => ouvrirEdition(u)} className="text-orange-600 text-xs font-medium hover:underline">Modifier</button>
                <button onClick={() => toggleActif(u)} className={`text-xs font-medium ${u.actif ? 'text-red-500' : 'text-green-600'}`}>
                  {u.actif ? 'Désactiver' : 'Activer'}
                </button>
                <button onClick={() => { setDeleteUser(u); setDeleteError(''); }} className="text-red-500 text-xs font-medium hover:underline">Supprimer</button>
              </div>
            </div>
          ))}
        </div>

        {/* Vue desktop */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                <th className="pb-2 font-medium">NOM</th>
                <th className="pb-2 font-medium">EMAIL</th>
                <th className="pb-2 font-medium">TÉLÉPHONE</th>
                <th className="pb-2 font-medium">RÔLE</th>
                <th className="pb-2 font-medium">STATUT</th>
                <th className="pb-2 font-medium">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-50">
                  <td className="py-3 font-medium text-slate-800 whitespace-nowrap">{u.prenom} {u.nom}</td>
                  <td className="py-3 text-slate-600 whitespace-nowrap">{u.email}</td>
                  <td className="py-3 text-slate-600 whitespace-nowrap">{u.telephone}</td>
                  <td className="py-3 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[u.role]}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${u.actif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="py-3 whitespace-nowrap">
                    <div className="flex gap-3">
                      <button onClick={() => ouvrirEdition(u)} className="text-orange-600 font-medium hover:underline text-xs">Modifier</button>
                      <button onClick={() => toggleActif(u)} className={`font-medium text-xs ${u.actif ? 'text-red-500' : 'text-green-600'}`}>
                        {u.actif ? 'Désactiver' : 'Activer'}
                      </button>
                      <button onClick={() => { setDeleteUser(u); setDeleteError(''); }} className="text-red-500 font-medium hover:underline text-xs">Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination && pagination.last_page > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 rounded-lg text-sm border border-slate-200 disabled:opacity-40">Précédent</button>
            <span className="text-sm text-slate-500">Page {pagination.current_page} / {pagination.last_page}</span>
            <button disabled={page >= pagination.last_page} onClick={() => setPage(page + 1)} className="px-3 py-1.5 rounded-lg text-sm border border-slate-200 disabled:opacity-40">Suivant</button>
          </div>
        )}
      </div>

      {/* Modal création/édition */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Prénom</label>
                  <input
                    required
                    value={form.prenom}
                    onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nom</label>
                  <input
                    required
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Téléphone</label>
                <input
                  required
                  value={form.telephone}
                  onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                  placeholder="+221771234567"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Rôle</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                >
                  <option value="client">Client</option>
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Mot de passe {editUser && <span className="text-slate-400">(laisser vide pour ne pas changer)</span>}
                </label>
                <input
                  type="password"
                  required={!editUser}
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 bg-slate-100 text-slate-700 text-sm font-medium py-2.5 rounded-lg hover:bg-slate-200 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-blue-950 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-blue-900 transition disabled:opacity-50"
                >
                  {formLoading ? 'Enregistrement...' : editUser ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmation suppression */}
      {deleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDeleteUser(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl mb-4">
              ⚠
            </div>
            <h3 className="text-lg font-bold text-slate-900">Supprimer cet utilisateur ?</h3>
            <p className="text-slate-500 text-sm mt-2">
              {deleteUser.prenom} {deleteUser.nom} sera définitivement supprimé. Cette action est irréversible.
            </p>

            {deleteError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mt-3 text-left">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setDeleteUser(null); setDeleteError(''); }}
                className="flex-1 bg-slate-100 text-slate-700 text-sm font-medium py-2.5 rounded-lg hover:bg-slate-200 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-red-700 transition"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}