<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClientSansCompte extends Model
{
    use HasFactory;

    protected $table = 'client_sans_compte';

    protected $fillable = [
        'nom',
        'telephone_whatsapp',
        'adresse',
    ];

    public function colis()
    {
        return $this->hasMany(Colis::class, 'client_sans_compte_id');
    }
}