<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $notifications = Notification::whereHas('colis', function ($query) use ($user) {
            $query->where('client_id', $user->id);
        })
        ->with('colis:id,code_suivi')
        ->orderBy('id', 'desc')
        ->paginate(10);

        return response()->json($notifications);
    }
}