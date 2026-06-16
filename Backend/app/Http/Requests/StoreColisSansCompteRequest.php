<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreColisSansCompteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Infos client sans compte
            'nom'                 => 'required|string|max:100',
            'telephone_whatsapp'  => 'required|string|regex:/^\+[1-9]\d{6,14}$/',
            'adresse'             => 'required|string|max:255',

            // Infos colis
            'expediteur'          => 'required|string|max:100',
            'origine'             => 'required|string|max:100',
            'destination'         => 'required|string|max:100',
            'poids_kg'            => 'required|numeric|gt:0',
            'volume_m3'           => 'required|numeric|gt:0',
            'cout_transport'      => 'required|numeric|gt:0',
        ];
    }

    public function messages(): array
    {
        return [
            'telephone_whatsapp.regex' => 'Le numéro WhatsApp doit être au format international (ex: +221771234567).',
            'poids_kg.gt'               => 'Le poids doit être strictement positif.',
            'volume_m3.gt'              => 'Le volume doit être strictement positif.',
            'cout_transport.gt'         => 'Le coût de transport doit être strictement positif.',
        ];
    }
}