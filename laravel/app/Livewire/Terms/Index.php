<?php

namespace App\Livewire\Terms;

use App\Models\Term;
use Illuminate\Validation\Rule;
use Livewire\Attributes\Layout;
use Livewire\Component;
use Livewire\WithPagination;

#[Layout('components.layouts.app')]
class Index extends Component
{
    use WithPagination;

    public bool $showModal = false;
    public ?string $editingId = null;
    public string $academic_year = '2025/2026';
    public string $type = 'SEMESTER';
    public string $name = '';
    public string $start_date = '';
    public string $end_date = '';

    public function create(): void
    {
        $this->reset(['editingId', 'name', 'start_date', 'end_date']);
        $this->academic_year = '2025/2026';
        $this->type = 'SEMESTER';
        $this->showModal = true;
    }

    public function edit(string $id): void
    {
        $t = Term::findOrFail($id);
        $this->editingId = $t->id;
        $this->academic_year = $t->academic_year;
        $this->type = $t->type->value;
        $this->name = $t->name;
        $this->start_date = $t->start_date?->format('Y-m-d') ?? '';
        $this->end_date = $t->end_date?->format('Y-m-d') ?? '';
        $this->showModal = true;
    }

    public function save(): void
    {
        $data = $this->validate([
            'academic_year' => ['required', 'string', 'max:20'],
            'type' => ['required', Rule::in(['SEMESTER', 'TRIWULAN', 'MID'])],
            'name' => ['required', 'string', 'max:255'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
        ]);

        if ($this->editingId) {
            Term::whereKey($this->editingId)->update($data);
        } else {
            Term::create($data);
        }

        $this->showModal = false;
        session()->flash('ok', 'Periode tersimpan.');
    }

    public function delete(string $id): void
    {
        try {
            Term::whereKey($id)->delete();
            session()->flash('ok', 'Periode dihapus.');
        } catch (\Throwable $e) {
            session()->flash('err', 'Gagal menghapus: periode masih dipakai sesi presensi.');
        }
    }

    public function render()
    {
        $terms = Term::orderBy('start_date', 'desc')->paginate(15);

        return view('livewire.terms.index', compact('terms'));
    }
}
