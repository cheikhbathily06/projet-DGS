<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $table = 'notifications';
    public $timestamps = false;

    protected $fillable = [
        'colis_id',
        'canal',
        'destinataire',
        'contenu',
        'statut_envoi',
        'envoye_le',
    ];

    public function colis()
    {
        return $this->belongsTo(Colis::class, 'colis_id');
    }
}