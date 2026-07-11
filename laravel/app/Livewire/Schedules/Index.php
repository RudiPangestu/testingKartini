<?php

namespace App\Livewire\Schedules;

use App\Models\Schedule;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Validation\Rule;
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

    public string $subject_id = '';
    public string $class_id = '';
    public string $teacher_id = '';
    public string $day_of_week = 'SEN';
    public string $start_time = '07:00';
    public string $end_time = '08:30';
    public string $academic_year = '2025/2026';

    public function updatingClassFilter(): void
    {
        $this->resetPage();
    }

    public function create(): void
    {
        $this->reset(['editingId', 'subject_id', 'class_id', 'teacher_id']);
        $this->day_of_week = 'SEN';
        $this->start_time = '07:00';
        $this->end_time = '08:30';
        $this->academic_year = '2025/2026';
        $this->showModal = true;
    }

    public function edit(string $id): void
    {
        $s = Schedule::findOrFail($id);
        $this->editingId = $s->id;
        $this->subject_id = $s->subject_id;
        $this->class_id = $s->class_id;
        $this->teacher_id = $s->teacher_id;
        $this->day_of_week = $s->day_of_week->value;
        $this->start_time = $s->start_time;
        $this->end_time = $s->end_time;
        $this->academic_year = $s->academic_year;
        $this->showModal = true;
    }

    public function save(): void
    {
        $data = $this->validate([
            'subject_id' => ['required', 'exists:subjects,id'],
            'class_id' => ['required', 'exists:classes,id'],
            'teacher_id' => ['required', 'exists:users,id'],
            'day_of_week' => ['required', Rule::in(['SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'])],
            'start_time' => ['required', 'string', 'max:8'],
            'end_time' => ['required', 'string', 'max:8'],
            'academic_year' => ['required', 'string', 'max:20'],
        ]);

        if ($this->editingId) {
            Schedule::whereKey($this->editingId)->update($data);
        } else {
            Schedule::create($data);
        }

        $this->showModal = false;
        session()->flash('ok', 'Jadwal tersimpan.');
    }

    public function delete(string $id): void
    {
        try {
            Schedule::whereKey($id)->delete();
            session()->flash('ok', 'Jadwal dihapus.');
        } catch (\Throwable $e) {
            session()->flash('err', 'Gagal menghapus: jadwal masih punya sesi presensi.');
        }
    }

    public function render()
    {
        $order = "CASE day_of_week WHEN 'SEN' THEN 1 WHEN 'SEL' THEN 2 WHEN 'RAB' THEN 3 WHEN 'KAM' THEN 4 WHEN 'JUM' THEN 5 WHEN 'SAB' THEN 6 ELSE 7 END";

        $schedules = Schedule::query()
            ->with(['subject', 'schoolClass', 'teacher'])
            ->when($this->classFilter, fn ($q) => $q->where('class_id', $this->classFilter))
            ->orderByRaw($order)
            ->orderBy('start_time')
            ->paginate(20);

        $subjects = Subject::orderBy('name')->get(['id', 'name']);
        $classes = SchoolClass::orderBy('name')->get(['id', 'name']);
        $teachers = User::where('role', 'GURU')->orderBy('full_name')->get(['id', 'full_name']);

        return view('livewire.schedules.index', compact('schedules', 'subjects', 'classes', 'teachers'));
    }
}
