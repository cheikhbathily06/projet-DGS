<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('colis', function (Blueprint $table) {
            $table->string('nom_destinataire')->nullable()->after('expediteur');
            $table->string('telephone_destinataire')->nullable()->after('nom_destinataire');
            $table->string('photo_url')->nullable()->after('qr_code_url');
        });
    }

    public function down(): void
    {
        Schema::table('colis', function (Blueprint $table) {
            $table->dropColumn(['nom_destinataire', 'telephone_destinataire', 'photo_url']);
        });
    }
};