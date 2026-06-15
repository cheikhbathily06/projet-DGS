<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MouvementColis extends Model
{
    use HasFactory;

    protected $table = 'mouvement_colis';
    public $timestamps = false;

    protected $fillable = [
        'colis_id',
        'ancien_statut',
        'nouveau_statut',
        'commentaire',
        'auteur_id',
        'date_evenement',
    ];

    public function colis()
    {
        return $this->belongsTo(Colis::class, 'colis_id');
    }

    public function auteur()
    {
        return $this->belongsTo(User::class, 'auteur_id');
    }
}