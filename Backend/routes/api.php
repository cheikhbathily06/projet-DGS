<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ColisController;
use Illuminate\Support\Facades\Route;

// Routes publiques
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login',    [AuthController::class, 'login']);

// Routes protégées
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);

    Route::get('/colis',  [ColisController::class, 'index']);
    Route::post('/colis', [ColisController::class, 'store']);


    Route::get('/colis/{colis}',  [ColisController::class, 'show']);
Route::put('/colis/{colis}',  [ColisController::class, 'update']);

Route::delete('/colis/{colis}', [ColisController::class, 'destroy']);

Route::post('/colis/sans-compte', [ColisController::class, 'storeSansCompte']);
});