<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateColisRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'expediteur'     => 'sometimes|required|string|max:100',
            'origine'        => 'sometimes|required|string|max:100',
            'destination'    => 'sometimes|required|string|max:100',
            'poids_kg'       => 'sometimes|required|numeric|gt:0',
            'volume_m3'      => 'sometimes|required|numeric|gt:0',
            'cout_transport' => 'sometimes|required|numeric|gt:0',
        ];
    }

    public function messages(): array
    {
        return [
            'poids_kg.gt'       => 'Le poids doit être strictement positif.',
            'volume_m3.gt'      => 'Le volume doit être strictement positif.',
            'cout_transport.gt' => 'Le coût de transport doit être strictement positif.',
        ];
    }
}