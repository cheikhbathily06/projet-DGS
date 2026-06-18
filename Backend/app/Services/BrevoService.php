<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class BrevoService
{
    protected string $apiKey;
    protected string $baseUrl = 'https://api.brevo.com/v3';

    public function __construct()
    {
        $this->apiKey = config('services.brevo.api_key');
    }

    public function envoyerEmail(string $destinataireEmail, string $destinataireNom, string $sujet, string $message, string $codeSuivi): bool
    {
        try {
            $contenuHtml = $this->genererTemplateHtml($destinataireNom, $message, $codeSuivi);

            $response = Http::withHeaders([
                'api-key'      => $this->apiKey,
                'Content-Type' => 'application/json',
                'Accept'       => 'application/json',
            ])->post("{$this->baseUrl}/smtp/email", [
                'sender' => [
                    'name'  => 'DGS Africa',
                    'email' => 'cheikhbath59@gmail.com',
                ],
                'to' => [
                    [
                        'email' => $destinataireEmail,
                        'name'  => $destinataireNom,
                    ],
                ],
                'subject'     => $sujet,
                'htmlContent' => $contenuHtml,
            ]);

            if ($response->successful()) {
                return true;
            }

            Log::error('Echec envoi Brevo', [
                'destinataire' => $destinataireEmail,
                'status'       => $response->status(),
                'body'         => $response->body(),
            ]);

            return false;

        } catch (\Exception $e) {
            Log::error('Exception envoi Brevo', [
                'destinataire' => $destinataireEmail,
                'erreur'       => $e->getMessage(),
            ]);

            return false;
        }
    }

    private function genererTemplateHtml(string $nom, string $message, string $codeSuivi): string
    {
        return <<<HTML
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="500" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                  <tr>
                    <td style="background-color:#1F4E79;padding:24px 32px;">
                      <span style="color:#ffffff;font-size:20px;font-weight:bold;">DGS Africa</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:32px;">
                      <p style="font-size:16px;color:#333333;margin:0 0 16px 0;">Bonjour {$nom},</p>
                      <p style="font-size:16px;color:#333333;line-height:1.5;margin:0 0 24px 0;">{$message}</p>
                      <table cellpadding="0" cellspacing="0" style="background-color:#EBF3FB;border-radius:6px;padding:16px;margin-bottom:24px;width:100%;">
                        <tr>
                          <td style="padding:16px;">
                            <span style="font-size:14px;color:#555555;">Code de suivi</span><br>
                            <span style="font-size:18px;color:#1F4E79;font-weight:bold;">{$codeSuivi}</span>
                          </td>
                        </tr>
                      </table>
                      <p style="font-size:14px;color:#777777;line-height:1.5;margin:0;">
                        Merci de votre confiance. Pour toute question, contactez notre équipe support.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color:#f4f6f8;padding:16px 32px;text-align:center;">
                      <span style="font-size:12px;color:#999999;">DGS Africa — Suivi de colis international</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        HTML;
    }
}