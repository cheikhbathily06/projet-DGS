<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mouvement_colis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('colis_id')->references('id')->on('colis')->onDelete('cascade');
            $table->enum('ancien_statut', ['recu', 'expedie', 'en_transit', 'arrive', 'disponible', 'livre'])->nullable();
            $table->enum('nouveau_statut', ['recu', 'expedie', 'en_transit', 'arrive', 'disponible', 'livre']);
            $table->text('commentaire')->nullable();
            $table->foreignId('auteur_id')->references('id')->on('users');
            $table->timestamp('date_evenement')->useCurrent();

            $table->index('colis_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mouvement_colis');
    }
};