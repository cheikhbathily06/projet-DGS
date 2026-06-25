<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreColisRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'client_id'              => 'nullable|exists:users,id',
            'expediteur'             => 'required|string|max:100',
            'nom_destinataire'       => 'nullable|string|max:100',
            'telephone_destinataire' => 'nullable|string|max:20',
            'origine'                => 'required|string|max:100',
            'destination'            => 'required|string|max:100',
            'poids_kg'               => 'required|numeric|gt:0',
            'cout_transport'         => 'required|numeric|gt:0',
        ];
    }

    public function messages(): array
    {
        return [
            'poids_kg.gt'       => 'Le poids doit être strictement positif.',
            'cout_transport.gt' => 'Le coût de transport doit être strictement positif.',
        ];
    }
}