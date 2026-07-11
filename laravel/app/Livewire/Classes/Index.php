<?php

namespace App\Livewire\Classes;

use App\Models\SchoolClass;
use App\Models\User;
use Livewire\Attributes\Layout;
use Livewire\Component;
use Livewire\WithPagination;

#[Layout('components.layouts.app')]
class Index extends Component
{
    use WithPagination;

    public string $search = '';
    public bool $showModal = false;
    public ?string $editingId = null;

    public string $name = '';
    public int $grade = 10;
    public string $academic_year = '2025/2026';
    public string $homeroom_teacher_id = '';

    public function updatingSearch(): void
    {
        $this->resetPage();
    }

    public function create(): void
    {
        $this->reset(['editingId', 'name', 'grade', 'academic_year', 'homeroom_teacher_id']);
        $this->grade = 10;
        $this->academic_year = '2025/2026';
        $this->showModal = true;
    }

    public function edit(string $id): void
    {
        $c = SchoolClass::findOrFail($id);
        $this->editingId = $c->id;
        $this->name = $c->name;
        $this->grade = $c->grade;
        $this->academic_year = $c->academic_year;
        $this->homeroom_teacher_id = $c->homeroom_teacher_id ?? '';
        $this->showModal = true;
    }

    public function save(): void
    {
        $data = $this->validate([
            'name' => ['required', 'string', 'max:255'],
            'grade' => ['required', 'integer', 'min:1', 'max:13'],
            'academic_year' => ['required', 'string', 'max:20'],
            'homeroom_teacher_id' => ['nullable', 'exists:users,id'],
        ]);

        $payload = [
            'name' => $data['name'],
            'grade' => (int) $data['grade'],
            'academic_year' => $data['academic_year'],
            'homeroom_teacher_id' => $data['homeroom_teacher_id'] ?: null,
        ];

        if ($this->editingId) {
            SchoolClass::whereKey($this->editingId)->update($payload);
        } else {
            SchoolClass::create($payload);
        }

        $this->showModal = false;
        session()->flash('ok', 'Kelas tersimpan.');
    }

    public function delete(string $id): void
    {
        try {
            SchoolClass::whereKey($id)->delete();
            session()->flash('ok', 'Kelas dihapus.');
        } catch (\Throwable $e) {
            session()->flash('err', 'Gagal menghapus: kelas masih punya murid/jadwal.');
        }
    }

    public function render()
    {
        $classes = SchoolClass::query()
            ->with('homeroomTeacher')
            ->withCount('students')
            ->when($this->search, fn ($q) => $q->where('name', 'like', "%{$this->search}%"))
            ->orderBy('academic_year', 'desc')
            ->orderBy('name')
            ->paginate(15);

        $teachers = User::where('role', 'GURU')->orderBy('full_name')->get(['id', 'full_name']);

        return view('livewire.classes.index', compact('classes', 'teachers'));
    }
}
