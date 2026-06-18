<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class VonageService
{
    protected string $apiKey;
    protected string $apiSecret;
    protected string $baseUrl = 'https://messages-sandbox.nexmo.com/v1';
    protected string $numeroSandbox = '14157386102'; // numéro Vonage sandbox attribué (sans le +)

    public function __construct()
    {
        $this->apiKey = config('services.vonage.api_key');
        $this->apiSecret = config('services.vonage.api_secret');
    }

    public function envoyerWhatsApp(string $destinataire, string $message): bool
    {
        try {
            // Nettoie le numéro (retire le + s'il y en a un)
            $destinataireFormate = ltrim($destinataire, '+');

            $response = Http::withBasicAuth($this->apiKey, $this->apiSecret)
                ->post("{$this->baseUrl}/messages", [
                    'from' => $this->numeroSandbox,
                    'to' => $destinataireFormate,
                    'message_type' => 'text',
                    'channel' => 'whatsapp',
                    'text' => $message,
                ]);

            if ($response->successful()) {
                return true;
            }

            Log::error('Echec envoi WhatsApp Vonage', [
                'destinataire' => $destinataire,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return false;

        } catch (\Exception $e) {
            Log::error('Exception envoi WhatsApp Vonage', [
                'destinataire' => $destinataire,
                'erreur' => $e->getMessage(),
            ]);

            return false;
        }
    }
}