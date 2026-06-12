<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('colis_id')->references('id')->on('colis')->onDelete('cascade');
            $table->enum('canal', ['sms', 'whatsapp']);
            $table->string('destinataire', 20);
            $table->text('contenu');
            $table->enum('statut_envoi', ['en_attente', 'envoye', 'echec'])->default('en_attente');
            $table->timestamp('envoye_le')->nullable();

            $table->index('colis_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};