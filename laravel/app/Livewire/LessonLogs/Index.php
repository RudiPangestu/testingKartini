<?php

namespace App\Livewire\LessonLogs;

use App\Models\LessonLog;
use App\Models\SchoolClass;
use App\Models\Subject;
use Livewire\Attributes\Layout;
use Livewire\Component;
use Livewire\WithPagination;

#[Layout('components.layouts.app')]
class Index extends Component
{
    use WithPagination;

    public string $classFilter = '';
    public bool $showModal = false;
    public ?string $editingId = null;

    public string $class_id = '';
    public string $subject_id = '';
    public string $date = '';
    public string $jam_ke = '';
    public string $pokok_bahasan = '';
    public string $metode = '';
    public bool $selesai = true;
    public string $siswa_tidak_hadir = '';
    public string $refleksi = '';
    public string $tindak_lanjut = '';
    public string $academic_year = '2025/2026';

    public function updatingClassFilter(): void
    {
        $this->resetPage();
    }

    public function create(): void
    {
        $this->reset(['editingId', 'class_id', 'subject_id', 'date', 'jam_ke', 'pokok_bahasan', 'metode', 'siswa_tidak_hadir', 'refleksi', 'tindak_lanjut']);
        $this->selesai = true;
        $this->academic_year = '2025/2026';
        $this->date = now()->format('Y-m-d');
        $this->showModal = true;
    }

    public function edit(string $id): void
    {
        $l = LessonLog::findOrFail($id);
        $this->editingId = $l->id;
        $this->class_id = $l->class_id;
        $this->subject_id = $l->subject_id ?? '';
        $this->date = $l->date?->format('Y-m-d') ?? '';
        $this->jam_ke = $l->jam_ke;
        $this->pokok_bahasan = $l->pokok_bahasan;
        $this->metode = $l->metode ?? '';
        $this->selesai = $l->selesai;
        $this->siswa_tidak_hadir = $l->siswa_tidak_hadir ?? '';
        $this->refleksi = $l->refleksi ?? '';
        $this->tindak_lanjut = $l->tindak_lanjut ?? '';
        $this->academic_year = $l->academic_year;
        $this->showModal = true;
    }

    public function save(): void
    {
        $data = $this->validate([
            'class_id' => ['required', 'exists:classes,id'],
            'subject_id' => ['nullable', 'exists:subjects,id'],
            'date' => ['required', 'date'],
            'jam_ke' => ['required', 'string', 'max:20'],
            'pokok_bahasan' => ['required', 'string'],
            'metode' => ['nullable', 'string', 'max:255'],
            'selesai' => ['boolean'],
            'siswa_tidak_hadir' => ['nullable', 'string'],
            'refleksi' => ['nullable', 'string'],
            'tindak_lanjut' => ['nullable', 'string'],
            'academic_year' => ['required', 'string', 'max:20'],
        ]);

        $payload = [
            'class_id' => $data['class_id'],
            'subject_id' => $data['subject_id'] ?: null,
            'date' => $data['date'],
            'jam_ke' => $data['jam_ke'],
            'pokok_bahasan' => $data['pokok_bahasan'],
            'metode' => $data['metode'] ?: null,
            'selesai' => $data['selesai'],
            'siswa_tidak_hadir' => $data['siswa_tidak_hadir'] ?: null,
            'refleksi' => $data['refleksi'] ?: null,
            'tindak_lanjut' => $data['tindak_lanjut'] ?: null,
            'academic_year' => $data['academic_year'],
        ];

        if ($this->editingId) {
            LessonLog::whereKey($this->editingId)->update($payload);
        } else {
            $payload['teacher_id'] = auth()->id();
            LessonLog::create($payload);
        }

        $this->showModal = false;
        session()->flash('ok', 'Buku batas tersimpan.');
    }

    public function delete(string $id): void
    {
        LessonLog::whereKey($id)->delete();
        session()->flash('ok', 'Baris dihapus.');
    }

    public function render()
    {
        $logs = LessonLog::query()
            ->with(['schoolClass', 'subject', 'teacher'])
            ->when($this->classFilter, fn ($q) => $q->where('class_id', $this->classFilter))
            ->orderBy('date', 'desc')
            ->paginate(15);

        $classes = SchoolClass::orderBy('name')->get(['id', 'name']);
        $subjects = Subject::orderBy('name')->get(['id', 'name']);

        return view('livewire.lesson-logs.index', compact('logs', 'classes', 'subjects'));
    }
}
