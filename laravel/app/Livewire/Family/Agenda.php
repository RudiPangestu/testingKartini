<?php

namespace App\Livewire\Family;

use App\Models\Event;
use Livewire\Attributes\Layout;
use Livewire\Component;
use Livewire\WithPagination;

#[Layout('components.layouts.app')]
class Agenda extends Component
{
    use WithPagination;

    public function render()
    {
        $events = Event::with('targetClass')
            ->orderBy('event_date', 'desc')->paginate(15);

        return view('livewire.family.agenda', compact('events'));
    }
}
