<?php

namespace App\Livewire\Events;

use App\Models\Event;
use App\Models\SchoolClass;
use Livewire\Attributes\Layout;
use Livewire\Component;
use Livewire\WithPagination;

#[Layout('components.layouts.app')]
class Index extends Component
{
    use WithPagination;

    public bool $showModal = false;
    public ?string $editingId = null;
    public string $title = '';
    public string $description = '';
    public string $event_date = '';
    public string $start_time = '07:00';
    public string $end_time = '09:00';
    public string $location = '';
    public string $target_class_id = '';

    public function create(): void
    {
        $this->reset(['editingId', 'title', 'description', 'event_date', 'location', 'target_class_id']);
        $this->start_time = '07:00';
        $this->end_time = '09:00';
        $this->showModal = true;
    }

    public function edit(string $id): void
    {
        $e = Event::findOrFail($id);
        $this->editingId = $e->id;
        $this->title = $e->title;
        $this->description = $e->description ?? '';
        $this->event_date = $e->event_date?->format('Y-m-d') ?? '';
        $this->start_time = $e->start_time;
        $this->end_time = $e->end_time;
        $this->location = $e->location ?? '';
        $this->target_class_id = $e->target_class_id ?? '';
        $this->showModal = true;
    }

    public function save(): void
    {
        $data = $this->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'event_date' => ['required', 'date'],
            'start_time' => ['required', 'string', 'max:8'],
            'end_time' => ['required', 'string', 'max:8'],
            'location' => ['nullable', 'string', 'max:255'],
            'target_class_id' => ['nullable', 'exists:classes,id'],
        ]);

        $payload = [
            'title' => $data['title'],
            'description' => $data['description'] ?: null,
            'event_date' => $data['event_date'],
            'start_time' => $data['start_time'],
            'end_time' => $data['end_time'],
            'location' => $data['location'] ?: null,
            'target_class_id' => $data['target_class_id'] ?: null,
        ];

        if ($this->editingId) {
            Event::whereKey($this->editingId)->update($payload);
        } else {
            $payload['created_by'] = auth()->id();
            Event::create($payload);
        }

        $this->showModal = false;
        session()->flash('ok', 'Kegiatan tersimpan.');
    }

    public function delete(string $id): void
    {
        try {
            Event::whereKey($id)->delete();
            session()->flash('ok', 'Kegiatan dihapus.');
        } catch (\Throwable $e) {
            session()->flash('err', 'Gagal menghapus: kegiatan masih punya sesi presensi.');
        }
    }

    public function render()
    {
        $events = Event::with('targetClass')->orderBy('event_date', 'desc')->paginate(15);
        $classes = SchoolClass::orderBy('name')->get(['id', 'name']);

        return view('livewire.events.index', compact('events', 'classes'));
    }
}
