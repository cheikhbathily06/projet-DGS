<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query();

        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        if ($request->has('recherche')) {
            $query->where(function ($q) use ($request) {
                $q->where('nom', 'like', '%' . $request->recherche . '%')
                  ->orWhere('prenom', 'like', '%' . $request->recherche . '%')
                  ->orWhere('email', 'like', '%' . $request->recherche . '%');
            });
        }

        $users = $query->orderBy('id', 'desc')->paginate(15);

        return response()->json($users);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nom'       => 'required|string|max:50',
            'prenom'    => 'required|string|max:50',
            'email'     => 'required|email|unique:users',
            'telephone' => 'required|string|unique:users',
            'password'  => 'required|string|min:8',
            'role'      => 'required|in:admin,agent,client',
        ]);

        $user = User::create([
            'nom'       => $request->nom,
            'prenom'    => $request->prenom,
            'name'      => $request->nom . ' ' . $request->prenom,
            'email'     => $request->email,
            'telephone' => $request->telephone,
            'password'  => Hash::make($request->password),
            'role'      => $request->role,
            'actif'     => true,
        ]);

        return response()->json($user, 201);
    }

    public function show(User $user)
    {
        return response()->json($user);
    }

    public function update(Request $request, User $user)
    {
        $request->validate([
            'nom'       => 'sometimes|required|string|max:50',
            'prenom'    => 'sometimes|required|string|max:50',
            'email'     => ['sometimes', 'required', 'email', Rule::unique('users')->ignore($user->id)],
            'telephone' => ['sometimes', 'required', 'string', Rule::unique('users')->ignore($user->id)],
            'role'      => 'sometimes|required|in:admin,agent,client',
            'actif'     => 'sometimes|boolean',
        ]);

        $user->update($request->only(['nom', 'prenom', 'email', 'telephone', 'role', 'actif']));

        if ($request->has('nom') || $request->has('prenom')) {
            $user->name = ($request->nom ?? $user->nom) . ' ' . ($request->prenom ?? $user->prenom);
            $user->save();
        }

        return response()->json($user->fresh());
    }

    public function destroy(User $user)
    {
        $hasColis = \App\Models\Colis::where('client_id', $user->id)
            ->orWhere('cree_par', $user->id)
            ->exists();

        if ($hasColis) {
            return response()->json([
                'message' => 'Impossible de supprimer cet utilisateur car il a des colis associés. Désactivez son compte à la place.',
            ], 422);
        }

        $user->delete();
        return response()->json(['message' => 'Utilisateur supprimé avec succès.']);
    }

   public function stats()
{
    $totalColis = \App\Models\Colis::count();
    $resumeStatuts = \App\Models\Colis::selectRaw('statut, count(*) as total')
        ->groupBy('statut')
        ->pluck('total', 'statut');

    $totalAgents = User::where('role', 'agent')->count();
    $totalClients = User::where('role', 'client')->count();

    $performanceAgents = User::where('role', 'agent')
        ->withCount('colisCreees as colis_crees')
        ->orderBy('colis_crees', 'desc')
        ->take(5)
        ->get(['id', 'nom', 'prenom']);

    // Délai moyen de livraison (en jours)
    $delaiMoyen = \DB::select("
        SELECT AVG(DATEDIFF(m2.date_evenement, m1.date_evenement)) as delai_moyen
        FROM mouvement_colis m1
        JOIN mouvement_colis m2 ON m1.colis_id = m2.colis_id
        WHERE m1.ancien_statut = 'recu' AND m1.nouveau_statut = 'expedie'
        AND m2.nouveau_statut = 'livre'
    ");
    $delaiMoyenJours = round($delaiMoyen[0]->delai_moyen ?? 0, 1);

    // Taux de succès par destination (% de colis livrés)
    $tauxParDestination = \App\Models\Colis::selectRaw('
        destination,
        COUNT(*) as total,
        SUM(CASE WHEN statut = "livre" THEN 1 ELSE 0 END) as livres,
        ROUND(SUM(CASE WHEN statut = "livre" THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as taux
    ')
    ->groupBy('destination')
    ->orderBy('total', 'desc')
    ->take(5)
    ->get();

    // Évolution mensuelle des volumes (6 derniers mois)
    $evolutionMensuelle = \App\Models\Colis::selectRaw('
        DATE_FORMAT(cree_le, "%Y-%m") as mois,
        COUNT(*) as total
    ')
    ->where('cree_le', '>=', now()->subMonths(6))
    ->groupBy('mois')
    ->orderBy('mois', 'asc')
    ->get();

    return response()->json([
        'total_colis'          => $totalColis,
        'resume_statuts'       => $resumeStatuts,
        'total_agents'         => $totalAgents,
        'total_clients'        => $totalClients,
        'performance_agents'   => $performanceAgents,
        'delai_moyen_jours'    => $delaiMoyenJours,
        'taux_par_destination' => $tauxParDestination,
        'evolution_mensuelle'  => $evolutionMensuelle,
    ]);
}
}