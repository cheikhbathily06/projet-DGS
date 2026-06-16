<?php

namespace App\Http\Controllers;

use App\Models\Colis;
use App\Http\Requests\StoreColisRequest;
use Illuminate\Http\Request;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Facades\Storage;
use App\Http\Requests\UpdateColisRequest;
use App\Http\Requests\StoreColisSansCompteRequest;
use App\Models\ClientSansCompte;

class ColisController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Colis::query();

        if ($user->role === 'client') {
            $query->where('client_id', $user->id);
        }

        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }

        if ($request->has('destination')) {
            $query->where('destination', $request->destination);
        }

        $colis = $query->latest('cree_le')->paginate(15);

        return response()->json($colis);
    }

    public function store(StoreColisRequest $request)
    {
        $codeSuivi = $this->genererCodeSuivi();

        $colis = Colis::create([
            ...$request->validated(),
            'code_suivi' => $codeSuivi,
            'qr_code_url' => '',
            'cree_par' => $request->user()->id,
        ]);

        $urlSuivi = url("/suivi/{$codeSuivi}");
        $qrCodeSvg = QrCode::format('svg')->size(200)->generate($urlSuivi);

        $nomFichier = "qrcodes/{$codeSuivi}.svg";
        Storage::disk('public')->put($nomFichier, $qrCodeSvg);

        $colis->qr_code_url = Storage::url($nomFichier);
        $colis->save();

        return response()->json($colis, 201);
    }

    public function show(Colis $colis, Request $request)
{
    $user = $request->user();

    //  un client ne peut consulter que ses propres colis
    if ($user->role === 'client' && $colis->client_id !== $user->id) {
        return response()->json(['message' => 'Accès non autorisé.'], 403);
    }

    return response()->json($colis);
}

public function update(UpdateColisRequest $request, Colis $colis)
{
    $colis->update([
        ...$request->validated(),
        'maj_le' => now(),
    ]);

    return response()->json($colis->fresh());
}
public function destroy(Colis $colis, Request $request)
{
    $user = $request->user();

    // Seuls admin et agent peuvent supprimer 
    if (! in_array($user->role, ['admin', 'agent'])) {
        return response()->json(['message' => 'Accès non autorisé.'], 403);
    }

    $colis->delete();

    return response()->json(['message' => 'Colis supprimé avec succès.']);
}


public function storeSansCompte(StoreColisSansCompteRequest $request)
{
    // 1. Créer le client sans compte
    $clientSansCompte = ClientSansCompte::create([
        'nom'                => $request->nom,
        'telephone_whatsapp' => $request->telephone_whatsapp,
        'adresse'            => $request->adresse,
    ]);

    // 2. Générer le code de suivi
    $codeSuivi = $this->genererCodeSuivi();

    // 3. Créer le colis associé
    $colis = Colis::create([
        'expediteur'             => $request->expediteur,
        'origine'                => $request->origine,
        'destination'            => $request->destination,
        'poids_kg'               => $request->poids_kg,
        'volume_m3'              => $request->volume_m3,
        'cout_transport'         => $request->cout_transport,
        'client_sans_compte_id'  => $clientSansCompte->id,
        'code_suivi'             => $codeSuivi,
        'qr_code_url'            => '',
        'cree_par'               => $request->user()->id,
    ]);

    // 4. Générer le QR code
    $urlSuivi = url("/suivi/{$codeSuivi}");
    $qrCodeSvg = QrCode::format('svg')->size(200)->generate($urlSuivi);

    $nomFichier = "qrcodes/{$codeSuivi}.svg";
    Storage::disk('public')->put($nomFichier, $qrCodeSvg);

    $colis->qr_code_url = Storage::url($nomFichier);
    $colis->save();

    return response()->json([
        'client_sans_compte' => $clientSansCompte,
        'colis' => $colis,
    ], 201);
}
    private function genererCodeSuivi(): string
    {
        $annee = now()->year;

        $dernierColis = Colis::where('code_suivi', 'like', "DGS-{$annee}-%")
            ->orderBy('code_suivi', 'desc')
            ->first();

        if ($dernierColis) {
            $dernierNumero = (int) substr($dernierColis->code_suivi, -6);
            $nouveauNumero = $dernierNumero + 1;
        } else {
            $nouveauNumero = 1;
        }

        $numeroFormate = str_pad($nouveauNumero, 6, '0', STR_PAD_LEFT);

        return "DGS-{$annee}-{$numeroFormate}";
    }
}