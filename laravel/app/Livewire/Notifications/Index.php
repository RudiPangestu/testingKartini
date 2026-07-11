<?php

namespace App\Livewire\Notifications;

use App\Models\Notification;
use Livewire\Attributes\Layout;
use Livewire\Component;
use Livewire\WithPagination;

#[Layout('components.layouts.app')]
class Index extends Component
{
    use WithPagination;

    public function markRead(string $id): void
    {
        Notification::whereKey($id)->where('user_id', auth()->id())->update(['is_read' => true]);
    }

    public function markAllRead(): void
    {
        Notification::where('user_id', auth()->id())->where('is_read', false)->update(['is_read' => true]);
        session()->flash('ok', 'Semua notifikasi ditandai dibaca.');
    }

    public function render()
    {
        $items = Notification::where('user_id', auth()->id())
            ->orderBy('sent_at', 'desc')->paginate(20);

        return view('livewire.notifications.index', compact('items'));
    }
}
