<?php

namespace App\Livewire\Students;

use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentParent;
use App\Models\User;
use Illuminate\Validation\Rule;
use Livewire\Attributes\Layout;
use Livewire\Component;
use Livewire\WithPagination;

#[Layout('components.layouts.app')]
class Index extends Component
{
    use WithPagination;

    public string $search = '';
    public string $classFilter = '';

    // Modal murid
    public bool $showModal = false;
    public ?string $editingId = null;
    public string $nisn = '';
    public string $nis = '';
    public string $full_name = '';
    public string $class_id = '';
    public string $gender = '';

    // Modal tautan ortu
    public ?string $linkFor = null;
    public string $linkForName = '';
    public string $linkParentId = '';
    public string $linkRelation = 'ibu';

    public function updatingSearch(): void
    {
        $this->resetPage();
    }

    public function updatingClassFilter(): void
    {
        $this->resetPage();
    }

    public function create(): void
    {
        $this->reset(['editingId', 'nisn', 'nis', 'full_name', 'class_id', 'gender']);
        $this->showModal = true;
    }

    public function edit(string $id): void
    {
        $s = Student::findOrFail($id);
        $this->editingId = $s->id;
        $this->nisn = $s->nisn;
        $this->nis = $s->nis ?? '';
        $this->full_name = $s->full_name;
        $this->class_id = $s->class_id ?? '';
        $this->gender = $s->gender?->value ?? '';
        $this->showModal = true;
    }

    public function save(): void
    {
        $data = $this->validate([
            'nisn' => ['required', 'string', 'max:30', Rule::unique('students', 'nisn')->ignore($this->editingId)],
            'nis' => ['nullable', 'string', 'max:30'],
            'full_name' => ['required', 'string', 'max:255'],
            'class_id' => ['nullable', 'exists:classes,id'],
            'gender' => ['nullable', Rule::in(['L', 'P'])],
        ]);

        $payload = [
            'nisn' => $data['nisn'],
            'nis' => $data['nis'] ?: null,
            'full_name' => $data['full_name'],
            'class_id' => $data['class_id'] ?: null,
            'gender' => $data['gender'] ?: null,
        ];

        if ($this->editingId) {
            Student::whereKey($this->editingId)->update($payload);
        } else {
            Student::create($payload);
        }

        $this->showModal = false;
        session()->flash('ok', 'Murid tersimpan.');
    }

    public function delete(string $id): void
    {
        try {
            Student::whereKey($id)->delete();
            session()->flash('ok', 'Murid dihapus.');
        } catch (\Throwable $e) {
            session()->flash('err', 'Gagal menghapus: murid masih punya data presensi/nilai.');
        }
    }

    // ---- Tautan orang tua ----
    public function openLink(string $studentId): void
    {
        $s = Student::findOrFail($studentId);
        $this->linkFor = $s->id;
        $this->linkForName = $s->full_name;
        $this->linkParentId = '';
        $this->linkRelation = 'ibu';
    }

    public function linkParent(): void
    {
        $this->validate([
            'linkParentId' => ['required', 'exists:users,id'],
            'linkRelation' => ['required', Rule::in(['ayah', 'ibu', 'wali'])],
        ]);

        $exists = StudentParent::where('student_id', $this->linkFor)
            ->where('parent_user_id', $this->linkParentId)->exists();

        if (! $exists) {
            StudentParent::create([
                'student_id' => $this->linkFor,
                'parent_user_id' => $this->linkParentId,
                'relation' => $this->linkRelation,
            ]);
        }

        $this->linkFor = null;
        session()->flash('ok', 'Orang tua ditautkan.');
    }

    public function unlinkParent(string $studentId, string $parentUserId): void
    {
        StudentParent::where('student_id', $studentId)
            ->where('parent_user_id', $parentUserId)->delete();
        session()->flash('ok', 'Tautan orang tua dilepas.');
    }

    public function render()
    {
        $students = Student::query()
            ->with(['schoolClass', 'parents.parent'])
            ->when($this->classFilter, fn ($q) => $q->where('class_id', $this->classFilter))
            ->when($this->search, fn ($q) => $q->where(fn ($w) => $w
                ->where('full_name', 'like', "%{$this->search}%")
                ->orWhere('nisn', 'like', "%{$this->search}%")))
            ->orderBy('full_name')
            ->paginate(20);

        $classes = SchoolClass::orderBy('name')->get(['id', 'name']);
        $parents = User::where('role', 'ORTU')->orderBy('full_name')->get(['id', 'full_name', 'email']);

        return view('livewire.students.index', compact('students', 'classes', 'parents'));
    }
}
