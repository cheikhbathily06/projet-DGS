<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function recherche(Request $request)
    {
        $request->validate([
            'telephone' => 'required|string',
        ]);

        $client = User::where('telephone', $request->telephone)
            ->where('role', 'client')
            ->where('actif', true)
            ->first(['id', 'nom', 'prenom', 'email', 'telephone']);

        if (! $client) {
            return response()->json([
                'message' => 'Aucun client trouvé avec ce numéro.',
            ], 404);
        }

        return response()->json($client);
    }
}