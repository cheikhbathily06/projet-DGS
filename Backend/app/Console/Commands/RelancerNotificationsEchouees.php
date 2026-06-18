<?php

namespace App\Console\Commands;

use App\Models\Notification;
use App\Services\BrevoService;
use Illuminate\Console\Command;

class RelancerNotificationsEchouees extends Command
{
    protected $signature = 'notifications:relancer';

    protected $description = 'Relance l\'envoi des notifications en échec (canal email)';

    public function handle()
    {
        $notificationsEchouees = Notification::where('statut_envoi', 'echec')
            ->where('canal', 'email')
            ->get();

        if ($notificationsEchouees->isEmpty()) {
            $this->info('Aucune notification en échec à relancer.');
            return;
        }

        $this->info("Relance de {$notificationsEchouees->count()} notification(s)...");

        $brevoService = new BrevoService();
        $reussites = 0;
        $echecs = 0;

        foreach ($notificationsEchouees as $notification) {
            $colis = $notification->colis;

            if (! $colis || ! $colis->client_id) {
                continue;
            }

            $client = $colis->client;

            $succes = $brevoService->envoyerEmail(
                $client->email,
                $client->nom . ' ' . $client->prenom,
                'Mise à jour de votre colis DGS Africa',
                $notification->contenu,
                $colis->code_suivi
            );

            if ($succes) {
                $notification->statut_envoi = 'envoye';
                $notification->envoye_le = now();
                $notification->save();
                $reussites++;
            } else {
                $echecs++;
            }
        }

        $this->info("Terminé : {$reussites} réussite(s), {$echecs} échec(s) persistant(s).");
    }
}