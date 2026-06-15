<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('colis', function (Blueprint $table) {
            $table->foreignId('client_sans_compte_id')
                  ->nullable()
                  ->after('client_id')
                  ->references('id')
                  ->on('client_sans_compte');
        });
    }

    public function down(): void
    {
        Schema::table('colis', function (Blueprint $table) {
            $table->dropForeign(['client_sans_compte_id']);
            $table->dropColumn('client_sans_compte_id');
        });
    }
};