<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStatutColisRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'statut'      => 'required|in:recu,expedie,en_transit,arrive,disponible,livre',
            'commentaire' => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'statut.in' => 'Le statut fourni n\'est pas valide.',
        ];
    }
}