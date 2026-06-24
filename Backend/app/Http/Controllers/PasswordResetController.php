<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\BrevoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class PasswordResetController extends Controller
{
    // Envoie un email avec le lien de reset
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        // On retourne toujours 200 même si l'email n'existe pas (sécurité)
        if (! $user) {
            return response()->json([
                'message' => 'Si cet email existe, un lien de réinitialisation a été envoyé.',
            ]);
        }

        // Supprime les anciens tokens pour cet email
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        // Génère un nouveau token
        $token = Str::random(64);

        DB::table('password_reset_tokens')->insert([
            'email'      => $request->email,
            'token'      => Hash::make($token),
            'created_at' => now(),
        ]);

        // URL frontend de reset
        $resetUrl = env('FRONTEND_URL', 'http://localhost:5173') . "/reset-password?token={$token}&email={$request->email}";

        // Envoi via Brevo
        $brevoService = new BrevoService();
        $brevoService->envoyerEmail(
            $user->email,
            $user->prenom . ' ' . $user->nom,
            'Réinitialisation de votre mot de passe — DGS Track',
            "Cliquez sur ce lien pour réinitialiser votre mot de passe : {$resetUrl}",
            'DGS Track'
        );

        return response()->json([
            'message' => 'Si cet email existe, un lien de réinitialisation a été envoyé.',
        ]);
    }

    // Réinitialise le mot de passe
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email'                 => 'required|email',
            'token'                 => 'required|string',
            'password'              => 'required|string|min:8|confirmed',
        ]);

        $record = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (! $record || ! Hash::check($request->token, $record->token)) {
            return response()->json([
                'message' => 'Token invalide ou expiré.',
            ], 422);
        }

        // Vérifie que le token n'a pas plus de 60 minutes
        if (now()->diffInMinutes($record->created_at) > 60) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return response()->json([
                'message' => 'Ce lien a expiré. Veuillez en demander un nouveau.',
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (! $user) {
            return response()->json(['message' => 'Utilisateur introuvable.'], 404);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        // Supprime le token utilisé
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json([
            'message' => 'Mot de passe réinitialisé avec succès.',
        ]);
    }
}