<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('client_sans_compte', function (Blueprint $table) {
            $table->string('nom')->after('id');
            $table->string('telephone_whatsapp', 20)->after('nom');
            $table->string('adresse')->after('telephone_whatsapp');
        });
    }

    public function down(): void
    {
        Schema::table('client_sans_compte', function (Blueprint $table) {
            $table->dropColumn(['nom', 'telephone_whatsapp', 'adresse']);
        });
    }
};