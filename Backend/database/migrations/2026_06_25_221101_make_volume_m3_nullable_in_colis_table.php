<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('colis', function (Blueprint $table) {
            $table->decimal('volume_m3', 8, 3)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('colis', function (Blueprint $table) {
            $table->decimal('volume_m3', 8, 3)->nullable(false)->change();
        });
    }
};