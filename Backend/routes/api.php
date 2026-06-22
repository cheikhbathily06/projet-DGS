<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ColisController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ClientController;


// Routes publiques
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login',    [AuthController::class, 'login']);
Route::get('/suivi/{codeSuivi}', [ColisController::class, 'suiviPublic']);

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

Route::patch('/colis/{colis}/statut', [ColisController::class, 'updateStatut']);

Route::get('/colis/{colis}/mouvements', [ColisController::class, 'mouvements']);

Route::get('/notifications', [NotificationController::class, 'index']);

Route::get('/dashboard/client', [ColisController::class, 'dashboardClient']);

Route::get('/clients/recherche', [ClientController::class, 'recherche']);

});