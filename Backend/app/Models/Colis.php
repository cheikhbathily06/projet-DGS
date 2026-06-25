<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Colis extends Model
{
    use HasFactory;

    protected $table = 'colis';
    public $timestamps = false;

   protected $fillable = [
    'code_suivi',
    'qr_code_url',
    'photo_url',
    'client_id',
    'client_sans_compte_id',
    'expediteur',
    'nom_destinataire',
    'telephone_destinataire',
    'origine',
    'destination',
    'poids_kg',
    'cout_transport',
    'statut',
    'cree_par',
    'cree_le',
    'maj_le',
];

    // Transitions autorisées dans les regle de gstion suivant l'ordre
    const TRANSITIONS = [
        'recu'       => 'expedie',
        'expedie'    => 'en_transit',
        'en_transit' => 'arrive',
        'arrive'     => 'disponible',
        'disponible' => 'livre',
    ];

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function clientSansCompte()
    {
        return $this->belongsTo(ClientSansCompte::class, 'client_sans_compte_id');
    }

    public function creePar()
    {
        return $this->belongsTo(User::class, 'cree_par');
    }

    public function mouvements()
    {
        return $this->hasMany(MouvementColis::class, 'colis_id');
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class, 'colis_id');
    }

    // Vérifie si la transition de statut est autorisée (RG-03)
    public function transitionAutorisee(string $nouveauStatut): bool
    {
        return isset(self::TRANSITIONS[$this->statut]) 
            && self::TRANSITIONS[$this->statut] === $nouveauStatut;
    }
}