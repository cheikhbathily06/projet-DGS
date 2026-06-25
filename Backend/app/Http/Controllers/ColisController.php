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
use App\Http\Requests\UpdateStatutColisRequest;
use App\Models\MouvementColis;

class ColisController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Colis::query();

        if ($user->role === 'client') {
            $query->where('client_id', $user->id);
        } elseif ($request->has('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }

        if ($request->has('destination')) {
            $query->where('destination', $request->destination);
        }

        if ($request->has('recherche')) {
            $query->where('code_suivi', 'like', '%' . $request->recherche . '%');
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

        $urlSuivi = env('FRONTEND_URL', 'http://localhost:5173') . "/suivi/{$codeSuivi}";
        $qrCodeSvg = QrCode::format('svg')->size(300)->generate($urlSuivi);

        $cheminTemp = storage_path("app/temp_qr_{$codeSuivi}.svg");
        file_put_contents($cheminTemp, $qrCodeSvg);

        $cloudinary = new \Cloudinary\Cloudinary();
        $resultat = $cloudinary->uploadApi()->upload($cheminTemp, [
            'folder'        => 'dgs_track/qrcodes',
            'public_id'     => $codeSuivi,
            'resource_type' => 'image',
        ]);

        unlink($cheminTemp);

        $colis->qr_code_url = $resultat['secure_url'];
        $colis->save();

        return response()->json($colis, 201);
    }

    public function show(Colis $colis, Request $request)
    {
        $user = $request->user();

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

    public function updateStatut(UpdateStatutColisRequest $request, Colis $colis)
    {
        $nouveauStatut = $request->statut;
        $ancienStatut = $colis->statut;

        if (! $colis->transitionAutorisee($nouveauStatut)) {
            return response()->json([
                'message' => "Transition non autorisée : '{$ancienStatut}' ne peut pas passer à '{$nouveauStatut}'.",
            ], 422);
        }

        $colis->statut = $nouveauStatut;
        $colis->maj_le = now();
        $colis->save();

        MouvementColis::create([
            'colis_id'       => $colis->id,
            'ancien_statut'  => $ancienStatut,
            'nouveau_statut' => $nouveauStatut,
            'commentaire'    => $request->commentaire,
            'auteur_id'      => $request->user()->id,
            'date_evenement' => now(),
        ]);

        if (in_array($nouveauStatut, ['expedie', 'arrive', 'disponible', 'livre'])) {
            $this->envoyerNotificationStatut($colis, $nouveauStatut);
        }

        return response()->json($colis->fresh());
    }

    private function envoyerNotificationStatut(Colis $colis, string $statut): void
    {
        if ($colis->client_id) {
            $client = $colis->client;
            $messages = [
                'expedie'    => "Votre colis {$colis->code_suivi} a été expédié.",
                'arrive'     => "Votre colis {$colis->code_suivi} est arrivé à destination.",
                'disponible' => "Votre colis {$colis->code_suivi} est disponible pour retrait.",
                'livre'      => "Votre colis {$colis->code_suivi} a été livré.",
            ];

            $contenu = $messages[$statut];

            $notification = \App\Models\Notification::create([
                'colis_id'     => $colis->id,
                'canal'        => 'email',
                'destinataire' => $client->email,
                'contenu'      => $contenu,
                'statut_envoi' => 'en_attente',
            ]);

            $brevoService = new \App\Services\BrevoService();
            $succes = $brevoService->envoyerEmail(
                $client->email,
                $client->nom . ' ' . $client->prenom,
                'Mise à jour de votre colis DGS Africa',
                $contenu,
                $colis->code_suivi
            );

            $notification->statut_envoi = $succes ? 'envoye' : 'echec';
            $notification->envoye_le = $succes ? now() : null;
            $notification->save();

            return;
        }

        if ($colis->client_sans_compte_id && $statut === 'arrive') {
            $clientSansCompte = $colis->clientSansCompte;
            $urlSuiviPublic = env('FRONTEND_URL', 'http://localhost:5173') . "/suivi/{$colis->code_suivi}";

            $message = "Bonjour {$clientSansCompte->nom}, votre colis {$colis->code_suivi} est arrivé à destination.\n\n"
                . "Détails du colis : {$urlSuiviPublic}\n\n"
                . "Vous pouvez venir le récupérer à l'adresse suivante : {$clientSansCompte->adresse}.\n\n"
                . "Merci de votre confiance, DGS Africa.";

            $notification = \App\Models\Notification::create([
                'colis_id'     => $colis->id,
                'canal'        => 'whatsapp',
                'destinataire' => $clientSansCompte->telephone_whatsapp,
                'contenu'      => $message,
                'statut_envoi' => 'en_attente',
            ]);

            $vonageService = new \App\Services\VonageService();
            $succes = $vonageService->envoyerWhatsApp($clientSansCompte->telephone_whatsapp, $message);

            $notification->statut_envoi = $succes ? 'envoye' : 'echec';
            $notification->envoye_le = $succes ? now() : null;
            $notification->save();
        }
    }

    public function mouvements(Colis $colis, Request $request)
    {
        $user = $request->user();

        if ($user->role === 'client' && $colis->client_id !== $user->id) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        $mouvements = $colis->mouvements()
            ->with('auteur:id,nom,prenom')
            ->orderBy('date_evenement', 'asc')
            ->get();

        return response()->json($mouvements);
    }

    public function destroy(Colis $colis, Request $request)
    {
        $user = $request->user();

        if (! in_array($user->role, ['admin', 'agent'])) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        $colis->delete();

        return response()->json(['message' => 'Colis supprimé avec succès.']);
    }

    public function storeSansCompte(StoreColisSansCompteRequest $request)
    {
        $clientSansCompte = ClientSansCompte::create([
            'nom'                => $request->nom,
            'telephone_whatsapp' => $request->telephone_whatsapp,
            'adresse'            => $request->adresse,
        ]);

        $codeSuivi = $this->genererCodeSuivi();

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

        $urlSuivi = env('FRONTEND_URL', 'http://localhost:5173') . "/suivi/{$codeSuivi}";
        $qrCodeSvg = QrCode::format('svg')->size(300)->generate($urlSuivi);

        $cheminTemp = storage_path("app/temp_qr_{$codeSuivi}.svg");
        file_put_contents($cheminTemp, $qrCodeSvg);

        $cloudinary = new \Cloudinary\Cloudinary();
        $resultat = $cloudinary->uploadApi()->upload($cheminTemp, [
            'folder'        => 'dgs_track/qrcodes',
            'public_id'     => $codeSuivi,
            'resource_type' => 'image',
        ]);

        unlink($cheminTemp);

        $colis->qr_code_url = $resultat['secure_url'];
        $colis->save();

        $urlSuiviPublic = env('FRONTEND_URL', 'http://localhost:5173') . "/suivi/{$codeSuivi}";

        $message = "Bonjour {$clientSansCompte->nom}, votre colis a été enregistré avec succès chez DGS Africa.\n\n"
            . "Suivez votre colis ici : {$urlSuiviPublic}\n"
            . "Code de suivi : {$codeSuivi}\n"
            . "Montant à payer : " . number_format($colis->cout_transport, 0, ',', ' ') . " XOF\n\n"
            . "Merci de votre confiance.";

        $vonageService = new \App\Services\VonageService();
        $succesWhatsapp = $vonageService->envoyerWhatsApp($clientSansCompte->telephone_whatsapp, $message);

        \App\Models\Notification::create([
            'colis_id'     => $colis->id,
            'canal'        => 'whatsapp',
            'destinataire' => $clientSansCompte->telephone_whatsapp,
            'contenu'      => $message,
            'statut_envoi' => $succesWhatsapp ? 'envoye' : 'echec',
            'envoye_le'    => $succesWhatsapp ? now() : null,
        ]);

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

    public function suiviPublic(string $codeSuivi)
    {
        $colis = Colis::where('code_suivi', $codeSuivi)->first();

        if (! $colis) {
            return response()->json(['message' => 'Code de suivi introuvable.'], 404);
        }

        $mouvements = $colis->mouvements()
            ->orderBy('date_evenement', 'asc')
            ->get(['ancien_statut', 'nouveau_statut', 'date_evenement']);

        return response()->json([
            'code_suivi'  => $colis->code_suivi,
            'origine'     => $colis->origine,
            'destination' => $colis->destination,
            'statut'      => $colis->statut,
            'cree_le'     => $colis->cree_le,
            'historique'  => $mouvements,
        ]);
    }

    public function dashboardClient(Request $request)
    {
        $user = $request->user();

        $resume = Colis::where('client_id', $user->id)
            ->selectRaw('statut, count(*) as total')
            ->groupBy('statut')
            ->pluck('total', 'statut');

        $dernieresExpeditions = Colis::where('client_id', $user->id)
            ->latest('cree_le')
            ->take(5)
            ->get(['id', 'code_suivi', 'destination', 'statut', 'cree_le']);

        $totalColis = Colis::where('client_id', $user->id)->count();

        return response()->json([
            'total_colis'           => $totalColis,
            'resume_par_statut'     => $resume,
            'dernieres_expeditions' => $dernieresExpeditions,
        ]);
    }

    public function dashboardAgent(Request $request)
    {
        $totalColis = Colis::count();

        $resume = Colis::selectRaw('statut, count(*) as total')
            ->groupBy('statut')
            ->pluck('total', 'statut');

        $derniersMovements = \App\Models\MouvementColis::with('colis:id,code_suivi,destination')
            ->orderBy('date_evenement', 'desc')
            ->take(10)
            ->get();

        return response()->json([
            'total_colis'         => $totalColis,
            'resume_par_statut'   => $resume,
            'derniers_mouvements' => $derniersMovements,
        ]);
    }
}