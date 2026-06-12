<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('colis', function (Blueprint $table) {
            $table->id();
            $table->string('code_suivi', 20)->unique();
            $table->string('qr_code_url');
            $table->foreignId('client_id')->references('id')->on('users');
            $table->string('expediteur');
            $table->string('origine');
            $table->string('destination');
            $table->decimal('poids_kg', 10, 2);
            $table->decimal('volume_m3', 10, 3);
            $table->decimal('cout_transport', 12, 2);
            $table->enum('statut', ['recu', 'expedie', 'en_transit', 'arrive', 'disponible', 'livre'])->default('recu');
            $table->foreignId('cree_par')->references('id')->on('users');
            $table->timestamp('cree_le')->useCurrent();
            $table->timestamp('maj_le')->useCurrent()->useCurrentOnUpdate();

            $table->index('statut');
            $table->index('client_id');
            $table->index('destination');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('colis');
    }
};